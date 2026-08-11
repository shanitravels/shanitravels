import { formatDate, formatPKR } from "@/lib/format";
import { RATE_TYPE_LABELS, type RateType, type ServiceMode } from "@/lib/types";

/** The subset of a saved Booking that the handover message quotes. */
export type BookingWhatsAppFields = {
  reference: string;
  vehicleName: string;
  serviceMode: ServiceMode;
  rateType: RateType;
  startDate: Date | string;
  endDate?: Date | string | null;
  pickupCity: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  indicativeFare?: number | null;
  promoCode?: string | null;
};

/**
 * Notes are capped at 1000 chars by the form, but the whole message rides in a
 * URL. Browsers start truncating well before their theoretical limit, and a
 * silently cut message is worse than a visibly shortened one.
 */
const MAX_NOTES = 400;

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The booking, formatted for WhatsApp. Built from the persisted record rather
 * than form state so it carries the reference and the server-computed fare —
 * the two things the customer's browser cannot know at submit time.
 *
 * `*bold*` is WhatsApp's own markup. Newlines survive URL-encoding intact.
 */
export function bookingWhatsAppMessage(b: BookingWhatsAppFields): string {
  const lines: string[] = [
    "*New Booking Request*",
    `Ref: ${b.reference}`,
    "",
    `*Service:* ${b.serviceMode === "self-drive" ? "Self-drive" : "With chauffeur"}`,
    `*Vehicle:* ${b.vehicleName}`,
    `*Rate type:* ${RATE_TYPE_LABELS[b.rateType]}`,
    `*Pick-up city:* ${b.pickupCity}`,
    `*Start date:* ${formatDate(b.startDate)}`,
  ];

  if (b.endDate) lines.push(`*End date:* ${formatDate(b.endDate)}`);
  lines.push(`*Indicative fare:* ${formatPKR(b.indicativeFare)}`);

  // Above the contact block on purpose: whoever picks this up needs to see the
  // campaign before they quote, not after.
  if (b.promoCode) lines.push(`*Promo code:* ${b.promoCode}`);

  lines.push("", `*Name:* ${b.name}`, `*Phone:* ${b.phone}`);
  if (b.email) lines.push(`*Email:* ${b.email}`);
  if (b.notes) lines.push(`*Notes:* ${truncate(b.notes, MAX_NOTES)}`);

  lines.push("", "Sent from shanitravels.pk");
  return lines.join("\n");
}
