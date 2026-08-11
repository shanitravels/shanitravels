import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { FiShield, FiMap, FiTruck, FiUserCheck, FiActivity, FiLifeBuoy, FiCheckCircle } from "react-icons/fi";
import { getSettings } from "@/lib/data/settings";
import { getActiveClients, getActiveTestimonials } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { SectionHead, ClientWall, TestimonialsGrid } from "@/components/site/sections";
import { getActiveOffices } from "@/lib/data/content";
import { getActiveIndustries } from "@/lib/data/industries";
import { IndustryIcon } from "@/components/site/IndustryIcon";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.corporate.metaTitle,
    description: t.corporate.metaDescription,
    alternates: { canonical: "/corporate" },
  };
}

const CAPABILITIES = [
  { icon: <FiTruck />, titleKey: "capFleetsTitle", descKey: "capFleetsDesc" },
  { icon: <FiMap />, titleKey: "capCoverageTitle", descKey: "capCoverageDesc" },
  { icon: <FiShield />, titleKey: "capHseTitle", descKey: "capHseDesc" },
  { icon: <FiActivity />, titleKey: "capInsuredTitle", descKey: "capInsuredDesc" },
  { icon: <FiUserCheck />, titleKey: "capDriversTitle", descKey: "capDriversDesc" },
  { icon: <FiLifeBuoy />, titleKey: "capBackupTitle", descKey: "capBackupDesc" },
] as const;

export default async function CorporatePage() {
  const { t } = await getI18n();
  const [settings, clients, testimonials, offices, industries] = await Promise.all([
    getSettings(),
    getActiveClients(),
    getActiveTestimonials(),
    getActiveOffices(),
    getActiveIndustries(),
  ]);
  const featuredTestimonials = testimonials.filter((t) => t.featured);
  const cities = offices.map((o) => o.city);

  return (
    <>
      <PageIntro
        eyebrow={t.corporate.eyebrow}
        title={t.corporate.title}
        description={t.corporate.description}
      >
        <div className="flex flex-wrap gap-4 text-sm text-white/80">
          {[
            t.corporate.pillDonor,
            t.corporate.pillSince,
            t.corporate.pillInsured,
            t.corporate.pillNetwork,
          ].map((pill) => (
            <span key={pill} className="inline-flex items-center gap-1.5">
              <FiCheckCircle className="h-4 w-4 text-accent-light" /> {pill}
            </span>
          ))}
        </div>
      </PageIntro>
      <Breadcrumbs items={[{ label: t.nav.corporate }]} />

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHead
          eyebrow={t.corporate.capabilitiesEyebrow}
          title={t.corporate.capabilitiesTitle}
          description={t.corporate.capabilitiesDesc}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.titleKey} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/10 text-lg text-navy">
                {c.icon}
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold text-navy">
                {t.corporate[c.titleKey]}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{t.corporate[c.descKey]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industries + safety cross-links */}
      {industries.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <SectionHead
              eyebrow={t.corporate.sectorEyebrow}
              title={t.corporate.sectorTitle}
              description={t.corporate.sectorDesc}
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {industries.map((ind) => (
                <Link
                  key={ind.id}
                  href={`/industries/${ind.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy shadow-card transition hover:border-navy/40"
                >
                  <IndustryIcon name={ind.icon} className="h-3.5 w-3.5 text-accent" /> {ind.name}
                </Link>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              {t.corporate.procurementPrefix}{" "}
              <Link href="/safety" className="font-semibold text-navy underline hover:text-accent">
                {t.corporate.procurementLink}
              </Link>{" "}
              {t.corporate.procurementSuffix}
            </p>
          </div>
        </section>
      )}

      {/* Credentials */}
      {settings.credentials.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead
              eyebrow={t.corporate.credentialsEyebrow}
              title={t.corporate.credentialsTitle}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {settings.credentials.map((c) => (
                <div key={c.label} className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
                  {c.image && (
                    <div className="relative mx-auto mb-3 h-24 w-full overflow-hidden rounded-lg bg-band">
                      <Image src={c.image.url} alt={c.image.alt || c.label} fill className="object-contain" sizes="200px" />
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">{c.label}</p>
                  <p className="mt-1 text-sm font-medium text-navy">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Client wall grouped */}
      {clients.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow={t.corporate.clientsEyebrow}
            title={t.corporate.clientsTitle}
            description={t.corporate.clientsDesc}
          />
          <div className="mt-10">
            <ClientWall clients={clients} grouped />
          </div>
        </section>
      )}

      {/* Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead
              eyebrow={t.corporate.referencesEyebrow}
              title={t.corporate.referencesTitle}
            />
            <div className="mt-10">
              <TestimonialsGrid testimonials={featuredTestimonials} />
            </div>
          </div>
        </section>
      )}

      {/* Proposal form */}
      <section id="proposal" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHead
          eyebrow={t.corporate.proposalEyebrow}
          title={t.corporate.proposalTitle}
          description={t.corporate.proposalDesc}
        />
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
          <Suspense fallback={null}>
            <EnquiryForm cities={cities} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
