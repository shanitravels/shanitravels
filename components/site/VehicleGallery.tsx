"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiMaximize2 } from "react-icons/fi";
import type { MediaImage } from "@/lib/types";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";

/**
 * Vehicle photo gallery.
 *
 * Desktop: a vertical thumbnail rail beside a large stage image, so the whole
 * set is visible at a glance without scrolling the page. Mobile has no room for
 * a side rail, so it falls back to a horizontal strip under the stage.
 *
 * The first image is the primary one and is what the rest of the site uses for
 * cards and share previews, so it is what opens here.
 */
export function VehicleGallery({ images, name }: { images: MediaImage[]; name: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [railOverflows, setRailOverflows] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = images[active];
  const many = images.length > 1;

  const step = (delta: number) => setActive((a) => (a + delta + images.length) % images.length);

  // Arrow keys drive the gallery in the lightbox; Escape closes it.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length]);

  // Keep the selected thumbnail in view when moving through the set.
  useEffect(() => {
    thumbRefs.current[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  // The scroll arrows only earn their space when the stack actually overflows,
  // and reclaiming those ~56px is what lets the thumbnails be this wide while
  // still fitting inside the stage. Measured rather than derived from
  // images.length, since the stage height moves with the viewport.
  //
  // This cannot oscillate: arrows appear only when the rail overflows *without*
  // them, and adding them shrinks the rail further, so the condition holds.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const measure = () => setRailOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [images.length]);

  const scrollRail = (dir: -1 | 1) =>
    railRef.current?.scrollBy({ top: dir * 200, behavior: "smooth" });

  if (!current) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-band text-sm text-muted">
        {t.gallery.noImage}
      </div>
    );
  }

  return (
    // Fills the ~726px the detail page gives this column. A narrower cap left a
    // dead gap between the stage and the booking card, so the height is
    // controlled by the 4:3 stage ratio instead of by clamping the width —
    // 4:5 was what made a full-width stage too tall to justify.
    // 4:3 also suits the landscape photos these vehicles are shot in; the old
    // portrait ratio cropped the front and rear of the car out of frame.
    <div className="w-full">
      {/* The rail is absolutely positioned so the stage alone dictates height.
          Laying it out as a flex sibling let a tall stack of thumbnails drive
          the row instead, spilling past the bottom of the image. */}
      {/* Reserves the rail's 128px + a 12px gutter. Keep this in step with the
          w-32 on the rail and its thumbnails — the stage is simply whatever
          width is left over, so this padding is the single sizing knob. */}
      <div className={`relative ${many ? "sm:pl-[140px]" : ""}`}>
        {/* Thumbnail rail — desktop only */}
        {many && (
          <div className="absolute inset-y-0 left-0 hidden w-32 flex-col items-center sm:flex">
            {railOverflows && (
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                className="mb-1 shrink-0 rounded p-1 text-muted transition hover:text-navy"
                aria-label={t.gallery.scrollUp}
              >
                <FiChevronUp className="h-4 w-4" />
              </button>
            )}

            <div
              ref={railRef}
              className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={fmt(t.gallery.viewImage, { n: i + 1, total: images.length })}
                  aria-current={i === active}
                  className={`relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg transition ${
                    i === active
                      ? "ring-2 ring-navy ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || fmt(t.gallery.view, { name, n: i + 1 })}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </button>
              ))}
            </div>

            {railOverflows && (
              <button
                type="button"
                onClick={() => scrollRail(1)}
                className="mt-1 shrink-0 rounded p-1 text-muted transition hover:text-navy"
                aria-label={t.gallery.scrollDown}
              >
                <FiChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Stage — its aspect ratio is what gives the whole block its height */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-band"
            aria-label={t.gallery.openFullScreen}
          >
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 46vw"
            />
            <span className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white opacity-0 transition group-hover:opacity-100">
              <FiMaximize2 className="h-4 w-4" />
            </span>
          </button>

          {many && (
            <>
              <StageArrow side="left" onClick={() => step(-1)} />
              <StageArrow side="right" onClick={() => step(1)} />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail strip — mobile fallback for the side rail */}
      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={fmt(t.gallery.viewImage, { n: i + 1, total: images.length })}
              className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg transition ${
                i === active ? "ring-2 ring-navy" : "opacity-60"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || fmt(t.gallery.view, { name, n: i + 1 })}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={fmt(t.gallery.galleryOf, { name })}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label={t.gallery.close}
          >
            <FiX className="h-6 w-6" />
          </button>
          {many && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label={t.gallery.previous}
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label={t.gallery.next}
              >
                <FiChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white tabular-nums">
                {active + 1} / {images.length}
              </span>
            </>
          )}
          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Prev/next control overlaid on the stage image. */
function StageArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const { t } = useI18n();
  const Icon = side === "left" ? FiChevronLeft : FiChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? t.gallery.previous : t.gallery.next}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-navy shadow transition hover:bg-white ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
