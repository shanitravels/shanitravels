"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { clsx } from "clsx";
import { useI18n } from "./LocaleProvider";
import { GALLERY_CATEGORIES, type GalleryImage, type GalleryCategory } from "@/lib/types";

/** How many tiles show before the "+N more" tile takes the last slot. */
const INITIAL_VISIBLE = 11;

/**
 * The photo wall: category chips, a mosaic, and a lightbox.
 *
 * Filtering happens here rather than through the URL because the whole
 * collection arrives in one payload — a gallery is a few hundred rows of
 * metadata, and a round trip per chip would be slower than the filter itself.
 */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const { t } = useI18n();
  const [category, setCategory] = useState<GalleryCategory | "all">("all");
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Only offer a chip for a category that actually has photographs — an empty
  // filter is a dead end the visitor has to back out of.
  const available = useMemo(
    () => GALLERY_CATEGORIES.filter((c) => images.some((i) => i.category === c)),
    [images]
  );

  const filtered = useMemo(
    () => (category === "all" ? images : images.filter((i) => i.category === category)),
    [images, category]
  );

  // Collapsing on every filter change keeps the "+N more" promise honest: the
  // count always describes the bucket currently on screen.
  const selectCategory = (next: GalleryCategory | "all") => {
    setCategory(next);
    setExpanded(false);
  };

  const collapsed = !expanded && filtered.length > INITIAL_VISIBLE + 1;
  const visible = collapsed ? filtered.slice(0, INITIAL_VISIBLE) : filtered;
  const hiddenCount = filtered.length - visible.length;

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightbox((current) =>
        current === null ? null : (current + delta + filtered.length) % filtered.length
      ),
    [filtered.length]
  );

  // Escape closes, arrows page. Bound while the lightbox is open only, so the
  // page keeps its normal keyboard behaviour the rest of the time.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [lightbox, close, step]);

  const active = lightbox === null ? null : filtered[lightbox];

  return (
    <>
      {/* Category chips */}
      <div className="flex flex-wrap justify-center gap-2">
        <Chip active={category === "all"} onClick={() => selectCategory("all")}>
          {t.photoGallery.all}
        </Chip>
        {available.map((c) => (
          <Chip key={c} active={category === c} onClick={() => selectCategory(c)}>
            {t.photoGallery.category[c]}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          {category === "all" ? t.photoGallery.empty : t.photoGallery.emptyFiltered}
        </p>
      ) : (
        /* A fixed-row-height grid rather than a column masonry: masonry orders
           top-to-bottom per column, which scrambles the curated `order` the
           admin set. Here a featured photograph simply claims a 2×2 block and
           everything else keeps its place in the sequence. */
        <div className="mt-8 grid auto-rows-[110px] grid-cols-2 gap-3 sm:auto-rows-[140px] md:grid-cols-3 lg:auto-rows-[165px] lg:grid-cols-4">
          {visible.map((img, i) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setLightbox(i)}
              className={clsx(
                "group relative overflow-hidden rounded-xl bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                img.featured && "col-span-2 row-span-2"
              )}
            >
              <Image
                src={img.image.url}
                alt={img.image.alt || img.caption || ""}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes={img.featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
              />
              {img.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/85 to-transparent p-3 pt-8 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {img.caption}
                </span>
              )}
            </button>
          ))}

          {collapsed && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="group relative flex flex-col items-center justify-center gap-1 rounded-xl bg-navy-deep text-white transition hover:bg-navy"
            >
              <FiPlus className="h-5 w-5 text-accent-light" />
              <span className="font-heading text-2xl font-bold">+{hiddenCount}</span>
              <span className="text-[11px] uppercase tracking-wide text-white/60">
                {t.photoGallery.more}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption || active.image.alt || t.photoGallery.titleAccent}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-deep/95 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t.gallery.close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
          >
            <FiX className="h-5 w-5" />
          </button>

          {filtered.length > 1 && (
            <>
              <ArrowButton side="left" onClick={() => step(-1)} label={t.gallery.previous} />
              <ArrowButton side="right" onClick={() => step(1)} label={t.gallery.next} />
            </>
          )}

          {/* Stops a click on the picture itself from closing the overlay. */}
          <figure
            className="max-h-full w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-xl">
              <Image
                src={active.image.url}
                alt={active.image.alt || active.caption || ""}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 896px, 100vw"
                priority
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-white/70">
              {active.caption || active.image.alt}
              <span className="ml-2 tabular text-white/40">
                {(lightbox ?? 0) + 1} / {filtered.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm",
        active
          ? "bg-accent text-white shadow-card"
          : "border border-line bg-white text-navy hover:border-accent/40 hover:text-accent"
      )}
    >
      {children}
    </button>
  );
}

function ArrowButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20",
        side === "left" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      )}
    >
      {side === "left" ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
    </button>
  );
}
