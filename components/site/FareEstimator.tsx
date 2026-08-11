"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { estimateFare, formatPKR, rateForType } from "@/lib/format";
import { bestDiscountFor, discountedRates } from "@/lib/pricing";
import type { Discount } from "@/lib/types";
import { RATE_TYPES, type RateType, type Vehicle } from "@/lib/types";
import { useI18n } from "./LocaleProvider";

/**
 * Indicative fare estimator. On a vehicle page it's fixed to one vehicle;
 * on the rates page it lets the visitor pick any vehicle. Always shows the
 * "excludes GST · indicative only" disclaimer.
 */
export function FareEstimator({
  vehicles,
  fixedVehicle,
  discounts = [],
}: {
  vehicles: Vehicle[];
  fixedVehicle?: Vehicle;
  discounts?: Discount[];
}) {
  const [vehicleId, setVehicleId] = useState(fixedVehicle?.id ?? vehicles[0]?.id ?? "");
  const vehicle = fixedVehicle ?? vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];

  const availableTypes = useMemo(
    () => (vehicle ? RATE_TYPES.filter((t) => rateForType(vehicle.rates, t) !== null) : []),
    [vehicle]
  );
  const [rateType, setRateType] = useState<RateType>(availableTypes[0] ?? "day");
  const [units, setUnits] = useState(1);
  const [km, setKm] = useState(0);
  const { t } = useI18n();

  const effectiveType = availableTypes.includes(rateType) ? rateType : availableTypes[0] ?? "day";

  // Estimate against discounted rates so the number matches the fleet cards.
  const discount = vehicle ? bestDiscountFor(vehicle, discounts) : null;
  const shownRates = vehicle ? discountedRates(vehicle.rates, discount) : {};
  const fare = vehicle
    ? estimateFare(shownRates, effectiveType, {
        units: effectiveType === "airport" ? 1 : units,
        km: shownRates.fuelPerKm ? km : 0,
      })
    : null;

  if (!vehicle) return null;

  const unitLabel =
    effectiveType === "hour"
      ? t.estimator.hours
      : effectiveType === "week"
        ? t.estimator.weeks
        : t.estimator.days;

  // RATE_TYPE_LABELS is a code constant; the visible label comes from the
  // dictionary so it follows the locale.
  const rateTypeLabel: Record<RateType, string> = {
    hour: t.estimator.typeHour,
    day: t.estimator.typeDay,
    week: t.estimator.typeWeek,
    airport: t.estimator.typeAirport,
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h3 className="font-heading text-base font-semibold text-navy">{t.estimator.title}</h3>
      <p className="mt-1 text-xs text-muted">{t.estimator.subtitle}</p>

      <div className="mt-4 space-y-3">
        {!fixedVehicle && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/70">{t.estimator.vehicle}</span>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink/70">{t.estimator.rateType}</span>
          <select
            value={effectiveType}
            onChange={(e) => setRateType(e.target.value as RateType)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            {availableTypes.map((rt) => (
              <option key={rt} value={rt}>
                {rateTypeLabel[rt]}
              </option>
            ))}
          </select>
        </label>

        {effectiveType !== "airport" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/70">{unitLabel}</span>
            <input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums"
            />
          </label>
        )}

        {vehicle.rates.fuelPerKm != null && effectiveType !== "airport" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/70">
              {t.estimator.distance}
            </span>
            <input
              type="number"
              min={0}
              value={km || ""}
              onChange={(e) => setKm(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums"
            />
          </label>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-band p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted">{t.estimator.indicativeTotal}</p>
        <p className="mt-1 font-heading text-2xl font-bold text-navy tabular-nums">
          {fare != null ? formatPKR(fare) : t.common.onRequest}
        </p>
        <p className="mt-1 text-[11px] text-muted">{t.estimator.disclaimer}</p>
      </div>

      <Link
        href={`/book?vehicle=${vehicle.slug}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light"
      >
        {t.estimator.bookThis} <FiArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
