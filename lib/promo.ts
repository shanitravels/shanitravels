import type { Promo } from "@/lib/types";

/**
 * Promo helpers shared by the server layout and the client bar.
 *
 * They live here rather than in components/site/PromoBar.tsx because that file
 * is `"use client"`, and a function exported from a client module cannot be
 * *called* on the server — only rendered as a component or passed as a prop.
 * The layout needs the signature to decide whether to render the bar at all, so
 * the pure logic sits in its own module that either side can import.
 */

export const PROMO_DISMISS_COOKIE = "st_promo_off";

/** Six months. Long enough that a dismissed campaign stays dismissed. */
export const PROMO_DISMISS_MAX_AGE = 60 * 60 * 24 * 180;

/**
 * Identifies *this* campaign. Dismissal is remembered against this value, so
 * changing the code or the run of dates brings the bar back for everyone rather
 * than leaving past dismissers permanently unaware of a new offer.
 *
 * Built only from fields that are the same in every language. The message used
 * to be part of it, which gave one campaign two signatures: closing the bar in
 * Urdu wrote the Urdu wording, the English page compared against the English
 * wording, failed to match, and showed the bar again — and the reverse. Reading
 * the English side instead is not available here either, because settings are
 * localized in the data layer (see `cachedRead`), so by the time any caller
 * sees a promo the wording is already whichever language is on screen.
 *
 * The cost is that correcting a typo in the message no longer re-shows the bar
 * to someone who dismissed it. Changing the code or the dates — the things that
 * actually make it a different offer — still does.
 */
export function promoSignature(
  promo: Pick<Promo, "code" | "startDate" | "endDate">
): string {
  // Never empty: a promo with no code and no dates still needs a value the
  // cookie can hold and match on.
  return [promo.code, promo.startDate, promo.endDate].filter(Boolean).join("|") || "promo";
}

/**
 * Carries the code to the booking form, so arriving through the bar pre-fills
 * it. Typing /book directly leaves the field empty, which keeps the promo
 * attribution on a booking honest.
 */
export function promoCtaHref(promo: Pick<Promo, "ctaHref" | "code">): string {
  const href = promo.ctaHref || "/book";
  if (!promo.code || href.includes("promo=")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}promo=${encodeURIComponent(promo.code)}`;
}
