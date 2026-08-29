import Script from "next/script";

/**
 * Third-party visitor analytics, chosen by environment variable.
 *
 * Renders nothing at all unless one is configured, so the site ships no
 * tracking by default and enabling it is a deploy setting rather than a code
 * change:
 *
 *   PLAUSIBLE_DOMAIN=shanitravels.com     → Plausible
 *   GA_MEASUREMENT_ID=G-XXXXXXXXXX        → Google Analytics 4
 *
 * Deliberately NOT prefixed NEXT_PUBLIC_: that prefix inlines a value at build
 * time, so turning analytics on would need a rebuild and a stale value would be
 * baked into the bundle. This component renders on the server, so an ordinary
 * runtime variable works and can be flipped from the hosting dashboard alone.
 *
 * Plausible is the better fit here — cookieless, so it needs no consent banner,
 * and about 1 KB against GA4's ~50 KB on a site whose audience is largely on
 * mobile data. GA4 is supported because it is free and many agencies expect it.
 *
 * Setting both is allowed and works; `components/site/track.ts` forwards
 * each conversion to whichever globals exist.
 *
 * This only measures page views and the events we send. The conversion counts
 * the admin dashboard reads are first-party and independent of anything here —
 * they keep working when a visitor blocks scripts.
 */
export function Analytics() {
  const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
  const gaId = process.env.GA_MEASUREMENT_ID;

  if (!plausibleDomain && !gaId) return null;

  return (
    <>
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.outbound-links.js"
          strategy="afterInteractive"
        />
      )}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </>
  );
}
