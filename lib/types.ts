import type { LocalizedString, Flatten } from "@/lib/i18n/localize";

/**
 * Naming convention in this file:
 *   `XDoc`  — the shape stored in MongoDB, where translatable fields are
 *             `{ en, ur }` pairs.
 *   `X`     — the same shape after lib/i18n/localize.ts collapses those pairs
 *             to plain strings for one locale. This is what components see.
 *
 * Deriving `X` from `XDoc` via `Flatten` keeps a single definition per model,
 * so a field can never be bilingual in storage but forgotten in the view type.
 */

/**
 * Serialized (plain JSON) shapes used across the app.
 *
 * Mongoose documents never cross a server/client or cache boundary directly —
 * `lib/serialize.ts` converts lean docs into these shapes (ObjectId → string,
 * Date → ISO string).
 */

/**
 * Vehicle classes. `event` covers vans, coasters and buses — the group-movement
 * fleet — after those two categories were merged.
 */
export const VEHICLE_CLASSES = [
  "economy",
  "sedan",
  "suv",
  "event",
  "vip",
  "specialized",
  "logistics",
] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  economy: "Economy",
  sedan: "Sedan",
  suv: "SUV / 4x4",
  event: "Event Transport",
  vip: "Executive",
  specialized: "Specialized",
  logistics: "Logistics",
};

/** One-line positioning for each class, used on the homepage catalog. */
export const VEHICLE_CLASS_BLURBS: Record<VehicleClass, string> = {
  economy: "Compact, fuel-efficient cars for city runs",
  sedan: "Comfortable saloons for daily and business travel",
  suv: "4x4s and crossovers for any terrain",
  event: "Vans, coasters and buses for groups and weddings",
  vip: "Mercedes, BMW and flagship SUVs with protocol chauffeurs",
  specialized: "B-6 armored vehicles for secure movement",
  logistics: "Pickups, trucks and carriers for cargo",
};

/**
 * The two super-categories the rate card is split into.
 *
 * A grouping for the pricing page only — the fleet, the booking wizard and the
 * admin all still work in `VehicleClass`. Kept here rather than in the page so
 * the card grid and the per-category route agree on which classes belong where,
 * and so a class added to VEHICLE_CLASSES without being placed in a group is a
 * type error rather than a silently missing card.
 */
export const RATE_GROUPS = ["passenger", "transport"] as const;
export type RateGroup = (typeof RATE_GROUPS)[number];

export const RATE_GROUP_CLASSES = {
  passenger: ["economy", "sedan", "vip", "suv"],
  transport: ["event", "specialized", "logistics"],
} as const satisfies Record<RateGroup, readonly VehicleClass[]>;

/** Which group a class belongs to, for the detail page's breadcrumb. */
export function rateGroupOf(cls: VehicleClass): RateGroup {
  return RATE_GROUPS.find((g) =>
    (RATE_GROUP_CLASSES[g] as readonly VehicleClass[]).includes(cls)
  )!;
}

/**
 * Self-drive is offered on everyday cars only. Event coaches, executive cars,
 * armored vehicles and logistics trucks are chauffeur-only regardless of what
 * the `selfDriveAvailable` flag on an individual vehicle says — this list is
 * the authority, and `isSelfDriveEligible` is the only thing that should be
 * consulted at a call site.
 */
export const SELF_DRIVE_CLASSES: readonly VehicleClass[] = ["economy", "sedan", "suv"];

export function isSelfDriveEligible(vehicle: {
  class: VehicleClass;
  selfDriveAvailable?: boolean;
}): boolean {
  return Boolean(vehicle.selfDriveAvailable) && SELF_DRIVE_CLASSES.includes(vehicle.class);
}

/**
 * Lead-analytics bucket sizes. Lives here rather than in lib/data/analytics.ts
 * because the chart is a client component and that module is `server-only`.
 */
export const GRANULARITIES = ["day", "week", "month", "year"] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Annually",
};

export interface LeadBucket {
  /** ISO timestamp of the bucket start. */
  period: string;
  bookings: number;
  corporate: number;
  general: number;
}

export interface LeadAnalytics {
  buckets: LeadBucket[];
  totals: { bookings: number; corporate: number; general: number };
  /** Same window, immediately before `from` — for the period-on-period delta. */
  previous: { bookings: number; corporate: number; general: number };
}

/**
 * Conversion actions worth counting, all of which end the visit.
 *
 * A form submission leaves a Booking or Enquiry document behind, so those are
 * already countable. These are the ones that were not: a WhatsApp or phone tap
 * hands the visitor to another app and the session simply ends, which made the
 * single most common way to contact Shani Travels invisible to the business.
 */
export const CONVERSION_KINDS = ["whatsapp", "call", "email", "directions"] as const;
export type ConversionKind = (typeof CONVERSION_KINDS)[number];

export const CONVERSION_KIND_LABELS: Record<ConversionKind, string> = {
  whatsapp: "WhatsApp",
  call: "Phone call",
  email: "Email",
  directions: "Directions",
};

export interface ConversionTotals {
  whatsapp: number;
  call: number;
  email: number;
  directions: number;
}

/** Where on the site the tap happened, for "which page drives contact". */
export interface ConversionSource {
  path: string;
  kind: ConversionKind;
  count: number;
}

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ["all", "class", "vehicle"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

/**
 * A price reduction applied to published rates. Scope narrows what it hits:
 * every vehicle, whole classes, or a hand-picked list.
 */
export interface DiscountDoc {
  id: string;
  name: string;
  /** Short badge shown on the public site, e.g. "EID · 15% OFF". */
  label: LocalizedString;
  type: DiscountType;
  /** Percent when type is "percentage", rupees off when "fixed". */
  value: number;
  scope: DiscountScope;
  vehicleClasses: VehicleClass[];
  vehicles: string[];
  startDate: string;
  /** Null means open-ended. */
  endDate?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link DiscountDoc}. */
export type Discount = Flatten<DiscountDoc>;

export const ARMOR_LEVELS = ["B-4", "B-6", "B-7"] as const;
export type ArmorLevel = (typeof ARMOR_LEVELS)[number];

export const CLIENT_SECTORS = [
  "un-donor",
  "ngo",
  "telecom-corporate",
  "government",
  "hospitality",
] as const;
export type ClientSector = (typeof CLIENT_SECTORS)[number];

export const CLIENT_SECTOR_LABELS: Record<ClientSector, string> = {
  "un-donor": "UN Agencies & Donors",
  ngo: "NGOs & INGOs",
  "telecom-corporate": "Telecom & Corporate",
  government: "Government",
  hospitality: "Hospitality",
};

export const BOOKING_STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ENQUIRY_STATUSES = ["new", "in-discussion", "proposal-sent", "won", "lost"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const RATE_TYPES = ["hour", "day", "week", "airport"] as const;
export type RateType = (typeof RATE_TYPES)[number];

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  hour: "Per hour",
  day: "Per day",
  week: "Per week",
  airport: "Airport transfer",
};

export const SERVICE_MODES = ["chauffeur", "self-drive"] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

export interface MediaImage {
  publicId: string;
  url: string;
  alt: string;
  order: number;
}

/**
 * A homepage hero slide — a {@link MediaImage} that also carries the words laid
 * over it, so every slide is editable rather than only the first.
 *
 * Each line is optional: blank falls back to the site headline on slide one and
 * to the UI dictionary on the rest, which is what lets a settings document
 * saved before these fields existed keep rendering unchanged.
 */
export interface HeroSlideDoc extends MediaImage {
  eyebrow: LocalizedString;
  title: LocalizedString;
  body: LocalizedString;
}

export interface VehicleRates {
  perHour?: number | null;
  /** null → "on request" (executive/logistics vehicles are often unpublished) */
  perDay?: number | null;
  perWeek?: number | null;
  perMonth?: number | null;
  fuelPerKm?: number | null;
  airportTransfer?: number | null;
}

export interface SelfDriveRates {
  perDay?: number | null;
  perWeek?: number | null;
  perMonth?: number | null;
  /** null → "confirmed at booking" */
  securityDeposit?: number | null;
}

export interface VehicleDoc {
  id: string;
  slug: string;
  name: string;
  class: VehicleClass;
  modelYears: string;
  seats: number;
  engine: LocalizedString;
  transmission: LocalizedString;
  driveType: LocalizedString;
  interiorFeatures: LocalizedString[];
  images: MediaImage[];
  rates: VehicleRates;
  currency: string;
  armorLevel?: ArmorLevel | null;
  rollCage: boolean;
  selfDriveAvailable: boolean;
  selfDrive?: SelfDriveRates | null;
  /** Shown in the homepage "featured fleet" strip. */
  featured: boolean;
  /** Pinned to the "Recommended" group at the top of the booking wizard picker. */
  recommended: boolean;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link VehicleDoc}. */
export type Vehicle = Flatten<VehicleDoc>;

export interface OfficeDoc {
  id: string;
  city: LocalizedString;
  address: LocalizedString;
  phones: string[];
  email?: string | null;
  /** Directions link, followed in a new tab from /network. */
  mapUrl?: string | null;
  /** Google Maps "Embed a map" iframe src, framed on /contact. */
  mapEmbedUrl?: string | null;
  isHeadOffice: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link OfficeDoc}. */
export type Office = Flatten<OfficeDoc>;

export interface Client {
  id: string;
  name: string;
  sector: ClientSector;
  logo?: { publicId: string; url: string; alt: string } | null;
  featured: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialDoc {
  id: string;
  organization: string;
  sector: ClientSector;
  quote: LocalizedString;
  year?: string | null;
  featured: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link TestimonialDoc}. */
export type Testimonial = Flatten<TestimonialDoc>;

// ---------------------------------------------------------------------------
// Gallery — the photo wall on /gallery
// ---------------------------------------------------------------------------

/**
 * Filter buckets on the gallery page, in the order the chips render.
 *
 * "All photos" is not a member: it is the absence of a filter, and modelling it
 * as a category would let an admin file a photograph under it.
 */
export const GALLERY_CATEGORIES = [
  "happy-clients",
  "our-team",
  "corporate-events",
  "journeys",
  "fleet",
  "behind-the-scenes",
] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** Admin-side display only; the public chips read the dictionary. */
export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  "happy-clients": "Happy Clients",
  "our-team": "Our Team",
  "corporate-events": "Corporate Events",
  journeys: "Journeys",
  fleet: "Fleet",
  "behind-the-scenes": "Behind The Scenes",
};

export interface GalleryImageDoc {
  id: string;
  image: { publicId: string; url: string; alt: string };
  caption: LocalizedString;
  category: GalleryCategory;
  /**
   * Promotes the photograph to a large tile in the mosaic. Purely a layout
   * weight — see `galleryTileSpan` in components/site/GalleryGrid.
   */
  featured: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link GalleryImageDoc}. */
export type GalleryImage = Flatten<GalleryImageDoc>;

// ---------------------------------------------------------------------------
// Award — recognition wall on /awards
// ---------------------------------------------------------------------------

export const AWARD_CATEGORIES = [
  "industry-awards",
  "client-appreciations",
  "certificates",
  "milestones",
  "press-media",
] as const;
export type AwardCategory = (typeof AWARD_CATEGORIES)[number];

/** Admin-side display only; the public filter rail reads the dictionary. */
export const AWARD_CATEGORY_LABELS: Record<AwardCategory, string> = {
  "industry-awards": "Industry Awards",
  "client-appreciations": "Client Appreciations",
  certificates: "Certificates",
  milestones: "Milestones",
  "press-media": "Press & Media",
};

export interface AwardDoc {
  id: string;
  title: LocalizedString;
  /** Who gave it — rendered in accent under the title. */
  issuer: LocalizedString;
  description: LocalizedString;
  image?: { publicId: string; url: string; alt: string } | null;
  /**
   * Date on the certificate, as a plain `YYYY-MM-DD` string rather than a Date.
   * Only ever formatted for display, and a Date would drag the whole
   * timezone question into a field where "May 2023" is the real precision.
   */
  awardedOn?: string | null;
  category: AwardCategory;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link AwardDoc}. */
export type Award = Flatten<AwardDoc>;

export const SERVICE_GROUPS = ["corporate", "individual", "specialized"] as const;
export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

export const SERVICE_GROUP_LABELS: Record<ServiceGroup, string> = {
  corporate: "For Organizations",
  individual: "For Individuals & Families",
  specialized: "Specialized Services",
};

export interface ServiceDoc {
  id: string;
  slug: string;
  title: LocalizedString;
  group: ServiceGroup;
  summary: LocalizedString;
  body: LocalizedString;
  image?: { publicId: string; url: string; alt: string } | null;
  relatedVehicleClasses: VehicleClass[];
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link ServiceDoc}. */
export type Service = Flatten<ServiceDoc>;

export interface IndustryDoc {
  id: string;
  slug: string;
  name: LocalizedString;
  icon?: string | null;
  heroImage?: { publicId: string; url: string; alt: string } | null;
  summary: LocalizedString;
  body: LocalizedString;
  relatedServiceSlugs: string[];
  relatedVehicleClasses: VehicleClass[];
  testimonialSector?: ClientSector | null;
  seo: { title: LocalizedString; description: LocalizedString };
  featured: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link IndustryDoc}. */
export type Industry = Flatten<IndustryDoc>;

export const SAFETY_CATEGORIES = ["chauffeur", "self-drive", "general"] as const;
export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export const SAFETY_CATEGORY_LABELS: Record<SafetyCategory, string> = {
  chauffeur: "Chauffeur-Driven Protocol",
  "self-drive": "Self-Drive Protocol",
  general: "General Requirements",
};

export interface SafetySectionDoc {
  id: string;
  slug: string;
  category: SafetyCategory;
  title: LocalizedString;
  intro?: LocalizedString | null;
  items: LocalizedString[];
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Localized view of {@link SafetySectionDoc}. */
export type SafetySection = Flatten<SafetySectionDoc>;

export interface VerificationFlag {
  done: boolean;
  by?: string | null;
  at?: string | null;
}

export interface BookingVerification {
  cnicVerified: VerificationFlag;
  licenceVerified: VerificationFlag;
  agreementSigned: VerificationFlag;
  declarationSigned: VerificationFlag;
}

export interface Booking {
  id: string;
  reference: string;
  vehicle: string | null;
  vehicleName: string;
  serviceMode: ServiceMode;
  rateType: RateType;
  startDate: string;
  endDate?: string | null;
  pickupCity: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  indicativeFare?: number | null;
  /**
   * Whatever the customer typed into the promo field, recorded as-is.
   *
   * It does not change `indicativeFare` — that stays the published rate so the
   * quote the team confirms on the phone is the one the customer saw. This is a
   * lead attribute: it tells whoever picks up the call which campaign brought
   * them in and what they were promised.
   */
  promoCode?: string | null;
  status: BookingStatus;
  adminNotes?: string | null;
  verification?: BookingVerification | null;
  createdAt: string;
  updatedAt: string;
}

export const ENQUIRY_TYPES = ["corporate", "general"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export interface Enquiry {
  id: string;
  reference: string;
  type: EnquiryType;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  sector?: string | null;
  cities: string[];
  vehiclesNeeded: string;
  duration: string;
  details?: string | null;
  status: EnquiryStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialDoc {
  label: LocalizedString;
  value: LocalizedString;
  image?: { publicId: string; url: string; alt: string } | null;
}

/** Localized view of {@link CredentialDoc}. */
export type Credential = Flatten<CredentialDoc>;

export interface PromoDoc {
  active: boolean;
  /** Small badge on the left of the bar, e.g. "Limited time offer". */
  headline: LocalizedString;
  /** The offer itself, e.g. "10% off all daily rentals". */
  message: LocalizedString;
  /** Typed back to us verbatim, so it is never translated. Blank = no code. */
  code: string;
  ctaLabel: LocalizedString;
  ctaHref: string;
  /** ISO dates. Blank start = live immediately; blank end = runs until switched off. */
  startDate: string;
  endDate: string;
}

/** Localized view of {@link PromoDoc}. */
export type Promo = Flatten<PromoDoc>;

/**
 * Live right now: switched on, started, and not past its end date.
 *
 * `endDate` is treated as inclusive — an offer ending on the 30th should still
 * run on the evening of the 30th, which a naive `endDate < now` would cut short
 * at midnight as the date parses to 00:00.
 */
export function isPromoLive(
  promo: Pick<PromoDoc, "active" | "startDate" | "endDate"> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!promo?.active) return false;
  if (promo.startDate && new Date(promo.startDate) > now) return false;
  if (promo.endDate) {
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999);
    if (end < now) return false;
  }
  return true;
}

export interface SiteSettingsDoc {
  id: string;
  helplineNumbers: string[];
  whatsappNumber: string;
  emails: string[];
  headOfficeAddress: string;
  socials: {
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    linkedin?: string;
  };
  heroHeadline: LocalizedString;
  heroSubheadline: LocalizedString;
  /** Slides, in order. Slide one falls back to the two fields above. */
  heroImages: HeroSlideDoc[];
  announcementBar?: { text: LocalizedString; active: boolean } | null;
  /**
   * The campaign bar that sits above the navbar.
   *
   * Separate from `announcementBar`, which carries plain notices — a promo has
   * a code, a call to action and a run of dates. When both are switched on the
   * promo takes the slot (see app/(public)/layout.tsx), so the bar never
   * doubles up and the notice comes back on its own once the promo expires.
   *
   * `code` is deliberately not localized: a discount code has to be typed back
   * to us exactly, so it stays one string in both languages — the same reason
   * enum values are not translated per row.
   */
  promo?: PromoDoc | null;
  stats: { yearsOperating: number; cities: number; fleetSize?: number | null };
  seoDefaults: {
    title: LocalizedString;
    description: LocalizedString;
    ogImage?: { publicId: string; url: string } | null;
  };
  /**
   * Artwork for the three offer tiles on the homepage.
   *
   * Each is optional: unset, the tile falls back to the first fleet photograph
   * of a fitting class, which is how the band worked before these existed. So
   * an empty database still renders a complete section, and an admin can
   * override one tile without having to supply all three.
   *
   * Keyed rather than an array — the tiles are three fixed editorial slots, not
   * a list, and a positional array would silently re-caption them if one were
   * removed.
   */
  offerImages: {
    longHire?: { publicId: string; url: string; alt: string } | null;
    airport?: { publicId: string; url: string; alt: string } | null;
    nationwide?: { publicId: string; url: string; alt: string } | null;
  };
  credentials: CredentialDoc[];
  commercialTerms: LocalizedString;
  about: {
    /**
     * Mission statement. Optional: left blank, the About page falls back to the
     * default in the dictionary, so the section is never empty on a fresh
     * database — the same arrangement the hero uses for its slide copy.
     */
    mission: LocalizedString;
    story: LocalizedString;
    ceoMessage: LocalizedString;
    /** Proper noun — not translated. */
    ceoName: string;
    /** Portrait floated beside the letter on /about. Optional: the text runs
     *  full width when no photograph has been uploaded. */
    ceoImage?: { publicId: string; url: string; alt: string } | null;
    hseSummary: LocalizedString;
  };
  /** Launch-dark switch for the self-drive service line (insurance pending). */
  selfDriveEnabled: boolean;
  updatedAt: string;
}

/** Localized view of {@link SiteSettingsDoc}. */
export type SiteSettings = Flatten<SiteSettingsDoc>;

/** Which public form an address was captured from. */
export const MARKETING_SOURCES = ["booking", "corporate", "contact"] as const;
export type MarketingSource = (typeof MARKETING_SOURCES)[number];

export interface MarketingContact {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  sources: MarketingSource[];
  submissions: number;
  subscribed: boolean;
  unsubscribedAt?: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A single role. The editor/ops/driver tiers existed to scope access to the
 * field-operations module, which no longer exists — everyone who signs in to
 * the panel is an administrator.
 */
export const ADMIN_ROLES = ["admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin — everything",
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Standard result shape returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
