import { ZodError } from "zod";
import { fieldErrorsOf } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Map thrown errors (auth, zod, mongo) to a safe ActionResult. */
export function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof ZodError) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(err) };
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    if (err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to do that." };
    }
    // Mongo duplicate key (unique slug/email/reference)
    if ("code" in err && (err as { code?: number }).code === 11000) {
      return { ok: false, error: "That value is already in use — slugs and emails must be unique." };
    }
    console.error("[action] failed:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  console.error("[action] failed:", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/**
 * Keeps existing Urdu when an edit only carries English.
 *
 * Validation accepts a bare string for a bilingual field and reads it as the
 * English side, leaving `ur` empty. Saving that directly would wipe a
 * translation every time someone corrected an English typo. This walks the
 * parsed payload against the document already in the database and restores any
 * `ur` the payload does not set.
 *
 * Only ever *adds* Urdu back — an explicitly supplied `ur`, including a
 * deliberate blanking, is left alone.
 */
export function preserveUrdu<T>(incoming: T, existing: unknown): T {
  if (Array.isArray(incoming)) {
    const prior = Array.isArray(existing) ? existing : [];
    return incoming.map((item, i) => preserveUrdu(item, prior[i])) as T;
  }

  if (incoming && typeof incoming === "object") {
    const inc = incoming as Record<string, unknown>;
    const old = (existing && typeof existing === "object" ? existing : {}) as Record<string, unknown>;

    // A bilingual pair with the Urdu side dropped — restore it.
    if ("en" in inc && "ur" in inc && typeof inc.en === "string") {
      if (!inc.ur && typeof old.ur === "string" && old.ur) {
        return { ...inc, ur: old.ur } as T;
      }
      return incoming;
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(inc)) out[k] = preserveUrdu(v, old[k]);
    return out as T;
  }

  return incoming;
}
