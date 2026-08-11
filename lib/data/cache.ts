import { unstable_cache } from "next/cache";
import { localize } from "@/lib/i18n/localize";
import { getLocale } from "@/lib/i18n/server";

/**
 * Bump to orphan every existing cache entry on the next deploy.
 *
 * Needed because some hosts (Vercel included) keep their data cache across
 * deployments, so a redeploy alone will not clear a bad entry. Raise this when
 * a deployment has cached something wrong and you don't want to wait out the
 * revalidate window.
 *
 * v2 — cleared entries poisoned by database-unreachable deployments.
 */
const CACHE_VERSION = "v2";

/**
 * Cached read that never caches a failure.
 *
 * The naive shape — catching inside the cached function and returning `[]` —
 * stores the empty result as if it were real data, so one transient database
 * fault blanks the site for the whole revalidate window (and, on platforms
 * whose data cache survives deployments, past a redeploy).
 *
 * Here the cached callback is allowed to throw: `unstable_cache` stores nothing
 * when it rejects, so the next request retries. The fallback is applied
 * *outside* the cache, which keeps pages rendering during an outage while
 * letting them self-heal the moment the database is reachable again.
 */
export function cachedRead<TArgs extends unknown[], TResult>(config: {
  /** Must throw on failure — that's what keeps bad results out of the cache. */
  read: (...args: TArgs) => Promise<TResult>;
  keys: string[];
  tags: string[];
  /** Value returned to the page when the read fails. Never cached. */
  fallback: TResult;
  /** Prefixes the console warning, e.g. "vehicles/getActiveVehicles". */
  label: string;
  revalidateSeconds?: number;
  /**
   * Set false for reads that must keep both languages — the admin panel, which
   * edits the `{ en, ur }` pair itself. Public reads want the default.
   */
  localized?: boolean;
}): (...args: TArgs) => Promise<TResult> {
  const {
    read,
    keys,
    tags,
    fallback,
    label,
    revalidateSeconds = 3600,
    localized = true,
  } = config;

  const cached = unstable_cache(read, [CACHE_VERSION, ...keys], {
    tags,
    revalidate: revalidateSeconds,
  });

  return async (...args: TArgs): Promise<TResult> => {
    let result: TResult;
    try {
      result = await cached(...args);
    } catch (err) {
      console.error(
        `[data/${label}] read failed — serving fallback, nothing cached, will retry next request:`,
        err instanceof Error ? err.message : err
      );
      result = fallback;
    }

    if (!localized) return result;

    // Collapsing bilingual pairs *here* rather than in each page is what let the
    // whole public site go bilingual without touching a single component: every
    // read already funnels through this function.
    //
    // Deliberately outside `unstable_cache`: the cached callback stores whole
    // bilingual documents, so one cache entry serves both languages and the
    // existing cache keys and tags stay locale-independent. Localizing inside
    // would double every entry and let one language's render poison the other's.
    //
    // The cast is sound rather than a fib: these reads already declare the
    // localized type (`Vehicle[]`, not `VehicleDoc[]`) through `serialize`, so
    // flattening is what finally makes that declaration true at runtime.
    const locale = await getLocale();
    return localize(result, locale) as TResult;
  };
}
