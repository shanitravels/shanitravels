import { FaWhatsapp } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin, FiArrowUp, FiArrowDown, FiMinus } from "react-icons/fi";
import {
  CONVERSION_KIND_LABELS,
  type ConversionKind,
  type ConversionSource,
  type ConversionTotals,
} from "@/lib/types";

/**
 * Outbound contact taps — the half of the funnel that leaves no lead behind.
 *
 * A WhatsApp or phone tap hands the visitor to another app, so nothing about it
 * is recoverable after the fact. These counts come from /api/track, recorded at
 * the moment of the click.
 *
 * Read them as intent, not as conversations: the count says someone opened
 * WhatsApp from that page, not that they went on to send the message.
 */

const ICONS: Record<ConversionKind, React.ReactNode> = {
  whatsapp: <FaWhatsapp />,
  call: <FiPhone />,
  email: <FiMail />,
  directions: <FiMapPin />,
};

const ORDER: ConversionKind[] = ["whatsapp", "call", "email", "directions"];

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) {
    return <span className="text-xs text-slate-400">no activity</span>;
  }
  if (before === 0) {
    return <span className="text-xs font-medium text-emerald-600">new</span>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <FiMinus className="h-3 w-3" /> level
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {up ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
      {Math.abs(pct)}% vs previous
    </span>
  );
}

export function ConversionPanel({
  totals,
  previous,
  topSources,
}: {
  totals: ConversionTotals;
  previous: ConversionTotals;
  topSources: ConversionSource[];
}) {
  const grand = ORDER.reduce((sum, k) => sum + totals[k], 0);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Contact taps</h2>
        <p className="text-xs text-slate-500">
          WhatsApp, phone and email links opened from the public site. Not counted as leads —
          these visitors never filled in a form.
        </p>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((kind) => (
          <div key={kind} className="bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className={kind === "whatsapp" ? "text-[#25D366]" : "text-slate-400"}>
                {ICONS[kind]}
              </span>
              {CONVERSION_KIND_LABELS[kind]}
            </div>
            <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-slate-900">
              {totals[kind].toLocaleString("en-PK")}
            </p>
            <div className="mt-1">
              <Delta now={totals[kind]} before={previous[kind]} />
            </div>
          </div>
        ))}
      </div>

      {grand === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No contact taps recorded in this period. Counting starts from the moment tracking was
          deployed, so an empty window here may simply predate it.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-slate-900">Which pages drive contact</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Page</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 text-right font-medium">Taps</th>
                </tr>
              </thead>
              <tbody>
                {topSources.map((s) => (
                  <tr key={`${s.path}:${s.kind}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{s.path}</td>
                    <td className="px-4 py-2 text-slate-600">{CONVERSION_KIND_LABELS[s.kind]}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-900">
                      {s.count.toLocaleString("en-PK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
