import { connectDB } from "@/lib/db";
import { DiscountModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import { cachedRead } from "@/lib/data/cache";
import type { Discount } from "@/lib/types";

/**
 * Active discounts for the public site.
 *
 * Only `active` is filtered here — the date window is evaluated at render time
 * by `isDiscountLive`, not in the query. Caching a `startDate <= now` filter
 * would freeze "now" into the cache entry, so a discount scheduled to begin
 * tomorrow would not appear until the entry happened to expire.
 */
export const getActiveDiscounts = cachedRead({
  label: "discounts/getActiveDiscounts",
  keys: ["active-discounts"],
  tags: [TAGS.discounts],
  fallback: [] as Discount[],
  read: async (): Promise<Discount[]> => {
    await connectDB();
    const docs = await DiscountModel.find({ active: true }).sort({ createdAt: -1 }).lean();
    return serialize<Discount[]>(docs);
  },
});
