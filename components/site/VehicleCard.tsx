"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiUsers, FiSettings, FiArrowRight, FiShield, FiKey, FiBox } from "react-icons/fi";
import { formatPKR } from "@/lib/format";
import { discountedPrice } from "@/lib/pricing";
import { type Discount, type Vehicle, isSelfDriveEligible } from "@/lib/types";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";

/** Price-forward vehicle card used on the homepage strip and fleet catalog. */
export function VehicleCard({
  vehicle,
  priority = false,
  showSelfDrive = false,
  discount = null,
}: {
  vehicle: Vehicle;
  priority?: boolean;
  /** When the self-drive line is enabled, show its badge on eligible vehicles. */
  showSelfDrive?: boolean;
  /** Best live discount for this vehicle, resolved by the caller. */
  discount?: Discount | null;
}) {
  const { t } = useI18n();
  const cover = vehicle.images[0];
  const perDay = vehicle.rates.perDay ?? null;
  // Only meaningful on a published rate — "On request" has nothing to reduce.
  const discounted = perDay != null ? discountedPrice(perDay, discount) : null;
  const isDiscounted = discounted != null && discounted < perDay!;
  const isLogistics = vehicle.class === "logistics";

  /**
   * The spec line, as data so the separators can be placed between items rather
   * than after them. A van with no transmission recorded, or a truck carrying
   * one interior feature, has to read as a clean single entry — not as an entry
   * followed by a dangling dot.
   */
  const specs = isLogistics
    ? vehicle.interiorFeatures.slice(0, 2).map((f) => ({ icon: FiBox, label: f }))
    : [
        { icon: FiUsers, label: fmt(t.common.seatsCount, { n: vehicle.seats }) },
        ...(vehicle.transmission
          ? [{ icon: FiSettings, label: vehicle.transmission }]
          : []),
      ];

  return (
    <Link
      href={`/fleet/${vehicle.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-band">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || vehicle.name}
            fill
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">{t.gallery.noImageShort}</div>
        )}
        <span className="absolute left-4 top-4 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm backdrop-blur">
          {t.vehicleClass[vehicle.class]}
        </span>
        <span className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {isDiscounted && discount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm backdrop-blur">
              {discount.label}
            </span>
          )}
          {vehicle.armorLevel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-navy-deep/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-300 backdrop-blur">
              <FiShield className="h-3 w-3" /> {vehicle.armorLevel} {t.common.armored}
            </span>
          )}
          {showSelfDrive && isSelfDriveEligible(vehicle) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <FiKey className="h-3 w-3" /> {t.common.selfDrive}
            </span>
          )}
          {!vehicle.armorLevel && vehicle.rollCage && (
            <span className="rounded-full bg-navy/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {t.common.offRoad}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* The margin sets the least space there may be above the rule; `mt-auto`
            on the block below spends anything left over, so a one-line name and
            a two-line one still put their prices on the same baseline. */}
        <div className="mb-5">
          <h3 className="font-heading text-lg font-semibold leading-snug text-navy">
            {vehicle.name}
          </h3>

          {specs.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {specs.map(({ icon: Icon, label }, i) => (
                <Fragment key={`${label}-${i}`}>
                  {i > 0 && <span aria-hidden>·</span>}
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Pushed to the bottom edge so the rule and the price sit on one line
            across a row, however many lines the name above them ran to. */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">
              {perDay != null ? t.common.from : t.common.rates}
            </p>
            <p className="mt-0.5 font-heading text-xl font-bold text-navy tabular-nums">
              {perDay != null ? (
                <>
                  {isDiscounted && (
                    <span className="mr-1.5 text-sm font-medium text-muted line-through">
                      {formatPKR(perDay)}
                    </span>
                  )}
                  {formatPKR(isDiscounted ? discounted! : perDay)}
                  <span className="ml-1 text-xs font-normal text-muted">{t.common.perDay}</span>
                </>
              ) : (
                <span className="text-base">{t.common.onRequest}</span>
              )}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-sm font-semibold text-accent">
            {t.common.details}
            <FiArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
          </span>
        </div>
      </div>
    </Link>
  );
}
