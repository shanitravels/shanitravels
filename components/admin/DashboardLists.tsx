"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FiPhone, FiChevronRight } from "react-icons/fi";
import { useToast } from "./Toast";
import { StatusPill, nextBookingStatus, nextEnquiryStatus } from "./parts";
import { setBookingStatus, setEnquiryStatus } from "@/lib/actions/requests";
import { formatDate, telHref } from "@/lib/format";
import type { Booking, Enquiry } from "@/lib/types";

export function DashboardBookings({ items }: { items: Booking[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(items);
  const [pending, start] = useTransition();

  const advance = (b: Booking) => {
    const next = nextBookingStatus(b.status);
    if (!next) return;
    start(async () => {
      const res = await setBookingStatus({ id: b.id, status: next });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === b.id ? { ...r, status: next } : r)));
        toast.success(res.message ?? "Updated");
      } else toast.error(res.error);
    });
  };

  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-400">No bookings yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((b) => {
        const next = nextBookingStatus(b.status);
        return (
          <li key={b.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-800">{b.vehicleName}</span>
                <StatusPill status={b.status} kind="booking" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {b.name} · {b.pickupCity} · {formatDate(b.startDate)}
              </p>
            </div>
            <a
              href={telHref(b.phone)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
              title={`Call ${b.phone}`}
            >
              <FiPhone className="h-4 w-4" />
            </a>
            {next && (
              <button
                onClick={() => advance(b)}
                disabled={pending}
                className="whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
              >
                → {next}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardEnquiries({ items }: { items: Enquiry[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(items);
  const [pending, start] = useTransition();

  const advance = (e: Enquiry) => {
    const next = nextEnquiryStatus(e.status);
    if (!next) return;
    start(async () => {
      const res = await setEnquiryStatus({ id: e.id, status: next });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === e.id ? { ...r, status: next } : r)));
        toast.success(res.message ?? "Updated");
      } else toast.error(res.error);
    });
  };

  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-400">No enquiries yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((e) => {
        const next = nextEnquiryStatus(e.status);
        return (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-800">
                  {e.type === "general" ? e.contactName : e.company}
                </span>
                <StatusPill status={e.status} kind="enquiry" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {e.type === "general" ? "General enquiry" : e.contactName} · {formatDate(e.createdAt)}
              </p>
            </div>
            <a
              href={telHref(e.phone)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
              title={`Call ${e.phone}`}
            >
              <FiPhone className="h-4 w-4" />
            </a>
            {next && (
              <button
                onClick={() => advance(e)}
                disabled={pending}
                className="whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
              >
                → {next}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
    >
      {label} <FiChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}
