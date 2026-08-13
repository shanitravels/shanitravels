/**
 * Set the public helpline and/or WhatsApp number.
 *
 *   npx tsx scripts/set-contact.ts --helpline 03008564588
 *   npx tsx scripts/set-contact.ts --whatsapp 03211234567
 *   npx tsx scripts/set-contact.ts --helpline 0300… --whatsapp 0321…
 *
 * The two are independent: `--helpline` sets the number behind the "Call us"
 * buttons, `--whatsapp` sets the number behind the WhatsApp buttons. Pass only
 * the one you want to change; the other is left untouched.
 *
 * Stored exactly as given (that's what the site displays); wa.me links are
 * normalized to international format at render time by `toWhatsAppNumber`.
 *
 * NOTE: writing straight to the database bypasses Next's cache invalidation.
 * Editing the numbers in Admin → Settings calls updateTag() and updates the
 * site immediately; after running this script, purge the cache with
 * `POST /api/revalidate?tag=settings` (or clear .next/cache locally).
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { SettingsModel } from "../lib/models";
import { toWhatsAppNumber } from "../lib/format";

/** Minimal `--flag value` parser — no dependency for three flags. */
function parseArgs(argv: string[]): { helpline?: string; whatsapp?: string } {
  const out: { helpline?: string; whatsapp?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--helpline") out.helpline = argv[++i];
    else if (arg === "--whatsapp") out.whatsapp = argv[++i];
    else {
      console.error(`Unrecognized argument: ${arg}`);
      usage();
    }
  }
  return out;
}

function usage(): never {
  console.error(
    "Usage: npx tsx scripts/set-contact.ts [--helpline <number>] [--whatsapp <number>]"
  );
  process.exit(1);
}

async function main() {
  const { helpline, whatsapp } = parseArgs(process.argv.slice(2));
  if (!helpline && !whatsapp) usage();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const before = await SettingsModel.findOne({ singleton: "main" })
    .select("whatsappNumber helplineNumbers")
    .lean();
  console.log("before:", JSON.stringify(before));

  // Only the flags actually passed go into $set, so setting one number never
  // silently overwrites the other.
  const $set: Record<string, unknown> = {};
  if (helpline) $set.helplineNumbers = [helpline];
  if (whatsapp) $set.whatsappNumber = whatsapp;

  await SettingsModel.updateOne({ singleton: "main" }, { $set }, { upsert: true });

  const after = await SettingsModel.findOne({ singleton: "main" })
    .select("whatsappNumber helplineNumbers")
    .lean();
  console.log("after :", JSON.stringify(after));

  if (helpline) console.log(`\nCall us link : tel:${helpline.replace(/[^+\d]/g, "")}`);
  if (whatsapp) console.log(`WhatsApp link: https://wa.me/${toWhatsAppNumber(whatsapp)}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
