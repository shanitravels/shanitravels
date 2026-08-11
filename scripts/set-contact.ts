/**
 * Set the public contact / WhatsApp number.
 *
 *   npx tsx scripts/set-contact.ts 03008564588
 *
 * Stored exactly as given (that's what the site displays); wa.me links are
 * normalized to international format at render time by `toWhatsAppNumber`.
 *
 * NOTE: writing straight to the database bypasses Next's cache invalidation.
 * Editing the number in Admin → Settings calls revalidateTag() and updates the
 * site immediately; after running this script you must redeploy (or clear
 * .next/cache locally) for the change to appear.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { SettingsModel } from "../lib/models";
import { toWhatsAppNumber } from "../lib/format";

async function main() {
  const number = process.argv[2];
  if (!number) {
    console.error("Usage: npx tsx scripts/set-contact.ts <number>");
    process.exit(1);
  }
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

  await SettingsModel.updateOne(
    { singleton: "main" },
    { $set: { whatsappNumber: number, helplineNumbers: [number] } },
    { upsert: true }
  );

  const after = await SettingsModel.findOne({ singleton: "main" })
    .select("whatsappNumber helplineNumbers")
    .lean();
  console.log("after :", JSON.stringify(after));
  console.log(`\nDisplayed as : ${number}`);
  console.log(`tel: link    : tel:${number.replace(/[^+\d]/g, "")}`);
  console.log(`WhatsApp     : https://wa.me/${toWhatsAppNumber(number)}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
