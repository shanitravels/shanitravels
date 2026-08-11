/**
 * One-time backfill: seed the mailing list from bookings and enquiries that were
 * recorded before capture existed.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-mailing-list.ts
 *
 * Idempotent — reruns only bump `submissions`, never resurrect an opt-out.
 */
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { BookingModel, EnquiryModel, MarketingContactModel } from "../lib/models";

const PLACEHOLDER = "not-provided@enquiry.local";
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function upsert(email: string | null | undefined, name: string | null, phone: string | null, source: string, when: Date) {
  const e = email?.trim().toLowerCase();
  if (!e || e === PLACEHOLDER || !RE.test(e)) return false;
  const set: Record<string, unknown> = { lastSeenAt: when };
  if (name) set.name = name;
  if (phone) set.phone = phone;
  await MarketingContactModel.updateOne(
    { email: e },
    { $set: set, $setOnInsert: { subscribed: true, unsubscribedAt: null }, $addToSet: { sources: source }, $inc: { submissions: 1 } },
    { upsert: true }
  );
  return true;
}

async function main() {
  await connectDB();
  const before = await MarketingContactModel.countDocuments();

  let added = 0;
  let skipped = 0;

  const bookings = await BookingModel.find()
    .select("email name phone createdAt")
    .lean<{ email?: string | null; name: string; phone: string; createdAt: Date }[]>();
  for (const b of bookings) {
    if (await upsert(b.email, b.name, b.phone, "booking", b.createdAt)) added++;
    else skipped++;
  }

  const enquiries = await EnquiryModel.find()
    .select("email contactName phone type createdAt")
    .lean<{ email?: string | null; contactName: string; phone: string; type: string; createdAt: Date }[]>();
  for (const q of enquiries) {
    const source = q.type === "corporate" ? "corporate" : "contact";
    if (await upsert(q.email, q.contactName, q.phone, source, q.createdAt)) added++;
    else skipped++;
  }

  const after = await MarketingContactModel.countDocuments();
  console.log(`records processed with a usable address: ${added}`);
  console.log(`skipped (blank / placeholder / invalid):  ${skipped}`);
  console.log(`mailing list: ${before} -> ${after} contacts`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
