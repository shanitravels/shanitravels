import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import { cachedRead } from "@/lib/data/cache";
import type { SiteSettings } from "@/lib/types";

/**
 * SiteSettings singleton read. Sensible defaults are merged in so the site
 * renders correctly on an empty database and never crashes on missing fields.
 */

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  helplineNumbers: ["03008564588"],
  whatsappNumber: "03008564588",
  emails: ["info@shanitravels.pk"],
  headOfficeAddress: "Blue Area, Islamabad, Pakistan",
  socials: {},
  heroHeadline: "Chauffeur-driven transport you can rely on — since 1997",
  heroSubheadline:
    "Rent a car with driver in Islamabad, or contract a project fleet anywhere in Pakistan.",
  heroImages: [],
  announcementBar: null,
  promo: {
    active: false,
    headline: "",
    message: "",
    code: "",
    ctaLabel: "",
    ctaHref: "/book",
    startDate: "",
    endDate: "",
  },
  stats: { yearsOperating: new Date().getFullYear() - 1997, cities: 8, fleetSize: null },
  seoDefaults: {
    title: "Shani Travels — Car Rental & Corporate Transport, Islamabad",
    description:
      "Chauffeur-driven car rental and nationwide project transport for organizations. Serving Pakistan since 1997.",
    ogImage: null,
  },
  offerImages: { longHire: null, airport: null, nationwide: null },
  credentials: [],
  commercialTerms: "",
  about: { mission: "", story: "", ceoMessage: "", ceoName: "", hseSummary: "" },
  selfDriveEnabled: false,
  updatedAt: new Date(0).toISOString(),
};

export const getSettings = cachedRead({
  label: "settings/getSettings",
  keys: ["site-settings"],
  tags: [TAGS.settings],
  // Defaults keep the chrome (header/footer/SEO) sane during an outage.
  fallback: DEFAULT_SETTINGS,
  read: async (): Promise<SiteSettings> => {
    await connectDB();
    const doc = await SettingsModel.findOne({ singleton: "main" }).lean();
    if (!doc) return DEFAULT_SETTINGS;
    const fromDb = serialize<Partial<SiteSettings>>(doc);
    return {
      ...DEFAULT_SETTINGS,
      ...fromDb,
      socials: { ...DEFAULT_SETTINGS.socials, ...fromDb.socials },
      stats: { ...DEFAULT_SETTINGS.stats, ...fromDb.stats },
      seoDefaults: { ...DEFAULT_SETTINGS.seoDefaults, ...fromDb.seoDefaults },
      offerImages: { ...DEFAULT_SETTINGS.offerImages, ...fromDb.offerImages },
      about: { ...DEFAULT_SETTINGS.about, ...fromDb.about },
    };
  },
});
