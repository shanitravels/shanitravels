/**
 * Turns self-drive on and opts the everyday classes into it.
 *
 *   npm run self-drive:enable
 *
 * Two things gate a self-drive booking, and both are data:
 *   1. SiteSettings.selfDriveEnabled — the global switch the whole public UI
 *      reads. While false, the booking wizard hides the Service step entirely
 *      and the server action rejects any self-drive submission.
 *   2. Vehicle.selfDriveAvailable — per-vehicle opt-in, which only takes effect
 *      for classes in SELF_DRIVE_CLASSES (lib/types.ts).
 *
 * Business rule as of Aug 2026: sedans and economy cars only. SUVs stay
 * chauffeur-only here even though the class list permits them — flip a vehicle
 * from the admin panel if that changes.
 *
 * Idempotent: safe to re-run.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { applyDnsFallback } from "../lib/dns-fallback";
import { SettingsModel, VehicleModel } from "../lib/models";

const CLASSES = ["economy", "sedan"] as const;

async function main() {
  applyDnsFallback();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI is not set. Add it to .env.local.");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to ${mongoose.connection.name}\n`);

  const settings = await SettingsModel.updateOne(
    { singleton: "main" },
    { $set: { selfDriveEnabled: true } }
  );
  console.log(
    settings.modifiedCount
      ? "✓ selfDriveEnabled → true — self-drive is now LIVE on the public site."
      : "· selfDriveEnabled was already true."
  );

  const opted = await VehicleModel.updateMany(
    { active: true, class: { $in: CLASSES }, selfDriveAvailable: { $ne: true } },
    { $set: { selfDriveAvailable: true } }
  );
  console.log(`✓ ${opted.modifiedCount} vehicle(s) newly opted in.\n`);

  const eligible = await VehicleModel.find({
    active: true,
    class: { $in: CLASSES },
    selfDriveAvailable: true,
  })
    .select("name class selfDrive")
    .sort({ class: 1, order: 1 })
    .lean();

  console.log(`Self-drive fleet (${eligible.length}):`);
  let missingRates = 0;
  for (const v of eligible as Array<{
    name: string;
    class: string;
    selfDrive?: { perDay?: number | null; securityDeposit?: number | null } | null;
  }>) {
    const perDay = v.selfDrive?.perDay ?? null;
    if (perDay === null) missingRates++;
    console.log(
      `  [${v.class.padEnd(7)}] ${v.name.padEnd(30)} ${
        perDay === null ? "per-day: ON REQUEST" : `per-day: ${perDay}`
      }`
    );
  }

  if (missingRates > 0) {
    console.log(
      `\n⚠ ${missingRates} of ${eligible.length} have no self-drive per-day rate.\n` +
        "  Self-drive fares come from the self-drive rate card, NOT the chauffeur\n" +
        "  rates, so those quote as “on request” until set in Admin → Rates."
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
