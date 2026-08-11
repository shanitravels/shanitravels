"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { BookingModel, DiscountModel, EnquiryModel, SettingsModel, VehicleModel, nextSequence } from "@/lib/models";
import { bookingSchema, enquirySchema, contactSchema, fieldErrorsOf } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { estimateFare, daysBetween, formatReference } from "@/lib/format";
import { notifyOps } from "@/lib/email";
import { recordMarketingContact } from "@/lib/marketing";
import type { PublicFormState } from "@/lib/form-state";
import { isSelfDriveEligible, type Discount } from "@/lib/types";
import { bestDiscountFor, discountedRates, discountSummary } from "@/lib/pricing";
import { serialize } from "@/lib/serialize";

/**
 * Public form submissions. All three: Zod-validated server-side, IP
 * rate-limited, honeypot-protected. Success redirects to a confirmation
 * page carrying the generated reference; validation errors return state
 * for inline display (native HTML validation covers the no-JS path).
 */

function collect(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$")) continue; // React internals
    if (key === "cities") continue; // handled below (multi-value)
    obj[key] = typeof value === "string" ? value : "";
  }
  const cities = formData.getAll("cities").filter((c): c is string => typeof c === "string" && c !== "");
  if (cities.length) obj.cities = cities;
  return obj;
}

export async function submitBooking(
  _prev: PublicFormState,
  formData: FormData
): Promise<PublicFormState> {
  const parsed = bookingSchema.safeParse(collect(formData));
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot filled → pretend success without writing anything.
  if (data.website !== "") redirect("/book/confirmed/ST-0000-00000");

  if (!(await checkRateLimit("booking", 5))) {
    return {
      error: "Too many requests from your connection. Please call or WhatsApp us instead.",
      fieldErrors: {},
    };
  }

  let reference = "";
  try {
    await connectDB();
    const vehicle = await VehicleModel.findOne({ _id: data.vehicleId, active: true }).lean();
    if (!vehicle) {
      return {
        error: "That vehicle is no longer available — please pick another.",
        fieldErrors: { vehicleId: ["Vehicle unavailable"] },
      };
    }

    const selfDrive = data.serviceMode === "self-drive";
    if (selfDrive) {
      // Server-side gate: the feature can be launched dark from Settings.
      const settings = await SettingsModel.findOne({ singleton: "main" }).select("selfDriveEnabled").lean();
      if (!(settings as { selfDriveEnabled?: boolean } | null)?.selfDriveEnabled) {
        return { error: "Self-drive bookings aren't available right now. Please book with a chauffeur or call us.", fieldErrors: {} };
      }
      // Class check lives here too, not just in the UI filter — a crafted POST
      // could otherwise self-drive-book an armored car or a 45-seat coach.
      if (!isSelfDriveEligible(vehicle)) {
        return {
          error: "That vehicle isn't available for self-drive — please pick another.",
          fieldErrors: { vehicleId: ["Not self-drive eligible"] },
        };
      }
    }

    const units =
      data.rateType === "day"
        ? daysBetween(data.startDate, data.endDate || null)
        : data.rateType === "week"
          ? Math.max(1, Math.ceil(daysBetween(data.startDate, data.endDate || null) / 7))
          : 1;
    // Self-drive fares come from the self-drive rate card (null → on request).
    const rateSource = selfDrive
      ? {
          perHour: null,
          perDay: vehicle.selfDrive?.perDay ?? null,
          perWeek: vehicle.selfDrive?.perWeek ?? null,
          perMonth: vehicle.selfDrive?.perMonth ?? null,
          fuelPerKm: null,
          airportTransfer: null,
        }
      : {
          perHour: vehicle.rates?.perHour,
          perDay: vehicle.rates?.perDay ?? null,
          perWeek: vehicle.rates?.perWeek,
          perMonth: vehicle.rates?.perMonth,
          fuelPerKm: vehicle.rates?.fuelPerKm,
          airportTransfer: vehicle.rates?.airportTransfer,
        };
    // Recompute the discount server-side rather than trusting anything the
    // client sent — the quoted figure has to be the one we can actually honour.
    const liveDiscounts = await DiscountModel.find({ active: true }).lean();
    const discount = bestDiscountFor(
      { id: String(vehicle._id), class: vehicle.class, rates: rateSource },
      serialize<Discount[]>(liveDiscounts)
    );
    const fare = estimateFare(discountedRates(rateSource, discount), data.rateType, { units });

    const year = new Date().getFullYear();
    const seq = await nextSequence(`booking-${year}`);
    reference = formatReference("ST", year, seq);

    await BookingModel.create({
      reference,
      vehicle: vehicle._id,
      vehicleName: vehicle.name,
      serviceMode: data.serviceMode,
      rateType: data.rateType,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      pickupCity: data.pickupCity,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes || null,
      indicativeFare: fare,
      // Recorded as typed. Deliberately does NOT feed into `fare` above: the
      // quote stays the published rate so the number the customer saw is the
      // number ops confirms, and the code is honoured on that call.
      promoCode: data.promoCode || null,
      status: "new",
      // Self-drive verification starts all-false; ops ticks flags at handover.
      verification: selfDrive
        ? {
            cnicVerified: { done: false },
            licenceVerified: { done: false },
            agreementSigned: { done: false },
            declarationSigned: { done: false },
          }
        : null,
    });

    await recordMarketingContact({
      email: data.email,
      name: data.name,
      phone: data.phone,
      source: "booking",
    });

    // Every booking notifies, not just self-drive. This previously fired only
    // for self-drive, so the main chauffeur flow sent no email at all.
    //
    // "Car rental" rather than "chauffeur" in the subject: a lead is a rental
    // request first, and whether a driver comes with it is one detail of it.
    // The mode is kept in the suffix so ops can still triage from the subject —
    // self-drive leads need verification and handover before the car moves.
    notifyOps(
      `New Car Rental Booking Lead ${reference} (${selfDrive ? "Self-drive" : "With chauffeur"})`,
      [
        `Reference: ${reference}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        `Vehicle: ${vehicle.name}`,
        `Service: ${selfDrive ? "Self-drive" : "With chauffeur"}`,
        `Pickup: ${data.pickupCity} on ${data.startDate}`,
        data.endDate ? `Until: ${data.endDate}` : null,
        `Indicative fare: ${fare ?? "on request"}`,
        discount ? `Discount applied: ${discount.label} (${discountSummary(discount)})` : null,
        data.promoCode ? `Promo code: ${data.promoCode}` : null,
        data.notes ? `Notes: ${data.notes}` : null,
        selfDrive ? "\nVerification and handover required." : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch (err) {
    console.error("[public] submitBooking failed:", err);
    return {
      error: "We couldn't save your request. Please try again, or call us directly.",
      fieldErrors: {},
    };
  }

  redirect(`/book/confirmed/${reference}`);
}

export async function submitEnquiry(
  _prev: PublicFormState,
  formData: FormData
): Promise<PublicFormState> {
  const parsed = enquirySchema.safeParse(collect(formData));
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  if (data.website !== "") redirect("/corporate/confirmed/EQ-0000-00000");

  if (!(await checkRateLimit("enquiry", 5))) {
    return {
      error: "Too many requests from your connection. Please email or call us instead.",
      fieldErrors: {},
    };
  }

  let reference = "";
  try {
    await connectDB();
    const year = new Date().getFullYear();
    const seq = await nextSequence(`enquiry-${year}`);
    reference = formatReference("EQ", year, seq);

    await EnquiryModel.create({
      reference,
      type: "corporate",
      company: data.company,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email,
      sector: data.sector || null,
      cities: data.cities,
      vehiclesNeeded: data.vehiclesNeeded,
      duration: data.duration,
      details: data.details || null,
      status: "new",
    });

    await recordMarketingContact({
      email: data.email,
      name: data.contactName,
      phone: data.phone,
      source: "corporate",
    });

    notifyOps(
      `New corporate enquiry ${reference}`,
      [
        `Reference: ${reference}`,
        `Company: ${data.company}`,
        `Contact: ${data.contactName}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        data.sector ? `Sector: ${data.sector}` : null,
        data.cities.length ? `Cities: ${data.cities.join(", ")}` : null,
        `Vehicles needed: ${data.vehiclesNeeded}`,
        `Duration: ${data.duration}`,
        data.details ? `Details: ${data.details}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch (err) {
    console.error("[public] submitEnquiry failed:", err);
    return {
      error: "We couldn't save your request. Please try again, or email us directly.",
      fieldErrors: {},
    };
  }

  redirect(`/corporate/confirmed/${reference}`);
}

export async function submitContact(
  _prev: PublicFormState,
  formData: FormData
): Promise<PublicFormState> {
  const parsed = contactSchema.safeParse(collect(formData));
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  if (data.website !== "") redirect("/contact/confirmed/EQ-0000-00000");

  if (!(await checkRateLimit("contact", 5))) {
    return {
      error: "Too many messages from your connection. Please call or WhatsApp us instead.",
      fieldErrors: {},
    };
  }

  let reference = "";
  try {
    await connectDB();
    const year = new Date().getFullYear();
    const seq = await nextSequence(`enquiry-${year}`);
    reference = formatReference("EQ", year, seq);

    await EnquiryModel.create({
      reference,
      type: "general",
      company: "—",
      contactName: data.name,
      phone: data.phone,
      email: data.email || "not-provided@enquiry.local",
      cities: [],
      vehiclesNeeded: "",
      duration: "",
      details: data.message,
      status: "new",
    });

    // recordMarketingContact drops the "not-provided" placeholder itself.
    await recordMarketingContact({
      email: data.email,
      name: data.name,
      phone: data.phone,
      source: "contact",
    });

    notifyOps(
      `New contact message ${reference}`,
      [
        `Reference: ${reference}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        `Message: ${data.message}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch (err) {
    console.error("[public] submitContact failed:", err);
    return {
      error: "We couldn't send your message. Please try again, or call us directly.",
      fieldErrors: {},
    };
  }

  redirect(`/contact/confirmed/${reference}`);
}
