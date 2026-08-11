import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/data/settings";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { FleetCatalog, type FleetFilters } from "@/components/site/FleetCatalog";
import { VEHICLE_CLASSES, type VehicleClass } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

type Search = {
  class?: string;
  seats?: string;
  sort?: string;
  selfdrive?: string;
  q?: string;
  make?: string;
};

/** Narrow an arbitrary query value to a known class, or null. */
function parseClass(value?: string): VehicleClass | null {
  return value && (VEHICLE_CLASSES as readonly string[]).includes(value)
    ? (value as VehicleClass)
    : null;
}

/** Deep links get their own title/description so each filtered view ranks on its own terms. */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { t } = await getI18n();
  const cls = parseClass((await searchParams).class);
  if (cls) {
    // The root layout appends "· Shani Travels", so don't repeat the brand here.
    return {
      title: fmt(t.fleet.metaClassTitle, { label: t.vehicleClass[cls] }),
      description: fmt(t.fleet.metaClassDescription, { blurb: t.vehicleClassBlurb[cls] }),
      alternates: { canonical: `/fleet?class=${cls}` },
    };
  }
  return {
    title: t.fleet.metaTitle,
    description: t.fleet.metaDescription,
    alternates: { canonical: "/fleet" },
  };
}

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { t } = await getI18n();
  const [params, vehicles, settings, discounts] = await Promise.all([
    searchParams,
    getActiveVehicles(),
    getSettings(),
      getActiveDiscounts(),
  ]);

  const cls = parseClass(params.class);
  // Resolved on the server so the filtered grid is in the HTML, not applied after hydration.
  const initial: FleetFilters = {
    cls: cls ?? "all",
    seats: ["4", "7", "12", "22"].includes(params.seats ?? "") ? params.seats! : "any",
    sort:
      params.sort === "price-asc" || params.sort === "price-desc" || params.sort === "seats-desc"
        ? params.sort
        : "featured",
    selfDriveOnly: settings.selfDriveEnabled && params.selfdrive === "1",
    // Capped so a hand-edited URL cannot hand the client an unbounded string to
    // match every vehicle name against on each keystroke.
    q: (params.q ?? "").slice(0, 80),
    makes: (params.make ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, 20),
  };

  return (
    <>
      <PageIntro
        eyebrow={t.fleet.eyebrow}
        title={cls ? t.vehicleClass[cls] : t.fleet.title}
        description={
          cls
            ? fmt(t.fleet.classDescription, { blurb: t.vehicleClassBlurb[cls] })
            : t.fleet.description
        }
      />
      <Breadcrumbs
        items={
          cls
            ? [{ label: t.nav.fleet, href: "/fleet" }, { label: t.vehicleClass[cls] }]
            : [{ label: t.nav.fleet }]
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <FleetCatalog
          discounts={discounts}
          vehicles={vehicles}
          selfDriveEnabled={settings.selfDriveEnabled}
          initial={initial}
        />

        <div className="mt-12 rounded-2xl border border-line bg-band p-6 text-center sm:p-8">
          <h2 className="font-heading text-xl font-bold text-navy">{t.fleet.orgCtaTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.fleet.orgCtaBody}</p>
          <Link
            href="/corporate"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            {t.fleet.orgCtaLink}
          </Link>
        </div>
      </div>
    </>
  );
}
