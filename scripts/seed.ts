/**
 * Seed script — populates MongoDB so the site is fully live on first run.
 *
 *   npm run seed            # fills empty collections, upserts admin + settings
 *   npm run seed -- --force # wipes and reseeds content collections
 *
 * Creates: 1 admin user (from env), the v2 fleet (43 vehicles across 8 classes,
 * 2026 rates where published), 8 offices, 26 clients, 6 testimonials,
 * 13 grouped services, 12 industry landing pages, the safety protocol,
 * and the SiteSettings singleton (self-drive ships dark: selfDriveEnabled=false).
 *
 * NOTE: phone numbers / addresses in the seed are placeholders — the client
 * updates the real ones from Admin → Settings and Admin → Offices.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  VehicleModel,
  OfficeModel,
  ClientModel,
  TestimonialModel,
  ServiceModel,
  IndustryModel,
  SafetySectionModel,
  SettingsModel,
  AdminUserModel,
} from "../lib/models";
import { fleet } from "./data/fleet";
import { services } from "./data/services";
import { industries } from "./data/industries";
import { safetySections } from "./data/safety";

const FORCE = process.argv.includes("--force");

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format`;

// ---------------------------------------------------------------------------
// Offices — the 8-city national network (placeholder contact details)
// ---------------------------------------------------------------------------
const offices = [
  {
    city: "Islamabad",
    address: "Head Office, 82-E Fazal-e-Haq Road, Blue Area, Islamabad",
    phones: ["+92 51 260 1997", "+92 335 555 1997"],
    email: "info@shanitravels.pk",
    mapUrl: "https://maps.google.com/?q=Blue+Area+Islamabad",
    isHeadOffice: true,
    order: 0,
  },
  { city: "Lahore", address: "Regional Office, Main Boulevard, Gulberg III, Lahore", phones: ["+92 42 357 1997"], email: "lahore@shanitravels.pk", mapUrl: "https://maps.google.com/?q=Gulberg+III+Lahore", isHeadOffice: false, order: 1 },
  { city: "Karachi", address: "Regional Office, Jinnah International Airport area, Karachi", phones: ["+92 21 345 1997"], email: "karachi@shanitravels.pk", mapUrl: "https://maps.google.com/?q=Jinnah+International+Airport+Karachi", isHeadOffice: false, order: 2 },
  { city: "Peshawar", address: "Branch Office, University Road, Peshawar", phones: ["+92 91 570 1997"], email: "", mapUrl: "https://maps.google.com/?q=University+Road+Peshawar", isHeadOffice: false, order: 3 },
  { city: "Quetta", address: "Branch Office, Jinnah Road, Quetta", phones: ["+92 81 282 1997"], email: "", mapUrl: "https://maps.google.com/?q=Jinnah+Road+Quetta", isHeadOffice: false, order: 4 },
  { city: "Multan", address: "Branch Office, Abdali Road, Multan", phones: ["+92 61 458 1997"], email: "", mapUrl: "https://maps.google.com/?q=Abdali+Road+Multan", isHeadOffice: false, order: 5 },
  { city: "Sukkur", address: "Branch Office, Military Road, Sukkur", phones: ["+92 71 561 1997"], email: "", mapUrl: "https://maps.google.com/?q=Military+Road+Sukkur", isHeadOffice: false, order: 6 },
  { city: "Hyderabad", address: "Branch Office, Auto Bhan Road, Hyderabad", phones: ["+92 22 278 1997"], email: "", mapUrl: "https://maps.google.com/?q=Auto+Bhan+Road+Hyderabad", isHeadOffice: false, order: 7 },
];

// ---------------------------------------------------------------------------
// Clients — the trusted-by wall (logos uploaded later via CMS)
// ---------------------------------------------------------------------------
const clients: { name: string; sector: string; featured?: boolean }[] = [
  { name: "PIA", sector: "telecom-corporate", featured: true },
  { name: "UNDP", sector: "un-donor", featured: true },
  { name: "UNICEF", sector: "un-donor", featured: true },
  { name: "UNHCR", sector: "un-donor" },
  { name: "WHO", sector: "un-donor" },
  { name: "WFP", sector: "un-donor" },
  { name: "IOM", sector: "un-donor", featured: true },
  { name: "ICRC", sector: "un-donor", featured: true },
  { name: "USAID", sector: "un-donor", featured: true },
  { name: "EU Election Observation Mission", sector: "un-donor" },
  { name: "World Vision", sector: "ngo" },
  { name: "Concern Worldwide", sector: "ngo" },
  { name: "NRSP", sector: "ngo" },
  { name: "Save the Children", sector: "ngo" },
  { name: "Mercy Corps", sector: "ngo" },
  { name: "British Council", sector: "ngo", featured: true },
  { name: "PTCL", sector: "telecom-corporate", featured: true },
  { name: "Ericsson", sector: "telecom-corporate", featured: true },
  { name: "Nokia", sector: "telecom-corporate", featured: true },
  { name: "Telenor", sector: "telecom-corporate", featured: true },
  { name: "Jazz", sector: "telecom-corporate" },
  { name: "Siemens", sector: "telecom-corporate" },
  { name: "OGDCL", sector: "telecom-corporate" },
  { name: "NADRA", sector: "government", featured: true },
  { name: "Election Commission of Pakistan", sector: "government" },
  { name: "Marriott Hotels", sector: "hospitality", featured: true },
  { name: "Serena Hotels", sector: "hospitality" },
];

// ---------------------------------------------------------------------------
// Testimonials — short paraphrases of the appreciation letters
// ---------------------------------------------------------------------------
const testimonials = [
  {
    organization: "SGAFP–NRSP (USAID-funded project)",
    sector: "ngo",
    quote:
      "Reliable vehicles, professional drivers and prompt service — with full representation in every province of Pakistan.",
    year: "2011",
    featured: true,
    order: 0,
  },
  {
    organization: "EU Election Observation Mission, Pakistan",
    sector: "un-donor",
    quote:
      "Secure, punctual and professional throughout the mission, with drivers who knew their assigned areas exceptionally well.",
    year: "2008",
    featured: true,
    order: 1,
  },
  {
    organization: "IOM — International Organization for Migration",
    sector: "un-donor",
    quote:
      "Vehicles provided all over the country with excellent communication and strong local knowledge. A very good experience.",
    year: "2013",
    featured: true,
    order: 2,
  },
  {
    organization: "Concern Worldwide Pakistan",
    sector: "ngo",
    quote:
      "A well-managed network across the country that follows up exactly as required. Services fully up to the mark.",
    year: "2012",
    featured: true,
    order: 3,
  },
  {
    organization: "IOM — Afghan Elections OCRV Project",
    sector: "un-donor",
    quote:
      "Commended for secured transport support during the Afghan Presidential Elections out-of-country voting programme.",
    year: "2004",
    featured: false,
    order: 4,
  },
  {
    organization: "CCS Comservice Pakistan",
    sector: "telecom-corporate",
    quote: "Recognised for the best luxury car services provided to our teams and visiting delegations.",
    year: "2010",
    featured: false,
    order: 5,
  },
];

// ---------------------------------------------------------------------------
// Site settings singleton
// ---------------------------------------------------------------------------
const settings = {
  singleton: "main",
  helplineNumbers: ["03008564588"],
  whatsappNumber: "03008564588",
  emails: ["info@shanitravels.pk", "bookings@shanitravels.pk"],
  headOfficeAddress: "82-E Fazal-e-Haq Road, Blue Area, Islamabad, Pakistan",
  socials: { facebook: "", instagram: "", pinterest: "", linkedin: "" },
  heroHeadline: "Chauffeur-driven transport you can rely on — since 1997",
  heroSubheadline:
    "Rent a car with driver for the day, or contract a dedicated project fleet anywhere in Pakistan. Insured, tracked and backed by offices in 8 cities.",
  heroImages: [
    { publicId: "", url: u("photo-1613859492095-85d9944f09f6", 2000), alt: "Land Cruiser Prado ready for a client", order: 0 },
    { publicId: "", url: u("photo-1623869675781-80aa31012a5a", 2000), alt: "Corolla Altis sedan detailed for pickup", order: 1 },
    { publicId: "", url: u("photo-1669886845445-c2350d2431f5", 2000), alt: "Coaster bus for group transport", order: 2 },
  ],
  announcementBar: {
    text: "The 2026 rate card is live — transparent per-day rates on every vehicle.",
    active: true,
  },
  stats: { yearsOperating: new Date().getFullYear() - 1997, cities: 8, fleetSize: 120 },
  seoDefaults: {
    title: "Shani Travels — Car Rental & Corporate Transport, Islamabad",
    description:
      "Chauffeur-driven car rental in Islamabad and nationwide project transport for UN agencies, NGOs and corporates. Insured, GPS-tracked fleet. Since 1997.",
    ogImage: null,
  },
  credentials: [
    { label: "Established", value: "1997 — Shani Group of Companies", image: null },
    { label: "Registrar of Firms", value: "Registered, Islamabad Capital Territory (2010)", image: null },
    { label: "NTN", value: "3661268-5", image: null },
    { label: "GST", value: "Registered for General Sales Tax", image: null },
  ],
  commercialTerms:
    "## Commercial terms\n\n- All rates are in PKR and **exclude General Sales Tax (GST)**.\n- Daily rates cover a standard 10-hour working day within city limits; overtime is billed per additional hour.\n- Fuel is billed per kilometre where marked; long routes include driver daily allowance.\n- Intercity and northern-area trips may carry toll, parking and overnight charges at actuals.\n- Bookings are confirmed by our team over phone or WhatsApp — no advance online payment is required.\n- Corporate accounts are invoiced monthly with agreed credit terms.\n- Rates marked \"on request\" are quoted per requirement after a short call.\n- Self-drive rentals carry a security deposit and are subject to the self-drive agreement.",
  about: {
    story:
      "Shani Travels is the ground-transport arm of the Shani Group of Companies, serving Pakistan since 1997. What began as a small chauffeur-driven car hire service in Islamabad has grown into a nationwide operation trusted by UN agencies, donors, NGOs, telecoms, airlines and government institutions.\n\nWe run project fleets through every province — from election observation missions and earthquake relief to multi-year development programmes and airline crew operations — backed by offices in 8 cities, vetted drivers and a maintenance regime that keeps every vehicle inspection-ready.",
    ceoMessage:
      "For nearly three decades our promise has stayed the same: a clean, insured vehicle, a professional driver and a team that answers the phone. Whether you need one car for an airport pickup or forty vehicles for a nationwide programme, we treat both with the same seriousness.",
    ceoName: "Muhammad Khurshid",
    hseSummary:
      "## Health, Safety & Environment\n\n- Every vehicle GPS-tracked and comprehensively insured\n- Documented pre-trip inspection for each journey\n- Background-checked, defensively-trained drivers with route inductions\n- Journey management and provincial backup vehicles for project fleets\n- Incident reporting with 24/7 operations support",
  },
  // Launch dark until self-drive insurance coverage is confirmed by the owners.
  selfDriveEnabled: false,
};

// ---------------------------------------------------------------------------

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Admin user (upsert by email)
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@shanitravels.pk").toLowerCase();
  let passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!passwordHash) {
    const plain = process.env.ADMIN_PASSWORD || "shani-admin-2026";
    passwordHash = await bcrypt.hash(plain, 12);
    console.warn(
      `ADMIN_PASSWORD_HASH not set — using ${process.env.ADMIN_PASSWORD ? "ADMIN_PASSWORD" : `default password "${plain}"`}. Change it after first login.`
    );
  }
  await AdminUserModel.findOneAndUpdate(
    { email: adminEmail },
    { email: adminEmail, name: "Site Administrator", role: "admin", active: true, passwordHash },
    { upsert: true }
  );
  console.log(`Admin user ready: ${adminEmail}`);

  const collections = [
    { name: "vehicles", model: VehicleModel, docs: fleet },
    { name: "offices", model: OfficeModel, docs: offices },
    { name: "clients", model: ClientModel, docs: clients.map((c, i) => ({ ...c, order: i, logo: null })) },
    { name: "testimonials", model: TestimonialModel, docs: testimonials },
    { name: "services", model: ServiceModel, docs: services },
    { name: "industries", model: IndustryModel, docs: industries },
    { name: "safety sections", model: SafetySectionModel, docs: safetySections },
  ] as const;

  for (const { name, model, docs } of collections) {
    const count = await (model as mongoose.Model<never>).countDocuments();
    if (count > 0 && !FORCE) {
      console.log(`Skipping ${name} (${count} existing — use --force to reseed).`);
      continue;
    }
    if (count > 0) await (model as mongoose.Model<never>).deleteMany({});
    await (model as mongoose.Model<never>).insertMany(docs as never[]);
    console.log(`Seeded ${docs.length} ${name}.`);
  }

  const existingSettings = await SettingsModel.countDocuments();
  if (existingSettings === 0 || FORCE) {
    await SettingsModel.findOneAndUpdate({ singleton: "main" }, { $set: settings }, { upsert: true });
    console.log("Seeded site settings (self-drive launches dark — enable it in Admin → Settings).");
  } else {
    console.log("Skipping settings (already present — use --force to overwrite).");
  }

  await mongoose.disconnect();
  console.log("Done. Sign in at /admin/login.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
