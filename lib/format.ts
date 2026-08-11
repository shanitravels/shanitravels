import type { RateType, VehicleRates } from "@/lib/types";

/** "PKR 27,500" — en-PK grouping without decimals. */
export function formatPKR(amount: number | null | undefined, currency = "PKR"): string {
  if (amount === null || amount === undefined) return "On request";
  return `${currency} ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}

/** Bare grouped number for table cells; em-dash when unset. */
export function formatRateCell(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function rateForType(rates: VehicleRates, type: RateType): number | null {
  switch (type) {
    case "hour":
      return rates.perHour ?? null;
    case "day":
      return rates.perDay ?? null;
    case "week":
      return rates.perWeek ?? null;
    case "airport":
      return rates.airportTransfer ?? null;
  }
}

/** Days between two ISO dates, inclusive of the first day (minimum 1). */
export function daysBetween(start: string, end?: string | null): number {
  if (!end) return 1;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/**
 * Indicative fare used by the estimator, the booking flow and the vehicle page.
 * Purely indicative — final quotes are confirmed by the team; excludes GST.
 */
export function estimateFare(
  rates: VehicleRates,
  rateType: RateType,
  opts: { units?: number; km?: number } = {}
): number | null {
  const base = rateForType(rates, rateType);
  if (base === null) return null;
  const units = Math.max(1, opts.units ?? 1);
  let total = rateType === "airport" ? base : base * units;
  if (opts.km && rates.fuelPerKm) total += opts.km * rates.fuelPerKm;
  return Math.round(total);
}

/** "st-2026-00042" → slug-safe machine reference for bookings/enquiries. */
export function formatReference(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['".,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normalize a phone for tel: links (keep + and digits). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/**
 * wa.me requires a full international number with no leading zero or plus.
 * Numbers are stored in whatever format the client prefers to display
 * (e.g. "0300 8564588"), so normalize local Pakistani forms here:
 *   03008564588  → 923008564588
 *   +92 300 …    → 92300…
 *   3008564588   → 923008564588
 */
export function toWhatsAppNumber(number: string, countryCode = "92"): string {
  let digits = number.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // 0092… → 92…
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return countryCode + digits.slice(1); // local trunk prefix
  return countryCode + digits;
}

export function whatsappHref(number: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${toWhatsAppNumber(number)}${query}`;
}

/** mailto: with an optional prefilled subject, so enquiries arrive pre-labelled. */
export function mailtoHref(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${email}${query ? `?${query.replace(/\+/g, "%20")}` : ""}`;
}
