import "server-only";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { RateLimitModel } from "@/lib/models";

/**
 * Fixed-window rate limiter for the public forms and the admin sign-in.
 *
 * Windows live in MongoDB so every instance counts against the same allowance.
 * The previous implementation kept them in a module-level Map, which on a
 * serverless platform gives each instance its own budget — the effective limit
 * became `limit x warm instances`, and a burst creates the very instances that
 * widen it. That was an acceptable trade for the public forms, where the
 * honeypot and server-side Zod do most of the work, but it was the only thing
 * standing between a credential-stuffing run and a single shared admin login.
 *
 * The in-memory map is still here as a fallback for when the database cannot be
 * reached. It fails *closed enough* to stop a naive burst without failing open
 * completely, and it never blocks a legitimate visitor over an outage — see
 * `memoryFallback` below.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Best-effort per-instance counting, used only when Mongo is unreachable. */
function memoryFallback(key: string, limit: number, now: number): boolean {
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** The caller's address, as far as the proxy in front of us reports it. */
async function clientIp(): Promise<string> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Count one attempt against `scope` for this caller.
 *
 * Returns true while the caller is within `limit` for the current window, false
 * once they are over it.
 */
export async function checkRateLimit(scope: string, limit = 5): Promise<boolean> {
  const key = `${scope}:${await clientIp()}`;
  const now = new Date();

  try {
    await connectDB();
    return await countInStore(key, limit, now);
  } catch (err) {
    // A database outage must not lock out every visitor on the site — the form
    // they are submitting is about to fail on its own if Mongo is really down,
    // and returning false here would replace a clear error with a misleading
    // "too many requests". Degrade to per-instance counting instead.
    console.warn(
      `[rate-limit] store unavailable for "${scope}", falling back to in-memory:`,
      err instanceof Error ? err.message : err
    );
    return memoryFallback(key, limit, now.getTime());
  }
}

/**
 * One attempt, counted atomically.
 *
 * Two steps rather than one upsert, because a fixed window has two distinct
 * cases and `$inc` alone cannot tell them apart: increment inside a live
 * window, or open a fresh one. The unique index on `key` is what makes the
 * second step safe under concurrency.
 */
async function countInStore(key: string, limit: number, now: Date): Promise<boolean> {
  const live = await incrementLiveWindow(key, now);
  if (live !== null) return live <= limit;

  try {
    // Matches only an expired window, so this either resets one or inserts the
    // first. A concurrent caller that got here first makes this a duplicate.
    await RateLimitModel.updateOne(
      { key, resetAt: { $lte: now } },
      { $set: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
    // Lost the race: someone opened the window a moment ago. Count against it.
    const count = await incrementLiveWindow(key, now);
    return count === null ? true : count <= limit;
  }
}

/** Increment the window if one is still open; null when none is. */
async function incrementLiveWindow(key: string, now: Date): Promise<number | null> {
  const doc = await RateLimitModel.findOneAndUpdate(
    { key, resetAt: { $gt: now } },
    { $inc: { count: 1 } },
    // returnDocument: "after" — we need the post-increment count, and the
    // `new` alias is deprecated in Mongoose 9.
    { returnDocument: "after", projection: { count: 1 } }
  ).lean();
  return doc ? (doc as { count: number }).count : null;
}
