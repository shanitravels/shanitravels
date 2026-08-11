/**
 * Reshapes stored text into bilingual `{ en, ur }` pairs and fills in the Urdu.
 *
 *   npx tsx scripts/i18n-migrate.ts            # dry run — reports, writes nothing
 *   npx tsx scripts/i18n-migrate.ts --apply    # backs up, then writes
 *
 * Runs on the native driver, not the Mongoose models: at the moment it runs the
 * documents still hold plain strings, which the (already bilingual) schemas
 * would refuse to cast.
 *
 * Idempotent. A field already shaped `{ en, ur }` is left alone except to fill
 * an empty `ur` from the translation file, so re-running after editing Urdu in
 * the admin panel never clobbers that work.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { applyDnsFallback } from "../lib/dns-fallback";
import { LOCALIZED_FIELDS } from "../lib/i18n/localized-fields";

const APPLY = process.argv.includes("--apply");
const STRINGS = path.join(process.cwd(), "i18n", "db-strings.ur.json");
const BACKUP_DIR = path.join(process.cwd(), "i18n", "backup");

type Pair = { en: string; ur: string };

const translations: Record<string, string> = fs.existsSync(STRINGS)
  ? JSON.parse(fs.readFileSync(STRINGS, "utf8"))
  : {};

let filled = 0;
let untranslated = 0;

function isPair(v: unknown): v is Pair {
  return !!v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "ur" in v);
}

/** string → pair, or top up an existing pair's empty `ur`. */
function toPair(value: unknown): Pair | null {
  if (typeof value === "string") {
    const en = value;
    const ur = translations[en] ?? "";
    if (ur) filled++;
    else if (en.trim()) untranslated++;
    return { en, ur };
  }
  if (isPair(value)) {
    const en = typeof value.en === "string" ? value.en : "";
    let ur = typeof value.ur === "string" ? value.ur : "";
    if (!ur && translations[en]) {
      ur = translations[en];
      filled++;
    } else if (!ur && en.trim()) {
      untranslated++;
    }
    return { en, ur };
  }
  return null;
}

function convert(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => toPair(v) ?? v);
  return toPair(value);
}

function getPath(doc: Record<string, unknown>, parts: string[]): unknown {
  return parts.reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
    doc
  );
}

function setPath(doc: Record<string, unknown>, parts: string[], value: unknown): void {
  let node: Record<string, unknown> = doc;
  for (const key of parts.slice(0, -1)) {
    if (typeof node[key] !== "object" || node[key] === null) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

async function main() {
  applyDnsFallback();
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;

  const plan: { collection: string; id: unknown; update: Record<string, unknown> }[] = [];

  for (const [collection, fields] of Object.entries(LOCALIZED_FIELDS)) {
    const docs = await db.collection(collection).find({}).toArray();

    for (const doc of docs) {
      const update: Record<string, unknown> = {};

      for (const field of fields) {
        const parts = field.split(".");
        // Read back any rewrite this document has already accumulated. Two
        // fields can share one array head (`credentials.label` and
        // `credentials.value`); rebuilding from `doc` both times would make the
        // second overwrite the first, silently dropping a conversion.
        const head = update[parts[0]] ?? doc[parts[0]];

        // `credentials.label` — a field inside an array of subdocuments. The
        // whole array is rewritten, since Mongo cannot $set through one.
        if (Array.isArray(head) && parts.length > 1) {
          const rest = parts.slice(1);
          const rebuilt = head.map((item: Record<string, unknown>) => {
            const copy = { ...item };
            const converted = convert(getPath(copy, rest));
            if (converted !== null) setPath(copy, rest, converted);
            return copy;
          });
          update[parts[0]] = rebuilt;
          continue;
        }

        const current = getPath(doc, parts);
        if (current === undefined || current === null) continue;
        const converted = convert(current);
        if (converted !== null) update[field] = converted;
      }

      if (Object.keys(update).length) {
        plan.push({ collection, id: doc._id, update });
      }
    }
  }

  console.log(`${plan.length} documents to update across ${Object.keys(LOCALIZED_FIELDS).length} collections.`);
  console.log(`${filled} field values matched a translation, ${untranslated} have no Urdu yet (they fall back to English).`);

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to commit.");
    await mongoose.disconnect();
    return;
  }

  // Snapshot every affected collection before touching it. Plain JSON so the
  // restore path needs nothing installed beyond node.
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (const collection of Object.keys(LOCALIZED_FIELDS)) {
    const docs = await db.collection(collection).find({}).toArray();
    fs.writeFileSync(
      path.join(BACKUP_DIR, `${stamp}.${collection}.json`),
      JSON.stringify(docs, null, 2),
      "utf8"
    );
  }
  console.log(`Backup written to ${path.relative(process.cwd(), BACKUP_DIR)}/${stamp}.*.json`);

  let written = 0;
  for (const { collection, id, update } of plan) {
    await db.collection(collection).updateOne({ _id: id as never }, { $set: update });
    written++;
  }
  console.log(`Updated ${written} documents.`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
