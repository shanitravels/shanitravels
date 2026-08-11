"use server";

import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { VehicleModel, ClientModel, ServiceModel, SettingsModel } from "@/lib/models";
import {
  cloudinaryConfigured,
  signUploadParams,
  listAssets,
  destroyAsset,
  type SignedUploadParams,
  type CloudinaryAsset,
} from "@/lib/cloudinary";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/** Media pipeline: signed uploads, library listing, guarded deletion. */

export async function getUploadSignature(
  subfolder?: string
): Promise<ActionResult<SignedUploadParams>> {
  try {
    // Ops file handover photos/signatures; drivers attach checklist and
    // incident photos — so every authenticated role may request a signature.
    await requireAdmin();
    if (!cloudinaryConfigured()) {
      return {
        ok: false,
        error: "Cloudinary isn't configured yet. Add the CLOUDINARY_* env vars to enable uploads.",
      };
    }
    return { ok: true, data: signUploadParams(subfolder) };
  } catch (err) {
    return toActionError(err);
  }
}

export async function browseMedia(cursor?: string): Promise<
  ActionResult<{ assets: CloudinaryAsset[]; nextCursor: string | null; configured: boolean }>
> {
  try {
    await requireAdmin();
    if (!cloudinaryConfigured()) {
      return { ok: true, data: { assets: [], nextCursor: null, configured: false } };
    }
    const { assets, nextCursor } = await listAssets(cursor);
    return { ok: true, data: { assets, nextCursor, configured: true } };
  } catch (err) {
    return toActionError(err);
  }
}

export interface AssetUsage {
  where: string;
  title: string;
}

/** Every place a Cloudinary public_id is referenced in the database. */
export async function findAssetUsage(publicId: string): Promise<ActionResult<AssetUsage[]>> {
  try {
    await requireAdmin();
    await connectDB();
    const usages: AssetUsage[] = [];

    const [vehicles, clients, services, settings] = await Promise.all([
      VehicleModel.find({ "images.publicId": publicId }).select("name").lean(),
      ClientModel.find({ "logo.publicId": publicId }).select("name").lean(),
      ServiceModel.find({ "image.publicId": publicId }).select("title").lean(),
      SettingsModel.findOne({
        $or: [
          { "heroImages.publicId": publicId },
          { "credentials.image.publicId": publicId },
          { "seoDefaults.ogImage.publicId": publicId },
        ],
      })
        .select("singleton")
        .lean(),
    ]);

    for (const v of vehicles) usages.push({ where: "Vehicle", title: v.name });
    for (const c of clients) usages.push({ where: "Client logo", title: c.name });
    for (const s of services) usages.push({ where: "Service", title: s.title });
    if (settings) usages.push({ where: "Site settings", title: "Hero / credentials / OG image" });

    return { ok: true, data: usages };
  } catch (err) {
    return toActionError(err);
  }
}

/** Delete from Cloudinary — blocked while anything still references the asset. */
export async function deleteMediaAsset(publicId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const usage = await findAssetUsage(publicId);
    if (!usage.ok) return usage;
    if (usage.data && usage.data.length > 0) {
      const list = usage.data.map((u) => `${u.where}: ${u.title}`).join(", ");
      return { ok: false, error: `Still in use — remove it first from: ${list}` };
    }
    const done = await destroyAsset(publicId);
    if (!done) return { ok: false, error: "Cloudinary refused the deletion. Try again." };
    return { ok: true, message: "Asset deleted from Cloudinary." };
  } catch (err) {
    return toActionError(err);
  }
}
