"use client";

import { useMemo, useState, useTransition } from "react";
import { FiPhone, FiMail, FiKey, FiUser, FiArrowRight } from "react-icons/fi";
import { StatusPill, EmptyState, Card, nextBookingStatus } from "./parts";
import { Modal } from "./Modal";
import { TextArea, Button, Toggle } from "./form";
import { useToast } from "./Toast";
import { setBookingStatus, saveBookingNotes, setVerificationFlag } from "@/lib/actions/requests";
import { formatDate, formatDateTime, formatPKR, telHref } from "@/lib/format";
import {
  BOOKING_STATUSES,
  RATE_TYPE_LABELS,
  type Booking,
  type BookingStatus,
} from "@/lib/types";

/**
 * Ticked by the admin at handover on self-drive bookings — paper checks
 * recorded here, not a workflow of their own.
 */
const VERIFICATION_FLAGS = [
  { key: "cnicVerified", label: "CNIC / passport verified" },
  { key: "licenceVerified", label: "Driving licence verified" },
  { key: "agreementSigned", label: "Rental agreement signed" },
  { key: "declarationSigned", label: "Security declaration signed" },
] as const;

/** Bookings table — rows open the full record in a modal, as enquiries do. */
export function BookingsManager({ initial }: { initial: Booking[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () =>
      rows.filter(
        (b) =>
          (filter === "all" || b.status === filter) &&
          (modeFilter === "all" || b.serviceMode === modeFilter)
      ),
    [rows, filter, modeFilter]
  );

  const open = (b: Booking) => {
    setSelected(b);
    setNotes(b.adminNotes ?? "");
  };

  /** Keep the row and the open modal in step after any mutation. */
  const patch = (id: string, next: Partial<Booking>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));
    setSelected((s) => (s && s.id === id ? { ...s, ...next } : s));
  };

  const changeStatus = (b: Booking, status: BookingStatus) => {
    start(async () => {
      const res = await setBookingStatus({ id: b.id, status });
      if (res.ok) {
        patch(b.id, { status });
        toast.success(res.message ?? "Updated");
      } else toast.error(res.error);
    });
  };

  const persistNotes = () => {
    if (!selected) return;
    const id = selected.id;
    start(async () => {
      const res = await saveBookingNotes(id, notes);
      if (res.ok) {
        patch(id, { adminNotes: notes });
        toast.success("Notes saved");
      } else toast.error(res.error);
    });
  };

  const flipVerification = (
    b: Booking,
    flag: (typeof VERIFICATION_FLAGS)[number]["key"],
    done: boolean
  ) => {
    start(async () => {
      const res = await setVerificationFlag({ bookingId: b.id, flag, done });
      if (res.ok) {
        patch(b.id, {
          verification: {
            ...(b.verification ?? {
              cnicVerified: { done: false },
              licenceVerified: { done: false },
              agreementSigned: { done: false },
              declarationSigned: { done: false },
            }),
            [flag]: done
              ? { done: true, by: "you", at: new Date().toISOString() }
              : { done: false, by: null, at: null },
          },
        });
        toast.success(res.message ?? "Saved");
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
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>

        {/* Service-mode chips */}
        <div className="flex gap-1.5">
          {(["all", "chauffeur", "self-drive"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                modeFilter === m
                  ? "bg-navy text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-navy/50"
              }`}
            >
              {m === "all" ? "All modes" : m.replace("-", " ")}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-400">{filtered.length} booking(s)</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No bookings" message="Booking requests from the website will appear here." />
      ) : (
        <>
          {/* The sidebar and this table both appear at md, leaving ~480px of
              content width — less than the table needs. Scroll it rather than
              clipping columns out of reach. */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const next = nextBookingStatus(b.status);
                  return (
                    <tr
                      key={b.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => open(b)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.reference}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{b.vehicleName}</td>
                      <td className="px-4 py-3"><ModeBadge mode={b.serviceMode} /></td>
                      <td className="px-4 py-3 text-slate-600">{b.name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {b.pickupCity} · {formatDate(b.startDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusPill status={b.status} kind="booking" />
                          {next && (
                            /* Advance without opening the record — the common case
                               is ticking a call off, not reading the whole booking. */
                            <button
                              onClick={(e) => { e.stopPropagation(); changeStatus(b, next); }}
                              disabled={pending}
                              title={`Mark as ${next}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold capitalize text-slate-600 transition hover:bg-white hover:text-navy disabled:opacity-50"
                            >
                              <FiArrowRight className="h-3 w-3" /> {next}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={telHref(b.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy"
                          title={`Call ${b.phone}`}
                        >
                          <FiPhone className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2 md:hidden">
            {filtered.map((b) => {
              const next = nextBookingStatus(b.status);
              return (
                <Card key={b.id} className="p-3" as="section">
                  <button className="w-full text-left" onClick={() => open(b)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{b.vehicleName}</span>
                      <StatusPill status={b.status} kind="booking" />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ModeBadge mode={b.serviceMode} />
                      <p className="text-xs text-slate-500">
                        {b.name} · {b.pickupCity} · {formatDate(b.startDate)}
                      </p>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">{b.reference}</p>
                  </button>
                  {next && (
                    <button
                      onClick={() => changeStatus(b, next)}
                      disabled={pending}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-1.5 text-xs font-semibold capitalize text-slate-600 transition hover:text-navy disabled:opacity-50"
                    >
                      <FiArrowRight className="h-3.5 w-3.5" /> Mark as {next}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        title={selected ? `Booking ${selected.reference}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ModeBadge mode={selected.serviceMode} />
              <StatusPill status={selected.status} kind="booking" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Vehicle" value={selected.vehicleName} />
              <Info label="Rate type" value={RATE_TYPE_LABELS[selected.rateType]} />
              <Info label="Pickup city" value={selected.pickupCity} />
              <Info label="Start" value={formatDate(selected.startDate)} />
              <Info label="End" value={selected.endDate ? formatDate(selected.endDate) : "—"} />
              <Info
                label="Indicative fare"
                value={selected.indicativeFare ? formatPKR(selected.indicativeFare) : "On request"}
              />
              {selected.promoCode && <Info label="Promo code" value={selected.promoCode} />}
              <Info label="Submitted" value={formatDateTime(selected.createdAt)} />
              <Info label="Last updated" value={formatDateTime(selected.updatedAt)} />
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">{selected.name}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <a href={telHref(selected.phone)} className="flex items-center gap-1.5 text-navy hover:underline">
                  <FiPhone className="h-3.5 w-3.5" /> {selected.phone}
                </a>
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-navy hover:underline">
                    <FiMail className="h-3.5 w-3.5" /> {selected.email}
                  </a>
                )}
              </div>
              {selected.notes && <p className="mt-2 text-xs text-slate-500">“{selected.notes}”</p>}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {BOOKING_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(selected, s)}
                    disabled={pending}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition disabled:opacity-50 ${
                      selected.status === s
                        ? "bg-navy text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {selected.serviceMode === "self-drive" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-semibold text-emerald-900">Self-drive verification</p>
                <p className="mt-0.5 text-[11px] text-emerald-800/70">
                  Tick each item as it&rsquo;s completed at handover. Every tick is stamped with who and when.
                </p>
                <ul className="mt-3 space-y-2.5">
                  {VERIFICATION_FLAGS.map(({ key, label }) => {
                    const flag = selected.verification?.[key];
                    return (
                      <li key={key} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-700">{label}</p>
                          {flag?.done && (
                            <p className="text-[11px] text-slate-400">
                              {flag.by ?? "—"} · {flag.at ? formatDateTime(flag.at) : ""}
                            </p>
                          )}
                        </div>
                        <Toggle
                          checked={flag?.done ?? false}
                          onChange={(v) => flipVerification(selected, key, v)}
                          label={label}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

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
      <p className="text-slate-700">{value}</p>
    </div>
  );
}

export function ModeBadge({ mode }: { mode: "chauffeur" | "self-drive" }) {
  return mode === "self-drive" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <FiKey className="h-3 w-3" /> Self-drive
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      <FiUser className="h-3 w-3" /> Chauffeur
    </span>
  );
}
