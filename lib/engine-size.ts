/**
 * Engine capacity, read out of the free-text `engine` field.
 *
 * That field is written for humans ("1.5L i-VTEC", "660cc petrol",
 * "2.7L petrol / 2.8L diesel"), so ordering the fleet by engine size means
 * parsing it rather than storing a second number an admin could forget to
 * update.
 *
 * Only figures carrying an explicit unit count. That is the whole trick:
 * "Diesel (4/5-cylinder)" holds a cylinder count and "4.6L V8" holds a
 * displacement *and* a cylinder count, and a bare-number parse would read 4
 * and 8 out of them as if they were litres.
 */

/** A number followed by cc / L / litre(s) / liter(s), and nothing else. */
const CAPACITY = /(\d+(?:\.\d+)?)\s*(cc|lit(?:re|er)s?|l)(?![a-z])/gi;

/**
 * Capacity in cubic centimetres, or null when the text names no displacement
 * ("Diesel", "Heavy diesel").
 *
 * Ranges and either/or engines ("1.6L / 2.0L petrol") resolve to the smallest
 * figure quoted: it is the variant the vehicle is listed from, and it keeps a
 * dual-fuel entry from leapfrogging single-engine cars of the same size.
 */
export function engineCc(engine: string | null | undefined): number | null {
  if (!engine) return null;

  let smallest: number | null = null;
  for (const [, raw, unit] of engine.matchAll(CAPACITY)) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) continue;
    const cc = unit.toLowerCase() === "cc" ? value : value * 1000;
    // A "0.9L" city car is real; a "9000cc" car in this fleet is a typo. No
    // upper guard though — the trucks are genuinely large.
    if (smallest === null || cc < smallest) smallest = cc;
  }
  return smallest;
}

/**
 * Sort comparator: smallest engine first, unknown capacity last, then name so
 * the order is stable for vehicles that tie (three 1.0L economy cars, four
 * 2.8L armoured units).
 */
export function byEngineSize(
  a: { engine?: string | null; name: string },
  b: { engine?: string | null; name: string }
): number {
  const ea = engineCc(a.engine) ?? Number.POSITIVE_INFINITY;
  const eb = engineCc(b.engine) ?? Number.POSITIVE_INFINITY;
  return ea - eb || a.name.localeCompare(b.name);
}
