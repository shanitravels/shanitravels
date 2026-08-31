import type { Metadata } from "next";
import { FiInfo } from "react-icons/fi";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { TbReceipt } from "react-icons/tb";
import { RateCategories, type RateCategory } from "@/components/site/RateCategories";
import { CLASS_IMAGE } from "@/lib/vehicle-art";
import { renderMarkdown } from "@/lib/markdown";
import {
  RATE_GROUPS,
  RATE_GROUP_CLASSES,
  isSelfDriveEligible,
  type VehicleClass,
} from "@/lib/types";
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

/**
 * The rate card, as a category chooser rather than one long table.
 *
 * The full per-vehicle table still exists — it moved to /rates/[class], where
 * it is scoped to the category the visitor actually picked. A single table of
 * every vehicle in the fleet is accurate and almost unreadable; this asks the
 * one question ("what are you moving — people or things?") that halves it.
 *
 * The header is the standard PageIntro band, as on every other interior page,
 * with the group toggle centred over the cards it filters rather than tucked
 * into the header row.
 */
export default async function RatesPage() {
  const { t } = await getI18n();
  const [vehicles, settings] = await Promise.all([getActiveVehicles(), getSettings()]);
  const termsHtml = settings.commercialTerms ? renderMarkdown(settings.commercialTerms) : "";

  // Every figure on a card is counted from live vehicles, so a card can never
  // advertise a price or a seat count the fleet does not actually offer.
  const categories: RateCategory[] = RATE_GROUPS.flatMap((group) =>
    (RATE_GROUP_CLASSES[group] as readonly VehicleClass[]).flatMap((cls) => {
      const inClass = vehicles.filter((v) => v.class === cls);
      if (inClass.length === 0) return []; // no vehicles → no card to click
      const priced = inClass.map((v) => v.rates.perDay).filter((n): n is number => n != null);
      const seats = inClass.map((v) => v.seats);
      return [
        {
          cls,
          group,
          image: CLASS_IMAGE[cls],
          count: inClass.length,
          fromPerDay: priced.length ? Math.min(...priced) : null,
          seatsFrom: Math.min(...seats),
          seatsTo: Math.max(...seats),
          selfDrive: inClass.some(isSelfDriveEligible),
        },
      ];
    })
  );

  return (
    <>
      <PageIntro
        icon={TbReceipt}
        eyebrow={t.rates.eyebrow}
        title={t.rates.packagesTitle}
        description={t.rates.packagesDescription}
      />
      <Breadcrumbs items={[{ label: t.nav.rates }]} />

      {/* Less headroom than the usual py-10/py-14: the control is the first
          thing on the page and a deep gap under the breadcrumb left it
          floating away from the cards it belongs to. */}
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:pb-14">
        <RateCategories categories={categories} />

        {/* Footnote bar */}
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
      </div>
    </>
  );
}
