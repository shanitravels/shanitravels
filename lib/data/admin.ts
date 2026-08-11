import "server-only";
import { connectDB } from "@/lib/db";
import {
  VehicleModel,
  OfficeModel,
  ClientModel,
  TestimonialModel,
  ServiceModel,
  IndustryModel,
  SafetySectionModel,
  BookingModel,
  EnquiryModel,
  MarketingContactModel,
  DiscountModel,
  SettingsModel,
  AdminUserModel,
} from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { localize } from "@/lib/i18n/localize";
import type {
  Vehicle,
  VehicleDoc,
  OfficeDoc,
  Client,
  TestimonialDoc,
  Service,
  ServiceDoc,
  IndustryDoc,
  SafetySectionDoc,
  Booking,
  Enquiry,
  MarketingContact,
  DiscountDoc,
  SiteSettingsDoc,
  AdminUser,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";

/**
 * Collapses bilingual fields to English, for the admin screens that are still
 * English-only.
 *
 * Those screens render plain strings and post plain strings back; without this
 * the raw `{en, ur}` objects reach JSX and React throws "Objects are not valid
 * as a React child". Editing stays non-destructive because `preserveUrdu()` in
 * lib/actions/helpers merges the stored `ur` back on save, so fixing an English
 * typo never wipes a translation.
 *
 * A manager that has grown Urdu inputs reads through an uncollapsed function
 * instead (see `allServicesBilingual`), and its collection joins
 * BILINGUAL_EDITORS in lib/actions/content.ts so the merge steps aside. The two
 * halves must move together — see the note on that set.
 */
function adminText<T>(value: T) {
  return localize(value, "en");
}


/**
 * Uncached admin reads — the CMS always shows fresh data (including inactive
 * records). Guarded at the page/layout level by requireAdmin(). Each returns a
 * safe empty value if the database is unreachable so the admin UI still renders.
 */

export async function sidebarBadges(): Promise<{
  bookings: number;
  enquiries: number;
}> {
  try {
    await connectDB();
    const [bookings, enquiries] = await Promise.all([
      BookingModel.countDocuments({ status: "new" }),
      EnquiryModel.countDocuments({ status: "new" }),
    ]);
    return { bookings, enquiries };
  } catch {
    return { bookings: 0, enquiries: 0 };
  }
}

export async function dashboardData() {
  try {
    await connectDB();
    const [
      newBookings,
      newEnquiries,
      activeVehicles,
      publishedTestimonials,
      recentBookings,
      recentEnquiries,
    ] = await Promise.all([
      BookingModel.countDocuments({ status: "new" }),
      EnquiryModel.countDocuments({ status: "new" }),
      VehicleModel.countDocuments({ active: true }),
      TestimonialModel.countDocuments({ active: true }),
      BookingModel.find().sort({ createdAt: -1 }).limit(6).lean(),
      EnquiryModel.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);
    return {
      stats: { newBookings, newEnquiries, activeVehicles, publishedTestimonials },
      recentBookings: adminText(serialize<Booking[]>(recentBookings)),
      recentEnquiries: adminText(serialize<Enquiry[]>(recentEnquiries)),
    };
  } catch {
    return {
      stats: { newBookings: 0, newEnquiries: 0, activeVehicles: 0, publishedTestimonials: 0 },
      recentBookings: [] as Booking[],
      recentEnquiries: [] as Enquiry[],
    };
  }
}

export async function allVehicles(): Promise<Vehicle[]> {
  try {
    await connectDB();
    const docs = await VehicleModel.find().sort({ class: 1, order: 1, name: 1 }).lean();
    return adminText(serialize<Vehicle[]>(docs));
  } catch {
    return [];
  }
}

/** Uncollapsed: the vehicle form has Urdu inputs. See allServicesBilingual. */
export async function vehicleById(id: string): Promise<VehicleDoc | null> {
  try {
    await connectDB();
    const doc = await VehicleModel.findById(id).lean();
    return doc ? serialize<VehicleDoc>(doc) : null;
  } catch {
    return null;
  }
}

/** Uncollapsed: the offices editor has Urdu inputs. See allServicesBilingual. */
export async function allOffices(): Promise<OfficeDoc[]> {
  try {
    await connectDB();
    const docs = await OfficeModel.find().sort({ order: 1, city: 1 }).lean();
    return serialize<OfficeDoc[]>(docs);
  } catch {
    return [];
  }
}

export async function allClients(): Promise<Client[]> {
  try {
    await connectDB();
    const docs = await ClientModel.find().sort({ order: 1, name: 1 }).lean();
    return adminText(serialize<Client[]>(docs));
  } catch {
    return [];
  }
}

/** Uncollapsed: the testimonials editor has Urdu inputs. See allServicesBilingual. */
export async function allTestimonials(): Promise<TestimonialDoc[]> {
  try {
    await connectDB();
    const docs = await TestimonialModel.find().sort({ order: 1 }).lean();
    return serialize<TestimonialDoc[]>(docs);
  } catch {
    return [];
  }
}

/**
 * English-only view, for screens that merely *reference* a service — the
 * industry editor's service picker, for one. Those show a name and store a
 * slug; they never edit the copy.
 */
export async function allServices(): Promise<Service[]> {
  try {
    await connectDB();
    const docs = await ServiceModel.find().sort({ order: 1, title: 1 }).lean();
    return adminText(serialize<Service[]>(docs));
  } catch {
    return [];
  }
}

/**
 * The uncollapsed view, for the editor that owns this content.
 *
 * This is the counterpart to `adminText()`: a screen with Urdu inputs needs the
 * `{ en, ur }` pairs intact, so it reads through here instead. Add one of these
 * per collection as its manager grows Urdu inputs; everything still on
 * `adminText()` keeps working unchanged.
 */
export async function allServicesBilingual(): Promise<ServiceDoc[]> {
  try {
    await connectDB();
    const docs = await ServiceModel.find().sort({ order: 1, title: 1 }).lean();
    return serialize<ServiceDoc[]>(docs);
  } catch {
    return [];
  }
}

/** Uncollapsed: the industries editor has Urdu inputs. See allServicesBilingual. */
export async function allIndustries(): Promise<IndustryDoc[]> {
  try {
    await connectDB();
    const docs = await IndustryModel.find().sort({ order: 1, name: 1 }).lean();
    return serialize<IndustryDoc[]>(docs);
  } catch {
    return [];
  }
}

/** Uncollapsed: the safety editor has Urdu inputs. See allServicesBilingual. */
export async function allSafetySections(): Promise<SafetySectionDoc[]> {
  try {
    await connectDB();
    const docs = await SafetySectionModel.find().sort({ category: 1, order: 1 }).lean();
    return serialize<SafetySectionDoc[]>(docs);
  } catch {
    return [];
  }
}

export async function bookingById(id: string): Promise<Booking | null> {
  try {
    await connectDB();
    const doc = await BookingModel.findById(id).lean();
    return doc ? adminText(serialize<Booking>(doc)) : null;
  } catch {
    return null;
  }
}

export async function allBookings(status?: string): Promise<Booking[]> {
  try {
    await connectDB();
    const filter = status && status !== "all" ? { status } : {};
    const docs = await BookingModel.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    return adminText(serialize<Booking[]>(docs));
  } catch {
    return [];
  }
}

export async function allEnquiries(status?: string): Promise<Enquiry[]> {
  try {
    await connectDB();
    const filter = status && status !== "all" ? { status } : {};
    const docs = await EnquiryModel.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    return adminText(serialize<Enquiry[]>(docs));
  } catch {
    return [];
  }
}

/** The offers mailing list. Unsubscribed rows are kept and shown, not hidden —
 *  the admin needs to see that an opt-out was honoured. */
export async function allMarketingContacts(): Promise<MarketingContact[]> {
  try {
    await connectDB();
    const docs = await MarketingContactModel.find({}).sort({ lastSeenAt: -1 }).limit(5000).lean();
    return adminText(serialize<MarketingContact[]>(docs));
  } catch {
    return [];
  }
}

/** Uncollapsed: the discounts editor has Urdu inputs. See allServicesBilingual. */
export async function allDiscounts(): Promise<DiscountDoc[]> {
  try {
    await connectDB();
    const docs = await DiscountModel.find().sort({ createdAt: -1 }).lean();
    return serialize<DiscountDoc[]>(docs);
  } catch {
    return [];
  }
}

/**
 * DEFAULT_SETTINGS is declared in the localized (English-only) shape, because
 * that is what the public site consumes. The admin form binds to `{ en, ur }`
 * pairs, so the defaults are widened here before they are merged in — every
 * localized path gets its English default and an empty Urdu side.
 *
 * Kept in step with LOCALIZED_FIELDS.sitesettings; `npm run i18n:check` covers
 * the schema half of that list, and this is the other half.
 */
function defaultsAsPairs(): SiteSettingsDoc {
  const pair = (en: string) => ({ en, ur: "" });
  const d = DEFAULT_SETTINGS;
  return {
    ...d,
    heroHeadline: pair(d.heroHeadline),
    heroSubheadline: pair(d.heroSubheadline),
    announcementBar: d.announcementBar
      ? { text: pair(d.announcementBar.text), active: d.announcementBar.active }
      : null,
    seoDefaults: {
      ...d.seoDefaults,
      title: pair(d.seoDefaults.title),
      description: pair(d.seoDefaults.description),
    },
    promo: d.promo
      ? {
          ...d.promo,
          headline: pair(d.promo.headline),
          message: pair(d.promo.message),
          ctaLabel: pair(d.promo.ctaLabel),
        }
      : null,
    credentials: d.credentials.map((c) => ({
      label: pair(c.label),
      value: pair(c.value),
      image: c.image ?? null,
    })),
    commercialTerms: pair(d.commercialTerms),
    about: {
      ...d.about,
      mission: pair(d.about.mission),
      story: pair(d.about.story),
      ceoMessage: pair(d.about.ceoMessage),
      hseSummary: pair(d.about.hseSummary),
    },
  };
}

/**
 * Uncollapsed: the settings form has Urdu inputs. See allServicesBilingual.
 *
 * DEFAULT_SETTINGS is the localized (English-only) shape, so it is widened to
 * pairs before merging — otherwise a field absent from the database would
 * arrive as a bare string and the form's Urdu box would have nothing to bind to.
 */
export async function adminSettings(): Promise<SiteSettingsDoc> {
  try {
    await connectDB();
    const doc = await SettingsModel.findOne({ singleton: "main" }).lean();
    if (!doc) return defaultsAsPairs();
    const fromDb = serialize<Partial<SiteSettingsDoc>>(doc);
    const base = defaultsAsPairs();
    return {
      ...base,
      ...fromDb,
      socials: { ...base.socials, ...fromDb.socials },
      stats: { ...base.stats, ...fromDb.stats },
      seoDefaults: { ...base.seoDefaults, ...fromDb.seoDefaults },
      offerImages: { ...base.offerImages, ...fromDb.offerImages },
      about: { ...base.about, ...fromDb.about },
    };
  } catch {
    return defaultsAsPairs();
  }
}

export async function allAdminUsers(): Promise<AdminUser[]> {
  try {
    await connectDB();
    const docs = await AdminUserModel.find().select("-passwordHash").sort({ createdAt: 1 }).lean();
    return adminText(serialize<AdminUser[]>(docs));
  } catch {
    return [];
  }
}
