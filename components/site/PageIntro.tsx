import type { IconType } from "react-icons";

/**
 * Compact page header band for interior public pages.
 *
 * `icon` gives the band the same treatment /gallery and /awards use: an
 * oversized watermark of the page's own icon on the right, a dashed flourish,
 * and the accent badge. Optional, so a page without a fitting icon simply
 * renders the plain band it always did.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: IconType;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-deep">
      {/* Decoration only: hidden from assistive tech, and clipped by the
          section so it can never widen the page on a phone. */}
      {Icon && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Top-anchored like the gallery and awards banners, so a band that
              grows a line taller does not drag the motif down with it. Smaller
              and pushed further off-canvas on phones, where a 176px watermark
              sat under two-fifths of the text column. */}
          <Icon className="absolute -right-10 top-6 h-32 w-32 text-white/[0.05] sm:right-4 sm:h-52 sm:w-52 lg:right-20 lg:h-56 lg:w-56" />
          <svg
            className="absolute right-28 top-8 hidden h-24 w-72 text-white/15 xl:block"
            viewBox="0 0 300 100"
            fill="none"
          >
            <path
              d="M2 82C60 82 92 12 168 12c46 0 74 22 92 40"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute right-12 top-10 hidden h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg lg:flex">
            <Icon className="h-6 w-6" />
          </span>
        </div>
      )}

      {/*
        `lg:pl-16 xl:pl-24` is the left gap the gallery and awards banners get
        from sitting in a narrower container. Adding it as padding rather than
        narrowing this one keeps the band's edges aligned with the page content
        below, which is max-w-7xl on most of the pages that use this.

        `max-w-2xl` on the copy keeps it clear of the motif.
      */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16 lg:pl-16 xl:pl-24">
        {eyebrow && (
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-accent-light">
            {eyebrow}
          </span>
        )}
        {/* Capped, like the description: an unbounded heading runs the full
            container width and straight under the accent badge, which is not
            translucent. */}
        <h1 className="mt-2 max-w-3xl font-heading text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
