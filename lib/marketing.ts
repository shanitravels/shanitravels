import "server-only";
import { MarketingContactModel } from "@/lib/models";
import type { MarketingSource } from "@/lib/types";

/**
 * The placeholder `submitContact` stores when a customer leaves email blank.
 * It must never reach the mailing list — it is not a real address.
 */
const PLACEHOLDER_EMAIL = "not-provided@enquiry.local";

/** Deliberately loose: Zod already validated real inputs, this is a last guard. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Add or refresh an address on the offers mailing list.
 *
 * Never throws and never rejects — a marketing write must not be able to fail a
 * booking that already saved. Callers deliberately do not await the outcome for
 * correctness, only for ordering.
 *
 * Re-submitting does NOT resubscribe someone who opted out: `subscribed` is set
 * only on insert. Silently resubscribing an unsubscribed customer because they
 * booked again is exactly the bug that gets a sending domain blacklisted.
 */
export async function recordMarketingContact(input: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  source: MarketingSource;
}): Promise<void> {
  try {
    const email = input.email?.trim().toLowerCase();
    if (!email || email === PLACEHOLDER_EMAIL || !EMAIL_RE.test(email)) return;

    const set: Record<string, unknown> = { lastSeenAt: new Date() };
    if (input.name) set.name = input.name;
    if (input.phone) set.phone = input.phone;

    await MarketingContactModel.updateOne(
      { email },
      {
        $set: set,
        $setOnInsert: { subscribed: true, unsubscribedAt: null },
        $addToSet: { sources: input.source },
        $inc: { submissions: 1 },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[marketing] failed to record contact:", err);
  }
}
