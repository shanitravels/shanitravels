import { describe, it, expect } from "vitest";
import {
  publishedRate,
  normalizeVehicleRates,
  isDiscountLive,
  discountAmount,
  bestDiscountFor,
  discountedPrice,
  discountedRates,
  discountSummary,
} from "./pricing";
import type { Discount, VehicleRates } from "./types";

/**
 * These functions decide the number a customer is quoted, so the tests below
 * are written against the *business rules* rather than the implementation:
 * zero is not a price, discounts never stack, fuel is never discounted.
 */

const NO_RATES: VehicleRates = {
  perHour: null,
  perDay: null,
  perWeek: null,
  perMonth: null,
  fuelPerKm: null,
  airportTransfer: null,
};

function rates(partial: Partial<VehicleRates>): VehicleRates {
  return { ...NO_RATES, ...partial };
}

function discount(partial: Partial<Discount>): Discount {
  return {
    id: "d1",
    name: "Test offer",
    label: "Offer",
    type: "percentage",
    value: 10,
    scope: "all",
    vehicleClasses: [],
    vehicles: [],
    startDate: "2026-01-01",
    endDate: null,
    active: true,
    ...partial,
  } as Discount;
}

const NOW = new Date("2026-06-15T12:00:00Z");

// ---------------------------------------------------------------------------

describe("publishedRate", () => {
  it("passes through a real price", () => {
    expect(publishedRate(8500)).toBe(8500);
    expect(publishedRate(0.5)).toBe(0.5);
  });

  /**
   * The regression this function exists for: cleared rate fields used to be
   * stored as 0, and "PKR 0" on the rate card reads as free hire.
   */
  it("folds zero to null so it renders as On request, never as free", () => {
    expect(publishedRate(0)).toBeNull();
  });

  it("rejects negatives and non-finite values", () => {
    expect(publishedRate(-100)).toBeNull();
    expect(publishedRate(Number.NaN)).toBeNull();
    expect(publishedRate(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("treats missing as unpriced", () => {
    expect(publishedRate(null)).toBeNull();
    expect(publishedRate(undefined)).toBeNull();
  });
});

describe("normalizeVehicleRates", () => {
  it("normalizes every rate field on the vehicle", () => {
    const v = normalizeVehicleRates({
      rates: rates({ perHour: 0, perDay: 8500, perWeek: -1, fuelPerKm: 0 }),
    });
    expect(v.rates.perHour).toBeNull();
    expect(v.rates.perDay).toBe(8500);
    expect(v.rates.perWeek).toBeNull();
    expect(v.rates.fuelPerKm).toBeNull();
  });

  it("normalizes the self-drive card too", () => {
    const v = normalizeVehicleRates({
      rates: NO_RATES,
      selfDrive: { perDay: 0, perWeek: 42000, perMonth: null, securityDeposit: 0 },
    });
    expect(v.selfDrive?.perDay).toBeNull();
    expect(v.selfDrive?.perWeek).toBe(42000);
  });

  /** A zero deposit is a real commercial term — "no deposit" — not an unset field. */
  it("leaves a zero security deposit alone", () => {
    const v = normalizeVehicleRates({
      rates: NO_RATES,
      selfDrive: { perDay: 5000, perWeek: null, perMonth: null, securityDeposit: 0 },
    });
    expect(v.selfDrive?.securityDeposit).toBe(0);
  });

  it("leaves a vehicle with no self-drive card untouched", () => {
    expect(normalizeVehicleRates({ rates: NO_RATES, selfDrive: null }).selfDrive).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("isDiscountLive", () => {
  it("is live inside its window", () => {
    expect(isDiscountLive(discount({ startDate: "2026-06-01", endDate: "2026-06-30" }), NOW)).toBe(true);
  });

  it("is not live before it starts", () => {
    expect(isDiscountLive(discount({ startDate: "2026-07-01" }), NOW)).toBe(false);
  });

  it("is not live after it ends", () => {
    expect(isDiscountLive(discount({ endDate: "2026-06-01" }), NOW)).toBe(false);
  });

  it("runs indefinitely with no end date", () => {
    expect(isDiscountLive(discount({ endDate: null }), NOW)).toBe(true);
  });

  it("is never live when switched off", () => {
    expect(isDiscountLive(discount({ active: false }), NOW)).toBe(false);
  });
});

describe("discountAmount", () => {
  it("computes a percentage", () => {
    expect(discountAmount(10000, discount({ type: "percentage", value: 15 }))).toBe(1500);
  });

  it("rounds to whole rupees", () => {
    expect(discountAmount(8500, discount({ type: "percentage", value: 15 }))).toBe(1275);
    expect(discountAmount(3333, discount({ type: "percentage", value: 10 }))).toBe(333);
  });

  it("takes a fixed amount as given", () => {
    expect(discountAmount(10000, discount({ type: "fixed", value: 2000 }))).toBe(2000);
  });

  /** A fixed offer larger than the price must never produce a negative fare. */
  it("never discounts more than the price itself", () => {
    expect(discountAmount(1500, discount({ type: "fixed", value: 5000 }))).toBe(1500);
  });

  it("never returns a negative saving", () => {
    expect(discountAmount(10000, discount({ type: "fixed", value: -500 }))).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe("bestDiscountFor", () => {
  const vehicle = { id: "v1", class: "sedan" as const, rates: rates({ perDay: 10000 }) };

  /**
   * The rule that protects margin: a site-wide 20% and a class-specific 15%
   * must resolve to 20% off, not 35%.
   */
  it("picks the single best offer rather than stacking them", () => {
    const best = bestDiscountFor(vehicle, [
      discount({ id: "site", type: "percentage", value: 20, scope: "all" }),
      discount({ id: "sedans", type: "percentage", value: 15, scope: "class", vehicleClasses: ["sedan"] }),
    ], NOW);
    expect(best?.id).toBe("site");
    expect(discountAmount(10000, best!)).toBe(2000);
  });

  it("compares percentage and fixed offers on the same reference amount", () => {
    // 15% of 10,000 = 1,500, which beats a flat 1,000.
    const best = bestDiscountFor(vehicle, [
      discount({ id: "pct", type: "percentage", value: 15 }),
      discount({ id: "flat", type: "fixed", value: 1000 }),
    ], NOW);
    expect(best?.id).toBe("pct");
  });

  it("lets a large fixed offer beat a small percentage", () => {
    const best = bestDiscountFor(vehicle, [
      discount({ id: "pct", type: "percentage", value: 5 }),
      discount({ id: "flat", type: "fixed", value: 2500 }),
    ], NOW);
    expect(best?.id).toBe("flat");
  });

  it("ignores offers scoped to another class", () => {
    expect(bestDiscountFor(vehicle, [
      discount({ scope: "class", vehicleClasses: ["suv"] }),
    ], NOW)).toBeNull();
  });

  it("honours an offer scoped to specific vehicles", () => {
    expect(bestDiscountFor(vehicle, [discount({ scope: "vehicle", vehicles: ["v1"] })], NOW)?.id).toBe("d1");
    expect(bestDiscountFor(vehicle, [discount({ scope: "vehicle", vehicles: ["v2"] })], NOW)).toBeNull();
  });

  it("ignores offers that are not live", () => {
    expect(bestDiscountFor(vehicle, [discount({ active: false })], NOW)).toBeNull();
    expect(bestDiscountFor(vehicle, [discount({ startDate: "2026-12-01" })], NOW)).toBeNull();
  });

  /** "On request" vehicles have no price to discount, so no badge should show. */
  it("returns nothing for an unpriced vehicle", () => {
    const unpriced = { id: "v2", class: "vip" as const, rates: NO_RATES };
    expect(bestDiscountFor(unpriced, [discount({ value: 25 })], NOW)).toBeNull();
  });

  it("falls back through week then hour when there is no day rate", () => {
    const weekly = { id: "v3", class: "event" as const, rates: rates({ perWeek: 50000 }) };
    expect(bestDiscountFor(weekly, [discount({ value: 10 })], NOW)?.id).toBe("d1");
  });

  it("returns nothing when every matching offer saves zero", () => {
    expect(bestDiscountFor(vehicle, [discount({ type: "fixed", value: 0 })], NOW)).toBeNull();
  });

  it("returns nothing when there are no offers at all", () => {
    expect(bestDiscountFor(vehicle, [], NOW)).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("discountedPrice", () => {
  it("reduces a price", () => {
    expect(discountedPrice(10000, discount({ value: 20 }))).toBe(8000);
  });

  it("leaves the price alone with no discount", () => {
    expect(discountedPrice(10000, null)).toBe(10000);
  });

  it("keeps an unpriced rate unpriced", () => {
    expect(discountedPrice(null, discount({ value: 20 }))).toBeNull();
    expect(discountedPrice(undefined, discount({ value: 20 }))).toBeNull();
  });

  it("never goes below zero", () => {
    expect(discountedPrice(1000, discount({ type: "fixed", value: 5000 }))).toBe(0);
  });
});

describe("discountedRates", () => {
  const full = rates({
    perHour: 1000,
    perDay: 10000,
    perWeek: 60000,
    perMonth: 200000,
    fuelPerKm: 50,
    airportTransfer: 4000,
  });

  it("applies the same offer across every published rate", () => {
    const d = discountedRates(full, discount({ value: 10 }));
    expect(d.perHour).toBe(900);
    expect(d.perDay).toBe(9000);
    expect(d.perWeek).toBe(54000);
    expect(d.perMonth).toBe(180000);
    expect(d.airportTransfer).toBe(3600);
  });

  /** Fuel is a pass-through cost, not margin — discounting it loses real money. */
  it("never discounts the fuel rate", () => {
    expect(discountedRates(full, discount({ value: 50 })).fuelPerKm).toBe(50);
  });

  it("leaves unpriced rates unpriced", () => {
    const d = discountedRates(rates({ perDay: 10000 }), discount({ value: 10 }));
    expect(d.perDay).toBe(9000);
    expect(d.perHour).toBeNull();
    expect(d.perWeek).toBeNull();
  });

  it("returns the rates unchanged with no discount", () => {
    expect(discountedRates(full, null)).toEqual(full);
  });
});

describe("discountSummary", () => {
  it("describes a percentage offer", () => {
    expect(discountSummary({ type: "percentage", value: 15 })).toBe("15% off");
  });

  it("groups a fixed offer in PKR", () => {
    expect(discountSummary({ type: "fixed", value: 2000 })).toBe("PKR 2,000 off");
  });
});
