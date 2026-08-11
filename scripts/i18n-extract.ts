/**
 * Pulls every translatable string out of MongoDB into i18n/db-strings.ur.json.
 *
 *   npx tsx scripts/i18n-extract.ts
 *
 * Read-only. Keys are the exact English source text, so the same sentence
 * appearing on three vehicles is translated once. Existing translations in the
 * file are preserved — re-running after adding content only appends the gaps.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { applyDnsFallback } from "../lib/dns-fallback";
import { LOCALIZED_FIELDS } from "../lib/i18n/localized-fields";

const OUT = path.join(process.cwd(), "i18n", "db-strings.ur.json");

function read(doc: unknown, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
    doc
  );
}

/** Collect strings from a value that may be a string, an array, or already
 *  migrated to `{ en, ur }`. */
function collect(value: unknown, into: Set<string>): void {
  if (typeof value === "string") {
    if (value.trim()) into.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collect(v, into);
    return;
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    // Already-migrated pair: only the English side is a source string.
    if (typeof o.en === "string" || typeof o.ur === "string") {
      if (typeof o.en === "string" && o.en.trim()) into.add(o.en);
      return;
    }
  }
}

async function main() {
  applyDnsFallback();
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;

  const found = new Set<string>();

  for (const [collection, fields] of Object.entries(LOCALIZED_FIELDS)) {
    const docs = await db.collection(collection).find({}).toArray();
    for (const doc of docs) {
      for (const field of fields) {
        // `credentials.label` addresses a field inside an array of subdocs.
        const [head, ...rest] = field.split(".");
        const headValue = doc[head];
        if (Array.isArray(headValue) && rest.length) {
          for (const item of headValue) collect(read(item, rest.join(".")), found);
        } else {
          collect(read(doc, field), found);
        }
      }
    }
  }

  const existing: Record<string, string> = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : {};

  const merged: Record<string, string> = {};
  for (const source of [...found].sort((a, b) => a.localeCompare(b))) {
    merged[source] = existing[source] ?? "";
  }

  const missing = Object.values(merged).filter((v) => !v).length;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n", "utf8");

  console.log(`${found.size} unique strings → ${path.relative(process.cwd(), OUT)}`);
  console.log(`${found.size - missing} translated, ${missing} still empty.`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
