"use client";

import { useMemo, useState, useTransition } from "react";
import { FiPhone, FiMail } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { TextArea, Button } from "./form";
import { StatusPill, EmptyState, Card } from "./parts";
import { setEnquiryStatus, saveEnquiryNotes } from "@/lib/actions/requests";
import { formatDate, formatDateTime, telHref } from "@/lib/format";
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from "@/lib/types";

export function EnquiriesManager({ initial }: { initial: Enquiry[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () => rows.filter((e) => filter === "all" || e.status === filter),
    [rows, filter]
  );

  const open = (e: Enquiry) => {
    setSelected(e);
    setNotes(e.adminNotes ?? "");
  };

  const changeStatus = (status: EnquiryStatus) => {
    if (!selected) return;
    const id = selected.id;
    start(async () => {
      const res = await setEnquiryStatus({ id, status });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        setSelected((s) => (s ? { ...s, status } : s));
        toast.success(res.message ?? "Updated");
      } else toast.error(res.error);
    });
  };

  const persistNotes = () => {
    if (!selected) return;
    const id = selected.id;
    start(async () => {
      const res = await saveEnquiryNotes(id, notes);
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, adminNotes: notes } : r)));
        toast.success("Notes saved");
      } else toast.error(res.error);
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace("-", " ")}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} enquiry(ies)</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No enquiries" message="Corporate proposals and general enquiries from the website will appear here." />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="cursor-pointer hover:bg-slate-50" onClick={() => open(e)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.reference}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {e.type === "general" ? "—" : e.company}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.contactName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] capitalize text-slate-500">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={e.status} kind="enquiry" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2 md:hidden">
            {filtered.map((e) => (
              <Card key={e.id} className="p-3" as="section">
                <button className="w-full text-left" onClick={() => open(e)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {e.type === "general" ? e.contactName : e.company}
                    </span>
                    <StatusPill status={e.status} kind="enquiry" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{e.contactName} · {formatDate(e.createdAt)}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">{e.reference}</p>
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        title={selected ? `Enquiry ${selected.reference}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Type" value={selected.type} />
              <Info label="Organization" value={selected.company} />
              <Info label="Contact" value={selected.contactName} />
              <Info label="Sector" value={selected.sector || "—"} />
              <Info label="Cities" value={selected.cities.length ? selected.cities.join(", ") : "—"} />
              <Info label="Duration" value={selected.duration || "—"} />
              <Info label="Vehicles needed" value={selected.vehiclesNeeded || "—"} />
              <Info label="Submitted" value={formatDateTime(selected.createdAt)} />
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <a href={telHref(selected.phone)} className="flex items-center gap-1.5 text-navy hover:underline">
                  <FiPhone className="h-3.5 w-3.5" /> {selected.phone}
                </a>
                <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-navy hover:underline">
                  <FiMail className="h-3.5 w-3.5" /> {selected.email}
                </a>
              </div>
              {selected.details && <p className="mt-2 text-xs text-slate-500">“{selected.details}”</p>}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ENQUIRY_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={pending}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition disabled:opacity-50 ${
                      selected.status === s
                        ? "bg-navy text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600">Internal notes</p>
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for your team…" />
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={persistNotes} pending={pending}>Save notes</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="capitalize text-slate-700">{value}</p>
    </div>
  );
}
