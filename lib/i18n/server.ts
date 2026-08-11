import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { ur } from "./dictionaries/ur";

const dictionaries: Record<Locale, Dictionary> = { en, ur };

export type { Dictionary };

/**
 * Reading the locale cookie is what makes a page dynamic.
 *
 * Calling `cookies()` opts the route out of static prerendering, which is the
 * accepted cost of choosing cookie-based locales over `/ur/` URLs. The cached
 * data layer is unaffected: lib/data/* still returns whole bilingual documents
 * and its `"use cache"` entries stay locale-independent — only the final
 * render varies.
 */
export async function getLocale(): Promise<Locale> {
  const value = await readLocaleCookie();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Reads the cookie, or reports `null` where there is no request to read from.
 *
 * `generateStaticParams` runs at build time with no HTTP request, and calling
 * `cookies()` there throws. Since every data read now resolves a locale (see
 * lib/data/cache.ts), that would take down any route with static params —
 * which is exactly how /services/[slug] started returning 500. There is no
 * visitor in that context, so the default locale is the right answer.
 */
async function readLocaleCookie(): Promise<string | undefined> {
  try {
    const store = await cookies();
    return store.get(LOCALE_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/**
 * Whether the visitor has actually chosen a language.
 *
 * Distinct from `getLocale()`, which reports the *effective* locale and cannot
 * tell "picked English" apart from "hasn't picked yet". The first-visit chooser
 * needs that difference, or it would reappear for every English reader.
 */
export async function getLocaleState(): Promise<{ locale: Locale; chosen: boolean }> {
  const value = await readLocaleCookie();
  return isLocale(value)
    ? { locale: value, chosen: true }
    : { locale: DEFAULT_LOCALE, chosen: false };
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Convenience for server components: the locale and its strings in one call. */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
