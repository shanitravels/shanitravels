import { z } from "zod";
import {
  VEHICLE_CLASSES,
  ARMOR_LEVELS,
  CLIENT_SECTORS,
  BOOKING_STATUSES,
  ENQUIRY_STATUSES,
  RATE_TYPES,
  ADMIN_ROLES,
  SERVICE_GROUPS,
  SERVICE_MODES,
  SAFETY_CATEGORIES,
  DISCOUNT_TYPES,
  DISCOUNT_SCOPES,
} from "@/lib/types";

/**
 * Zod schemas validated on the client (form UX) AND inside every server
 * action (authority). Mirrors the Mongoose schema constraints.
 */

// --- shared ---------------------------------------------------------------

export const imageSchema = z.object({
  publicId: z.string().default(""),
  url: z.string().url("Image URL must be valid"),
  alt: z.string().max(200).default(""),
  order: z.coerce.number().int().min(0).default(0),
});

const flatImage = z.object({
  publicId: z.string().default(""),
  url: z.string().url(),
  alt: z.string().max(200).default(""),
});

const photo = z.object({
  publicId: z.string().default(""),
  url: z.string().url(),
});

const optionalRate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().min(0).nullable()
);

const trimmed = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max);

/**
 * A bilingual text field, accepted in either shape.
 *
 * Admin forms that carry both languages send `{ en, ur }`. A plain string is
 * also accepted and read as the English side, which keeps older form payloads
 * and seed scripts working instead of failing a cast deep inside Mongoose.
 *
 * A plain string leaves `ur` empty here; `preserveUrdu()` in lib/actions/helpers
 * is what stops that erasing existing translations on an English-only edit.
 *
 * Urdu gets a doubled length budget: the same sentence in Nastaliq runs longer
 * than its English source, and a limit tuned for English would reject valid copy.
 */
const localizedText = (max: number, label: string) =>
  z
    .union([z.string(), z.object({ en: z.string().optional(), ur: z.string().optional() })])
    .transform((v) =>
      typeof v === "string"
        ? { en: v.trim(), ur: "" }
        : { en: (v.en ?? "").trim(), ur: (v.ur ?? "").trim() }
    )
    .pipe(
      z.object({
        en: z.string().min(1, `${label} is required`).max(max),
        ur: z.string().max(max * 2),
      })
    );

/** Same, but the English side may be blank (optional body copy, intros). */
const localizedOptional = (max: number) =>
  z
    .union([z.string(), z.object({ en: z.string().optional(), ur: z.string().optional() })])
    .transform((v) =>
      typeof v === "string"
        ? { en: v.trim(), ur: "" }
        : { en: (v.en ?? "").trim(), ur: (v.ur ?? "").trim() }
    )
    .pipe(z.object({ en: z.string().max(max), ur: z.string().max(max * 2) }));

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and hyphens only");

// --- vehicle --------------------------------------------------------------

export const vehicleSchema = z.object({
  name: trimmed(120, "Name"),
  slug: slugField,
  class: z.enum(VEHICLE_CLASSES),
  modelYears: z.string().trim().max(40).default(""),
  seats: z.coerce.number().int().min(1, "Seats must be at least 1").max(100),
  engine: localizedOptional(120),
  transmission: localizedOptional(60),
  driveType: localizedOptional(60),
  interiorFeatures: z.array(localizedText(120, "Feature")).max(30).default([]),
  images: z.array(imageSchema).max(20).default([]),
  rates: z.object({
    perHour: optionalRate,
    perDay: optionalRate, // null → "on request"
    perWeek: optionalRate,
    perMonth: optionalRate,
    fuelPerKm: optionalRate,
    airportTransfer: optionalRate,
  }),
  currency: z.string().trim().max(8).default("PKR"),
  armorLevel: z
    .preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(ARMOR_LEVELS).nullable())
    .default(null),
  rollCage: z.boolean().default(false),
  selfDriveAvailable: z.boolean().default(false),
  selfDrive: z
    .object({
      perDay: optionalRate,
      perWeek: optionalRate,
      perMonth: optionalRate,
      securityDeposit: optionalRate,
    })
    .nullable()
    .default(null),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

export const ratesRowSchema = z.object({
  id: z.string().min(1),
  rates: vehicleSchema.shape.rates,
});
export const ratesBulkSchema = z.array(ratesRowSchema).min(1);

// --- office ---------------------------------------------------------------

export const officeSchema = z.object({
  city: localizedText(60, "City"),
  address: localizedText(300, "Address"),
  phones: z.array(z.string().trim().min(5).max(30)).min(1, "At least one phone").max(6),
  email: z.string().trim().email().max(120).or(z.literal("")).default(""),
  mapUrl: z.string().trim().url().max(500).or(z.literal("")).default(""),
  isHeadOffice: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type OfficeInput = z.infer<typeof officeSchema>;

// --- client ---------------------------------------------------------------

export const clientSchema = z.object({
  name: trimmed(120, "Name"),
  sector: z.enum(CLIENT_SECTORS),
  logo: flatImage.nullable().default(null),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type ClientInput = z.infer<typeof clientSchema>;

// --- testimonial ----------------------------------------------------------

export const testimonialSchema = z.object({
  organization: trimmed(160, "Organization"),
  sector: z.enum(CLIENT_SECTORS),
  quote: localizedText(400, "Quote"),
  year: z.string().trim().max(20).or(z.literal("")).default(""),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

// --- service --------------------------------------------------------------

export const serviceSchema = z.object({
  title: localizedText(120, "Title"),
  slug: slugField,
  group: z.enum(SERVICE_GROUPS).default("individual"),
  summary: localizedText(300, "Summary"),
  body: localizedOptional(20000),
  image: flatImage.nullable().default(null),
  relatedVehicleClasses: z.array(z.enum(VEHICLE_CLASSES)).max(8).default([]),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// --- industry -------------------------------------------------------------

export const industrySchema = z.object({
  name: localizedText(120, "Name"),
  slug: slugField,
  icon: z.string().trim().max(60).or(z.literal("")).default(""),
  heroImage: flatImage.nullable().default(null),
  summary: localizedText(300, "Summary"),
  body: localizedOptional(30000),
  relatedServiceSlugs: z.array(z.string().trim().min(1).max(80)).max(13).default([]),
  relatedVehicleClasses: z.array(z.enum(VEHICLE_CLASSES)).max(8).default([]),
  testimonialSector: z
    .preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(CLIENT_SECTORS).nullable())
    .default(null),
  seo: z.object({
    title: localizedText(120, "SEO title"),
    description: localizedText(300, "SEO description"),
  }),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type IndustryInput = z.infer<typeof industrySchema>;

// --- safety section -------------------------------------------------------

export const safetySectionSchema = z.object({
  title: localizedText(120, "Title"),
  slug: slugField,
  category: z.enum(SAFETY_CATEGORIES),
  intro: localizedOptional(1000),
  items: z.array(localizedText(400, "Line")).min(1, "Add at least one line").max(30),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
export type SafetySectionInput = z.infer<typeof safetySectionSchema>;

// --- discounts -------------------------------------------------------------

export const discountSchema = z
  .object({
    name: trimmed(120, "Name"),
    label: localizedText(40, "Badge label"),
    type: z.enum(DISCOUNT_TYPES),
    value: z.coerce.number().min(0.01, "Value must be greater than zero"),
    scope: z.enum(DISCOUNT_SCOPES),
    vehicleClasses: z.array(z.enum(VEHICLE_CLASSES)).default([]),
    vehicles: z.array(z.string()).default([]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().or(z.literal("")).nullable().default(null),
    active: z.boolean().default(true),
  })
  .refine((d) => d.type !== "percentage" || d.value <= 100, {
    message: "A percentage discount cannot exceed 100%",
    path: ["value"],
  })
  .refine((d) => d.scope !== "class" || d.vehicleClasses.length > 0, {
    message: "Pick at least one vehicle class",
    path: ["vehicleClasses"],
  })
  .refine((d) => d.scope !== "vehicle" || d.vehicles.length > 0, {
    message: "Pick at least one vehicle",
    path: ["vehicles"],
  })
  .refine((d) => !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: "End date cannot be before the start date",
    path: ["endDate"],
  });
export type DiscountInput = z.infer<typeof discountSchema>;

// --- settings -------------------------------------------------------------

export const settingsSchema = z.object({
  helplineNumbers: z.array(z.string().trim().min(5).max(30)).min(1).max(6),
  whatsappNumber: z.string().trim().min(5).max(30),
  emails: z.array(z.string().trim().email()).min(1).max(6),
  headOfficeAddress: trimmed(400, "Head office address"),
  socials: z.object({
    facebook: z.string().trim().url().or(z.literal("")).default(""),
    instagram: z.string().trim().url().or(z.literal("")).default(""),
    // Defaulted like the rest, so a settings payload saved before this field
    // existed still validates instead of failing on save.
    pinterest: z.string().trim().url().or(z.literal("")).default(""),
    linkedin: z.string().trim().url().or(z.literal("")).default(""),
  }),
  heroHeadline: localizedText(160, "Hero headline"),
  heroSubheadline: localizedOptional(300),
  heroImages: z.array(imageSchema).max(8).default([]),
  announcementBar: z.object({
    text: localizedOptional(200),
    active: z.boolean().default(false),
  }),
  promo: z.object({
    active: z.boolean().default(false),
    headline: localizedOptional(60),
    message: localizedOptional(160),
    // Uppercased so "travel10" and "TRAVEL10" are the same code to everyone.
    code: z.string().trim().toUpperCase().max(40).default(""),
    ctaLabel: localizedOptional(40),
    ctaHref: z.string().trim().max(200).default("/book"),
    startDate: z.string().trim().default(""),
    endDate: z.string().trim().default(""),
  }),
  stats: z.object({
    yearsOperating: z.coerce.number().int().min(0).max(200),
    cities: z.coerce.number().int().min(0).max(100),
    fleetSize: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce.number().int().min(0).nullable()
    ),
  }),
  seoDefaults: z.object({
    title: localizedText(120, "Default SEO title"),
    description: localizedText(300, "Default SEO description"),
    ogImage: photo.nullable().default(null),
  }),
  offerImages: z
    .object({
      longHire: flatImage.nullable().default(null),
      airport: flatImage.nullable().default(null),
      nationwide: flatImage.nullable().default(null),
    })
    // Defaulted as a whole as well as per key, so a settings payload saved
    // before this field existed still validates.
    .default({ longHire: null, airport: null, nationwide: null }),
  credentials: z
    .array(
      z.object({
        label: localizedText(80, "Label"),
        value: localizedText(160, "Value"),
        image: flatImage.nullable().default(null),
      })
    )
    .max(12)
    .default([]),
  commercialTerms: localizedOptional(20000),
  about: z.object({
    // Defaulted, unlike its siblings: they predate any client that could omit
    // them, whereas a browser holding the previous admin bundle through a
    // deploy would submit an `about` with no `mission` and fail the whole save.
    mission: localizedOptional(20000).default({ en: "", ur: "" }),
    story: localizedOptional(20000),
    ceoMessage: localizedOptional(20000),
    ceoName: z.string().trim().max(120).default(""),
    hseSummary: localizedOptional(20000),
  }),
  selfDriveEnabled: z.boolean().default(false),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

// --- admin users ----------------------------------------------------------

export const adminUserSchema = z.object({
  email: z.string().trim().email().max(160),
  name: trimmed(120, "Name"),
  role: z.enum(ADMIN_ROLES),
  active: z.boolean().default(true),
  password: z.string().min(8, "Password must be at least 8 characters").max(200).optional(),
});
export type AdminUserInput = z.infer<typeof adminUserSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// --- public: booking ------------------------------------------------------

export const bookingSchema = z
  .object({
    vehicleId: z.string().trim().min(1, "Choose a vehicle"),
    serviceMode: z.enum(SERVICE_MODES).default("chauffeur"),
    rateType: z.enum(RATE_TYPES),
    startDate: z
      .string()
      .trim()
      .min(1, "Pick-up date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
    endDate: z
      .string()
      .trim()
      .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .default(""),
    pickupCity: trimmed(60, "Pick-up city"),
    name: trimmed(120, "Your name"),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(30)
      .regex(/^[+\d][\d\s()-]+$/, "Enter a valid phone number"),
    email: z.string().trim().email("Enter a valid email").max(160).or(z.literal("")).default(""),
    notes: z.string().trim().max(1000).default(""),
    /** Captured for the lead, not applied to the fare. See Booking in lib/types. */
    promoCode: z.string().trim().toUpperCase().max(40).default(""),
    /** Self-drive consent — required when serviceMode is self-drive. */
    selfDriveConsent: z.string().or(z.literal("")).default(""),
    // Honeypot — must stay empty.
    website: z.string().max(0).default(""),
  })
  .refine((d) => d.serviceMode !== "self-drive" || d.selfDriveConsent === "on", {
    message: "Please confirm you understand the verification and handover process",
    path: ["selfDriveConsent"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

// --- public: corporate enquiry -------------------------------------------

const phoneField = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(30)
  .regex(/^[+\d][\d\s()-]+$/, "Enter a valid phone number");

export const enquirySchema = z.object({
  company: trimmed(160, "Organization name"),
  contactName: trimmed(120, "Contact name"),
  phone: phoneField,
  email: z.string().trim().email("Enter a valid email").max(160),
  sector: z.string().trim().max(80).default(""),
  cities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  vehiclesNeeded: trimmed(300, "Vehicles needed"),
  duration: trimmed(120, "Expected duration"),
  details: z.string().trim().max(3000).default(""),
  website: z.string().max(0).default(""),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

// --- public: general contact ---------------------------------------------

export const contactSchema = z.object({
  name: trimmed(120, "Your name"),
  phone: phoneField,
  email: z.string().trim().email("Enter a valid email").max(160).or(z.literal("")).default(""),
  message: trimmed(3000, "Message"),
  website: z.string().max(0).default(""),
});
export type ContactInput = z.infer<typeof contactSchema>;

// --- admin status updates -------------------------------------------------

export const bookingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(BOOKING_STATUSES),
});

export const enquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES),
});

export const verificationFlagSchema = z.object({
  bookingId: z.string().min(1),
  flag: z.enum(["cnicVerified", "licenceVerified", "agreementSigned", "declarationSigned"]),
  done: z.boolean(),
});

/** Flatten Zod errors into { field: [messages] } for form display. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
