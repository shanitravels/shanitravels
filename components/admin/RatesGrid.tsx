"use client";

import { useMemo, useState, useTransition } from "react";
import { FiSave, FiDownload } from "react-icons/fi";
import { useToast } from "./Toast";
import { EmptyState } from "./parts";
import { saveRatesBulk } from "@/lib/actions/vehicles";
import { VEHICLE_CLASS_LABELS, type Vehicle, type VehicleRates } from "@/lib/types";

type RateKey = keyof VehicleRates;

const COLUMNS: { key: RateKey; label: string }[] = [
  { key: "perHour", label: "Per hour" },
  { key: "perDay", label: "Per day" },
  { key: "perWeek", label: "Per week" },
  { key: "perMonth", label: "Per month" },
  { key: "fuelPerKm", label: "Fuel / km" },
  { key: "airportTransfer", label: "Airport" },
];

interface Row {
  id: string;
  name: string;
  cls: string;
  rates: Record<RateKey, string>;
}

const toStr = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

/**
 * A cell holds either a price or nothing at all.
 *
 * Blank is deliberate — it is how a rate is withdrawn and shown as "On request"
 * on the vehicle page and the public rate list. Zero is not: it would publish
 * the vehicle at "PKR 0", so it is caught here before the save is attempted,
 * where the offending cell can still be pointed at. The server rejects it too.
 */
const isBadCell = (raw: string) => {
  if (raw.trim() === "") return false;
  const n = Number(raw);
  return !Number.isFinite(n) || n <= 0;
};

export function RatesGrid({ vehicles }: { vehicles: Vehicle[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Row[]>(() =>
    vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      cls: VEHICLE_CLASS_LABELS[v.class],
      rates: {
        perHour: toStr(v.rates.perHour),
        perDay: toStr(v.rates.perDay),
        perWeek: toStr(v.rates.perWeek),
        perMonth: toStr(v.rates.perMonth),
        fuelPerKm: toStr(v.rates.fuelPerKm),
        airportTransfer: toStr(v.rates.airportTransfer),
      },
    }))
  );
  const [dirty, setDirty] = useState(false);

  const setCell = (id: string, key: RateKey, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rates: { ...r.rates, [key]: value } } : r))
    );
    setDirty(true);
  };

  // Named rather than counted: with six columns across a long fleet, "2 cells"
  // is not enough to find them by.
  const invalidRows = useMemo(
    () => rows.filter((r) => COLUMNS.some((c) => isBadCell(r.rates[c.key]))),
    [rows]
  );

  const save = () => {
    if (invalidRows.length > 0) {
      toast.error(
        `Rates must be greater than zero — fix ${invalidRows
          .map((r) => r.name)
          .join(", ")}. Clear a cell instead to show “On request”.`
      );
      return;
    }
    const payload = rows.map((r) => ({
      id: r.id,
      rates: {
        perHour: r.rates.perHour === "" ? null : Number(r.rates.perHour),
        perDay: r.rates.perDay === "" ? null : Number(r.rates.perDay),
        perWeek: r.rates.perWeek === "" ? null : Number(r.rates.perWeek),
        perMonth: r.rates.perMonth === "" ? null : Number(r.rates.perMonth),
        fuelPerKm: r.rates.fuelPerKm === "" ? null : Number(r.rates.fuelPerKm),
        airportTransfer: r.rates.airportTransfer === "" ? null : Number(r.rates.airportTransfer),
      },
    }));
    start(async () => {
      const res = await saveRatesBulk(payload);
      if (res.ok) {
        setDirty(false);
        toast.success(res.message ?? "Rates saved");
      } else toast.error(res.error);
    });
  };

  const exportCsv = () => {
    const header = ["Vehicle", "Class", ...COLUMNS.map((c) => c.label), "Currency"];
    const lines = rows.map((r) => {
      const v = vehicles.find((x) => x.id === r.id);
      return [
        r.name,
        r.cls,
        ...COLUMNS.map((c) => r.rates[c.key] || "on request"),
        v?.currency ?? "PKR",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shani-travels-rates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = useMemo(() => rows, [rows]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No active vehicles"
        message="Add and activate vehicles to manage their rates here."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FiDownload className="h-4 w-4" /> Export CSV
        </button>
        <div className="ml-auto flex items-center gap-3">
          {invalidRows.length > 0 ? (
            <span className="text-xs text-red-600">
              Rates must be greater than zero — clear the cell to show “On request”
            </span>
          ) : (
            dirty && <span className="text-xs text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={save}
            disabled={pending || !dirty || invalidRows.length > 0}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" /> {pending ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 font-medium">Vehicle</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-right font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grouped.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2">
                  <p className="font-medium text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.cls}</p>
                </td>
                {COLUMNS.map((c) => {
                  const bad = isBadCell(r.rates[c.key]);
                  return (
                    <td key={c.key} className="px-3 py-2">
                      <input
                        type="number"
                        min={0.01}
                        step="any"
                        inputMode="decimal"
                        value={r.rates[c.key]}
                        onChange={(e) => setCell(r.id, c.key, e.target.value)}
                        placeholder="On request"
                        aria-invalid={bad}
                        aria-label={`${r.name} — ${c.label}`}
                        title={bad ? "Rates must be greater than zero. Clear the cell to show “On request”." : undefined}
                        className={`w-24 rounded border px-2 py-1 text-right tabular-nums placeholder:text-[11px] placeholder:text-slate-300 focus:outline-none focus:ring-1 ${
                          bad
                            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-navy focus:ring-navy/20"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        All amounts in PKR and greater than zero. Clear a cell to withdraw that rate — the vehicle
        page and the public rate list then show “On request” in its place.
      </p>
    </div>
  );
}
