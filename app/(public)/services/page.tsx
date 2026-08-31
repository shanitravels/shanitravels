import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiShield } from "react-icons/fi";
import { getActiveServices } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { TbListCheck } from "react-icons/tb";
import { SERVICE_GROUPS, type Service } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.services.metaTitle,
    description: t.services.metaDescription,
    alternates: { canonical: "/services" },
  };
}

/** Group -> dictionary keys. SERVICE_GROUP_LABELS stays for the admin side. */
const GROUP_KEYS = {
  corporate: { label: "groupCorporate", desc: "groupCorporateDesc" },
  individual: { label: "groupIndividual", desc: "groupIndividualDesc" },
  specialized: { label: "groupSpecialized", desc: "groupSpecializedDesc" },
} as const;

export default async function ServicesPage() {
  const { t } = await getI18n();
  const services = await getActiveServices();

  return (
    <>
      <PageIntro
        icon={TbListCheck}
        eyebrow={t.services.eyebrow}
        title={t.services.title}
        description={t.services.description}
      />
      <Breadcrumbs items={[{ label: t.nav.services }]} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {services.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.services.empty}</p>
        ) : (
          <div className="space-y-16">
            {SERVICE_GROUPS.map((group) => {
              const inGroup = services.filter((s) => s.group === group);
              if (inGroup.length === 0) return null;
              return (
                <section key={group} aria-labelledby={`group-${group}`}>
                  {/* Accent rule above the heading — the same mark the hero and
                      the section bands use, so a group here reads as part of the
                      site rather than as a plain list header. */}
                  <div className="mb-7 max-w-2xl">
                    <span className="section-heading-line" />
                    <h2
                      id={`group-${group}`}
                      className="mt-4 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl"
                    >
                      {t.services[GROUP_KEYS[group].label]}
                    </h2>
                    <p className="mt-2 leading-relaxed text-muted">
                      {t.services[GROUP_KEYS[group].desc]}
                    </p>
                  </div>
                  {/* Left-aligned grid, four across at the widest step. A short
                      last row simply runs out — that is ordinary grid behaviour
                      and the reason the columns go to four is to keep the tiles
                      small, so the gap it leaves is a tile's width rather than a
                      third of the page. */}
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {inGroup.map((s) => (
                      <li key={s.id}>
                        <ServiceCard service={s} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-bleed navy, like every other closing band on the site. The pale
          panel this replaced sat inside the page gutter and read as one more
          card rather than as the end of the page. */}
      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-accent-light">
            <FiShield className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-heading text-2xl font-bold text-white sm:text-3xl">
            {t.services.safetyTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/70">
            {t.services.safetyBody}
          </p>
          <Link
            href="/safety"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t.services.safetyCta} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

/**
 * One service in the grid.
 *
 * The photograph sits across the top rather than in a 9rem strip down the side.
 * These are landscape vehicle shots — cropped to a sliver a third the height of
 * the card they read as texture, and the old layout dropped them entirely below
 * `sm`, which left phones with a page of plain text blocks. `h-full` because a
 * grid row is only as tidy as its shortest card.
 */
async function ServiceCard({ service }: { service: Service }) {
  const { t } = await getI18n();

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-band">
        {service.image ? (
          <Image
            src={service.image.url}
            alt={service.image.alt || service.title}
            fill
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            // Four across at xl, so the tile never needs more than a quarter of
            // the 80rem container — asking for 33vw shipped a third more pixels
            // than the tile can show.
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          // A service with no photograph yet gets the brand panel rather than an
          // empty frame — the list is admin-managed and images are optional.
          <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy-deep" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-balance font-heading text-[15px] font-semibold leading-snug text-navy">
          {service.title}
        </h3>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{service.summary}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
          {t.common.learnMore}
          <FiArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </span>
      </div>
    </Link>
  );
}
