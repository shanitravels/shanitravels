import mongoose, { Schema, type Model } from "mongoose";
import {
  VEHICLE_CLASSES,
  ARMOR_LEVELS,
  CLIENT_SECTORS,
  BOOKING_STATUSES,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  RATE_TYPES,
  ADMIN_ROLES,
  SERVICE_GROUPS,
  SERVICE_MODES,
  SAFETY_CATEGORIES,
  MARKETING_SOURCES,
  DISCOUNT_TYPES,
  DISCOUNT_SCOPES,
  CONVERSION_KINDS,
  GALLERY_CATEGORIES,
  AWARD_CATEGORIES,
} from "@/lib/types";

/**
 * Mongoose schemas — the single source of truth for the database.
 * Validation here mirrors the Zod schemas in `lib/validation.ts` so bad data
 * can never land even if a server action is bypassed.
 *
 * Every model uses the `mongoose.models.X || model()` guard so hot reloads
 * don't recompile schemas.
 */

const imageSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const flatImageSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const photoSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, required: true },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Vehicle — the core catalog
// ---------------------------------------------------------------------------
/**
 * A bilingual text field.
 *
 * Stored as a subdocument rather than parallel `title_ur` keys so the pair
 * travels together through queries, `serialize()` and the admin forms, and so
 * lib/i18n/localize.ts can find it structurally instead of by name.
 * `ur` may be empty — rendering falls back to `en`.
 */
const localizedSchema = new Schema(
  { en: { type: String, default: "" }, ur: { type: String, default: "" } },
  { _id: false }
);

const localized = () => ({ type: localizedSchema, default: () => ({ en: "", ur: "" }) });

/** An array of bilingual strings (interior features, safety checklist items). */
const localizedArray = () => ({ type: [localizedSchema], default: [] });

/**
 * A published rate. Unset (null) is how a vehicle shows "on request"; a stored
 * figure must be a price that can be charged, so zero is refused here as well
 * as in lib/validation — "PKR 0" on the rate card would read as free hire.
 */
const rateField = () => ({
  type: Number,
  default: null,
  // Tuple-annotated: inferred as (string | number)[], Mongoose's typings want
  // the [limit, message] pair.
  min: [0.01, "Rates must be greater than zero — leave the field blank for “on request”."] as [
    number,
    string,
  ],
});

const vehicleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    class: { type: String, enum: VEHICLE_CLASSES, required: true, index: true },
    modelYears: { type: String, default: "" },
    seats: { type: Number, required: true, min: 1 },
    engine: localized(),
    transmission: localized(),
    driveType: localized(),
    interiorFeatures: localizedArray(),
    images: { type: [imageSchema], default: [] },
    // null → "on request" (executive/logistics fleet is often unpublished);
    // a stored number must be a real price. `min` skips null, so clearing a
    // rate stays legal while zero does not. See rateField above.
    rates: {
      perHour: rateField(),
      perDay: rateField(),
      perWeek: rateField(),
      perMonth: rateField(),
      fuelPerKm: rateField(),
      airportTransfer: rateField(),
    },
    currency: { type: String, default: "PKR" },
    armorLevel: { type: String, enum: [...ARMOR_LEVELS, null], default: null },
    rollCage: { type: Boolean, default: false },
    selfDriveAvailable: { type: Boolean, default: false },
    selfDrive: {
      type: new Schema(
        {
          perDay: rateField(),
          perWeek: rateField(),
          perMonth: rateField(),
          // Not a rateField: a deposit of zero is a real term, "no deposit".
          securityDeposit: { type: Number, default: null, min: 0 },
        },
        { _id: false }
      ),
      default: null,
    },
    // Two independent shelves, deliberately not one "promoted" flag: `featured`
    // fills the homepage strip, `recommended` pins a vehicle to the top group
    // of the booking wizard's picker. A vehicle can sit on either, both, or
    // neither.
    featured: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Office — the national network
// ---------------------------------------------------------------------------
const officeSchema = new Schema(
  {
    city: localized(),
    address: localized(),
    phones: { type: [String], default: [] },
    email: { type: String, default: null },
    // Two different Google Maps links, deliberately separate: `mapUrl` is the
    // "Get directions" click-through on /network, `mapEmbedUrl` is the
    // iframe src for the map panel on /contact. A /maps/embed URL opens as a
    // bare chrome-less map when followed as a link, and a normal maps link
    // refuses to render in a frame, so neither can stand in for the other.
    mapUrl: { type: String, default: null },
    mapEmbedUrl: { type: String, default: null },
    isHeadOffice: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Client — the trusted-by wall
// ---------------------------------------------------------------------------
const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sector: { type: String, enum: CLIENT_SECTORS, required: true, index: true },
    logo: { type: flatImageSchema, default: null },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Testimonial — paraphrased from appreciation letters
// ---------------------------------------------------------------------------
const testimonialSchema = new Schema(
  {
    organization: { type: String, required: true, trim: true },
    sector: { type: String, enum: CLIENT_SECTORS, required: true },
    quote: localized(),
    year: { type: String, default: null },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// GalleryImage — the photo wall
// ---------------------------------------------------------------------------
const galleryImageSchema = new Schema(
  {
    // Required, unlike the optional logo on a client: a gallery row with no
    // photograph is not a partially-filled record, it is an empty tile.
    image: { type: flatImageSchema, required: true },
    caption: localized(),
    category: { type: String, enum: GALLERY_CATEGORIES, required: true, index: true },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Award — recognition, certificates and press
// ---------------------------------------------------------------------------
const awardSchema = new Schema(
  {
    title: localized(),
    issuer: localized(),
    description: localized(),
    image: { type: flatImageSchema, default: null },
    // "YYYY-MM-DD" as text — see the note on AwardDoc.awardedOn.
    awardedOn: { type: String, default: null },
    category: { type: String, enum: AWARD_CATEGORIES, required: true, index: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Service — grouped by audience (corporate / individual / specialized)
// ---------------------------------------------------------------------------
const serviceSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    title: localized(),
    group: { type: String, enum: SERVICE_GROUPS, default: "individual", index: true },
    summary: localized(),
    body: localized(),
    image: { type: flatImageSchema, default: null },
    relatedVehicleClasses: { type: [String], enum: VEHICLE_CLASSES, default: [] },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Industry — per-industry landing pages (the SEO play)
// ---------------------------------------------------------------------------
const industrySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    name: localized(),
    icon: { type: String, default: null },
    heroImage: { type: flatImageSchema, default: null },
    summary: localized(),
    body: localized(),
    relatedServiceSlugs: { type: [String], default: [] },
    relatedVehicleClasses: { type: [String], enum: VEHICLE_CLASSES, default: [] },
    testimonialSector: { type: String, enum: [...CLIENT_SECTORS, null], default: null },
    seo: {
      title: localized(),
      description: localized(),
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// SafetySection — the security protocol as structured content
// ---------------------------------------------------------------------------
const safetySectionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    category: { type: String, enum: SAFETY_CATEGORIES, required: true, index: true },
    title: localized(),
    intro: localized(),
    items: localizedArray(),
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Booking (retail) — created by the public flow
// ---------------------------------------------------------------------------
const verificationFlagSchema = new Schema(
  {
    done: { type: Boolean, default: false },
    by: { type: String, default: null },
    at: { type: Date, default: null },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    vehicleName: { type: String, required: true },
    serviceMode: { type: String, enum: SERVICE_MODES, default: "chauffeur", index: true },
    rateType: { type: String, enum: RATE_TYPES, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, default: null },
    pickupCity: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    notes: { type: String, default: null },
    indicativeFare: { type: Number, default: null },
    // Recorded verbatim; it does not alter indicativeFare. See Booking in lib/types.
    promoCode: { type: String, default: null },
    status: { type: String, enum: BOOKING_STATUSES, default: "new", index: true },
    adminNotes: { type: String, default: null },
    // Self-drive verification — admin-side flags, ticked at handover.
    // Deliberate decision: the site NEVER collects CNIC/passport/licence
    // uploads from customers. Documents are verified physically at handover.
    verification: {
      type: new Schema(
        {
          cnicVerified: { type: verificationFlagSchema, default: () => ({}) },
          licenceVerified: { type: verificationFlagSchema, default: () => ({}) },
          agreementSigned: { type: verificationFlagSchema, default: () => ({}) },
          declarationSigned: { type: verificationFlagSchema, default: () => ({}) },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Enquiry (corporate proposal request / general contact)
// ---------------------------------------------------------------------------
const enquirySchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ENQUIRY_TYPES, default: "corporate" },
    company: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    sector: { type: String, default: null },
    cities: { type: [String], default: [] },
    vehiclesNeeded: { type: String, default: "" },
    duration: { type: String, default: "" },
    details: { type: String, default: null },
    status: { type: String, enum: ENQUIRY_STATUSES, default: "new", index: true },
    adminNotes: { type: String, default: null },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Discount — price reductions applied to published rates
// ---------------------------------------------------------------------------
const discountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: localized(),
    type: { type: String, enum: DISCOUNT_TYPES, default: "percentage" },
    value: { type: Number, required: true, min: 0 },
    scope: { type: String, enum: DISCOUNT_SCOPES, default: "all" },
    vehicleClasses: { type: [String], enum: VEHICLE_CLASSES, default: [] },
    vehicles: { type: [Schema.Types.ObjectId], ref: "Vehicle", default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// MarketingContact — the mailing list for offers and discounts.
//
// Deliberately its own collection rather than a query over bookings/enquiries:
// a marketing list needs an opt-out that survives independently of the request
// it came from. Deleting a booking must not silently resubscribe someone.
// ---------------------------------------------------------------------------
const marketingContactSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: null },
    phone: { type: String, default: null },
    /** Every form this address has arrived through. */
    sources: { type: [String], enum: MARKETING_SOURCES, default: [] },
    submissions: { type: Number, default: 0 },
    subscribed: { type: Boolean, default: true, index: true },
    unsubscribedAt: { type: Date, default: null },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * A hero slide: the picture plus the words shown over it.
 *
 * Its own schema rather than the shared `imageSchema`, because only the hero
 * carries copy alongside the photograph — putting these three on `imageSchema`
 * would hang them off every vehicle gallery and media record too.
 *
 * All three lines are optional. Blank means "use the fallback", which is the
 * site headline for the first slide and the dictionary for the rest, so a
 * settings document written before this field existed still renders exactly as
 * it did.
 */
const heroSlideSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
    eyebrow: localized(),
    title: localized(),
    body: localized(),
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// SiteSettings — singleton, everything global the admin can edit
// ---------------------------------------------------------------------------
const settingsSchema = new Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    helplineNumbers: { type: [String], default: [] },
    whatsappNumber: { type: String, default: "" },
    emails: { type: [String], default: [] },
    headOfficeAddress: { type: String, default: "" },
    socials: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      pinterest: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    heroHeadline: localized(),
    heroSubheadline: localized(),
    heroImages: { type: [heroSlideSchema], default: [] },
    announcementBar: {
      text: localized(),
      active: { type: Boolean, default: false },
    },
    // The campaign bar. `code` stays a plain String — a discount code has to be
    // typed back to us exactly, so it is the same in both languages.
    promo: {
      active: { type: Boolean, default: false },
      headline: localized(),
      message: localized(),
      code: { type: String, default: "" },
      ctaLabel: localized(),
      ctaHref: { type: String, default: "/book" },
      startDate: { type: String, default: "" },
      endDate: { type: String, default: "" },
    },
    stats: {
      yearsOperating: { type: Number, default: 0 },
      cities: { type: Number, default: 0 },
      fleetSize: { type: Number, default: null },
    },
    seoDefaults: {
      title: localized(),
      description: localized(),
      ogImage: { type: photoSchema, default: null },
    },
    // Homepage offer tiles. Null means "use a fleet photograph instead".
    offerImages: {
      longHire: { type: flatImageSchema, default: null },
      airport: { type: flatImageSchema, default: null },
      nationwide: { type: flatImageSchema, default: null },
    },
    credentials: {
      type: [
        new Schema(
          {
            label: localized(),
            value: localized(),
            image: { type: flatImageSchema, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    commercialTerms: localized(),
    about: {
      mission: localized(),
      story: localized(),
      ceoMessage: localized(),
      // Proper noun — same in both languages.
      ceoName: { type: String, default: "" },
      ceoImage: { type: flatImageSchema, default: null },
      hseSummary: localized(),
    },
    // Launch-dark switch for the self-drive line (insurance confirmation pending).
    // Default false — see the note on SiteSettings.showClientIdentities. A
    // privacy default has to be the safe one: a fresh deployment must not
    // publish client names before anyone has decided it should.
    showClientIdentities: { type: Boolean, default: false },
    selfDriveEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// AdminUser
// ---------------------------------------------------------------------------
const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ADMIN_ROLES, default: "editor" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Counter — atomic sequences for references
// ---------------------------------------------------------------------------
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

// ---------------------------------------------------------------------------
// ConversionEvent — outbound contact taps
// ---------------------------------------------------------------------------
/**
 * One row per WhatsApp / phone / email tap.
 *
 * Form submissions already leave a Booking or an Enquiry behind, so they can be
 * counted after the fact. These cannot: the tap hands the visitor to another
 * app and the session ends, so unless it is recorded at the moment of the click
 * it leaves no trace anywhere. On a business where most enquiries arrive over
 * WhatsApp, that was the majority of the funnel going unmeasured.
 *
 * Deliberately no IP, no user agent, no identifier of any kind — this counts
 * intent per page, and storing less means there is nothing here to leak.
 */
const conversionEventSchema = new Schema(
  {
    kind: { type: String, enum: CONVERSION_KINDS, required: true, index: true },
    /** Same-origin pathname the tap happened on, e.g. "/fleet/toyota-yaris". */
    path: { type: String, required: true, trim: true, maxlength: 512 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

// The dashboard always slices by date and groups by kind or path.
conversionEventSchema.index({ createdAt: -1, kind: 1 });

// ---------------------------------------------------------------------------
// RateLimit — shared fixed-window counters
// ---------------------------------------------------------------------------
/**
 * Rate-limit windows, kept in the database rather than in each process.
 *
 * A module-level Map gives every serverless instance its own allowance, so the
 * real limit becomes `limit x warm instances` — tolerable for the public forms,
 * where the honeypot and Zod carry most of the load, but it was the only thing
 * standing between a credential-stuffing run and the admin sign-in.
 */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: true },
});

// Mongo drops each window once it expires, so this collection stays small
// without any sweeping of our own. The TTL monitor runs about once a minute,
// which is why lib/rate-limit.ts compares `resetAt` itself rather than
// trusting the row's absence to mean "window over".
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Models are typed loosely (`Model<any>`) on purpose. Deep `InferSchemaType`
 * generics over these schemas make `tsc` allocate gigabytes; real type safety
 * lives at the boundary instead — Zod validates every write, and every read is
 * cast through `serialize<DomainType>()`. Doc-shape typing here would add cost
 * without adding guarantees.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

function getModel(name: string, schema: Schema): AnyModel {
  const cached = mongoose.models[name] as AnyModel | undefined;
  if (!cached) return mongoose.model(name, schema);

  // `mongoose.models` is state inside the mongoose package, and Next's dev HMR
  // re-evaluates this file without re-evaluating node_modules — so a model
  // registered before a schema edit keeps the *old* paths for the life of the
  // dev server. Because schemas are `strict` by default, Mongoose then drops a
  // newly added field from every write without erroring: the admin toggle
  // appears to work and nothing persists. Re-registering when the path set has
  // genuinely changed costs an index re-declaration on that one compile only,
  // and never runs in production, where the process starts from a clean slate.
  if (process.env.NODE_ENV !== "production") {
    const pathsOf = (s: Schema) => Object.keys(s.paths).sort().join(",");
    if (pathsOf(cached.schema) !== pathsOf(schema)) {
      mongoose.deleteModel(name);
      return mongoose.model(name, schema);
    }
  }
  return cached;
}

export const VehicleModel = getModel("Vehicle", vehicleSchema);
export const OfficeModel = getModel("Office", officeSchema);
export const ClientModel = getModel("Client", clientSchema);
export const TestimonialModel = getModel("Testimonial", testimonialSchema);
export const GalleryImageModel = getModel("GalleryImage", galleryImageSchema);
export const AwardModel = getModel("Award", awardSchema);
export const ServiceModel = getModel("Service", serviceSchema);
export const IndustryModel = getModel("Industry", industrySchema);
export const SafetySectionModel = getModel("SafetySection", safetySectionSchema);
export const BookingModel = getModel("Booking", bookingSchema);
export const EnquiryModel = getModel("Enquiry", enquirySchema);
export const DiscountModel = getModel("Discount", discountSchema);
export const MarketingContactModel = getModel("MarketingContact", marketingContactSchema);
export const SettingsModel = getModel("SiteSettings", settingsSchema);
export const AdminUserModel = getModel("AdminUser", adminUserSchema);
export const CounterModel = getModel("Counter", counterSchema);
export const RateLimitModel = getModel("RateLimit", rateLimitSchema);
export const ConversionEventModel = getModel("ConversionEvent", conversionEventSchema);

/** Atomically increment and return the next sequence for a reference key. */
export async function nextSequence(key: string): Promise<number> {
  // returnDocument: "after" is load-bearing, not stylistic — the reference is
  // the post-increment value, and on the first upsert "before" yields null.
  const doc = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  ).lean();
  return (doc as { seq: number }).seq;
}
