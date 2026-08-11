/**
 * Cache tags for every public-facing content collection.
 *
 * Data-layer reads (`lib/data/*`) tag their `unstable_cache` entries with these,
 * and every admin mutation calls `revalidateTag()` on the affected tag so the
 * public site reflects changes on the next request.
 */
export const TAGS = {
  vehicles: "vehicles",
  offices: "offices",
  clients: "clients",
  testimonials: "testimonials",
  services: "services",
  settings: "settings",
  industries: "industries",
  safety: "safety",
  discounts: "discounts",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

export const ALL_TAGS: CacheTag[] = Object.values(TAGS);
