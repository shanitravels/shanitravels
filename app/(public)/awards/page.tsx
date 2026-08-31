import type { Metadata } from "next";
import { FiAward } from "react-icons/fi";
import { getActiveAwards } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { AwardsWall } from "@/components/site/AwardsWall";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.awards.metaTitle,
    description: t.awards.metaDescription,
    alternates: { canonical: "/awards" },
  };
}

export default async function AwardsPage() {
  const { t } = await getI18n();
  const [awards, settings] = await Promise.all([getActiveAwards(), getSettings()]);

  return (
    <>
      {/* Hero — two-tone title over the deep navy band, matching the gallery. */}
      <section className="relative overflow-hidden bg-navy-deep">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <FiAward className="absolute -right-8 top-2 h-52 w-52 text-white/[0.04] sm:right-16 sm:h-64 sm:w-64" />
          <span className="absolute right-12 top-16 hidden h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg lg:flex">
            <FiAward className="h-7 w-7" />
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="max-w-3xl font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.awards.titleLead}{" "}
            <span className="text-accent-light">{t.awards.titleAccent}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            {t.awards.description}
          </p>
        </div>
      </section>

      <Breadcrumbs items={[{ label: t.awards.breadcrumb }]} />

      <section className="bg-band/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          {/* The counts live inside the wall, above the cards they describe —
              see the note there on why they are not a full-width band. */}
          <AwardsWall awards={awards} yearsOperating={settings.stats.yearsOperating} />
        </div>
      </section>
    </>
  );
}
