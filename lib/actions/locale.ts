"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/config";

/**
 * Persist the visitor's language choice.
 *
 * Writing the cookie is all this does — the caller follows up with
 * `router.refresh()` so the server re-renders in the new language. Not
 * httpOnly: a language preference carries nothing sensitive, and leaving it
 * readable lets the client avoid a flash of the wrong language if that is ever
 * needed.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
