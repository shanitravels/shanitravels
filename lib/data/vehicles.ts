import { connectDB } from "@/lib/db";
import { VehicleModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import { cachedRead } from "@/lib/data/cache";
import { normalizeVehicleRates } from "@/lib/pricing";
import type { Vehicle } from "@/lib/types";

/**
 * Cached public reads for the vehicle catalog, tagged with TAGS.vehicles.
 * Every admin mutation calls revalidateTag(TAGS.vehicles), so the public site
 * updates on the next request; the 1-hour window self-heals a missed tag.
 *
 * These read functions deliberately let database errors propagate —
 * `cachedRead` applies the fallback outside the cache so a transient outage is
 * never stored as real data. See lib/data/cache.ts.
 *
 * Rates pass through `normalizeVehicleRates` on the way out so a non-positive
 * amount left by an older save reaches the site as "On request", never "PKR 0".
 */

export const getActiveVehicles = cachedRead({
  label: "vehicles/getActiveVehicles",
  keys: ["active-vehicles"],
  tags: [TAGS.vehicles],
  fallback: [] as Vehicle[],
  read: async (): Promise<Vehicle[]> => {
    await connectDB();
    const docs = await VehicleModel.find({ active: true })
      .sort({ class: 1, order: 1, name: 1 })
      .lean();
    return serialize<Vehicle[]>(docs).map(normalizeVehicleRates);
  },
});

export const getFeaturedVehicles = cachedRead({
  label: "vehicles/getFeaturedVehicles",
  keys: ["featured-vehicles"],
  tags: [TAGS.vehicles],
  fallback: [] as Vehicle[],
  read: async (): Promise<Vehicle[]> => {
    await connectDB();
    const docs = await VehicleModel.find({ active: true, featured: true })
      .sort({ order: 1, name: 1 })
      .limit(8)
      .lean();
    return serialize<Vehicle[]>(docs).map(normalizeVehicleRates);
  },
});

export const getVehicleBySlug = cachedRead({
  label: "vehicles/getVehicleBySlug",
  keys: ["vehicle-by-slug"],
  tags: [TAGS.vehicles],
  fallback: null as Vehicle | null,
  read: async (slug: string): Promise<Vehicle | null> => {
    await connectDB();
    const doc = await VehicleModel.findOne({ slug, active: true }).lean();
    return doc ? normalizeVehicleRates(serialize<Vehicle>(doc)) : null;
  },
});

export const getActiveVehicleSlugs = cachedRead({
  label: "vehicles/getActiveVehicleSlugs",
  keys: ["active-vehicle-slugs"],
  tags: [TAGS.vehicles],
  fallback: [] as string[],
  read: async (): Promise<string[]> => {
    await connectDB();
    const docs = await VehicleModel.find({ active: true }).select("slug").lean();
    return docs.map((d) => d.slug as string);
  },
});
