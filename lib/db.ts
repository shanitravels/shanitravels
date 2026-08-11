import mongoose from "mongoose";
import { applyDnsFallback } from "./dns-fallback";

/**
 * Cached Mongoose connection for serverless environments.
 *
 * A single connection promise is stored on `globalThis` so hot reloads in dev
 * and warm lambda invocations in production reuse the socket instead of
 * opening a new one per request.
 *
 * Atlas occasionally rejects concurrent TLS handshakes with
 * `tlsv1 alert internal error` — most visibly during `next build`, where
 * several static-generation workers connect at once. Those failures are
 * transient and retryable, so the initial connect backs off and retries
 * rather than letting a whole page render as empty.
 */

const MONGODB_URI = process.env.MONGODB_URI;

const MAX_ATTEMPTS = 4;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};
globalWithMongoose.__mongoose = cached;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient network/TLS faults are worth retrying; auth failures are not. */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name ?? "";
  const message = err.message ?? "";
  return (
    name === "MongoNetworkError" ||
    name === "MongoServerSelectionError" ||
    message.includes("tlsv1 alert") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    // A failed SRV lookup is worth another pass: applyDnsFallback() runs again
    // on the next attempt and may have repaired the resolver in between.
    message.includes("querySrv")
  );
}

let bannerShown = false;

/**
 * The public pages degrade to empty content when the database is unreachable,
 * so a misconfigured deployment renders a working-but-empty site rather than
 * erroring. That is easy to miss in build logs — so say it loudly, once.
 */
function warnUnreachable(err: unknown): void {
  if (bannerShown) return;
  bannerShown = true;
  const message = err instanceof Error ? err.message : String(err);
  // A failed SRV lookup never reaches Atlas, so the usual access-related
  // advice is actively misleading — name the real cause instead.
  const isDnsFailure = message.includes("querySrv") || message.includes("EAI_AGAIN");
  const causes = isDnsFailure
    ? [
        "  This is a DNS failure, not an Atlas one — the mongodb+srv lookup",
        "  never reached the cluster, so credentials and the IP allow-list",
        "  are not the problem.",
        "   1. Check this host can resolve DNS at all.",
        "   2. Node uses its own resolver, not the OS. If",
        "      `node -e \"console.log(require('dns').getServers())\"` prints",
        "      127.0.0.1, set a static DNS server on the network adapter.",
      ]
    : [
        "  Most common causes, in order:",
        "   1. MongoDB Atlas → Network Access does not allow this host's IP.",
        "      Serverless platforms use dynamic IPs — add 0.0.0.0/0.",
        "   2. MONGODB_URI is missing or wrong in the environment.",
        "   3. The database user lacks readWrite on the named database.",
      ];
  console.error(
    [
      "",
      "═".repeat(72),
      "  DATABASE UNREACHABLE — pages will render with NO CONTENT",
      "═".repeat(72),
      `  ${message.slice(0, 160)}`,
      "",
      ...causes,
      "",
      "  Verify a running deployment at:  /api/health",
      "═".repeat(72),
      "",
    ].join("\n")
  );
}

async function connectWithRetry(uri: string): Promise<typeof mongoose> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // A broken OS resolver makes the SRV lookup in a mongodb+srv:// URI fail
    // before we ever reach Atlas; no-op when DNS is configured correctly.
    // Re-checked per attempt because loading the driver can itself create a
    // fresh promises resolver pointing at 127.0.0.1 — so a single call before
    // the loop can be undone by the very first connect.
    applyDnsFallback();

    try {
      return await mongoose.connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 15000,
        // Keep concurrent handshakes modest — several build workers may be
        // connecting to the same cluster simultaneously.
        maxPoolSize: 10,
        retryWrites: true,
      });
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break;
      const backoff = 250 * 2 ** (attempt - 1); // 250ms, 500ms, 1s
      console.warn(
        `[db] connect attempt ${attempt}/${MAX_ATTEMPTS} failed (${
          err instanceof Error ? err.message.slice(0, 80) : "unknown"
        }); retrying in ${backoff}ms`
      );
      await sleep(backoff);
    }
  }

  warnUnreachable(lastError);
  throw lastError;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry(MONGODB_URI).catch((err) => {
      // Reset so the next request retries instead of reusing a rejected promise.
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
