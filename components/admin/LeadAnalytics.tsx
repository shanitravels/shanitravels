"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiGrid, FiBarChart2 } from "react-icons/fi";
import { Card } from "./parts";
import { GRANULARITY_LABELS, type Granularity, type LeadAnalytics } from "@/lib/types";

/**
 * Series colours validated for both themes and for protan/deutan/tritan vision
 * (worst adjacent pair ΔE 24.7 protan, 33.6 normal). Do not substitute by eye.
 */
const SERIES = [
  { key: "bookings", label: "Booking leads", light: "#2a78d6", dark: "#3987e5" },
  { key: "corporate", label: "Corporate enquiries", light: "#eb6834", dark: "#d95926" },
] as const;

const PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "12m", label: "12 months" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
] as const;

export function LeadAnalyticsView({
  data,
  from,
  to,
  granularity,
  preset,
}: {
  data: LeadAnalytics;
  from: string;
  to: string;
  granularity: Granularity;
  preset: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [asTable, setAsTable] = useState(false);

  const push = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    router.push(`/admin/analytics?${next.toString()}`);
  };

  const { buckets, totals, previous } = data;

  const fmtPeriod = useMemo(() => {
    const o: Intl.DateTimeFormatOptions =
      granularity === "year"
        ? { year: "numeric" }
        : granularity === "month"
          ? { month: "short", year: "2-digit" }
          : { day: "numeric", month: "short" };
    return new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "Asia/Karachi" });
  }, [granularity]);

  return (
    <div className="space-y-4">
      {/* ---- filters: one row above the charts ---- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <Group label="Range">
            <div className="flex flex-wrap rounded-lg border border-slate-300 p-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => push({ preset: p.key })}
                  className={seg(preset === p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Group>

          <Group label="Custom range">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => push({ preset: "custom", from: e.target.value })}
                className={dateInput}
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => push({ preset: "custom", to: e.target.value })}
                className={dateInput}
              />
            </div>
          </Group>

          <Group label="Group by">
            <div className="flex rounded-lg border border-slate-300 p-0.5">
              {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
                <button key={g} onClick={() => push({ granularity: g })} className={seg(granularity === g)}>
                  {GRANULARITY_LABELS[g]}
                </button>
              ))}
            </div>
          </Group>

          <button
            onClick={() => setAsTable((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {asTable ? <FiBarChart2 className="h-3.5 w-3.5" /> : <FiGrid className="h-3.5 w-3.5" />}
            {asTable ? "Chart" : "Table"}
          </button>
        </div>
      </Card>

      {/* ---- headline totals ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Booking leads" value={totals.bookings} prev={previous.bookings} dot={SERIES[0]} />
        <Stat label="Corporate enquiries" value={totals.corporate} prev={previous.corporate} dot={SERIES[1]} />
        <Stat label="Contact messages" value={totals.general} prev={previous.general} />
      </div>

      {/* ---- plot or table ---- */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Leads received · {GRANULARITY_LABELS[granularity].toLowerCase()}
          </h2>
          <ul className="flex flex-wrap items-center gap-4">
            {SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: `var(--series-${s.key})` }}
                  aria-hidden
                />
                {s.label}
              </li>
            ))}
          </ul>
        </div>

        {buckets.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            No leads in this range yet.
          </p>
        ) : asTable ? (
          <LeadTable buckets={buckets} fmt={fmtPeriod} />
        ) : (
          <LeadChart buckets={buckets} fmt={fmtPeriod} />
        )}
      </Card>

      <style>{`
        :root { --series-bookings: ${SERIES[0].light}; --series-corporate: ${SERIES[1].light}; }
        @media (prefers-color-scheme: dark) {
          :root { --series-bookings: ${SERIES[0].dark}; --series-corporate: ${SERIES[1].dark}; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ chart */

const PAD = { t: 12, r: 16, b: 26, l: 34 };
const VB = { w: 760, h: 240 };

function LeadChart({ buckets, fmt }: { buckets: { period: string; bookings: number; corporate: number }[]; fmt: Intl.DateTimeFormat }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...buckets.flatMap((b) => [b.bookings, b.corporate]));
  // Round the axis up to something readable rather than to the raw maximum.
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5 / 5) * 5;
  const top = Math.ceil(max / step) * step;

  const iw = VB.w - PAD.l - PAD.r;
  const ih = VB.h - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (buckets.length === 1 ? iw / 2 : (i / (buckets.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / top) * ih;

  const path = (key: "bookings" | "corporate") =>
    buckets.map((b, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(b[key]).toFixed(1)}`).join(" ");

  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  // Thin x labels so they never collide, whatever the bucket count.
  const labelEvery = Math.ceil(buckets.length / 8);
  const showDots = buckets.length <= 40;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="h-[240px] w-full min-w-[560px]"
          role="img"
          aria-label={`Booking leads and corporate enquiries across ${buckets.length} periods`}
          onMouseLeave={() => setHover(null)}
        >
          {/* recessive grid */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={VB.w - PAD.r} y1={y(t)} y2={y(t)} className="stroke-slate-200" strokeWidth="1" />
              <text x={PAD.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-slate-400 text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {t}
              </text>
            </g>
          ))}

          {/* x labels */}
          {buckets.map((b, i) =>
            i % labelEvery === 0 || i === buckets.length - 1 ? (
              <text key={b.period} x={x(i)} y={VB.h - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
                {fmt.format(new Date(b.period))}
              </text>
            ) : null
          )}

          {/* crosshair */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} className="stroke-slate-300" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* series — 2px lines, drawn after the grid so they sit above it */}
          <path d={path("bookings")} fill="none" stroke="var(--series-bookings)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={path("corporate")} fill="none" stroke="var(--series-corporate)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {showDots &&
            buckets.map((b, i) => (
              <g key={b.period}>
                {/* 2px surface ring keeps overlapping markers separable */}
                <circle cx={x(i)} cy={y(b.bookings)} r={hover === i ? 5 : 3.5} fill="var(--series-bookings)" stroke="white" strokeWidth="2" />
                <circle cx={x(i)} cy={y(b.corporate)} r={hover === i ? 5 : 3.5} fill="var(--series-corporate)" stroke="white" strokeWidth="2" />
              </g>
            ))}

          {/* hit targets, wider than the marks */}
          {buckets.map((b, i) => (
            <rect
              key={b.period}
              x={x(i) - iw / Math.max(1, buckets.length) / 2 - 6}
              y={PAD.t}
              width={iw / Math.max(1, buckets.length) + 12}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      </div>

      <div className="min-h-[46px]">
        {hover !== null && (
          <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
            <span className="font-semibold text-slate-800">{fmt.format(new Date(buckets[hover].period))}</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--series-bookings)" }} aria-hidden />
              Booking leads <b className="tabular font-semibold text-slate-900">{buckets[hover].bookings}</b>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--series-corporate)" }} aria-hidden />
              Corporate <b className="tabular font-semibold text-slate-900">{buckets[hover].corporate}</b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadTable({
  buckets,
  fmt,
}: {
  buckets: { period: string; bookings: number; corporate: number; general: number }[];
  fmt: Intl.DateTimeFormat;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Period</th>
            <th className="py-2 pr-4 font-medium">Booking leads</th>
            <th className="py-2 pr-4 font-medium">Corporate</th>
            <th className="py-2 font-medium">Contact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {buckets.map((b) => (
            <tr key={b.period}>
              <td className="py-2 pr-4 text-slate-700">{fmt.format(new Date(b.period))}</td>
              <td className="tabular py-2 pr-4 text-slate-900">{b.bookings}</td>
              <td className="tabular py-2 pr-4 text-slate-900">{b.corporate}</td>
              <td className="tabular py-2 text-slate-500">{b.general}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function Stat({
  label,
  value,
  prev,
  dot,
}: {
  label: string;
  value: number;
  prev: number;
  dot?: { key: string };
}) {
  const delta = value - prev;
  const pct = prev === 0 ? null : Math.round((delta / prev) * 100);
  const Icon = delta > 0 ? FiTrendingUp : delta < 0 ? FiTrendingDown : FiMinus;
  const tone = delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-slate-400";

  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
        {dot && (
          <span className="h-2 w-2 rounded-full" style={{ background: `var(--series-${dot.key})` }} aria-hidden />
        )}
        {label}
      </p>
      <p className="tabular mt-1 font-heading text-3xl font-bold text-navy">{value}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        {pct === null ? (delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} vs previous`) : `${pct > 0 ? "+" : ""}${pct}% vs previous period`}
      </p>
    </Card>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  );
}

const dateInput =
  "rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

const seg = (on: boolean) =>
  `rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
    on ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"
  }`;
