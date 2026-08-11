/**
 * Locale configuration.
 *
 * The site is bilingual English/Urdu. The choice lives in a cookie rather than
 * a URL segment, so every page renders at the same address in either language.
 * That keeps links stable but makes public pages vary per visitor — see
 * lib/i18n/server.ts for what that costs.
 */

export const LOCALES = ["en", "ur"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Read by the server on every render and written by the language switcher. */
export const LOCALE_COOKIE = "st_lang";

/** A year — the choice is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Urdu is right-to-left as a script, but the layout was deliberately kept
 * left-to-right. The browser's bidi algorithm still lays out Urdu runs
 * correctly inside an LTR block, so text reads properly while the page
 * furniture stays where English visitors expect it.
 */
export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; dir: "ltr" }> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  ur: { label: "Urdu", nativeLabel: "اردو", dir: "ltr" },
};
