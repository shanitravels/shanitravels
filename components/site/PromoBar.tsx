"use client";

import { useState } from "react";
import Link from "next/link";
import { FiTag, FiArrowRight, FiX } from "react-icons/fi";
import { useI18n } from "./LocaleProvider";
import type { Promo } from "@/lib/types";
import { PROMO_DISMISS_COOKIE, PROMO_DISMISS_MAX_AGE, promoCtaHref } from "@/lib/promo";

/**
 * The campaign bar above the navbar.
 *
 * Dismissal is stored in a cookie rather than component state or localStorage,
 * because the server decides whether to render this at all (see
 * app/(public)/layout.tsx). A cookie is the one signal available there, so a
 * dismissed bar never reaches the HTML on the next page — no flash of a banner
 * the visitor already closed, and no hydration mismatch from hiding it on mount.
 *
 * The cookie value is a signature of the offer, not a plain "true": change the
 * code or extend the end date and it counts as a new campaign, so people who
 * dismissed the last one still see this one.
 *
 * Height is the constraint that shapes the layout — one line on desktop, inside
 * the 50–70px the design calls for. Everything that can be dropped on a narrow
 * screen is, rather than letting the bar wrap to two lines and push the hero
 * down: the headline badge goes below `sm`, the code chip below `md`.
 */
export function PromoBar({
  promo,
  signature,
}: {
  promo: Promo;
  /**
   * Comes from the server rather than being derived here. This component only
   * ever sees the promo in the language on screen, and a signature taken from
   * that text differs between English and Urdu — which is exactly how a bar
   * closed in one language came back in the other.
   */
  signature: string;
}) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    document.cookie = `${PROMO_DISMISS_COOKIE}=${encodeURIComponent(
      signature
    )}; path=/; max-age=${PROMO_DISMISS_MAX_AGE}; samesite=lax`;
    setDismissed(true);
  };

  return (
    <div className="relative bg-accent text-white">
      <div className="mx-auto flex min-h-[52px] max-w-7xl items-center justify-center gap-3 px-4 py-2 pr-11 sm:gap-4 md:px-8">
        {promo.headline && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider sm:inline-flex">
            <FiTag className="h-3 w-3" aria-hidden />
            {promo.headline}
          </span>
        )}

        {promo.message && (
          <span className="text-sm font-semibold leading-snug sm:text-[15px]">{promo.message}</span>
        )}

        {promo.code && (
          <span className="hidden shrink-0 items-center gap-2 text-sm md:inline-flex">
            <span className="text-white/75">{t.promo.useCode}</span>
            <code className="rounded border border-dashed border-white/50 px-2.5 py-1 font-mono text-[13px] font-bold tracking-wider">
              {promo.code}
            </code>
          </span>
        )}

        {promo.ctaLabel && (
          <Link
            href={promoCtaHref(promo)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-[13px] font-bold text-accent transition hover:bg-white/90"
          >
            {promo.ctaLabel} <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t.promo.dismiss}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white md:right-4"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}
