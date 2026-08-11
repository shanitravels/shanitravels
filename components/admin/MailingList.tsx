"use client";

import { useMemo, useState, useTransition } from "react";
import { FiSearch, FiCopy, FiDownload, FiMail } from "react-icons/fi";
import { useToast } from "./Toast";
import { Toggle, Button } from "./form";
import { Card, EmptyState } from "./parts";
import { setMarketingSubscribed } from "@/lib/actions/marketing";
import { formatDate } from "@/lib/format";
import type { MarketingContact, MarketingSource } from "@/lib/types";

const SOURCE_LABELS: Record<MarketingSource, string> = {
  booking: "Booking",
  corporate: "Corporate",
  contact: "Contact",
};

type Filter = "subscribed" | "unsubscribed" | "all";

export function MailingList({ initial }: { initial: MarketingContact[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("subscribed");
  const [pending, start] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "subscribed" && !r.subscribed) return false;
      if (filter === "unsubscribed" && r.subscribed) return false;
      if (!q) return true;
      return r.email.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q);
    });
  }, [rows, query, filter]);

  const subscribedCount = rows.filter((r) => r.subscribed).length;

  const toggle = (id: string, subscribed: boolean) => {
    start(async () => {
      const res = await setMarketingSubscribed(id, subscribed);
      if (res.ok) {
        setRows((rs) =>
          rs.map((r) => (r.id === id ? { ...r, subscribed, unsubscribedAt: subscribed ? null : new Date().toISOString() } : r))
        );
        toast.success(res.message ?? "Saved");
      } else toast.error(res.error);
    });
  };

  /**
   * Export only what is currently visible. Exporting the full list regardless of
   * the filter is how unsubscribed addresses end up pasted into a campaign.
   */
  const emails = visible.map((r) => r.email);

  const copyEmails = async () => {
    if (!emails.length) return toast.error("Nothing to copy");
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      toast.success(`Copied ${emails.length} address${emails.length === 1 ? "" : "es"}`);
    } catch {
      toast.error("Clipboard blocked — use Download CSV instead");
    }
  };

  const downloadCsv = () => {
    if (!visible.length) return toast.error("Nothing to export");
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ["email", "name", "phone", "sources", "submissions", "subscribed", "last_seen"].join(","),
      ...visible.map((r) =>
        [
          esc(r.email),
          esc(r.name ?? ""),
          esc(r.phone ?? ""),
          esc(r.sources.join(" ")),
          String(r.submissions),
          r.subscribed ? "yes" : "no",
          esc(formatDate(r.lastSeenAt)),
        ].join(",")
      ),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shani-travels-mailing-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No addresses yet"
        message="Email addresses are collected automatically whenever someone books a vehicle or sends an enquiry."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total addresses" value={rows.length} />
        <Stat label="Subscribed" value={subscribedCount} />
        <Stat label="Opted out" value={rows.length - subscribedCount} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or name…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15"
            />
          </div>

          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {(["subscribed", "unsubscribed", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === f ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button size="sm" variant="secondary" onClick={copyEmails}>
            <FiCopy className="h-3.5 w-3.5" /> Copy {visible.length}
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadCsv}>
            <FiDownload className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <FiMail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Copy and CSV export only what the filter above is showing. Keep it on{" "}
            <strong>Subscribed</strong> when preparing an offer — anyone who opted out must not be
            included.
          </span>
        </p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Requests</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
              <th className="px-4 py-3 text-right font-medium">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr key={r.id} className={r.subscribed ? "" : "bg-slate-50/60 text-slate-400"}>
                <td className="px-4 py-3">
                  <a href={`mailto:${r.email}`} className="font-medium text-navy hover:underline">
                    {r.email}
                  </a>
                </td>
                <td className="px-4 py-3">{r.name || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.sources.map((s) => (
                      <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {SOURCE_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 tabular">{r.submissions}</td>
                <td className="px-4 py-3">{formatDate(r.lastSeenAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Toggle
                      checked={r.subscribed}
                      onChange={(v) => toggle(r.id, v)}
                      label={`Subscribe ${r.email}`}
                      disabled={pending}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No addresses match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-navy tabular">{value}</p>
    </Card>
  );
}
