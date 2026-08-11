"use client";

import { useCallback, useState } from "react";
import { getUploadSignature } from "@/lib/actions/media";

export interface UploadedImage {
  publicId: string;
  url: string;
}

/**
 * Direct browser → Cloudinary upload using a server-signed signature.
 * The API secret never reaches the client; the signature scopes uploads to
 * the site folder and allowed formats.
 */
export function useCloudinaryUpload(subfolder?: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      setError(null);

      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is larger than 10 MB.`);
        return null;
      }

      const sig = await getUploadSignature(subfolder);
      if (!sig.ok || !sig.data) {
        setError(sig.ok ? "Upload not configured." : sig.error);
        return null;
      }

      const { cloudName, apiKey, timestamp, signature, folder, allowedFormats } = sig.data;
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);
      form.append("allowed_formats", allowedFormats);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? "Cloudinary rejected the upload.");
          return null;
        }
        return { publicId: json.public_id as string, url: json.secure_url as string };
      } catch {
        setError("Upload failed — check your connection and try again.");
        return null;
      }
    },
    [subfolder]
  );

  const uploadMany = useCallback(
    async (files: FileList | File[]): Promise<UploadedImage[]> => {
      setUploading(true);
      const results: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        const r = await upload(file);
        if (r) results.push(r);
      }
      setUploading(false);
      return results;
    },
    [upload]
  );

  return { upload, uploadMany, uploading, error, setError };
}
