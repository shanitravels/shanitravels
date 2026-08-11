import { connectDB } from "@/lib/db";
import { IndustryModel, SafetySectionModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import { cachedRead } from "@/lib/data/cache";
import type { Industry, SafetySection } from "@/lib/types";

/** Cached public reads for industry landing pages and the safety protocol. */

export const getActiveIndustries = cachedRead({
  label: "industries/getActiveIndustries",
  keys: ["active-industries"],
  tags: [TAGS.industries],
  fallback: [] as Industry[],
  read: async (): Promise<Industry[]> => {
    await connectDB();
    const docs = await IndustryModel.find({ active: true }).sort({ order: 1, name: 1 }).lean();
    return serialize<Industry[]>(docs);
  },
});

export const getIndustryBySlug = cachedRead({
  label: "industries/getIndustryBySlug",
  keys: ["industry-by-slug"],
  tags: [TAGS.industries],
  fallback: null as Industry | null,
  read: async (slug: string): Promise<Industry | null> => {
    await connectDB();
    const doc = await IndustryModel.findOne({ slug, active: true }).lean();
    return doc ? serialize<Industry>(doc) : null;
  },
});

export const getActiveSafetySections = cachedRead({
  label: "industries/getActiveSafetySections",
  keys: ["active-safety-sections"],
  tags: [TAGS.safety],
  fallback: [] as SafetySection[],
  read: async (): Promise<SafetySection[]> => {
    await connectDB();
    const docs = await SafetySectionModel.find({ active: true })
      .sort({ category: 1, order: 1 })
      .lean();
    return serialize<SafetySection[]>(docs);
  },
});
