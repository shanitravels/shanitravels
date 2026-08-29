/**
 * Guards the invariant behind lib/i18n/localized-fields.ts.
 *
 *   npm run i18n:check
 *
 * That file claims one list feeds three consumers — the Mongoose schemas, the
 * migration, and the admin forms. Nothing actually enforced it, and two fields
 * had already drifted: `safetysections.title` and `industries.seo.description`
 * were still validated as plain strings. A save through those forms would have
 * written a bare string over a stored `{ en, ur }` pair, silently undoing the
 * migration for that field with no error anywhere.
 *
 * So: for every path in LOCALIZED_FIELDS, assert the zod schema accepts a pair.
 * Run this after touching either file.
 */
import { z } from "zod";
import { LOCALIZED_FIELDS, LOCALIZED_ARRAY_FIELDS } from "../lib/i18n/localized-fields";
import {
  vehicleSchema,
  officeSchema,
  testimonialSchema,
  serviceSchema,
  industrySchema,
  safetySectionSchema,
  discountSchema,
  settingsSchema,
  galleryImageSchema,
  awardSchema,
} from "../lib/validation";

/** Collection name -> the schema its admin form posts through. */
const SCHEMAS: Record<string, z.ZodTypeAny> = {
  vehicles: vehicleSchema,
  offices: officeSchema,
  testimonials: testimonialSchema,
  services: serviceSchema,
  industries: industrySchema,
  safetysections: safetySectionSchema,
  galleryimages: galleryImageSchema,
  awards: awardSchema,
  discounts: discountSchema,
  sitesettings: settingsSchema,
};

type ZodDef = {
  type?: string;
  element?: z.ZodTypeAny;
  innerType?: z.ZodTypeAny;
};

/**
 * Strip the wrappers that sit between a path segment and the object underneath
 * it — `.default()`, `.optional()`, `.nullable()` — then step into an array's
 * element, so `credentials.label` reaches the subdocument's shape.
 */
function unwrap(node: z.ZodTypeAny): z.ZodTypeAny {
  for (let i = 0; i < 10; i++) {
    const def = (node as { def?: ZodDef }).def;
    if (def?.innerType) node = def.innerType;
    else if (def?.type === "array" && def.element) node = def.element;
    else break;
  }
  return node;
}

/** Walk a dotted path into a zod object/array schema. */
function resolve(schema: z.ZodTypeAny, path: string[]): z.ZodTypeAny | null {
  let node: z.ZodTypeAny = schema;
  for (const key of path) {
    const shape = (unwrap(node) as unknown as { shape?: Record<string, z.ZodTypeAny> }).shape;
    if (!shape || !shape[key]) return null;
    node = shape[key];
  }
  return node;
}

const PAIR = { en: "sample english", ur: "نمونہ اردو" };

const problems: string[] = [];
let checked = 0;

for (const [collection, fields] of Object.entries(LOCALIZED_FIELDS)) {
  const schema = SCHEMAS[collection];
  if (!schema) {
    problems.push(`${collection}: no schema wired into this check`);
    continue;
  }
  const arrayFields: readonly string[] = LOCALIZED_ARRAY_FIELDS[collection] ?? [];

  for (const field of fields) {
    const node = resolve(schema, field.split("."));
    if (!node) {
      problems.push(`${collection}.${field}: path not found in the schema`);
      continue;
    }
    checked++;

    // A field holding an array of strings becomes an array of pairs.
    const value = arrayFields.includes(field) ? [PAIR] : PAIR;
    const result = node.safeParse(value);
    if (!result.success) {
      problems.push(
        `${collection}.${field}: schema rejects a { en, ur } pair — ${result.error.issues[0]?.message}`
      );
    }
  }
}

console.log(`\nChecked ${checked} localized field paths across ${Object.keys(LOCALIZED_FIELDS).length} collections.`);
console.log(`Problems: ${problems.length}`);
for (const p of problems) console.log("  " + p);
console.log(`\n${problems.length ? "FAIL" : "PASS"}\n`);
process.exit(problems.length ? 1 : 0);
