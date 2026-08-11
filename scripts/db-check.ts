/**
 * Connection + contents check.
 *
 *   npm run db:check
 *
 * Verifies MONGODB_URI actually connects, then reports the document count in
 * every collection so you can see at a glance whether the seed has run.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { applyDnsFallback } from "../lib/dns-fallback";
import {
  VehicleModel,
  OfficeModel,
  ClientModel,
  TestimonialModel,
  ServiceModel,
  IndustryModel,
  SafetySectionModel,
  BookingModel,
  EnquiryModel,
  SettingsModel,
  AdminUserModel,
} from "../lib/models";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI is not set. Add it to .env.local.");
    process.exit(1);
  }
  if (uri.includes("REPLACE_WITH_DB_USERNAME") || uri.includes("<db_username>")) {
    console.error("✗ MONGODB_URI still contains the Atlas username placeholder.");
    console.error("  Edit .env.local and replace it with the real database username.");
    process.exit(1);
  }

  applyDnsFallback();

  const redacted = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  console.log(`Connecting to ${redacted}`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    console.error("✗ Connection failed:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      message.includes("querySrv") || message.includes("EAI_AGAIN")
        ? "\n  This is a DNS failure — the SRV lookup never reached Atlas, so\n" +
            "  credentials and the IP allow-list are not the problem.\n" +
            "  · check this machine can resolve DNS at all\n" +
            "  · Node ignores the OS resolver; if `node -e \"console.log(require('dns').getServers())\"`\n" +
            "    prints 127.0.0.1, set a static DNS server on your network adapter"
        : "\n  Common causes:\n" +
            "  · wrong username/password (Atlas → Database Access)\n" +
            "  · your IP isn't allow-listed (Atlas → Network Access)\n" +
            "  · the user lacks readWrite on this database"
    );
    process.exit(1);
  }

  console.log(`✓ Connected. Database: ${mongoose.connection.name}\n`);

  const collections = [
    ["Vehicles", VehicleModel],
    ["Services", ServiceModel],
    ["Industries", IndustryModel],
    ["Safety sections", SafetySectionModel],
    ["Offices", OfficeModel],
    ["Clients", ClientModel],
    ["Testimonials", TestimonialModel],
    ["Site settings", SettingsModel],
    ["Admin users", AdminUserModel],
    ["Bookings", BookingModel],
    ["Enquiries", EnquiryModel],
  ] as const;

  let total = 0;
  for (const [label, model] of collections) {
    const count = await (model as mongoose.Model<never>).countDocuments();
    total += count;
    console.log(`  ${label.padEnd(18)} ${String(count).padStart(4)}`);
  }

  console.log(
    total === 0
      ? "\nDatabase is empty — run `npm run seed` to populate it."
      : "\n✓ Database has content."
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
