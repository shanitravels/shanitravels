/**
 * Which company built a vehicle, worked out from its name.
 *
 * There is no `make` field on a vehicle — the fleet is admin-managed and the
 * name is the only place the brand is recorded. Taking the first word of the
 * name gets most of the fleet right and the rest badly wrong: it files the four
 * "Armored …" vehicles under a company called "Armored", and the vehicle carrier
 * under one called "22-Wheeler". Hence the three passes below.
 *
 * If the brand ever becomes something the admin should control directly, this
 * is the function to replace with a stored field.
 */

/**
 * Brands written into vehicle names. Multi-word brands have to be listed —
 * "Mercedes-Benz" is never going to fall out of a token scan on its own.
 * The list is only a head start: pass 3 picks up any brand not named here, so
 * adding a Nissan to the fleet needs no change to this file.
 */
const KNOWN_MAKES = [
  "Mercedes-Benz",
  "Toyota",
  "Honda",
  "Suzuki",
  "Hyundai",
  "Lexus",
  "Changan",
  "Daewoo",
  "Yutong",
  "Bedford",
  "Isuzu",
  "Mazda",
  "Hino",
  "BMW",
  "Kia",
] as const;

/**
 * Models whose name omits the brand. Every one of these is a Toyota sold here
 * under the model name alone — "Armored Prado (B-6)" says nothing about Toyota,
 * but a customer filtering for Toyota plainly wants it back.
 *
 * Deliberately limited to models where the brand is not in question. A vehicle
 * whose maker cannot be established from its name is left unassigned rather
 * than guessed at (see `vehicleMake` returning null).
 */
const MODEL_MAKES: Record<string, string> = {
  "land cruiser": "Toyota",
  fortuner: "Toyota",
  prado: "Toyota",
  revo: "Toyota",
  hiace: "Toyota",
  corolla: "Toyota",
  coaster: "Toyota",
};

/**
 * Leading words that describe the vehicle rather than name its maker. Without
 * this, pass 3 would invent a company for anything the first two passes miss.
 */
const NOT_A_MAKE = new Set(["armored", "armoured", "self", "used", "new"]);

/**
 * Where `needle` appears in `haystack` as a whole word, or -1. Hyphens and
 * slashes count as boundaries, so "D/Cab" never matches "Cab".
 *
 * The position matters, not just the fact of a match: a name that mentions two
 * brands — "Hino / Isuzu 10-Wheeler" — belongs to the one it leads with, and
 * deciding that by the order of the list below would be arbitrary.
 */
function indexOfWord(haystack: string, needle: string): number {
  const escaped = needle.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^a-z0-9])(${escaped})($|[^a-z0-9])`, "i").exec(haystack);
  return m ? m.index + m[1].length : -1;
}

/** The entry mentioned earliest in `name`, or null if none is. */
function firstMentioned<T extends string>(
  name: string,
  entries: readonly T[]
): T | null {
  let best: T | null = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const entry of entries) {
    const at = indexOfWord(name, entry);
    if (at !== -1 && at < bestAt) {
      bestAt = at;
      best = entry;
    }
  }
  return best;
}

/**
 * The company that built this vehicle, or `null` when the name does not say.
 *
 * `null` is a real answer, not a failure: "22-Wheeler Vehicle Carrier" names no
 * maker, and inventing one would put a claim on the page that nobody made.
 */
export function vehicleMake(name: string): string | null {
  const raw = (name ?? "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // 1. A brand named outright wins. Checked before models so the Lexus-badged
  //    "Land Cruiser LX (Lexus)" comes back as a Lexus, not as a Toyota.
  const named = firstMentioned(lower, KNOWN_MAKES);
  if (named) return named;

  // 2. A model whose brand is not in doubt.
  const model = firstMentioned(lower, Object.keys(MODEL_MAKES));
  if (model) return MODEL_MAKES[model];

  // 3. Anything else: assume the name leads with the brand, which is the house
  //    style for every vehicle on the list. Guarded so a leading descriptor or
  //    a number ("22-Wheeler …") does not become a company.
  const first = raw.split(/[\s/]+/)[0] ?? "";
  if (!/^[a-z]/i.test(first) || NOT_A_MAKE.has(first.toLowerCase())) return null;
  return first;
}

/** Distinct makes across a fleet, most vehicles first then alphabetical. */
export function makeOptions(names: string[]): { make: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of names) {
    const make = vehicleMake(n);
    if (make) counts.set(make, (counts.get(make) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count || a.make.localeCompare(b.make));
}
