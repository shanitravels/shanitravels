/**
 * Moves the hero slide copy out of the code and into the database.
 *
 *   npm run backfill:hero-slides            # write
 *   npm run backfill:hero-slides -- --dry   # report only
 *
 * The hero used to render slide one from `heroHeadline`/`heroSubheadline` and
 * every later slide from a hardcoded table in the dictionary, which meant an
 * admin could edit the first slide and no other. Each slide now carries its own
 * eyebrow, headline and body, and the component reads them with no fallback —
 * so those strings have to exist as rows before that change is any use. This is
 * what puts them there.
 *
 * Idempotent: a line that already has content is never overwritten, so running
 * it twice, or after an admin has edited a slide, changes nothing.
 *
 * The copy is imported from the dictionaries rather than transcribed, so what
 * lands in the database is exactly what the site was already showing.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { applyDnsFallback } from "../lib/dns-fallback";
import { SettingsModel } from "../lib/models";
import { en } from "../lib/i18n/dictionaries/en";
import { ur } from "../lib/i18n/dictionaries/ur";

type Pair = { en: string; ur: string };
const pair = (e: string, u: string): Pair => ({ en: e, ur: u });

/**
 * The copy each slide after the first was showing, in the order the hero cycled
 * them. Mirrors `SLIDE_COPY` in components/site/Hero.tsx — index 0 here is the
 * hero's slide two, and the list repeats for a fourth slide onwards exactly as
 * `(i - 1) % length` did.
 */
const LATER_SLIDES = [
  {
    eyebrow: pair(en.hero.slideCorporateEyebrow, ur.hero.slideCorporateEyebrow),
    title: pair(en.hero.slideCorporateTitle, ur.hero.slideCorporateTitle),
    body: pair(en.hero.slideCorporateDesc, ur.hero.slideCorporateDesc),
  },
  {
    eyebrow: pair(en.hero.slideCoverageEyebrow, ur.hero.slideCoverageEyebrow),
    title: pair(en.hero.slideCoverageTitle, ur.hero.slideCoverageTitle),
    body: pair(en.hero.slideCoverageDesc, ur.hero.slideCoverageDesc),
  },
  {
    eyebrow: pair(en.hero.slideSafetyEyebrow, ur.hero.slideSafetyEyebrow),
    title: pair(en.hero.slideSafetyTitle, ur.hero.slideSafetyTitle),
    body: pair(en.hero.slideSafetyDesc, ur.hero.slideSafetyDesc),
  },
];

/** Blank on both sides — the only state this script fills in. */
const isBlank = (p: Pair | undefined) => !p?.en?.trim() && !p?.ur?.trim();

async function main() {
  const dry = process.argv.includes("--dry");
  applyDnsFallback();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI is not set. Add it to .env.local.");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. Database: ${mongoose.connection.name}${dry ? "  (dry run)" : ""}\n`);

  const settings = await SettingsModel.findOne({ singleton: "main" });
  if (!settings) {
    console.error("✗ No settings document. Run `npm run seed` first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const slides = settings.heroImages ?? [];
  if (slides.length === 0) {
    console.log("No hero images configured — nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  let filled = 0;
  slides.forEach((slide: Record<string, Pair | undefined>, i: number) => {
    // Slide one is the page's H1 and has always been editable through the two
    // settings fields; those are its source here so the headline a crawler
    // reads does not change.
    const source =
      i === 0
        ? {
            eyebrow: pair(en.hero.ribbon, ur.hero.ribbon),
            title: settings.heroHeadline,
            body: settings.heroSubheadline,
          }
        : LATER_SLIDES[(i - 1) % LATER_SLIDES.length];

    const changes: string[] = [];
    for (const key of ["eyebrow", "title", "body"] as const) {
      if (!isBlank(slide[key])) continue;
      const value = source[key];
      if (isBlank(value)) continue;
      if (!dry) slide[key] = { en: value.en ?? "", ur: value.ur ?? "" };
      changes.push(key);
    }

    console.log(
      `  slide ${i + 1}: ${changes.length ? `filled ${changes.join(", ")}` : "already written — left alone"}`
    );
    if (changes.length) {
      filled++;
      console.log(`      headline: ${String(source.title?.en ?? "").slice(0, 62)}`);
    }
  });

  if (!dry && filled > 0) {
    settings.markModified("heroImages");
    await settings.save();
  }

  console.log(
    dry
      ? `\nDry run — ${filled} of ${slides.length} slides would be filled. Nothing written.`
      : `\n✓ ${filled} of ${slides.length} slides written to the database.`
  );
  if (!dry && filled > 0) {
    console.log("  Purge the public cache so the change shows: POST /api/revalidate?tag=settings");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
