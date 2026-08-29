/**
 * Fill the gallery and awards pages with placeholder content.
 *
 *   npm run placeholders:seed
 *   npm run placeholders:clear
 *
 * Both pages ship empty, which makes them impossible to review and easy to
 * mistake for broken. This generates neutral placeholder artwork, uploads it to
 * Cloudinary, and writes rows through the same Zod schemas the admin panel
 * posts through — so every row is one the editor could have created by hand.
 *
 * The gallery uses real stock photography from Unsplash, chosen for the
 * chauffeur-hire and corporate-transport niche and mirrored into Cloudinary so
 * the site does not depend on someone else's CDN. The Unsplash License allows
 * commercial use without attribution. These are still stand-ins: they are not
 * Shani Travels' vehicles, staff or clients, so replace them with the
 * company's own photography when it exists.
 *
 * The awards artwork is generated rather than photographed, because there is
 * no honest stock stand-in for a specific award. Its copy is template wording
 * ("Issuing organization") rather than invented awards attributed to real
 * bodies. Replace it from Admin → Gallery / Awards, then run
 * `npm run placeholders:clear` to drop whatever is left.
 *
 * Idempotent. Re-running overwrites the same Cloudinary public IDs and replaces
 * the same rows, so it never accumulates duplicates.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { applyDnsFallback } from "../lib/dns-fallback";
import { GalleryImageModel, AwardModel } from "../lib/models";
import { galleryImageSchema, awardSchema } from "../lib/validation";
import {
  GALLERY_CATEGORIES,
  AWARD_CATEGORIES,
  AWARD_CATEGORY_LABELS,
  type GalleryCategory,
  type AwardCategory,
} from "../lib/types";

/**
 * Every placeholder asset lives under this prefix, which is also how `clear`
 * finds the rows again. Nothing an editor uploads can land here — the admin
 * uploader writes to `shani-travels/<section>/`.
 */
const PREFIX = "shani-travels/placeholders";

const NAVY = "#0b2447";
const ACCENT = "#c8102e";

/**
 * Category labels go into SVG text nodes, which are XML — and "Press & Media"
 * carries a bare ampersand. Left raw it makes the document malformed, and
 * Cloudinary rejects the upload with a flat "Resource is invalid" that says
 * nothing about why.
 */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Artwork
// ---------------------------------------------------------------------------

/**
 * Stock photographs per gallery category, by Unsplash photo id.
 *
 * Every id here was fetched and confirmed to return a real JPEG before being
 * committed — a 404 in the mosaic is worse than an empty page. `large` marks
 * the wide, scenic frames that earn a double-width tile; portrait-ish or busy
 * shots stay single so the crop does not cut faces in half.
 */
interface StockPhoto {
  id: string;
  alt: string;
  caption: string;
  large?: boolean;
}

const GALLERY_PHOTOS: Record<GalleryCategory, StockPhoto[]> = {
  "happy-clients": [
    { id: "photo-1521791136064-7986c2920216", alt: "Two people shaking hands after a meeting", caption: "Client handshake" },
    { id: "photo-1549923746-c502d488b3ea", alt: "Two men smiling and shaking hands", caption: "Agreement reached" },
    { id: "photo-1600880292089-90a7e086ee0c", alt: "A team joining hands around a table", caption: "Working together" },
  ],
  "our-team": [
    { id: "photo-1596032457104-baa1f5f9372a", alt: "Chauffeur in a formal suit at the steering wheel", caption: "At the wheel" },
    { id: "photo-1730800328198-f9efbf9db53f", alt: "Suited driver standing beside a black saloon", caption: "Ready for pickup" },
    { id: "photo-1449965408869-eaa3f722e40d", alt: "Driver's hands on the wheel on an open road", caption: "On the road" },
  ],
  "corporate-events": [
    { id: "photo-1540575467063-178a50c2df87", alt: "Delegates seated for a conference presentation", caption: "Conference transfers", large: true },
    { id: "photo-1511578314322-379afb476865", alt: "A large conference venue with round tables", caption: "Event logistics" },
    { id: "photo-1523580494863-6f3031224c94", alt: "Attendees watching a stage presentation", caption: "Delegate movement" },
  ],
  journeys: [
    { id: "photo-1625816772919-3d569dd8a2e2", alt: "Cars on a winding mountain road", caption: "Mountain highway", large: true },
    { id: "photo-1666114244670-6ed7cd9c293d", alt: "A car driving down an open road", caption: "Long-distance run" },
    { id: "photo-1615552714321-dca9935c0981", alt: "Green mountains under a cloudy sky", caption: "Northern routes" },
  ],
  fleet: [
    { id: "photo-1613859492095-85d9944f09f6", alt: "Four-wheel drive ready for a client", caption: "4x4 ready" },
    { id: "photo-1587813369290-091c9d432daf", alt: "White vans parked in a row", caption: "Group transport" },
    { id: "photo-1638247311144-54dec39cabc6", alt: "A row of cars parked together", caption: "The fleet", large: true },
  ],
  "behind-the-scenes": [
    { id: "photo-1633014041037-f5446fb4ce99", alt: "A car covered in foam at a wash bay", caption: "Washed before dispatch" },
    { id: "photo-1608506375591-b90e1f955e4b", alt: "Foam being sprayed onto a car in a garage", caption: "Detailing" },
    { id: "photo-1565689876697-e467b6c54da2", alt: "A wheel being cleaned with detailing equipment", caption: "Wheels and tyres" },
  ],
};

/** Unsplash serves any size from one id; 1600px is plenty for a mosaic tile. */
const unsplashUrl = (id: string) =>
  `https://images.unsplash.com/${id}?w=1600&q=80&auto=format&fit=crop`;

/** A framed certificate, portrait — for certificate-ish categories. */
function certificateArt(label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <rect width="850" height="1100" fill="#fdfcf8"/>
  <rect x="28" y="28" width="794" height="1044" fill="none" stroke="${NAVY}" stroke-width="6"/>
  <rect x="46" y="46" width="758" height="1008" fill="none" stroke="${ACCENT}" stroke-width="2"/>
  <text x="425" y="200" font-family="Georgia,serif" font-size="52" fill="${NAVY}" text-anchor="middle" letter-spacing="4">CERTIFICATE</text>
  <text x="425" y="250" font-family="Helvetica,Arial,sans-serif" font-size="24" fill="${ACCENT}" text-anchor="middle" letter-spacing="6">${xml(label.toUpperCase())}</text>
  <rect x="300" y="290" width="250" height="3" fill="${NAVY}" opacity="0.35"/>
  ${[380, 440, 500, 560, 620].map((y, i) => `<rect x="${170 + (i % 2) * 30}" y="${y}" width="${510 - (i % 3) * 70}" height="12" rx="6" fill="${NAVY}" opacity="0.13"/>`).join("\n  ")}
  <circle cx="425" cy="800" r="78" fill="none" stroke="${ACCENT}" stroke-width="5" opacity="0.7"/>
  <circle cx="425" cy="800" r="58" fill="${ACCENT}" opacity="0.10"/>
  <text x="425" y="810" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="bold" fill="${ACCENT}" text-anchor="middle" opacity="0.8">SEAL</text>
  <rect x="230" y="950" width="180" height="4" fill="${NAVY}" opacity="0.3"/>
  <rect x="440" y="950" width="180" height="4" fill="${NAVY}" opacity="0.3"/>
  <text x="425" y="1020" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="${NAVY}" text-anchor="middle" opacity="0.45">Placeholder artwork</text>
</svg>`;
}

/** A trophy on a plinth, portrait — for award-ish categories. */
function trophyArt(label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <defs>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d8a63c"/>
      <stop offset="50%" stop-color="#f0d68a"/>
      <stop offset="100%" stop-color="#b8862a"/>
    </linearGradient>
  </defs>
  <rect width="850" height="1100" fill="#f4f6f9"/>
  <circle cx="425" cy="430" r="300" fill="${NAVY}" opacity="0.05"/>
  <path d="M300 220h250v150a125 125 0 0 1-250 0z" fill="url(#metal)"/>
  <path d="M300 250h-70a70 70 0 0 0 70 70z" fill="url(#metal)"/>
  <path d="M550 250h70a70 70 0 0 1-70 70z" fill="url(#metal)"/>
  <rect x="405" y="495" width="40" height="110" fill="url(#metal)"/>
  <rect x="330" y="605" width="190" height="34" rx="8" fill="url(#metal)"/>
  <rect x="290" y="639" width="270" height="70" rx="10" fill="${NAVY}"/>
  <text x="425" y="684" font-family="Helvetica,Arial,sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" opacity="0.85">${xml(label.toUpperCase())}</text>
  <rect x="250" y="800" width="350" height="12" rx="6" fill="${NAVY}" opacity="0.12"/>
  <rect x="310" y="840" width="230" height="12" rx="6" fill="${NAVY}" opacity="0.12"/>
  <text x="425" y="1000" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="${NAVY}" text-anchor="middle" opacity="0.45">Placeholder artwork</text>
</svg>`;
}

/** Categories whose artwork is a trophy rather than a certificate. */
const TROPHY_CATEGORIES: readonly AwardCategory[] = ["industry-awards", "milestones"];

// ---------------------------------------------------------------------------

/**
 * Seconds between this machine's clock and Cloudinary's, measured once.
 *
 * Cloudinary refuses a signature whose timestamp is over an hour old, so a
 * host clock that has drifted behind fails every upload with "Stale request"
 * — which looks like a credentials problem and is not one. Reading the `Date`
 * header off their own endpoint and signing against that makes the script work
 * on a machine whose time is wrong, and costs one HEAD request.
 *
 * This is a workaround for *this* script only. Signed uploads from the admin
 * panel use the server clock (see lib/cloudinary.ts), which is correct in
 * production; a dev machine this far out of sync will fail those too, and the
 * real fix there is to sync the clock.
 */
let clockOffsetSeconds = 0;

async function measureClockOffset(): Promise<void> {
  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
      method: "HEAD",
    });
    const header = res.headers.get("date");
    if (!header) return;
    const skew = Math.round((new Date(header).getTime() - Date.now()) / 1000);
    // Ignore ordinary sub-minute jitter; report anything worth knowing about.
    if (Math.abs(skew) < 60) return;
    clockOffsetSeconds = skew;
    console.warn(
      `  ! This machine's clock is ${Math.round(skew / 60)} minute(s) behind Cloudinary's.
` +
        "    Signing against their time instead. Consider syncing the system clock."
    );
  } catch {
    // Offline or blocked: fall back to the local clock and let the upload
    // report the real failure rather than swallowing it here.
  }
}

/**
 * Push one asset to Cloudinary and hand back its delivered URL.
 *
 * `source` is either a data URI (the generated award artwork) or a remote
 * https URL, which Cloudinary fetches server-side. Mirroring the stock
 * photographs rather than hot-linking them means the gallery keeps working if
 * Unsplash changes a URL, and the images flow through the same
 * `f_auto,q_auto,w_…` pipeline as everything else on the site.
 */
async function upload(source: string, publicId: string, format?: string): Promise<string> {
  const res = await cloudinary.uploader.upload(source, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    ...(format ? { format } : {}),
    timestamp: Math.round(Date.now() / 1000) + clockOffsetSeconds,
  });
  return res.secure_url as string;
}

const svgSource = (svg: string) =>
  "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

function configureCloudinary(): void {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. Set the CLOUDINARY_* env vars in .env.local.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Matches only rows this script created. */
const PLACEHOLDER_FILTER = { "image.publicId": { $regex: `^${PREFIX}/` } };

async function clear(): Promise<void> {
  const g = await GalleryImageModel.deleteMany(PLACEHOLDER_FILTER);
  const a = await AwardModel.deleteMany(PLACEHOLDER_FILTER);
  console.log(`Removed ${g.deletedCount} gallery row(s), ${a.deletedCount} award(s).`);
  console.log(
    `Remaining: ${await GalleryImageModel.countDocuments()} gallery, ` +
      `${await AwardModel.countDocuments()} awards.`
  );
  console.log("\nCloudinary artwork is left in place under", `${PREFIX}/`);
  console.log("Delete it from Admin → Media if you want it gone too.");
}

async function seed(): Promise<void> {
  configureCloudinary();
  await measureClockOffset();

  // --- gallery: three photographs per category ---------------------------
  //
  // Ordered round-robin across the categories rather than category by
  // category, so the default "All Photos" view opens on a mix of subjects
  // instead of three handshakes in a row. Each chip still shows its own three.
  const gallery: unknown[] = [];
  const total = GALLERY_CATEGORIES.length * 3;
  let i = 0;
  for (let n = 0; n < 3; n++) {
    for (const category of GALLERY_CATEGORIES) {
      const photo = GALLERY_PHOTOS[category as GalleryCategory][n];
      const publicId = `${PREFIX}/gallery-${category}-${n + 1}`;
      const url = await upload(unsplashUrl(photo.id), publicId);
      gallery.push({
        image: { publicId, url, alt: photo.alt },
        caption: { en: photo.caption, ur: "" },
        category,
        featured: Boolean(photo.large),
        order: i,
        active: true,
      });
      process.stdout.write(`  gallery ${String(++i).padStart(2)} / ${total}\r`);
    }
  }
  console.log(`  gallery ${i} / ${total}  uploaded`);

  // --- awards: two entries per category ----------------------------------
  const awards: unknown[] = [];
  let j = 0;
  for (const category of AWARD_CATEGORIES) {
    const label = AWARD_CATEGORY_LABELS[category as AwardCategory];
    const art = TROPHY_CATEGORIES.includes(category as AwardCategory) ? trophyArt : certificateArt;
    for (let n = 1; n <= 2; n++) {
      const publicId = `${PREFIX}/award-${category}-${n}`;
      const url = await upload(svgSource(art(label)), publicId, "png");
      awards.push({
        // Both languages: awardSchema now requires the Urdu side, so an
        // English-only placeholder would fail the same validation the admin
        // form runs.
        title: { en: `${label} — sample entry ${n}`, ur: `${label} — نمونہ ${n}` },
        issuer: { en: "Issuing organization", ur: "جاری کرنے والا ادارہ" },
        description: {
          en: "A short note on what this recognition was awarded for goes here. Replace this entry from Admin → Awards.",
          ur: "اس پذیرائی کی وجہ کا مختصر بیان یہاں آئے گا۔ اسے Admin → Awards سے تبدیل کریں۔",
        },
        image: { publicId, url, alt: `${label} placeholder artwork` },
        awardedOn: `202${3 - (j % 3)}-${String(((j * 3) % 12) + 1).padStart(2, "0")}-15`,
        category,
        order: j,
        active: true,
      });
      process.stdout.write(`  awards ${String(++j).padStart(2)} / 10\r`);
    }
  }
  console.log(`  awards ${j} / 10  uploaded`);

  // Validate through the admin schemas before writing anything: a row the
  // editor could not save is not a row worth seeding.
  gallery.forEach((row, n) => {
    const r = galleryImageSchema.safeParse(row);
    if (!r.success) throw new Error(`gallery row ${n}: ${JSON.stringify(r.error.issues)}`);
  });
  awards.forEach((row, n) => {
    const r = awardSchema.safeParse(row);
    if (!r.success) throw new Error(`award row ${n}: ${JSON.stringify(r.error.issues)}`);
  });

  // Replace rather than append, so re-running is safe.
  await GalleryImageModel.deleteMany(PLACEHOLDER_FILTER);
  await AwardModel.deleteMany(PLACEHOLDER_FILTER);
  await GalleryImageModel.insertMany(gallery);
  await AwardModel.insertMany(awards);

  console.log(`\nSeeded ${gallery.length} gallery photographs and ${awards.length} awards.`);
  console.log("Replace them from Admin → Gallery / Awards, then: npm run placeholders:clear");
}

async function main(): Promise<void> {
  const mode = process.argv[2] === "clear" ? "clear" : "seed";
  applyDnsFallback();
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  try {
    if (mode === "clear") await clear();
    else await seed();
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
