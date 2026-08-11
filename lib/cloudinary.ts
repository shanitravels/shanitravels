import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Server-side Cloudinary helpers. All uploads are signed here (never expose
 * the API secret), scoped to the MEDIA_FOLDER, and size/type limited.
 */

export const MEDIA_FOLDER = "shani-travels";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
}

export function cloudinaryConfigured(): boolean {
  return ensureConfigured();
}

export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
}

/**
 * Produce signed params for a direct browser → Cloudinary upload.
 * The signature covers folder + allowed_formats + timestamp, so the client
 * cannot upload outside the site folder or with other formats.
 */
export function signUploadParams(subfolder?: string): SignedUploadParams {
  if (!ensureConfigured()) {
    throw new Error("Cloudinary is not configured. Set the CLOUDINARY_* env vars.");
  }
  const safeSub = (subfolder ?? "").replace(/[^a-z0-9/_-]/gi, "");
  const folder = safeSub ? `${MEDIA_FOLDER}/${safeSub}` : MEDIA_FOLDER;
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = ALLOWED_FORMATS.join(",");
  const signature = cloudinary.utils.api_sign_request(
    { allowed_formats: allowedFormats, folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
}

export interface CloudinaryAsset {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
}

/** List assets in the site folder (media library). */
export async function listAssets(nextCursor?: string): Promise<{
  assets: CloudinaryAsset[];
  nextCursor: string | null;
}> {
  if (!ensureConfigured()) return { assets: [], nextCursor: null };
  const res = await cloudinary.api.resources({
    type: "upload",
    prefix: `${MEDIA_FOLDER}/`,
    max_results: 60,
    next_cursor: nextCursor,
  });
  return {
    assets: (res.resources as Array<Record<string, unknown>>).map((r) => ({
      publicId: r.public_id as string,
      url: r.secure_url as string,
      format: r.format as string,
      bytes: r.bytes as number,
      width: r.width as number,
      height: r.height as number,
      createdAt: r.created_at as string,
    })),
    nextCursor: (res.next_cursor as string | undefined) ?? null,
  };
}

export async function destroyAsset(publicId: string): Promise<boolean> {
  if (!ensureConfigured()) return false;
  if (!publicId.startsWith(`${MEDIA_FOLDER}/`)) {
    throw new Error("Refusing to delete an asset outside the site media folder.");
  }
  const res = await cloudinary.uploader.destroy(publicId);
  return res.result === "ok" || res.result === "not found";
}
