"use client";

import type { ConversionKind } from "@/lib/types";

/**
 * Conversion tracking, sent two places at once.
 *
 *   1. First-party, to /api/track — always on, stored in our own MongoDB, and
 *      the only source that survives ad blockers. This is what the admin
 *      dashboard reads.
 *   2. Whichever third-party analytics is configured, so the tap shows up in
 *      the same funnel as page views. No-ops when none is set up.
 *
 * Everything here is best-effort and silent. It is attached to links the
 * visitor is already following, so a tracking failure must never be visible
 * and must never delay the navigation.
 */

interface PlausibleWindow {
  plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
}

/**
 * `sendBeacon` rather than `fetch`, because these clicks unload the page.
 *
 * A WhatsApp link hands off to another app immediately and the browser cancels
 * any request still in flight — which is precisely why these conversions were
 * invisible. A beacon is handed to the browser to deliver on its own schedule
 * and survives the navigation. `keepalive: true` on fetch is the fallback for
 * the rare browser without sendBeacon.
 */
function beacon(payload: { kind: ConversionKind; path: string }): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Beacons are a nice-to-have; never let one break a click.
  }
}

/** Forward the same event to Plausible or GA4, whichever is present. */
function forwardToProvider(kind: ConversionKind, path: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as PlausibleWindow;
  try {
    w.plausible?.(`Contact: ${kind}`, { props: { path } });
    w.gtag?.("event", "contact", { method: kind, page_path: path });
  } catch {
    /* provider not ready, or blocked */
  }
}

/**
 * Record an outbound contact tap — WhatsApp, phone, email, directions.
 *
 * Safe to call from an onClick handler on a link that is about to navigate.
 */
export function trackConversion(kind: ConversionKind): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  beacon({ kind, path });
  forwardToProvider(kind, path);
}

/**
 * A named milestone inside the site — a completed booking, a wizard step.
 *
 * Third-party only: these happen on pages we render, so the server already
 * knows about them and a first-party row would be duplicate bookkeeping.
 */
export function trackEvent(name: string, props?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as PlausibleWindow;
  try {
    w.plausible?.(name, props ? { props } : undefined);
    w.gtag?.("event", name.toLowerCase().replace(/\s+/g, "_"), props);
  } catch {
    /* provider not ready, or blocked */
  }
}
