import type { Metadata } from "next";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { RatesTable } from "@/components/site/RatesTable";
import { FareEstimator } from "@/components/site/FareEstimator";
import { renderMarkdown } from "@/lib/markdown";
import { getI18n } from "@/lib/i18n/server";

// Locale-dependent, so this is a function rather than a static object.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.rates.metaTitle,
    description: t.rates.metaDescription,
    alternates: { canonical: "/rates" },
  };
}

export default async function RatesPage() {
  const { t } = await getI18n();
  const [vehicles, settings, discounts] = await Promise.all([
    getActiveVehicles(),
    getSettings(),
    getActiveDiscounts(),
  ]);
  const termsHtml = settings.commercialTerms ? renderMarkdown(settings.commercialTerms) : "";

  return (
    <>
      <PageIntro
        eyebrow={t.rates.eyebrow}
        title={t.rates.title}
        description={t.rates.description}
      />
      <Breadcrumbs items={[{ label: t.nav.rates }]} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RatesTable vehicles={vehicles} discounts={discounts} />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <FareEstimator vehicles={vehicles} discounts={discounts} />
            </div>
          </div>
        </div>

        {termsHtml && (
          <div className="mt-12 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <div
              className="md-content max-w-none text-sm leading-relaxed text-ink/80"
              dangerouslySetInnerHTML={{ __html: termsHtml }}
            />
          </div>
        )}
      </div>
    </>
  );
}
