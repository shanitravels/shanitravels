"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiHeadphones, FiTruck, FiUserCheck } from "react-icons/fi";
import type { MediaImage } from "@/lib/types";
import { SOCIAL_ICONS, type SocialLinkItem } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { useI18n } from "./LocaleProvider";

/** Dictionary keys for the trust line under the actions. */
const TRUST = [
  "trustEstablished",
  "trustInsured",
  "trustNationwide",
  "trustSupport",
] as const;

/**
 * The three promises carried on the panel strip along the bottom edge. Icon
 * here, copy in the dictionary — same split as TRUST above.
 */
const PILLARS = [
  { icon: FiUserCheck, title: "pillarChauffeurTitle", body: "pillarChauffeurDesc" },
  { icon: FiTruck, title: "pillarFleetTitle", body: "pillarFleetDesc" },
  { icon: FiHeadphones, title: "pillarDeskTitle", body: "pillarDeskDesc" },
] as const;

/**
 * Copy for every slide after the first.
 *
 * The first slide keeps the CMS headline — that is the line the admin wrote and
 * the one a crawler sees in the server-rendered HTML, so it is never replaced.
 * These carry the rest of the story, and cycle if more hero images are added
 * than there are sets here.
 *
 * Deliberately about the operation rather than about a particular vehicle: the
 * pictures are admin-managed and change without the copy knowing, so a slide
 * that promised "armored SUVs" would eventually caption a saloon.
 */
const SLIDE_COPY = [
  { eyebrow: "slideCorporateEyebrow", title: "slideCorporateTitle", body: "slideCorporateDesc" },
  { eyebrow: "slideCoverageEyebrow", title: "slideCoverageTitle", body: "slideCoverageDesc" },
  { eyebrow: "slideSafetyEyebrow", title: "slideSafetyTitle", body: "slideSafetyDesc" },
] as const;

/** How long each slide holds. The progress bar is driven from the same number. */
const SLIDE_MS = 7000;

/** Every slide's photograph sits in the initial viewport, so the browser
 *  fetches all of them — a long CMS gallery would cost the visitor real data. */
const MAX_SLIDES = 6;

const FALLBACK_BG =
  "https://images.unsplash.com/photo-1654688554491-69d21d38fb91?w=1920&q=80&auto=format";

/**
 * Lays every slide's version of one line of copy into a single grid cell, so
 * the cell always stands as tall as the longest of them and nothing below it
 * moves as the show advances.
 *
 * Top-aligned, so each slide's copy starts on the same line rather than being
 * pushed down by a headline that happens to wrap. The slides not on show keep
 * their layout box — the render below gives them `invisible` (visibility) and
 * not `hidden` (display), because it is that box which reserves the height.
 * Visibility also takes them out of the tab order and off the a11y tree.
 *
 * Wrapped around the copy as a whole rather than around each line of it. Giving
 * every line its own reserved height pins the actions down too, but it strands
 * the body a headline's worth of empty space below a one-line headline, which
 * looks broken. Reserving once puts all the slack in one place, under the copy,
 * where it reads as room rather than as a hole.
 */
function Stack<T>({
  items,
  current,
  className,
  children,
}: {
  items: T[];
  current: number;
  className?: string;
  children: (item: T, active: boolean) => React.ReactNode;
}) {
  return (
    <div className={cn("grid", className)}>
      {items.map((item, i) => {
        const active = i === current;
        return (
          <div
            // Re-keyed as it becomes active so the entry animation replays.
            key={`${i}-${active}`}
            className="col-start-1 row-start-1 self-start"
            aria-hidden={!active}
          >
            {children(item, active)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Homepage hero — a slideshow of the CMS hero images, each with its own line of
 * copy, over a scrim tuned to leave the vehicle visible.
 *
 * A client component because the rotation is stateful; the strings arrive
 * through the locale provider rather than `getI18n()`, and the headline props
 * stay server-resolved so slide one renders identically before hydration.
 */
export function Hero({
  headline,
  subheadline,
  images,
  socials = [],
}: {
  headline: string;
  subheadline: string;
  images: MediaImage[];
  /** Resolved by the server from settings; empty until an admin fills them in. */
  socials?: SocialLinkItem[];
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    const source =
      images.length > 0
        ? images.slice(0, MAX_SLIDES)
        : [{ publicId: "", url: FALLBACK_BG, alt: "", order: 0 }];

    return source.map((image, i) => {
      const copy = i === 0 ? null : SLIDE_COPY[(i - 1) % SLIDE_COPY.length];
      return {
        image,
        eyebrow: copy ? t.hero[copy.eyebrow] : t.hero.ribbon,
        title: copy ? t.hero[copy.title] : headline,
        body: copy ? t.hero[copy.body] : subheadline,
      };
    });
  }, [images, headline, subheadline, t]);

  const count = slides.length;
  // Guards against an image being removed from the CMS while the page is open.
  const current = index % count;

  useEffect(() => {
    if (count < 2 || paused) return;
    // Read at schedule time rather than held in state: an auto-advancing hero
    // is exactly the motion this setting exists to stop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((index + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [count, paused, index]);

  return (
    <section
      className="relative isolate flex min-h-[34rem] w-full flex-col overflow-hidden bg-navy-deep lg:min-h-[38rem]"
      aria-roledescription="carousel"
      aria-label={t.hero.carouselLabel}
      // Keyboard users get the pause the pointer handlers give everyone else:
      // a slide that changes under a focused control is a trap.
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((item, i) => (
          <div
            key={`${i}-${item.image.url}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none",
              i === current ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== current}
          >
            <div className={cn("hero-media absolute inset-0", i === current && "is-active")}>
              <Image
                src={item.image.url}
                alt={item.image.alt || t.hero.bgAlt}
                fill
                // Only the first slide is the LCP candidate; preloading the
                // rest would race the one the visitor actually sees.
                preload={i === 0}
                className="object-cover object-[58%_center]"
                sizes="100vw"
              />
            </div>
          </div>
        ))}

        <div className="hero-scrim absolute inset-0" />
        <div className="hero-scrim-base absolute inset-0" />
        <div className="dot-grid absolute inset-0 opacity-[0.16]" />
      </div>

      {/* Social accounts, over the sky in the top corner.

          Absolutely positioned, deliberately: the hero's height is the height of
          its copy, and anything added to that flow would lengthen the section.
          Out of flow, this costs nothing.

          Held back until `md` — below that the copy column runs the full width
          and its eyebrow reaches into this corner, so the two would collide.
          The footer carries the same links on a phone. */}
      {socials.length > 0 && (
        <div className="absolute right-5 top-6 z-20 hidden items-center gap-2.5 md:flex lg:right-8">
          {socials.map(({ key, label, href }) => {
            const Icon = SOCIAL_ICONS[key];
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hero-social flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-navy-deep/55 text-white backdrop-blur-sm transition hover:border-white hover:bg-navy-deep/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      )}

      {/* Headline block.

          Top-anchored: every slide's copy begins on the same line, whatever its
          length, and runs down from there at its natural spacing. The block
          holds the tallest slide's height (see Stack), so the trust line, the
          progress bar and the panels below all stay put; on a short slide the
          leftover falls between the actions and the trust line. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-8 pt-10 md:px-8 md:pb-10 md:pt-12">
        <div
          className="max-w-2xl"
          // Scoped to the copy column, not the whole section: hovering the
          // photograph should not freeze the show, but reading should.
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* The eyebrow reserves its own height, unlike the copy below it: on a
              narrow screen the longest of them takes two lines where the others
              take one, and that difference would push the headline off its mark.
              A line of 11px text is a small thing to hold open — doing the same
              for the headline is what strands the body. */}
          <Stack items={slides} current={current}>
            {(item, active) => (
              <span
                className={cn(
                  "hero-legible flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80",
                  active ? "hero-copy" : "invisible"
                )}
              >
                <span className="h-px w-8 bg-accent" />
                {item.eyebrow}
              </span>
            )}
          </Stack>

          <Stack items={slides} current={current} className="mt-5">
            {(item, active) => {
              // Only the slide on show is the heading, so the document keeps
              // exactly one h1 no matter how many slides are stacked. On the
              // server `current` is 0, so that h1 is the CMS headline — what a
              // crawler reads is unchanged.
              //
              // The stand-ins must letter identically to the heading or they
              // reserve the wrong height. Shared utility classes are not enough
              // on their own: globals.css styles Urdu headings by element, and
              // an element selector outranks a utility class. `.hero-title` is
              // what carries those rules across to the paragraphs — keep it on
              // this element and in both [lang="ur"] rules.
              const Title = active ? "h1" : "p";

              return (
                <div className={cn(active ? "hero-copy" : "invisible")}>
                  <Title className="hero-title hero-legible font-heading text-[2.15rem] font-extrabold uppercase leading-[1.06] text-white sm:text-5xl lg:text-[3.4rem]">
                    {item.title}
                  </Title>

                  {item.body && (
                    <p className="hero-legible mt-4 max-w-lg text-base leading-relaxed text-white/80">
                      {item.body}
                    </p>
                  )}

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href="/fleet"
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(200,16,46,0.9)] transition hover:bg-accent-light"
                    >
                      {t.hero.retailBrowse} <FiArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/corporate"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-navy-deep/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
                    >
                      {t.hero.corporateProposal}
                    </Link>
                  </div>
                </div>
              );
            }}
          </Stack>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {TRUST.map((key) => (
              <li
                key={key}
                className="hero-legible flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80"
              >
                <FiCheck className="h-3.5 w-3.5 text-accent-light" />
                {t.hero[key]}
              </li>
            ))}
          </ul>

          {count > 1 && (
            <div className="mt-8 flex items-center gap-4">
              <span className="hero-legible tabular text-[11px] font-semibold tracking-[0.18em] text-white/70">
                {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                {slides.map((item, i) => (
                  <button
                    key={`bar-${i}-${item.image.url}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={fmt(t.hero.showSlide, { n: i + 1 })}
                    aria-current={i === current}
                    className="group relative h-6 w-11 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/45">
                      {i === current && (
                        <span
                          className={cn(
                            "hero-progress-fill block h-full w-full origin-left rounded-full bg-accent",
                            paused && "is-paused"
                          )}
                          style={{ "--hero-interval": `${SLIDE_MS}ms` } as React.CSSProperties}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promise strip along the bottom edge */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 md:px-8 md:pb-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-xl border border-white/12 bg-navy-deep/55 p-5 backdrop-blur-md transition-colors duration-300 hover:border-white/25 hover:bg-navy-deep/75"
            >
              {/* The red rule is the Shani mark on an otherwise neutral panel —
                  it arrives on hover so the resting strip stays quiet. */}
              <span className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-y-100 motion-reduce:transition-none" />
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-accent-light">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="mt-4 font-heading text-[13px] font-bold uppercase tracking-[0.14em] text-white">
                {t.hero[title]}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{t.hero[body]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
