"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiHeadphones, FiTruck, FiUserCheck } from "react-icons/fi";
import type { HeroSlideDoc, MediaImage } from "@/lib/types";
import type { Flatten } from "@/lib/i18n/localize";

/**
 * A slide as the component receives it: localized (so the copy is plain
 * strings) and with that copy optional, because the stand-in slide built for an
 * empty CMS is a bare picture.
 */
type HeroSlide = MediaImage & Partial<Omit<Flatten<HeroSlideDoc>, keyof MediaImage>>;
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

/* The slide copy that used to live here — a hardcoded table the admin could
 * not reach — now sits on each slide row in the database, put there by
 * scripts/backfill-hero-slides.ts. The dictionary keys it read
 * (hero.slideCorporate*, hero.slideCoverage*, hero.slideSafety*) are kept in
 * lib/i18n/dictionaries so that script stays runnable for a fresh database. */

/**
 * How long each slide holds, in milliseconds.
 *
 * The bar is not merely "driven from the same number" — it *is* the clock. The
 * slide advances when the bar's animation ends, so the two cannot drift apart
 * however the page is interacted with. Keep this in step with the fallback in
 * `--hero-interval` (app/globals.css).
 */
const SLIDE_MS = 5000;

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
  /**
   * Slides from settings. Localized already, so the copy arrives as plain
   * strings; the fallback slide the component builds for an empty CMS carries
   * no copy of its own, hence the partial shape.
   */
  images: HeroSlide[];
  /** Resolved by the server from settings; empty until an admin fills them in. */
  socials?: SocialLinkItem[];
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    // Every slide's words come from its own row. There is no per-line fallback
    // to the dictionary any more: the copy that used to live in code was
    // written into the database by scripts/backfill-hero-slides.ts, so what an
    // admin sees in the settings form is exactly what renders here. A line left
    // blank renders blank — deliberately, so an emptied field looks emptied
    // rather than silently reverting to something nobody can edit.
    if (images.length > 0) {
      return images.slice(0, MAX_SLIDES).map((image) => ({
        image,
        eyebrow: image.eyebrow?.trim() ?? "",
        title: image.title?.trim() ?? "",
        body: image.body?.trim() ?? "",
      }));
    }

    // Nothing configured at all. Not a content fallback but an empty-database
    // guard: the homepage still needs a hero, and these two fields are the only
    // hero copy that exists before any slide does.
    return [
      {
        image: { publicId: "", url: FALLBACK_BG, alt: "", order: 0 },
        eyebrow: t.hero.ribbon,
        title: headline,
        body: subheadline,
      },
    ];
  }, [images, headline, subheadline, t]);

  const count = slides.length;
  // Guards against an image being removed from the CMS while the page is open.
  const current = index % count;

  /**
   * Advance when the progress bar finishes, rather than on a timer of our own.
   *
   * There used to be a `setTimeout` alongside the bar's CSS animation, and the
   * two kept their own time. The effect listed `paused` as a dependency, so
   * every hover or focus tore the timeout down and started a fresh full hold
   * while the bar carried on from where it was — the bar would reach the end,
   * nothing would happen, and it would start over on the same slide.
   *
   * One clock removes that class of bug entirely: pausing is
   * `animation-play-state: paused`, which holds the bar and withholds the event
   * together, and resuming continues from the exact point it stopped rather
   * than restarting the hold.
   *
   * Reduced motion needs no check here either — globals.css sets
   * `animation: none` on the bar, so no event is ever raised and the hero
   * simply stops advancing, which is the point of the setting.
   */
  const advanceFrom = (slide: number) =>
    // Guarded rather than a plain increment: the counter is rendered twice (the
    // picture's foot below xl, the copy column at xl) and only the visible copy
    // animates, but should both ever run, this still advances one slide.
    setIndex((n) => (n % count === slide ? (slide + 1) % count : n));

  /* The slide counter and its progress bars. Rendered in two places — over the
     foot of the picture below xl, inside the copy column at xl — because the
     picture moves from behind the copy to beneath it at that breakpoint. */
  const progress = count > 1 && (
    <div className="flex items-center gap-4">
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
                  // The hero's clock. See advanceFrom above.
                  onAnimationEnd={() => advanceFrom(i)}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  /* The two calls to action. Identical on every slide, so they live outside the
     Stack, and — like the counter, the ticks and the account links — they are
     rendered in two places: after the photograph below xl, inside the copy
     column at xl. */
  const actions = (
    <>
      <Link
        href="/fleet"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(200,16,46,0.9)] transition hover:bg-accent-light sm:py-3"
      >
        {t.hero.retailBrowse} <FiArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/corporate"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-navy-deep/30 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10 sm:py-3"
      >
        {t.hero.corporateProposal}
      </Link>
    </>
  );

  /* The account links. Rendered twice for the same reason as the counter and
     the ticks: at xl they sit in the top corner over the sky, and below xl —
     where a centred eyebrow runs the full width and would collide with that
     corner — they take their own row between the actions and the photograph. */
  const socialIcons = socials.map(({ key, label, href }) => {
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
  });

  /* The four ticks. Like the counter, this renders in two places: below xl the
     running order is actions → photograph → ticks, so it sits after the band;
     at xl the photograph is a backdrop rather than a block, and the ticks
     belong in the copy column with everything else. */
  const trustList = (
    <ul className="mx-auto grid w-max grid-cols-2 gap-x-3 gap-y-2 text-left sm:gap-x-6 sm:gap-y-2.5 xl:mx-0 xl:flex xl:w-auto xl:flex-wrap xl:items-center">
      {TRUST.map((key) => (
        <li
          key={key}
          className="hero-legible flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-white/80 sm:gap-2 sm:text-[11px] sm:tracking-[0.14em]"
        >
          <FiCheck className="h-3.5 w-3.5 shrink-0 text-accent-light" />
          {t.hero[key]}
        </li>
      ))}
    </ul>
  );

  return (
    <section
      className="relative isolate flex min-h-[26rem] w-full flex-col overflow-hidden bg-navy-deep xl:min-h-[38rem]"
      aria-roledescription="carousel"
      aria-label={t.hero.carouselLabel}
      // Keyboard users get the pause the pointer handlers give everyone else:
      // a slide that changes under a focused control is a trap.
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Below xl the copy no longer sits on the photograph, and flat navy
          behind it reads as a slab. The same texture the picture carries keeps
          the two halves looking like one section. Painted before the band in
          the DOM, so the photograph covers it where they overlap. */}
      {/* z-[5] lifts this over the photograph, so below xl exactly one dot layer
          covers copy and picture alike. Stacked layers — this one plus the
          band's own — made the band a lighter, more textured rectangle whose
          edges stayed visible however smooth the gradient got.
          pointer-events-none because it now sits over the slide controls. */}
      <div
        className="dot-grid pointer-events-none absolute inset-0 z-[5] opacity-[0.10] xl:hidden"
        aria-hidden
      />

      {/* Social accounts, over the sky in the top corner.

          Absolutely positioned, deliberately: the hero's height is the height of
          its copy, and anything added to that flow would lengthen the section.
          Out of flow, this costs nothing.

          Held back until `xl` — that is where the copy stops being centred and
          returns to a left column. While it is centred the eyebrow runs the
          full width and reaches into this corner, and the two collide. The
          footer carries the same links on phones and tablets. */}
      {socials.length > 0 && (
        <div className="absolute right-8 top-6 z-20 hidden items-center gap-2.5 xl:flex">
          {socialIcons}
        </div>
      )}

      {/* Headline block.

          Top-anchored: every slide's copy begins on the same line, whatever its
          length, and runs down from there at its natural spacing. The block
          holds the tallest slide's height (see Stack), so the trust line, the
          progress bar and the panels below all stay put; on a short slide the
          leftover falls between the actions and the trust line. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-6 pt-7 text-center sm:pb-8 sm:pt-9 md:px-8 md:pt-12 xl:justify-end xl:pb-10 xl:text-left">
        <div
          className="mx-auto w-full max-w-2xl xl:mx-0"
          // Scoped to the copy column, not the whole section: hovering the
          // photograph should not freeze the show, but reading should.
          //
          // Pointer events filtered to a real mouse, deliberately. These were
          // mouseenter/mouseleave, and a tap on a touchscreen raises a
          // synthesised mouseenter with no matching mouseleave — so the first
          // tap anywhere on the copy pinned `paused` true and the hero never
          // advanced again. That is the "stuck on the same slide" this fixes,
          // and it only ever showed on phones and tablets.
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          // A pointer that vanishes mid-hover (the tab is switched, the button
          // is captured elsewhere) would otherwise leave it paused for good.
          onPointerCancel={() => setPaused(false)}
        >
          {/* The eyebrow reserves its own height, unlike the copy below it: on a
              narrow screen the longest of them takes two lines where the others
              take one, and that difference would push the headline off its mark.
              A line of 11px text is a small thing to hold open — doing the same
              for the headline is what strands the body. */}
          <Stack items={slides} current={current}>
            {(item, active) => (
              // Centred layouts stack the accent rule above the words: inline,
              // a two-line eyebrow leaves the rule stranded at the far left
              // while the text centres beside it.
              <span
                className={cn(
                  "hero-legible flex flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:tracking-[0.24em] xl:flex-row xl:items-center xl:gap-3",
                  active ? "hero-copy" : "invisible"
                )}
              >
                <span className="h-px w-8 shrink-0 bg-accent" />
                {item.eyebrow}
              </span>
            )}
          </Stack>

          <Stack items={slides} current={current} className="mt-4 sm:mt-5">
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
                  <Title className="hero-title hero-legible font-heading text-[1.7rem] font-extrabold uppercase leading-[1.08] text-white sm:text-[2.75rem] md:text-5xl xl:text-[3.4rem]">
                    {item.title}
                  </Title>

                  {item.body && (
                    <p className="hero-legible mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:mt-4 sm:text-base xl:mx-0">
                      {item.body}
                    </p>
                  )}

                </div>
              );
            }}
          </Stack>

          {/* Below xl the actions follow the photograph — see the block after
              the band. They sit outside the Stack either way: both buttons are
              the same on every slide, so there is nothing per-slide to reserve
              height for, and the Stack only has to hold the copy steady. */}
          <div className="mt-7 hidden flex-wrap items-center gap-3 xl:flex">{actions}</div>

          {/* Below xl these follow the photograph too. */}
          <div className="mt-8 hidden xl:block">{trustList}</div>

          {/* At xl the picture is behind this column, so the counter belongs
              here. Below xl it rides the foot of the picture instead. */}
          {progress && <div className="mt-8 hidden xl:flex">{progress}</div>}
        </div>
      </div>

      {/* The photograph.

          Below xl it is a block in the flow beneath the copy, held at the
          source image's own 16:9 so the whole frame — the car and the chauffeur
          beside it — survives. It used to be a full-bleed backdrop at every
          size, which meant `object-cover` had to crop a 16:9 picture into a
          0.3-ratio column on a phone: 83% of the width went, and what was left
          was a sliver of building.

          At xl the section is close to the picture's own ratio, so it goes back
          to being a full-bleed backdrop with the copy over it. */}
      <div className="relative z-0 aspect-[16/9] w-full overflow-hidden xl:absolute xl:inset-0 xl:aspect-auto">
        {slides.map((item, i) => (
          <div
            key={`${i}-${item.image.url}`}
            className={cn(
              // hero-band-fade takes the image's alpha to nothing at the band's
              // top and bottom edges below xl, so the section's own navy shows
              // there rather than an overlay imitating it.
              // 800ms against a 5s hold. At the old 1200ms the crossfade ate
              // nearly a quarter of the shorter cycle, so a slide spent more of
              // its life dissolving than being looked at.
              "hero-band-fade absolute inset-0 transition-opacity duration-[800ms] ease-out motion-reduce:transition-none",
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
                // Below xl the band takes a tighter crop than the frame it is
                // given. Showing the whole 16:9 picture there leaves the car
                // small in a sea of forecourt; scaling past the band and
                // biasing the origin right-and-down puts the subject at a
                // readable size. 78%/58% was chosen against all three slides —
                // the chauffeur, the last bus in the fleet line, and the
                // operator's desk all stay inside the frame. Carried on the
                // image rather than .hero-media so the reduced-motion rule,
                // which clears that element's transform, cannot drop the crop.
                className="scale-[1.22] object-cover object-center origin-[78%_58%] xl:origin-center xl:scale-100 xl:object-[58%_center]"
                sizes="100vw"
              />
            </div>
          </div>
        ))}

        {/* No navy overlay below xl any more — hero-band-fade on each slide
            does the join by masking the image instead. */}
        <div className="hero-scrim absolute inset-0 hidden xl:block" />
        <div className="hero-scrim-base absolute inset-0 hidden xl:block" />
        {/* xl only — below that the section-level layer above covers this area
            too, and running both is what produced the visible band edge. */}
        <div className="dot-grid pointer-events-none absolute inset-0 hidden opacity-[0.16] xl:block" />

        {progress && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-5 pb-4 xl:hidden">
            {progress}
          </div>
        )}
      </div>

      {/* Actions, below xl only. Capped rather than edge-to-edge: a single
          button spanning a 1000px tablet reads as a banner, not a control. */}
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-stretch gap-2.5 px-5 pt-6 sm:max-w-md sm:gap-3 md:px-8 xl:hidden">
        {actions}
      </div>

      {/* Account links, below xl only — at xl they take the top corner over the
          sky, which a centred eyebrow occupies at these sizes. The running
          order on a phone is copy, picture, actions, accounts, ticks. */}
      {socials.length > 0 && (
        <div className="relative z-10 flex items-center justify-center gap-2.5 px-5 pt-6 md:px-8 xl:hidden">
          {socialIcons}
        </div>
      )}

      {/* The ticks, in the running order the phone and tablet layouts ask for:
          actions, the photograph, the accounts, then these. Hidden at xl, where
          the copy column above carries them instead. */}
      <div className="relative z-10 px-5 pt-6 text-center md:px-8 xl:hidden">{trustList}</div>

      {/* Promise strip along the bottom edge */}
      {/* pt only below xl, where the ticks now sit directly above this strip. */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-6 md:px-8 md:pb-10 xl:pt-0">
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
