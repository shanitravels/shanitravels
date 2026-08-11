import type { Locale } from "./config";

/**
 * Bilingual text as stored in MongoDB.
 *
 * Every translatable field on a content model holds one of these instead of a
 * bare string. `ur` may be empty — an admin can save English before the Urdu
 * copy exists — and rendering falls back to `en` so a page is never blank.
 */
export type LocalizedString = { en: string; ur: string };

/**
 * Collapses stored bilingual documents down to one language *at the data
 * boundary*, so page and component code keeps seeing plain strings.
 *
 * This is what keeps the change small: `vehicle.name` is still a `string` by
 * the time it reaches a component, so the ~45 public files that render content
 * did not have to learn about locales at all. Only the fetch sites localize.
 */

/**
 * A `{ en, ur }` pair and nothing else. The key-subset check matters: content
 * documents contain plenty of ordinary objects, and collapsing one of those by
 * mistake would silently replace it with a string.
 */
export function isLocalizedString(value: unknown): value is LocalizedString {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.length > 2) return false;
  if (!keys.every((k) => k === "en" || k === "ur")) return false;
  const v = value as Partial<LocalizedString>;
  return typeof v.en === "string" || typeof v.ur === "string";
}

/** Resolve one pair, falling back to English when the Urdu is missing. */
export function pickText(
  value: LocalizedString | string | null | undefined,
  locale: Locale
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const preferred = value[locale];
  if (typeof preferred === "string" && preferred.trim()) return preferred;
  return value.en ?? "";
}

/** The shape a document takes once localized: every pair becomes a string. */
export type Flatten<T> = T extends LocalizedString
  ? string
  : T extends Date
    ? T
    : T extends (infer U)[]
      ? Flatten<U>[]
      : T extends object
        ? { [K in keyof T]: Flatten<T[K]> }
        : T;

/**
 * Deep-walks a serialized document, replacing every `{ en, ur }` with the
 * string for `locale`. Expects plain data — run it after lib/serialize.ts,
 * never on a live Mongoose document.
 */
export function localize<T>(value: T, locale: Locale): Flatten<T> {
  if (isLocalizedString(value)) return pickText(value, locale) as Flatten<T>;
  if (Array.isArray(value)) return value.map((v) => localize(v, locale)) as Flatten<T>;
  if (value instanceof Date) return value as Flatten<T>;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = localize(v, locale);
    return out as Flatten<T>;
  }
  return value as Flatten<T>;
}
