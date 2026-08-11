"use server";

import { connectDB } from "@/lib/db";
import { MarketingContactModel } from "@/lib/models";
import { requireAdmin } from "@/lib/auth/session";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/**
 * Flip an address on or off the offers list.
 *
 * Rows are never deleted here: an unsubscribe has to survive, and a deleted row
 * would be silently re-added the next time that customer books.
 */
export async function setMarketingSubscribed(id: string, subscribed: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await MarketingContactModel.updateOne(
      { _id: id },
      { $set: { subscribed, unsubscribedAt: subscribed ? null : new Date() } }
    );
    return { ok: true, message: subscribed ? "Subscribed" : "Unsubscribed" };
  } catch (err) {
    return toActionError(err);
  }
}
