import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { getActiveIndustries, getIndustryBySlug } from "@/lib/data/industries";
import { getActiveServices, getActiveClients, getActiveTestimonials } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { VehicleCard } from "@/components/site/VehicleCard";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { bestDiscountFor } from "@/lib/pricing";
import { IndustryIcon } from "@/components/site/IndustryIcon";
import { TestimonialsGrid, ClientWall } from "@/components/site/sections";
import { renderMarkdown } from "@/lib/markdown";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

export async function generateStaticParams() {
  const industries = await getActiveIndustries();
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  const { t } = await getI18n();
  if (!industry) return { title: t.industryDetail.notFound };
  return {
    title: industry.seo.title || industry.name,
    description: industry.seo.description || industry.summary,
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: industry.heroImage ? { images: [{ url: industry.heroImage.url }] } : undefined,
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getI18n();
  const [industry, services, vehicles, clients, testimonials, discounts, settings] =
    await Promise.all([
      getIndustryBySlug(slug),
      getActiveServices(),
      getActiveVehicles(),
      getActiveClients(),
      getActiveTestimonials(),
      getActiveDiscounts(),
      getSettings(),
    ]);
  if (!industry) notFound();

  const bodyHtml = industry.body ? renderMarkdown(industry.body) : "";
  const relatedServices = services.filter((s) => industry.relatedServiceSlugs.includes(s.slug));
  const relatedVehicles = industry.relatedVehicleClasses.length
    ? vehicles.filter((v) => industry.relatedVehicleClasses.includes(v.class)).slice(0, 3)
    : [];
  const sectorClients = industry.testimonialSector
    ? clients.filter((c) => c.sector === industry.testimonialSector).slice(0, 12)
    : [];
  const sectorTestimonials = industry.testimonialSector
    ? testimonials.filter((t) => t.sector === industry.testimonialSector).slice(0, 3)
    : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep">
        {industry.heroImage && (
          <div className="absolute inset-0">
            <Image
              src={industry.heroImage.url}
              alt={industry.heroImage.alt || industry.name}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/50" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl text-white backdrop-blur">
            <IndustryIcon name={industry.icon} />
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl">
            {fmt(t.industryDetail.heroTitle, { name: industry.name })}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{industry.summary}</p>
        </div>
      </section>
      <Breadcrumbs
        items={[{ label: t.nav.industries, href: "/industries" }, { label: industry.name }]}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {bodyHtml && (
          <div
            className="md-content md-justify text-ink/80"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}

        {relatedServices.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-navy">
              {t.industryDetail.relevantServices}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {relatedServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${s.slug}`}
                  className="group rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-navy/40"
                >
                  <p className="font-semibold text-navy">{s.title}</p>
                  <p className="mt-1 text-xs text-muted">{s.summary}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent transition group-hover:gap-2">
                    {t.common.learnMore} <FiArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {relatedVehicles.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <h2 className="font-heading text-xl font-bold text-navy">
            {fmt(t.industryDetail.fleetFor, { name: industry.name.toLowerCase() })}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} discount={bestDiscountFor(v, discounts)} />
            ))}
          </div>
        </div>
      )}

      {/* `showClientIdentities` gates the logos outright; the quotes stay but
          lose their attribution. See TestimonialsGrid's `identify` prop. */}
      {((settings.showClientIdentities && sectorClients.length > 0) ||
        sectorTestimonials.length > 0) && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            {settings.showClientIdentities && sectorClients.length > 0 && (
              <>
                <h2 className="text-center font-heading text-xl font-bold text-navy">
                  {t.industryDetail.trustedInSector}
                </h2>
                <div className="mt-8">
                  <ClientWall clients={sectorClients} />
                </div>
              </>
            )}
            {sectorTestimonials.length > 0 && (
              <div className="mt-10">
                <TestimonialsGrid
                  testimonials={sectorTestimonials}
                  identify={settings.showClientIdentities}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Proposal CTA pre-filled with the sector */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-navy">
          {fmt(t.industryDetail.planTitle, { name: industry.name.toLowerCase() })}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          {t.industryDetail.planBody}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/corporate?sector=${encodeURIComponent(industry.name)}#proposal`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            {t.industryDetail.requestProposal} <FiArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/safety"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3 text-sm font-semibold text-navy transition hover:bg-band"
          >
            {t.industryDetail.readSafety}
          </Link>
        </div>
        <div className="mt-8">
          <Link href="/industries" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-accent">
            <FiArrowLeft className="h-4 w-4" /> {t.industryDetail.allIndustries}
          </Link>
        </div>
      </section>
    </>
  );
}
