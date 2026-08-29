/**
 * Which stored fields are bilingual, by collection.
 *
 * One list, three consumers: the Mongoose schemas, the migration that reshapes
 * existing rows, and the admin forms that render a second input. Keeping it
 * here is what stops those three drifting apart.
 *
 * Dotted paths address nested objects; a field holding an array of strings
 * becomes an array of `{ en, ur }`.
 *
 * What is deliberately absent is as important as what is present:
 *   - `slug` — a URL key, must stay stable and single.
 *   - `promo.code` — a discount code the customer types back to us verbatim.
 *   - vehicle `name`, client `name`, `organization`, `ceoName` — brand, model
 *     and proper nouns, which Pakistani Urdu writing leaves in Latin script.
 *   - `modelYears`, `stats`, phone numbers, prices — numerals.
 *   - enum values (`class`, `sector`, `category`) — code constants, translated
 *     through the UI dictionary instead of per row.
 */
export const LOCALIZED_FIELDS = {
  vehicles: ["engine", "transmission", "driveType", "interiorFeatures"],
  services: ["title", "summary", "body"],
  industries: ["name", "summary", "body", "seo.title", "seo.description"],
  safetysections: ["title", "intro", "items"],
  offices: ["city", "address"],
  testimonials: ["quote"],
  galleryimages: ["caption"],
  awards: ["title", "issuer", "description"],
  discounts: ["label"],
  sitesettings: [
    "heroHeadline",
    "heroSubheadline",
    "announcementBar.text",
    "promo.headline",
    "promo.message",
    "promo.ctaLabel",
    "seoDefaults.title",
    "seoDefaults.description",
    "commercialTerms",
    "about.mission",
    "about.story",
    "about.ceoMessage",
    "about.hseSummary",
    "credentials.label",
    "credentials.value",
  ],
} as const satisfies Record<string, readonly string[]>;

export type LocalizedCollection = keyof typeof LOCALIZED_FIELDS;

/** Fields that are arrays of strings rather than single strings. */
export const LOCALIZED_ARRAY_FIELDS: Record<string, readonly string[]> = {
  vehicles: ["interiorFeatures"],
  safetysections: ["items"],
};

/** Paths that sit inside an array of subdocuments (`credentials[].label`). */
export const LOCALIZED_SUBDOC_ARRAYS: Record<string, readonly string[]> = {
  sitesettings: ["credentials", "heroImages"],
};
