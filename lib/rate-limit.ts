import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter for the public forms.
 *
 * Best-effort by design: on serverless each instance keeps its own window,
 * which still stops naive bursts; the honeypot field plus server-side Zod
 * validation cover the rest. Swap for Upstash/Redis if stronger guarantees
 * are ever needed — the call sites won't change.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(scope: string, limit = 5): Promise<boolean> {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
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
