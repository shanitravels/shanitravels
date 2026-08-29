import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronRight, FiInfo, FiArrowLeft } from "react-icons/fi";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { getSettings } from "@/lib/data/settings";
import { RatesTable } from "@/components/site/RatesTable";
import { FareEstimator } from "@/components/site/FareEstimator";
import { CLASS_IMAGE } from "@/lib/vehicle-art";
import { renderMarkdown } from "@/lib/markdown";
import { VEHICLE_CLASSES, rateGroupOf, type VehicleClass } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

/** The route param is the class key itself — the same value `/fleet?class=` uses. */
function parseClass(value: string): VehicleClass | null {
  return (VEHICLE_CLASSES as readonly string[]).includes(value) ? (value as VehicleClass) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ class: string }>;
}): Promise<Metadata> {
  const { class: raw } = await params;
  const { t } = await getI18n();
  const cls = parseClass(raw);
  if (!cls) return { title: t.rates.metaTitle };

  const label = t.vehicleClass[cls];
  return {
    title: `${label} — ${t.rates.title}`,
    description: `${t.vehicleClassBlurb[cls]}. ${t.rates.metaDescription}`,
    alternates: { canonical: `/rates/${cls}` },
  };
}

/** Pre-render one route per class; the set is a code constant, not data. */
export function generateStaticParams() {
  return VEHICLE_CLASSES.map((cls) => ({ class: cls }));
}

/**
 * Rates for one vehicle class.
 *
 * The table and the estimator are the same components the old single-page rate
 * card used, handed only this class's vehicles. Scoping them here is the whole
 * reason the index could become a chooser: each table is now short enough to
 * read, and the estimator's vehicle list is a handful rather than the fleet.
 */
export default async function RateCategoryPage({
  params,
}: {
  params: Promise<{ class: string }>;
}) {
  const { class: raw } = await params;
  const cls = parseClass(raw);
  if (!cls) notFound();

  const { t } = await getI18n();
  const [allVehicles, settings, discounts] = await Promise.all([
    getActiveVehicles(),
    getSettings(),
    getActiveDiscounts(),
  ]);

  const vehicles = allVehicles.filter((v) => v.class === cls);
  // An empty class has no rates to show and no card pointing here — treat it
  // as absent rather than rendering a page of empty states.
  if (vehicles.length === 0) notFound();

  const termsHtml = settings.commercialTerms ? renderMarkdown(settings.commercialTerms) : "";
  const group = rateGroupOf(cls);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="relative h-20 w-28 shrink-0">
          <Image
            src={CLASS_IMAGE[cls]}
            alt=""
            fill
            sizes="112px"
            unoptimized
            className="object-contain"
          />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t.rates.group[group]}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {t.vehicleClass[cls]}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {t.vehicleClassBlurb[cls]}
          </p>

          <nav aria-label={t.common.breadcrumb} className="mt-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
              <li>
                <Link href="/" className="transition hover:text-navy">
                  {t.nav.home}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <FiChevronRight className="h-3 w-3 text-muted/60" />
                <Link href="/rates" className="transition hover:text-navy">
                  {t.nav.rates}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <FiChevronRight className="h-3 w-3 text-muted/60" />
                <span className="font-medium text-accent">{t.vehicleClass[cls]}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RatesTable vehicles={vehicles} discounts={discounts} />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <FareEstimator vehicles={vehicles} discounts={discounts} />
          </div>
        </div>
      </div>

      <p className="mt-10 flex items-start gap-3 rounded-2xl bg-band px-5 py-4 text-sm text-muted">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        {t.rates.priceNote}
      </p>

      {termsHtml && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
          <div
            className="md-content md-justify max-w-none text-sm leading-relaxed text-ink/80"
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        </div>
      )}

      <Link
        href="/rates"
        className="mt-8 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden />
        {t.rates.backToRates}
      </Link>
    </div>
  );
}
