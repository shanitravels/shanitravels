"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { ALL_TAGS, TAGS } from "@/lib/tags";
import { settingsSchema } from "@/lib/validation";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/**
 * Save the SiteSettings singleton. Settings feed the global chrome (header,
 * footer, hero, SEO defaults), so saving invalidates every public tag.
 *
 * `updateTag`, not `revalidateTag(tag, "max")`: the latter is
 * stale-while-revalidate, so the admin saves a new phone number, reloads the
 * site and is still served the old one from cache. `updateTag` expires the
 * entry outright — the next request waits for fresh data (read-your-own-writes).
 */
export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = settingsSchema.parse(input);
    await connectDB();
    // No preserveUrdu here: SettingsForm renders an Urdu input beside every
    // English one and submits both sides, so it is authoritative — including
    // when a translation is deliberately cleared. Mirrors BILINGUAL_EDITORS in
    // lib/actions/content.ts; settings simply have their own action file.
    await SettingsModel.findOneAndUpdate(
      { singleton: "main" },
      { $set: data },
      { upsert: true, runValidators: true }
    );
    for (const tag of ALL_TAGS) updateTag(tag);
    return { ok: true, message: "Settings saved — the public site is updated." };
  } catch (err) {
    return toActionError(err);
  }
}

/** Quick toggle for the announcement bar from the dashboard. */
export async function setAnnouncementActive(active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await SettingsModel.findOneAndUpdate(
      { singleton: "main" },
      { $set: { "announcementBar.active": active } },
      { upsert: true }
    );
    updateTag(TAGS.settings);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}
