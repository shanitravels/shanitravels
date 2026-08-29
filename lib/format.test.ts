import { describe, it, expect } from "vitest";
import {
  formatPKR,
  formatRateCell,
  rateForType,
  daysBetween,
  estimateFare,
  formatReference,
  slugify,
  telHref,
  toWhatsAppNumber,
  whatsappHref,
} from "./format";
import type { VehicleRates } from "./types";

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

// ---------------------------------------------------------------------------

describe("formatPKR", () => {
  it("groups thousands", () => {
    expect(formatPKR(27500)).toBe("PKR 27,500");
  });

  it("drops decimals", () => {
    expect(formatPKR(8499.6)).toBe("PKR 8,500");
  });

  it("says On request when there is no price", () => {
    expect(formatPKR(null)).toBe("On request");
    expect(formatPKR(undefined)).toBe("On request");
  });

  /** Zero is a real number here — publishedRate is what turns it into null. */
  it("formats a literal zero rather than hiding it", () => {
    expect(formatPKR(0)).toBe("PKR 0");
  });

  it("accepts another currency", () => {
    expect(formatPKR(1200, "USD")).toBe("USD 1,200");
  });
});

describe("formatRateCell", () => {
  it("is bare and grouped for table cells", () => {
    expect(formatRateCell(27500)).toBe("27,500");
  });

  it("uses an em dash when unset", () => {
    expect(formatRateCell(null)).toBe("—");
    expect(formatRateCell(undefined)).toBe("—");
  });
});

// ---------------------------------------------------------------------------

describe("rateForType", () => {
  const all = rates({ perHour: 1500, perDay: 8500, perWeek: 50000, airportTransfer: 4000 });

  it("reads the rate matching the type", () => {
    expect(rateForType(all, "hour")).toBe(1500);
    expect(rateForType(all, "day")).toBe(8500);
    expect(rateForType(all, "week")).toBe(50000);
    expect(rateForType(all, "airport")).toBe(4000);
  });

  it("reports null for an unpriced type", () => {
    expect(rateForType(rates({ perDay: 8500 }), "hour")).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("daysBetween", () => {
  it("is one day when no end date is given", () => {
    expect(daysBetween("2026-08-24")).toBe(1);
    expect(daysBetween("2026-08-24", null)).toBe(1);
  });

  it("counts a multi-day span", () => {
    expect(daysBetween("2026-08-24", "2026-08-31")).toBe(7);
  });

  it("never returns less than one", () => {
    expect(daysBetween("2026-08-24", "2026-08-24")).toBe(1);
    // An end before the start is nonsense input; it must not produce a
    // negative unit count that would invert the fare.
    expect(daysBetween("2026-08-24", "2026-08-20")).toBe(1);
  });

  it("crosses month and year boundaries", () => {
    expect(daysBetween("2026-08-30", "2026-09-02")).toBe(3);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("counts a leap day", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  /**
   * PINS CURRENT BEHAVIOUR, NOT A CONFIRMED RULE.
   *
   * 24th -> 25th counts as ONE day. Car hire in Pakistan is often quoted
   * inclusively, where that booking is charged as two. The docstring on
   * daysBetween says "inclusive of the first day", which reads like the
   * opposite of what the arithmetic does.
   *
   * If operations confirm the inclusive convention, change this expectation
   * to 2 and add +1 in daysBetween — every multi-day estimate is currently
   * one day short.
   */
  it("counts consecutive days as one, not two (see note above)", () => {
    expect(daysBetween("2026-08-24", "2026-08-25")).toBe(1);
  });
});

// ---------------------------------------------------------------------------

describe("estimateFare", () => {
  const all = rates({ perHour: 1500, perDay: 8500, perWeek: 50000, airportTransfer: 4000, fuelPerKm: 50 });

  it("multiplies the rate by the number of units", () => {
    expect(estimateFare(all, "day", { units: 3 })).toBe(25500);
    expect(estimateFare(all, "week", { units: 2 })).toBe(100000);
  });

  it("defaults to a single unit", () => {
    expect(estimateFare(all, "day")).toBe(8500);
  });

  /** An airport transfer is a flat fee — multiplying it would overcharge. */
  it("does not multiply an airport transfer", () => {
    expect(estimateFare(all, "airport", { units: 5 })).toBe(4000);
  });

  it("adds fuel by distance when asked", () => {
    expect(estimateFare(all, "day", { units: 1, km: 100 })).toBe(8500 + 5000);
  });

  it("ignores distance when the vehicle has no fuel rate", () => {
    expect(estimateFare(rates({ perDay: 8500 }), "day", { km: 100 })).toBe(8500);
  });

  it("is unpriced when the rate for that type is unpriced", () => {
    expect(estimateFare(rates({ perDay: 8500 }), "hour")).toBeNull();
    expect(estimateFare(NO_RATES, "day")).toBeNull();
  });

  it("clamps a nonsensical unit count to one", () => {
    expect(estimateFare(all, "day", { units: 0 })).toBe(8500);
    expect(estimateFare(all, "day", { units: -3 })).toBe(8500);
  });

  it("returns whole rupees", () => {
    expect(estimateFare(rates({ perDay: 8333.33 }), "day", { units: 3 })).toBe(25000);
  });
});

// ---------------------------------------------------------------------------

describe("formatReference", () => {
  it("pads the sequence to five digits", () => {
    expect(formatReference("ST", 2026, 42)).toBe("ST-2026-00042");
  });

  it("does not truncate a sequence past five digits", () => {
    expect(formatReference("ST", 2026, 123456)).toBe("ST-2026-123456");
  });

  /** The honeypot redirect targets this exact reference; it must stay stable. */
  it("produces the honeypot reference for sequence zero", () => {
    expect(formatReference("ST", 2026, 0)).toBe("ST-2026-00000");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Toyota Land Cruiser V8")).toBe("toyota-land-cruiser-v8");
  });

  it("drops punctuation rather than hyphenating it", () => {
    expect(slugify("Land Cruiser LX (Lexus)")).toBe("land-cruiser-lx-lexus");
    expect(slugify("Toyota D/Cab REVO 4x4")).toBe("toyota-d-cab-revo-4x4");
  });

  it("collapses runs and trims edge hyphens", () => {
    expect(slugify("  Honda   City  1200  ")).toBe("honda-city-1200");
    expect(slugify("--Armored REVO (B-6)--")).toBe("armored-revo-b-6");
  });

  it("caps the length", () => {
    expect(slugify("a".repeat(200)).length).toBe(80);
  });
});

describe("telHref", () => {
  it("keeps digits and a leading plus", () => {
    expect(telHref("+92 300 856 4588")).toBe("tel:+923008564588");
  });

  it("strips separators from a local number", () => {
    expect(telHref("0300-8564588")).toBe("tel:03008564588");
  });
});

describe("toWhatsAppNumber", () => {
  /** wa.me rejects a leading zero or plus, and a wrong number is a lost lead. */
  it("converts a local Pakistani number", () => {
    expect(toWhatsAppNumber("0300 856 4588")).toBe("923008564588");
  });

  it("strips the plus from an international number", () => {
    expect(toWhatsAppNumber("+92 300 856 4588")).toBe("923008564588");
  });

  it("handles the 00 international prefix", () => {
    expect(toWhatsAppNumber("0092 300 8564588")).toBe("923008564588");
  });

  it("adds the country code to a bare subscriber number", () => {
    expect(toWhatsAppNumber("3008564588")).toBe("923008564588");
  });

  it("leaves an already-normalized number alone", () => {
    expect(toWhatsAppNumber("923008564588")).toBe("923008564588");
  });

  it("accepts another country code", () => {
    expect(toWhatsAppNumber("07700 900123", "44")).toBe("447700900123");
  });
});

describe("whatsappHref", () => {
  it("builds a bare wa.me link", () => {
    expect(whatsappHref("0300 856 4588")).toBe("https://wa.me/923008564588");
  });

  it("url-encodes a prefilled message", () => {
    expect(whatsappHref("03008564588", "Booking ST-2026-00042")).toBe(
      "https://wa.me/923008564588?text=Booking%20ST-2026-00042"
    );
  });
});
