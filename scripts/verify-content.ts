/**
 * Content audit — prints services by group, fleet by class, and industries.
 *
 *   npm run db:verify
 *
 * A quick way to confirm what the public site will show after a seed or edit.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { ServiceModel, VehicleModel, IndustryModel } from "../lib/models";
import { SERVICE_GROUPS, SERVICE_GROUP_LABELS, VEHICLE_CLASSES, VEHICLE_CLASS_LABELS } from "../lib/types";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  console.log("\n═══ SERVICES ═══");
  for (const group of SERVICE_GROUPS) {
    const svcs = await ServiceModel.find({ group }).sort({ order: 1 }).lean();
    console.log(`\n${SERVICE_GROUP_LABELS[group]}  (${svcs.length})`);
    for (const s of svcs as Array<{ title: string; slug: string; active: boolean }>) {
      console.log(`   ${s.active ? "•" : "○"} ${s.title.padEnd(38)} /services/${s.slug}`);
    }
  }

  console.log("\n═══ FLEET ═══\n");
  for (const cls of VEHICLE_CLASSES) {
    const total = await VehicleModel.countDocuments({ class: cls });
    if (total === 0) continue;
    const armored = await VehicleModel.countDocuments({ class: cls, armorLevel: { $ne: null } });
    const selfDrive = await VehicleModel.countDocuments({ class: cls, selfDriveAvailable: true });
    const notes = [
      armored ? `${armored} armored` : "",
      selfDrive ? `${selfDrive} self-drive` : "",
    ].filter(Boolean);
    console.log(
      `   ${VEHICLE_CLASS_LABELS[cls].padEnd(16)} ${String(total).padStart(2)}${notes.length ? `   (${notes.join(", ")})` : ""}`
    );
  }
  const priced = await VehicleModel.countDocuments({ "rates.perDay": { $ne: null } });
  const totalVehicles = await VehicleModel.countDocuments();
  console.log(`\n   ${priced} of ${totalVehicles} vehicles have a published per-day rate; the rest show "On request".`);

  console.log("\n═══ INDUSTRIES ═══\n");
  const inds = await IndustryModel.find().sort({ order: 1 }).select("name slug active").lean();
  for (const i of inds as Array<{ name: string; slug: string; active: boolean }>) {
    console.log(`   ${i.active ? "•" : "○"} ${i.name.padEnd(32)} /industries/${i.slug}`);
  }

  console.log("");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
