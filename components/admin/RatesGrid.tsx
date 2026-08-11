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

  const save = () => {
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
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            onClick={save}
            disabled={pending || !dirty}
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
                {COLUMNS.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={r.rates[c.key]}
                      onChange={(e) => setCell(r.id, c.key, e.target.value)}
                      placeholder="—"
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        All amounts in PKR. Leave a cell blank to show “On request” on the public site.
      </p>
    </div>
  );
}
