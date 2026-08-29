/**
 * Reorder the fleet by engine capacity, and clear legacy zero rates.
 *
 *   npx tsx scripts/fix-fleet-ordering.ts --dry
 *   npx tsx scripts/fix-fleet-ordering.ts
 *
 * Three jobs:
 *
 *   1. `order` is rewritten per class, ascending by engine capacity parsed out
 *      of the free-text `engine` field (see lib/engine-size.ts). Vehicles whose
 *      engine names no displacement ("Heavy diesel") keep their relative place
 *      at the end of their class, ordered by name.
 *
 *      This is what /rates and the admin list read — they sort on
 *      `class, order, name` and never see the fleet page's client-side sort.
 *
 *   2. Any rate stored as literal `0` becomes null. `publishedRate` already
 *      renders those as "On request", so nothing changes on screen; this is to
 *      stop the rows tripping the `min: 0.01` rule the schema now carries.
 *
 *   3. Reports which vehicles still carry Unsplash stock placeholders, so real
 *      photography can be uploaded through Admin → Vehicles.
 *
 * Idempotent. Pass --dry to preview without writing.
 *
 * NOTE: writes straight to MongoDB and so bypasses Next's cache invalidation.
 * Afterwards purge with `POST /api/revalidate?tag=vehicles`.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { VehicleModel } from "../lib/models";
import { applyDnsFallback } from "../lib/dns-fallback";
import { engineCc, byEngineSize } from "../lib/engine-size";
import { VEHICLE_CLASSES } from "../lib/types";

const RATE_FIELDS = ["perHour", "perDay", "perWeek", "perMonth", "fuelPerKm", "airportTransfer"] as const;

async function main() {
  const dry = process.argv.includes("--dry");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  applyDnsFallback();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✓ Connected. Database: ${mongoose.connection.name}${dry ? "  (dry run)" : ""}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicles: any[] = await VehicleModel.find({}).lean();

  // --- 1. order by engine capacity, within class --------------------------
  let moved = 0;
  for (const cls of VEHICLE_CLASSES) {
    const inClass = vehicles.filter((v) => v.class === cls);
    if (!inClass.length) continue;

    const sorted = [...inClass].sort((a, b) =>
      byEngineSize({ engine: a.engine?.en, name: a.name }, { engine: b.engine?.en, name: b.name })
    );

    console.log(`\n=== ${cls} (${sorted.length}) ===`);
    for (const [i, v] of sorted.entries()) {
      const cc = engineCc(v.engine?.en);
      const change = v.order === i ? "" : `   order ${v.order} → ${i}`;
      if (v.order !== i) moved += 1;
      console.log(
        `  ${String(i).padStart(2)}  ${v.name.padEnd(34)} ${(cc ? `${cc}cc` : "no capacity").padEnd(12)}${change}`
      );
      if (!dry && v.order !== i) {
        await VehicleModel.updateOne({ _id: v._id }, { $set: { order: i } });
      }
    }
  }

  // --- 2. legacy zero rates ------------------------------------------------
  console.log("\n=== zero rates ===");
  let cleared = 0;
  for (const v of vehicles) {
    const zeroed = RATE_FIELDS.filter((f) => v.rates?.[f] === 0);
    if (!zeroed.length) continue;
    cleared += zeroed.length;
    console.log(`  ${v.name.padEnd(34)} ${zeroed.join(", ")} → null`);
    if (!dry) {
      const unset = Object.fromEntries(zeroed.map((f) => [`rates.${f}`, null]));
      await VehicleModel.updateOne({ _id: v._id }, { $set: unset });
    }
  }
  if (!cleared) console.log("  none");

  // --- 3. placeholder photography -----------------------------------------
  const stock = vehicles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((v) => (v.images ?? []).some((i: any) => (i.url ?? "").includes("unsplash.com")))
    .sort((a, b) => VEHICLE_CLASSES.indexOf(a.class) - VEHICLE_CLASSES.indexOf(b.class) || a.name.localeCompare(b.name));

  console.log(`\n=== still on Unsplash stock placeholders: ${stock.length} of ${vehicles.length} ===`);
  for (const v of stock) console.log(`  ${v.class.padEnd(11)} ${v.name}`);

  await mongoose.disconnect();

  console.log(
    dry
      ? `\nDry run — nothing written. Would move ${moved} vehicles and clear ${cleared} zero rates.`
      : `\n✓ Written. Moved ${moved} vehicles, cleared ${cleared} zero rates.\n  Purge the cache: POST /api/revalidate?tag=vehicles`
  );
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
