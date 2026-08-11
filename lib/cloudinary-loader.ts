"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Global next/image loader.
 *
 * - Cloudinary URLs get `f_auto,q_auto,w_<width>,c_limit` injected after
 *   `/upload/` so every image is served responsive + auto-optimised from the CDN.
 * - Unsplash URLs (seed-era placeholders) get their `w`/`q` params rewritten.
 * - Anything else (local /public assets, data URIs) passes through untouched.
 *
 * Because `images.loader` is "custom", Next's own optimizer is off project-wide —
 * a passed-through src can never be resized. Mark those `<Image>`s `unoptimized`
 * or Next warns that the loader "does not implement width".
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const params = ["f_auto", "q_auto", `w_${width}`, "c_limit"];
    return src.replace("/upload/", `/upload/${params.join(",")}/`);
  }

  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  return src;
}
