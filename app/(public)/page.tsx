import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiShield, FiMapPin, FiClock, FiUserCheck } from "react-icons/fi";
import { getSettings } from "@/lib/data/settings";
import { getFeaturedVehicles, getActiveVehicles } from "@/lib/data/vehicles";
import { getFeaturedClients, getActiveOffices, getActiveTestimonials, getActiveServices } from "@/lib/data/content";
import { Hero } from "@/components/site/Hero";
import { BookARide } from "@/components/site/BookARide";
import { ServiceHighlights } from "@/components/site/ServiceHighlights";
import { VehicleCard } from "@/components/site/VehicleCard";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { bestDiscountFor } from "@/lib/pricing";
import { FleetCategories } from "@/components/site/FleetCategories";
import {
  SectionHead,
  TrustBand,
  ClientWall,
  TestimonialsGrid,
  OfferShowcase,
  CorporateAccountBand,
  CtaBand,
} from "@/components/site/sections";
import { jsonLdScript, localBusinessJsonLd } from "@/lib/seo";
import { socialLinks } from "@/lib/social-links";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const og = settings.seoDefaults.ogImage?.url ?? settings.heroImages[0]?.url;
  return {
    title: settings.seoDefaults.title,
    description: settings.seoDefaults.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: settings.seoDefaults.title,
      description: settings.seoDefaults.description,
      type: "website",
      images: og ? [{ url: og }] : undefined,
    },
  };
}

export default async function HomePage() {
  const { t } = await getI18n();
  const [settings, featured, allVehicles, clients, offices, testimonials, services, discounts] =
    await Promise.all([
      getSettings(),
      getFeaturedVehicles(),
      getActiveVehicles(),
      getFeaturedClients(),
      getActiveOffices(),
      getActiveTestimonials(),
      getActiveServices(),
      getActiveDiscounts(),
    ]);

  const featuredTestimonials = testimonials.filter((t) => t.featured).slice(0, 3);

  return (
    <>
      {jsonLdScript(localBusinessJsonLd(settings, offices))}

      <Hero
        headline={settings.heroHeadline}
        subheadline={settings.heroSubheadline}
        images={settings.heroImages}
        socials={socialLinks(settings.socials, settings.whatsappNumber)}
      />

      {/* Straight under the hero: the four figures are the first claim the page
          makes, and they qualify everything below them. */}
      <TrustBand settings={settings} />

      {/* Fleet catalog — every class, each deep-linking into the filtered fleet */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:pb-14">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHead
            center={false}
            rule
            eyebrow={t.home.fleetEyebrow}
            title={t.home.fleetTitle}
            description={t.home.fleetDesc}
          />
          <Link
            href="/fleet"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-accent px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
          >
            {t.home.allVehicles} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8">
          <FleetCategories vehicles={allVehicles} />
        </div>

        {/*
          Trust strip, closing the catalog block as in the design.

          The four claims are the same ones the "Why Shani Travels" section
          further down makes, read from the same dictionary keys rather than
          reworded — one set of strings, so the two can never drift into saying
          slightly different things about the same promise.
        */}
        <ul className="mt-6 grid gap-x-6 gap-y-5 rounded-2xl border border-line bg-white px-6 py-5 shadow-card sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {[
            { icon: <FiUserCheck />, title: t.home.whyDriversTitle, desc: t.home.whyDriversDesc },
            { icon: <FiShield />, title: t.home.whyInsuredTitle, desc: t.home.whyInsuredDesc },
            { icon: <FiMapPin />, title: t.home.whyCoverageTitle, desc: t.home.whyCoverageDesc },
            { icon: <FiClock />, title: t.home.whyOpsTitle, desc: t.home.whyOpsDesc },
          ].map((f, i) => (
            <li
              key={f.title}
              className={`flex items-center gap-3 ${i > 0 ? "lg:pl-6" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                {f.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-navy">
                  {f.title}
                </span>
                <span className="block text-xs leading-snug text-muted">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Offers — placed straight after the catalog: the visitor has just seen
          what we run, and this answers "why book it here". */}
      <OfferShowcase
        vehicles={allVehicles}
        discounts={discounts}
        images={settings.offerImages}
      />

      {/* Instant-contact channels, after the fleet — the visitor has seen what's
          available and is ready to reach out. */}
      <BookARide
        className="py-12 sm:py-14"
        whatsapp={settings.whatsappNumber}
        helpline={settings.helplineNumbers[0]}
        email={settings.emails[0]}
      />

      {/* Featured fleet */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHead
              center={false}
              eyebrow={t.home.featuredEyebrow}
              title={t.home.featuredTitle}
              description={t.home.featuredDesc}
            />
            <Link
              href="/fleet"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
            >
              {t.home.viewFullFleet} <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} priority={i < 3} discount={bestDiscountFor(v, discounts)} />
            ))}
          </div>
        </section>
      )}

      {/* Why Shani */}
      <section className="bg-band">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow={t.home.whyEyebrow}
            title={t.home.whyTitle}
            description={t.home.whyDesc}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <FiShield />, title: t.home.whyInsuredTitle, desc: t.home.whyInsuredDesc },
              { icon: <FiUserCheck />, title: t.home.whyDriversTitle, desc: t.home.whyDriversDesc },
              { icon: <FiMapPin />, title: t.home.whyCoverageTitle, desc: t.home.whyCoverageDesc },
              { icon: <FiClock />, title: t.home.whyOpsTitle, desc: t.home.whyOpsDesc },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/10 text-lg text-navy">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-navy">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The institutional pitch, sitting between the retail "why us" grid and
          the client wall that proves it. */}
      <CorporateAccountBand />

      {/* Client wall */}
      {clients.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow={t.home.clientsEyebrow}
            title={t.home.clientsTitle}
            description={t.home.clientsDesc}
          />
          <div className="mt-10">
            <ClientWall clients={clients} />
          </div>
          <div className="mt-8 text-center">
            <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5">
              {t.home.seeAllClients} <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Services module — the same services the text-card teaser used to
          list, given the icon treatment from the design. */}
      {services.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead
              center={false}
              eyebrow={t.home.servicesEyebrow}
              title={t.home.servicesTitle}
            />
            <div className="mt-8">
              <ServiceHighlights services={services} />
            </div>
            <div className="mt-8">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5"
              >
                {t.serviceDetail.allServices} <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow={t.home.testimonialsEyebrow}
            title={t.home.testimonialsTitle}
            description={t.home.testimonialsDesc}
          />
          <div className="mt-10">
            <TestimonialsGrid testimonials={featuredTestimonials} />
          </div>
        </section>
      )}

      {/* Coverage snapshot */}
      {offices.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead
              eyebrow={t.home.networkEyebrow}
              title={t.home.networkTitle}
              description={fmt(t.home.networkDesc, { count: offices.length })}
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {offices.map((o) => (
                <span
                  key={o.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy shadow-card"
                >
                  <FiMapPin className="h-3.5 w-3.5 text-accent" /> {o.city}
                  {o.isHeadOffice && <span className="text-[11px] text-muted">{t.home.hq}</span>}
                </span>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/network" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5">
                {t.home.viewNetwork} <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
