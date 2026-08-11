"use client";

import { useEffect, useRef, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useI18n } from "./LocaleProvider";

/**
 * Best-effort auto-open of the prefilled WhatsApp chat on the confirmation page.
 *
 * The booking is already saved by the time this runs, so this is purely a
 * convenience — if the browser blocks it, nothing is lost and the manual button
 * beneath is the real path. That button is always rendered by <Confirmation>,
 * never conditionally on this component succeeding.
 */
export function WhatsAppHandoff({ href }: { href: string }) {
  const { t } = useI18n();
  // Effects run twice under StrictMode in dev; without this guard that is two
  // WhatsApp tabs on every confirmation.
  const fired = useRef(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Deliberately NOT passing "noopener" in the feature string: per spec that
    // makes window.open return null even when it succeeds, which would report
    // every successful open as blocked. Sever the reference afterwards instead.
    const win = window.open(href, "_blank");
    if (win) {
      win.opener = null;
    } else {
      // Whether the popup was blocked is only knowable after calling open(), so
      // the result has to come back into React from the effect. One render, on
      // mount, and only on the blocked path.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlocked(true);
    }
  }, [href]);

  if (!blocked) return null;

  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900">
      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{t.confirmation.popupBlocked}</span>
    </p>
  );
}
