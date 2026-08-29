import { describe, it, expect } from "vitest";
import { isLocalizedString, pickText, localize } from "./localize";

/**
 * The rule the whole bilingual site rests on: an Urdu field that has not been
 * written yet falls back to English, so a page is never blank. The second rule
 * matters just as much — `localize` deep-walks real documents, so it must
 * collapse `{ en, ur }` pairs and nothing else.
 */

describe("isLocalizedString", () => {
  it("recognises a pair", () => {
    expect(isLocalizedString({ en: "Sedan", ur: "سیڈان" })).toBe(true);
  });

  it("recognises a half-written pair", () => {
    expect(isLocalizedString({ en: "Sedan", ur: "" })).toBe(true);
    expect(isLocalizedString({ en: "Sedan" })).toBe(true);
  });

  /** Collapsing an ordinary object by mistake would replace it with a string. */
  it("rejects ordinary content objects", () => {
    expect(isLocalizedString({ perDay: 8500, perWeek: null })).toBe(false);
    expect(isLocalizedString({ en: "x", ur: "y", extra: 1 })).toBe(false);
    expect(isLocalizedString({ url: "…", alt: "…" })).toBe(false);
    expect(isLocalizedString({})).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isLocalizedString(null)).toBe(false);
    expect(isLocalizedString(undefined)).toBe(false);
    expect(isLocalizedString("Sedan")).toBe(false);
    expect(isLocalizedString(["en", "ur"])).toBe(false);
  });
});

describe("pickText", () => {
  const pair = { en: "Chauffeur-driven", ur: "ڈرائیور سمیت" };

  it("returns the requested language", () => {
    expect(pickText(pair, "en")).toBe("Chauffeur-driven");
    expect(pickText(pair, "ur")).toBe("ڈرائیور سمیت");
  });

  it("falls back to English when the Urdu is missing", () => {
    expect(pickText({ en: "Chauffeur-driven", ur: "" }, "ur")).toBe("Chauffeur-driven");
  });

  /** Whitespace-only counts as untranslated, not as a deliberate blank. */
  it("falls back when the Urdu is only whitespace", () => {
    expect(pickText({ en: "Chauffeur-driven", ur: "   " }, "ur")).toBe("Chauffeur-driven");
  });

  it("passes a plain string through", () => {
    expect(pickText("Muhammad Khurshid", "ur")).toBe("Muhammad Khurshid");
  });

  it("returns an empty string for missing input", () => {
    expect(pickText(null, "en")).toBe("");
    expect(pickText(undefined, "ur")).toBe("");
  });
});

describe("localize", () => {
  it("collapses pairs throughout a document", () => {
    const vehicle = {
      id: "v1",
      name: "Toyota Corolla",
      engine: { en: "1.3L petrol", ur: "1.3L پٹرول" },
      interiorFeatures: [
        { en: "Air conditioning", ur: "ایئر کنڈیشننگ" },
        { en: "Leather seats", ur: "" },
      ],
    };
    expect(localize(vehicle, "ur")).toEqual({
      id: "v1",
      name: "Toyota Corolla",
      engine: "1.3L پٹرول",
      interiorFeatures: ["ایئر کنڈیشننگ", "Leather seats"],
    });
  });

  it("leaves numbers, nulls and booleans alone", () => {
    const doc = { rates: { perDay: 8500, perHour: null }, active: true, order: 0 };
    expect(localize(doc, "ur")).toEqual(doc);
  });

  /** An image is {url, alt} — two keys, but not a locale pair. */
  it("does not collapse look-alike objects", () => {
    const doc = { images: [{ url: "https://x/y.jpg", alt: "A car" }] };
    expect(localize(doc, "ur")).toEqual(doc);
  });

  it("handles a nested settings shape", () => {
    const settings = {
      about: {
        ceoName: "Muhammad Khurshid",
        mission: { en: "Our mission", ur: "ہمارا مشن" },
        hseSummary: { en: "HSE", ur: "" },
      },
      credentials: [{ label: { en: "NTN", ur: "این ٹی این" }, value: { en: "123", ur: "" } }],
    };
    expect(localize(settings, "ur")).toEqual({
      about: { ceoName: "Muhammad Khurshid", mission: "ہمارا مشن", hseSummary: "HSE" },
      credentials: [{ label: "این ٹی این", value: "123" }],
    });
  });
});
