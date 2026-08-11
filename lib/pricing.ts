import type { Discount, Vehicle, VehicleRates } from "@/lib/types";

/**
 * Discount application. Deliberately free of `server-only` — prices render in
 * both server components (fleet pages) and client components (booking wizard,
 * fare estimator), and both must compute the same number.
 */

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
