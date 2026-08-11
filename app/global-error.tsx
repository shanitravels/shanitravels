"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ur } from "@/lib/i18n/dictionaries/ur";

const DICTIONARIES = { en, ur };

/** The cookie cannot change while this boundary is mounted, so there is
 *  nothing to subscribe to — but useSyncExternalStore requires a subscribe. */
function subscribe() {
  return () => {};
}

function readLocale(): Locale {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The server has no access to the client's cookie at the point this component
 *  is emitted, so hydration starts from the default and swaps after. */
function serverLocale(): Locale {
  return DEFAULT_LOCALE;
}

/**
 * Root error boundary.
 *
 * This replaces the entire document when it fires — root layout included — so
 * there is no LocaleProvider above it and `useI18n()` is unavailable. It reads
 * the locale cookie directly instead, which works because the cookie is not
 * httpOnly (see lib/actions/locale.ts).
 *
 * The cookie is read through useSyncExternalStore, which is what keeps this
 * hydration-safe: React renders the server snapshot (English) for the
 * hydration pass and only then switches to the client snapshot. Reading
 * document.cookie inline during render would mismatch instead. The result is
 * a brief English flash on a page that only ever appears when something has
 * already gone wrong.
 *
 * Both dictionaries are imported because either may be needed and this file
 * cannot import the server-only accessor. They are small, and this bundle only
 * loads when the boundary trips.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(subscribe, readLocale, serverLocale);
  const t = DICTIONARIES[locale];

  return (
    <html lang={locale}>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
            background: "#f6f7f9",
            color: "#0e1b2e",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t.error.title}</h1>
          <p style={{ marginTop: "0.5rem", color: "#5b6b82" }}>{t.error.body}</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              borderRadius: "0.5rem",
              background: "#0b2447",
              color: "#fff",
              border: "none",
              padding: "0.625rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.error.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
