import Link from "next/link";
import { clsx } from "clsx";
import type { BookingStatus, EnquiryStatus } from "@/lib/types";

/** Page header with title, optional description, and right-aligned actions. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <div
      className={clsx(
        "rounded-xl border bg-white p-4 shadow-card transition",
        href && "hover:border-navy/40 hover:shadow-lift",
        accent ? "border-accent/30" : "border-slate-200"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={clsx("mt-2 text-3xl font-bold", accent ? "text-accent" : "text-navy")}>
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Empty-state block with a create CTA. */
export function EmptyState({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Tag className={clsx("rounded-xl border border-slate-200 bg-white shadow-card", className)}>
      {children}
    </Tag>
  );
}

const bookingPillStyles: Record<BookingStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-200 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

const enquiryPillStyles: Record<EnquiryStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  "in-discussion": "bg-amber-100 text-amber-700",
  "proposal-sent": "bg-violet-100 text-violet-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

export function StatusPill({ status, kind }: { status: string; kind: "booking" | "enquiry" }) {
  const styles =
    kind === "booking"
      ? bookingPillStyles[status as BookingStatus]
      : enquiryPillStyles[status as EnquiryStatus];
  return (
    <span
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        styles ?? "bg-slate-100 text-slate-600"
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}

/** Status pipelines shared by dashboard + detail drawers. */
export const BOOKING_FLOW: BookingStatus[] = ["new", "contacted", "confirmed", "completed"];
export const ENQUIRY_FLOW: EnquiryStatus[] = ["new", "in-discussion", "proposal-sent", "won"];

export function nextBookingStatus(status: BookingStatus): BookingStatus | null {
  const i = BOOKING_FLOW.indexOf(status);
  return i >= 0 && i < BOOKING_FLOW.length - 1 ? BOOKING_FLOW[i + 1] : null;
}

export function nextEnquiryStatus(status: EnquiryStatus): EnquiryStatus | null {
  const i = ENQUIRY_FLOW.indexOf(status);
  return i >= 0 && i < ENQUIRY_FLOW.length - 1 ? ENQUIRY_FLOW[i + 1] : null;
}
