import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiCheck, FiUsers, FiSettings, FiZap, FiCompass, FiArrowRight, FiBriefcase, FiShield, FiKey } from "react-icons/fi";
import { getActiveVehicles, getVehicleBySlug, getActiveVehicleSlugs } from "@/lib/data/vehicles";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { VehicleGallery } from "@/components/site/VehicleGallery";
import { FareEstimator } from "@/components/site/FareEstimator";
import { VehicleCard } from "@/components/site/VehicleCard";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { bestDiscountFor, discountedRates, discountSummary } from "@/lib/pricing";
import { jsonLdScript, vehicleJsonLd } from "@/lib/seo";
import { formatPKR, formatRateCell } from "@/lib/format";
import { type Vehicle, isSelfDriveEligible } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

export async function generateStaticParams() {
  const slugs = await getActiveVehicleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  const { t } = await getI18n();
  if (!vehicle) return { title: t.vehicleDetail.notFound };
  const cover = vehicle.images[0]?.url;
  const priceLine =
    vehicle.rates.perDay != null
      ? fmt(t.vehicleDetail.metaPriceFrom, { price: formatPKR(vehicle.rates.perDay) })
      : t.vehicleDetail.metaRatesOnRequest;
  const suffix = vehicle.armorLevel
    ? fmt(t.vehicleDetail.metaArmored, { level: vehicle.armorLevel })
    : t.vehicleDetail.metaWithDriver;
  return {
    title: `${vehicle.name} — ${suffix}`,
    description: fmt(t.vehicleDetail.metaDescription, {
      name: vehicle.name,
      seats: vehicle.seats,
      price: priceLine,
    }),
    alternates: { canonical: `/fleet/${vehicle.slug}` },
    openGraph: cover ? { images: [{ url: cover }] } : undefined,
  };
}

/** Rate rows carry a dictionary key; labels resolve per locale at render. */
const RATE_ROWS: {
  key: keyof Vehicle["rates"];
  labelKey:
    | "ratePerHour"
    | "ratePerDay"
    | "ratePerWeek"
    | "ratePerMonth"
    | "rateAirport"
    | "rateFuelPerKm";
}[] = [
  { key: "perHour", labelKey: "ratePerHour" },
  { key: "perDay", labelKey: "ratePerDay" },
  { key: "perWeek", labelKey: "ratePerWeek" },
  { key: "perMonth", labelKey: "ratePerMonth" },
  { key: "airportTransfer", labelKey: "rateAirport" },
  { key: "fuelPerKm", labelKey: "rateFuelPerKm" },
];

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getI18n();
  const [vehicle, allVehicles, settings, discounts] = await Promise.all([
    getVehicleBySlug(slug),
    getActiveVehicles(),
    getSettings(),
      getActiveDiscounts(),
  ]);
  if (!vehicle) notFound();
  const showSelfDrive = settings.selfDriveEnabled && isSelfDriveEligible(vehicle);
  const vehicleDiscount = bestDiscountFor(vehicle, discounts);
  const shownRates = discountedRates(vehicle.rates, vehicleDiscount);

  const related = allVehicles
    .filter((v) => v.class === vehicle.class && v.id !== vehicle.id)
    .slice(0, 3);
  const relatedFallback =
    related.length > 0 ? related : allVehicles.filter((v) => v.id !== vehicle.id).slice(0, 3);

  const specs = [
    { icon: <FiUsers />, label: t.common.seats, value: `${vehicle.seats}` },
    { icon: <FiSettings />, label: t.common.transmission, value: vehicle.transmission || "—" },
    { icon: <FiZap />, label: t.common.engine, value: vehicle.engine || "—" },
    { icon: <FiCompass />, label: t.common.drive, value: vehicle.driveType || "—" },
  ];

  return (
    <>
      {jsonLdScript(vehicleJsonLd(vehicle))}

      <Breadcrumbs items={[{ label: t.nav.fleet, href: "/fleet" }, { label: vehicle.name }]} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: gallery + details */}
          <div className="lg:col-span-3">
            <VehicleGallery images={vehicle.images} name={vehicle.name} />

            <div className="mt-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                {t.vehicleClass[vehicle.class]}
                {vehicle.modelYears ? ` · ${vehicle.modelYears}` : ""}
              </span>
              <h1 className="mt-1 font-heading text-2xl font-bold text-navy sm:text-3xl">
                {vehicle.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {vehicle.armorLevel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-navy-deep px-3 py-1 text-xs font-bold tracking-wide text-amber-300">
                    <FiShield className="h-3.5 w-3.5" />{" "}
                    {fmt(t.vehicleDetail.armoredBadge, { level: vehicle.armorLevel })}
                  </span>
                )}
                {showSelfDrive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    <FiKey className="h-3.5 w-3.5" /> {t.vehicleDetail.selfDriveAvailable}
                  </span>
                )}
              </div>

              {/* Spec grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-xl border border-line bg-white p-3 text-center shadow-card">
                    <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      {s.icon}
                    </span>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted">{s.label}</p>
                    <p className="text-sm font-semibold text-navy">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              {vehicle.interiorFeatures.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-heading text-lg font-semibold text-navy">
                    {t.vehicleDetail.features}
                  </h2>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {vehicle.interiorFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink/80">
                        <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rate table centrepiece */}
              <div className="mt-8">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  {showSelfDrive ? t.vehicleDetail.chauffeurRates : t.vehicleDetail.rates}
                </h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-line">
                      {RATE_ROWS.map((row) => {
                        const val = vehicle.rates[row.key];
                        return (
                          <tr key={row.key}>
                            <td className="px-4 py-3 text-ink/70">{t.vehicleDetail[row.labelKey]}</td>
                            <td className="px-4 py-3 text-right font-semibold text-navy tabular-nums">
                              {val != null ? `${vehicle.currency} ${formatRateCell(val)}` : t.common.onRequest}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {fmt(t.vehicleDetail.ratesNote, { currency: vehicle.currency })}
                </p>
              </div>

              {/* Self-drive rates */}
              {showSelfDrive && (
                <div className="mt-8">
                  <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-navy">
                    <FiKey className="h-4 w-4 text-emerald-600" /> {t.vehicleDetail.selfDriveRates}
                  </h2>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-card">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-line">
                        {(
                          [
                            [t.vehicleDetail.ratePerDay, vehicle.selfDrive?.perDay],
                            [t.vehicleDetail.ratePerWeek, vehicle.selfDrive?.perWeek],
                            [t.vehicleDetail.ratePerMonth, vehicle.selfDrive?.perMonth],
                            [t.vehicleDetail.securityDeposit, vehicle.selfDrive?.securityDeposit],
                          ] as const
                        ).map(([label, val]) => (
                          <tr key={label}>
                            <td className="px-4 py-3 text-ink/70">{label}</td>
                            <td className="px-4 py-3 text-right font-semibold text-navy tabular-nums">
                              {val != null
                                ? `${vehicle.currency} ${formatRateCell(val)}`
                                : label === t.vehicleDetail.securityDeposit
                                  ? t.vehicleDetail.confirmedAtBooking
                                  : t.common.onRequest}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {t.vehicleDetail.selfDriveNote}
                    <Link href="/self-drive" className="font-medium text-emerald-700 underline">
                      {t.vehicleDetail.selfDriveNoteLink}
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky booking + estimator */}
          <aside className="lg:col-span-2">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {vehicle.rates.perDay != null
                    ? t.vehicleDetail.startingFrom
                    : t.vehicleDetail.pricing}
                </p>
                <p className="font-heading text-3xl font-bold text-navy tabular-nums">
                  {vehicle.rates.perDay != null ? (
                    <>
                      {vehicleDiscount && (
                        <span className="mr-2 text-xl font-medium text-muted line-through">
                          {formatPKR(vehicle.rates.perDay)}
                        </span>
                      )}
                      {formatPKR(shownRates.perDay ?? vehicle.rates.perDay)}
                      <span className="text-sm font-normal text-muted">{t.common.perDay}</span>
                    </>
                  ) : (
                    <span className="text-2xl">{t.common.onRequest}</span>
                  )}
                </p>
                {vehicleDiscount && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                    {vehicleDiscount.label} · {discountSummary(vehicleDiscount)}
                  </p>
                )}
                <Link
                  href={`/book?vehicle=${vehicle.slug}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
                >
                  {t.vehicleDetail.bookThis} <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/corporate"
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-3 text-sm font-semibold text-navy transition hover:bg-band"
                >
                  <FiBriefcase className="h-4 w-4" /> {t.vehicleDetail.requestProject}
                </Link>
              </div>

              <FareEstimator vehicles={[vehicle]} fixedVehicle={vehicle} discounts={discounts} />
            </div>
          </aside>
        </div>

        {/* Related */}
        {relatedFallback.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-xl font-bold text-navy">{t.vehicleDetail.alsoLike}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFallback.map((v) => (
                <VehicleCard key={v.id} vehicle={v} discount={bestDiscountFor(v, discounts)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
