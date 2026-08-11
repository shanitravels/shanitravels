import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { getActiveServices, getServiceBySlug } from "@/lib/data/content";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getActiveIndustries } from "@/lib/data/industries";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { VehicleCard } from "@/components/site/VehicleCard";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { bestDiscountFor } from "@/lib/pricing";
import { renderMarkdown } from "@/lib/markdown";
import type { ServiceGroup } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

/** Mirrors GROUP_KEYS on the services index. SERVICE_GROUP_LABELS in lib/types
 *  stays for the admin side, which is English-only. */
const GROUP_LABEL_KEYS: Record<
  ServiceGroup,
  "groupCorporate" | "groupIndividual" | "groupSpecialized"
> = {
  corporate: "groupCorporate",
  individual: "groupIndividual",
  specialized: "groupSpecialized",
};

export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  const { t } = await getI18n();
  if (!service) return { title: t.serviceDetail.notFound };
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: service.image ? { images: [{ url: service.image.url }] } : undefined,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getI18n();
  const [service, vehicles, industries, discounts] = await Promise.all([
    getServiceBySlug(slug),
    getActiveVehicles(),
    getActiveIndustries(),
      getActiveDiscounts(),
  ]);
  if (!service) notFound();

  const bodyHtml = service.body ? renderMarkdown(service.body) : "";
  const relatedVehicles = service.relatedVehicleClasses.length
    ? vehicles.filter((v) => service.relatedVehicleClasses.includes(v.class)).slice(0, 3)
    : [];
  const relatedIndustries = industries.filter((i) => i.relatedServiceSlugs.includes(service.slug));

  return (
    <>
      <Breadcrumbs items={[{ label: t.nav.services, href: "/services" }, { label: service.title }]} />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          {t.services[GROUP_LABEL_KEYS[service.group]]}
        </span>
        <h1 className="mt-1 font-heading text-3xl font-bold text-navy sm:text-4xl">{service.title}</h1>
        <p className="mt-3 text-lg text-muted">{service.summary}</p>

        {service.image && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-band">
            <Image src={service.image.url} alt={service.image.alt || service.title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        {bodyHtml && (
          <div className="md-content mt-8 text-ink/80" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        )}

        {relatedIndustries.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-navy">{t.serviceDetail.industriesServed}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedIndustries.map((i) => (
                <Link
                  key={i.id}
                  href={`/industries/${i.slug}`}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-navy transition hover:border-navy/50 hover:bg-band"
                >
                  {i.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-line bg-band p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-navy">{t.serviceDetail.ctaTitle}</h2>
            <p className="text-sm text-muted">
              {service.group === "corporate"
                ? t.serviceDetail.ctaCorporate
                : t.serviceDetail.ctaIndividual}
            </p>
          </div>
          <div className="flex gap-3">
            {service.group === "corporate" ? (
              <Link href="/corporate#proposal" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light">
                {t.serviceDetail.requestProposal} <FiArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/book" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light">
                {t.common.bookNow} <FiArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-white/70">
              {t.serviceDetail.askUs}
            </Link>
          </div>
        </div>
      </article>

      {relatedVehicles.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-xl font-bold text-navy">
            {t.serviceDetail.vehiclesForService}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} discount={bestDiscountFor(v, discounts)} />
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-accent">
          <FiArrowLeft className="h-4 w-4" /> {t.serviceDetail.allServices}
        </Link>
      </div>
    </>
  );
}
