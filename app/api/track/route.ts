import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ConversionEventModel } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { CONVERSION_KINDS, type ConversionKind } from "@/lib/types";

/**
 * Records an outbound contact tap: `POST /api/track` with `{ kind, path }`.
 *
 * Exists as a route rather than a server action because the browser must be
 * able to send it with `navigator.sendBeacon`. These taps navigate away to
 * WhatsApp or the dialler immediately, and a normal fetch is cancelled the
 * moment the page unloads — which is exactly why these leads left no trace.
 * A beacon is queued by the browser and delivered regardless.
 *
 * Accepts nothing identifying. Body is `{ kind, path }` and that is all that is
 * stored; the IP is used for rate limiting and never written down.
 */

export const dynamic = "force-dynamic";

function isKind(value: unknown): value is ConversionKind {
  return typeof value === "string" && (CONVERSION_KINDS as readonly string[]).includes(value);
}

/**
 * Only a same-origin pathname is stored. A crafted body could otherwise write
 * an arbitrary string — including a URL — into a field the admin panel renders.
 */
function safePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value.split(/[?#]/)[0].slice(0, 512);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    // sendBeacon sends a Blob; the content type varies, so parse the text.
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { kind, path } = (body ?? {}) as { kind?: unknown; path?: unknown };
  const safe = safePath(path);
  if (!isKind(kind) || !safe) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Generous: a visitor legitimately taps call and WhatsApp on several pages in
  // one session. This is here to cap a script, not to shape real behaviour.
  if (!(await checkRateLimit("track", 60))) {
    // Answer 204 rather than 429 — nothing is waiting on this response, and a
    // beacon cannot retry anyway. Dropping the row silently is the right
    // outcome for a counter.
    return new NextResponse(null, { status: 204 });
  }

  try {
    await connectDB();
    await ConversionEventModel.create({ kind, path: safe });
  } catch (err) {
    // Never surface a failure: this is a counter attached to a link the visitor
    // is already following. Losing a row costs a data point, not a lead.
    console.error("[track] could not record conversion:", err instanceof Error ? err.message : err);
  }

  return new NextResponse(null, { status: 204 });
}
