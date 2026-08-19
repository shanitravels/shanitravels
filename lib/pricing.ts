import type { Discount, SelfDriveRates, Vehicle, VehicleRates } from "@/lib/types";

/**
 * Discount application. Deliberately free of `server-only` — prices render in
 * both server components (fleet pages) and client components (booking wizard,
 * fare estimator), and both must compute the same number.
 */

/**
 * A rate is published only when it is a positive number.
 *
 * Zero is not a price. "PKR 0" on a rate card reads as free hire rather than as
 * an unquoted vehicle, so anything non-positive folds back to null — the single
 * value the whole site already renders as "On request". Saving a zero is now
 * rejected (see `optionalRate` in lib/validation), and this keeps rows written
 * before that rule — a cleared per-day field used to be stored as 0 — reading
 * as "On request" rather than as free.
 */
export function publishedRate(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Every rate on a vehicle put through `publishedRate`, applied once where
 * vehicles are read so no page has to remember the distinction.
 */
export function normalizeVehicleRates<
  T extends { rates: VehicleRates; selfDrive?: SelfDriveRates | null },
>(vehicle: T): T {
  return {
    ...vehicle,
    rates: {
      ...vehicle.rates,
      perHour: publishedRate(vehicle.rates.perHour),
      perDay: publishedRate(vehicle.rates.perDay),
      perWeek: publishedRate(vehicle.rates.perWeek),
      perMonth: publishedRate(vehicle.rates.perMonth),
      fuelPerKm: publishedRate(vehicle.rates.fuelPerKm),
      airportTransfer: publishedRate(vehicle.rates.airportTransfer),
    },
    selfDrive: vehicle.selfDrive
      ? {
          ...vehicle.selfDrive,
          perDay: publishedRate(vehicle.selfDrive.perDay),
          perWeek: publishedRate(vehicle.selfDrive.perWeek),
          perMonth: publishedRate(vehicle.selfDrive.perMonth),
          // Left alone: a zero deposit is a real term — "no deposit" — whereas
          // a blank one means the amount is agreed at booking.
          securityDeposit: vehicle.selfDrive.securityDeposit,
        }
      : vehicle.selfDrive,
  };
}

/**
 * Live right now: switched on, started, and not yet expired.
 *
 * Typed on the fields it actually reads rather than on `Discount`, so the admin
 * can pass a `DiscountDoc` — same dates, bilingual `label` — without a cast.
 */
export function isDiscountLive(
  d: Pick<Discount, "active" | "startDate" | "endDate">,
  now: Date = new Date()
): boolean {
  if (!d.active) return false;
  if (new Date(d.startDate) > now) return false;
  if (d.endDate && new Date(d.endDate) < now) return false;
  return true;
}

function matchesVehicle(d: Discount, vehicle: Pick<Vehicle, "id" | "class">): boolean {
  if (d.scope === "all") return true;
  if (d.scope === "class") return d.vehicleClasses.includes(vehicle.class);
  return d.vehicles.includes(vehicle.id);
}

/** Rupees saved on `amount`, floored at zero and never more than the amount. */
export function discountAmount(amount: number, d: Discount): number {
  const off = d.type === "percentage" ? (amount * d.value) / 100 : d.value;
  return Math.min(amount, Math.max(0, Math.round(off)));
}

/**
 * The discount to show for a vehicle.
 *
 * Several may match at once (an "everything" sale plus a class-specific one).
 * The customer gets the best of them rather than the sum — stacking is how a
 * 20% site-wide plus a 15% class offer quietly becomes 35% off.
 *
 * Compared on a reference amount so percentage and fixed offers rank against
 * each other honestly; without one, "500 off" and "10%" are not comparable.
 */
export function bestDiscountFor(
  vehicle: Pick<Vehicle, "id" | "class" | "rates">,
  discounts: Discount[],
  now: Date = new Date()
): Discount | null {
  const reference = vehicle.rates.perDay ?? vehicle.rates.perWeek ?? vehicle.rates.perHour ?? 0;
  if (reference <= 0) return null; // "On request" — nothing to discount

  let best: Discount | null = null;
  let bestOff = 0;
  for (const d of discounts) {
    if (!isDiscountLive(d, now) || !matchesVehicle(d, vehicle)) continue;
    const off = discountAmount(reference, d);
    if (off > bestOff) { best = d; bestOff = off; }
  }
  return bestOff > 0 ? best : null;
}

export function discountedPrice(amount: number | null | undefined, d: Discount | null): number | null {
  if (amount === null || amount === undefined) return null;
  if (!d) return amount;
  return amount - discountAmount(amount, d);
}

/** Every published rate reduced by the same discount. Nulls stay null. */
export function discountedRates(rates: VehicleRates, d: Discount | null): VehicleRates {
  if (!d) return rates;
  const apply = (v: number | null | undefined) => (v === null || v === undefined ? v : discountedPrice(v, d));
  return {
    ...rates,
    perHour: apply(rates.perHour),
    perDay: apply(rates.perDay),
    perWeek: apply(rates.perWeek),
    perMonth: apply(rates.perMonth),
    airportTransfer: apply(rates.airportTransfer),
    // Fuel is a pass-through cost, not margin — never discounted.
    fuelPerKm: rates.fuelPerKm,
  };
}

/** "15% off" / "PKR 2,000 off" — for badges and rate-table captions. */
export function discountSummary(d: Pick<Discount, "type" | "value">): string {
  return d.type === "percentage"
    ? `${d.value}% off`
    : `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(d.value)} off`;
}
