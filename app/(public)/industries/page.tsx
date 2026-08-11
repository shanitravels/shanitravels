import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { getActiveIndustries } from "@/lib/data/industries";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { IndustryIcon } from "@/components/site/IndustryIcon";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.industries.metaTitle,
    description: t.industries.metaDescription,
    alternates: { canonical: "/industries" },
  };
}

export default async function IndustriesPage() {
  const { t } = await getI18n();
  const industries = await getActiveIndustries();

  return (
    <>
      <PageIntro
        eyebrow={t.industries.eyebrow}
        title={t.industries.title}
        description={t.industries.description}
      />
      <Breadcrumbs items={[{ label: t.nav.industries }]} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {industries.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.industries.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <Link
                key={ind.id}
                href={`/industries/${ind.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/10 text-lg text-navy">
                  <IndustryIcon name={ind.icon} />
                </span>
                <h2 className="mt-4 font-heading text-lg font-semibold text-navy">{ind.name}</h2>
                <p className="mt-1.5 flex-1 text-sm text-muted">{ind.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent transition group-hover:gap-2">
                  How we serve {ind.name.toLowerCase()} <FiArrowRight className="h-4 w-4 shrink-0" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
