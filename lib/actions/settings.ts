"use server";

import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { ALL_TAGS, TAGS } from "@/lib/tags";
import { settingsSchema } from "@/lib/validation";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/**
 * Save the SiteSettings singleton. Settings feed the global chrome (header,
 * footer, hero, SEO defaults), so saving revalidates every public tag.
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
    for (const tag of ALL_TAGS) revalidateTag(tag, "max");
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
    revalidateTag(TAGS.settings, "max");
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}
