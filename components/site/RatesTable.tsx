"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { formatRateCell } from "@/lib/format";
import { bestDiscountFor, discountedRates } from "@/lib/pricing";
import type { Discount } from "@/lib/types";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass } from "@/lib/types";
import { useI18n } from "./LocaleProvider";

/** Column keys plus their dictionary key; labels resolve at render. */
const COLS: { key: keyof Vehicle["rates"]; labelKey: "colHour" | "colDay" | "colWeek" | "colMonth" | "colAirport" }[] = [
  { key: "perHour", labelKey: "colHour" },
  { key: "perDay", labelKey: "colDay" },
  { key: "perWeek", labelKey: "colWeek" },
  { key: "perMonth", labelKey: "colMonth" },
  { key: "airportTransfer", labelKey: "colAirport" },
];

/** Public, read-only rate card: searchable, class-filterable, mobile-carded. */
export function RatesTable({
  vehicles,
  discounts = [],
}: {
  vehicles: Vehicle[];
  discounts?: Discount[];
}) {
  const { t } = useI18n();
  // Resolved once per render so every cell for a vehicle uses the same offer.
  const rateFor = (v: Vehicle) => discountedRates(v.rates, bestDiscountFor(v, discounts));
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState<string>("all");

  const availableClasses = useMemo(
    () => VEHICLE_CLASSES.filter((c) => vehicles.some((v) => v.class === c)),
    [vehicles]
  );

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (cls === "all" || v.class === cls) &&
          v.name.toLowerCase().includes(query.toLowerCase())
      ),
    [vehicles, cls, query]
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.rates.search}
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t.rates.allClasses}</option>
          {availableClasses.map((c) => (
            <option key={c} value={c}>
              {t.vehicleClass[c as VehicleClass]}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">{t.rates.vehicle}</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-right font-medium">
                  {t.rates[c.labelKey]}
                </th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-band/50">
                <td className="px-4 py-3">
                  <Link href={`/fleet/${v.slug}`} className="font-medium text-navy hover:text-accent">
                    {v.name}
                  </Link>
                  <p className="text-xs text-muted">{t.vehicleClass[v.class]}</p>
                </td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-3 py-3 text-right tabular-nums text-ink/80">
                    {v.rates[c.key] != null ? formatRateCell(rateFor(v)[c.key]) : "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Link href={`/book?vehicle=${v.slug}`} className="text-xs font-semibold text-accent hover:underline">
                    {t.rates.book}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((v) => (
          <div key={v.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/fleet/${v.slug}`} className="font-semibold text-navy">
                  {v.name}
                </Link>
                <p className="text-xs text-muted">{t.vehicleClass[v.class]}</p>
              </div>
              <Link href={`/book?vehicle=${v.slug}`} className="text-xs font-semibold text-accent">
                {t.rates.book}
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm">
              {COLS.map((c) => (
                <div key={c.key} className="flex justify-between">
                  <dt className="text-muted">{t.rates[c.labelKey]}</dt>
                  <dd className="font-medium tabular-nums text-ink/80">
                    {v.rates[c.key] != null ? formatRateCell(rateFor(v)[c.key]) : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">{t.rates.noMatch}</p>
      )}

      <p className="mt-4 text-center text-xs text-muted">
        {t.rates.footnote}
      </p>
    </div>
  );
}
