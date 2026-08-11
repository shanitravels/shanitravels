"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FiUploadCloud, FiStar, FiArrowUp, FiArrowDown, FiTrash2 } from "react-icons/fi";
import { useCloudinaryUpload } from "./useCloudinaryUpload";
import type { MediaImage } from "@/lib/types";

/**
 * Multi-image manager for the vehicle form.
 *
 * Laid out as a rail of thumbnails beside a large preview — deliberately the
 * same shape as the public VehicleGallery, so what an admin sees while editing
 * is what a customer gets on the vehicle page.
 *
 * The primary image is simply the first in the list. That is not a separate
 * field: `images[0]` is already what fleet cards, share previews and the
 * gallery's opening frame all read, so promoting an image to primary moves it
 * to the front rather than setting a flag that could disagree with the order.
 * `order` is re-derived from array position on every change.
 */
export function ImageManager({
  value,
  onChange,
  subfolder,
}: {
  value: MediaImage[];
  onChange: (images: MediaImage[]) => void;
  subfolder?: string;
}) {
  const { uploadMany, uploading, error } = useCloudinaryUpload(subfolder);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  // Selection is by index, so it can outlive the image it pointed at.
  const index = Math.min(selected, Math.max(value.length - 1, 0));
  const current = value[index];

  const reindex = (imgs: MediaImage[]) => imgs.map((img, i) => ({ ...img, order: i }));

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded = await uploadMany(files);
    onChange(
      reindex([
        ...value,
        ...uploaded.map((u) => ({ publicId: u.publicId, url: u.url, alt: "", order: 0 })),
      ])
    );
  };

  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(reindex(next));
    setSelected(target);
  };

  const makePrimary = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(reindex(next));
    setSelected(0);
  };

  const remove = (i: number) => {
    onChange(reindex(value.filter((_, idx) => idx !== i)));
    setSelected((s) => (i < s ? s - 1 : s));
  };

  const setAlt = (i: number, alt: string) =>
    onChange(value.map((img, idx) => (idx === i ? { ...img, alt } : img)));

  return (
    <div>
      {value.length > 0 && current && (
        <div className="mb-4 flex gap-3">
          {/* Rail */}
          <div className="flex max-h-[320px] w-24 shrink-0 flex-col gap-2 overflow-y-auto pr-1">
            {value.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setSelected(i)}
                title={i === 0 ? "Primary image" : `Image ${i + 1}`}
                className={`relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === index
                    ? "border-navy"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-navy/90 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-white">
                    Primary
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stage + controls for the selected image */}
          <div className="min-w-0 flex-1">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={current.url}
                alt={current.alt || "Selected image"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 420px"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-navy px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Primary
                </span>
              )}
              <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white tabular-nums">
                {index + 1} / {value.length}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => makePrimary(index)}
                disabled={index === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiStar className="h-3.5 w-3.5" />
                {index === 0 ? "This is the primary" : "Set as primary"}
              </button>
              <IconBtn title="Move earlier" onClick={() => move(index, -1)} disabled={index === 0}>
                <FiArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn
                title="Move later"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
              >
                <FiArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Remove image" onClick={() => remove(index)} danger>
                <FiTrash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>

            <input
              value={current.alt}
              onChange={(e) => setAlt(index, e.target.value)}
              placeholder="Alt text — describe the shot for screen readers & SEO"
              className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-navy focus:outline-none"
            />
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
      >
        <FiUploadCloud className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">
          Drag &amp; drop images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-navy underline"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG, WebP or AVIF · up to 10 MB each · select several at once
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading && <p className="mt-2 text-xs font-medium text-navy">Uploading…</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded border border-slate-200 p-1.5 transition disabled:opacity-30 ${
        danger ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/** Single-image field for logos, service images, OG/certificate scans. */
export function SingleImageField({
  value,
  onChange,
  subfolder,
  hint,
}: {
  value: { publicId: string; url: string; alt: string } | null;
  onChange: (image: { publicId: string; url: string; alt: string } | null) => void;
  subfolder?: string;
  hint?: string;
}) {
  const { upload, uploading, error } = useCloudinaryUpload(subfolder);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const r = await upload(file);
    setBusy(false);
    if (r) onChange({ publicId: r.publicId, url: r.url, alt: value?.alt ?? "" });
  };

  return (
    <div>
      {value ? (
        <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
            <Image src={value.url} alt={value.alt || "Uploaded image"} fill className="object-contain" sizes="96px" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Alt text"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-navy focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="self-start text-xs font-medium text-red-500 hover:underline"
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 transition hover:border-navy hover:text-navy"
        >
          <FiUploadCloud className="h-5 w-5" />
          {busy || uploading ? "Uploading…" : "Upload image"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
