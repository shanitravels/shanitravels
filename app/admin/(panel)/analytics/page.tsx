import { requireAdmin } from "@/lib/auth/session";
import { leadAnalytics } from "@/lib/data/analytics";
import { GRANULARITIES, type Granularity } from "@/lib/types";
import { PageHeader } from "@/components/admin/parts";
import { LeadAnalyticsView } from "@/components/admin/LeadAnalytics";

/** Karachi is UTC+5 with no DST, so a fixed offset is exact here. */
const TZ_OFFSET_MS = 5 * 3600_000;

/** "2026-08-01" → the instant of that local midnight in Pakistan. */
function localDayStart(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - TZ_OFFSET_MS);
}
function localDayEnd(ymd: string): Date {
  return new Date(localDayStart(ymd).getTime() + 86_400_000 - 1);
}
function toYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const PRESET_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

function resolveRange(preset: string, fromQ?: string, toQ?: string) {
  const today = toYmd(new Date());

  if (preset === "custom" && fromQ && toQ) return { from: fromQ, to: toQ };
  if (preset === "all") return { from: "2020-01-01", to: today };
  if (preset === "ytd") return { from: `${today.slice(0, 4)}-01-01`, to: today };

  const days = PRESET_DAYS[preset] ?? 30;
  const start = new Date(localDayStart(today).getTime() - (days - 1) * 86_400_000);
  return { from: toYmd(start), to: today };
}

/** Daily buckets over two years is unreadable; nudge to a sane default instead. */
function defaultGranularity(spanDays: number): Granularity {
  if (spanDays <= 45) return "day";
  if (spanDays <= 180) return "week";
  if (spanDays <= 1100) return "month";
  return "year";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; granularity?: string }>;
}) {
  await requireAdmin();
  const q = await searchParams;

  const preset = q.preset ?? "30d";
  const { from, to } = resolveRange(preset, q.from, q.to);
  const fromDate = localDayStart(from);
  const toDate = localDayEnd(to);
  const spanDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000));

  const granularity: Granularity = GRANULARITIES.includes(q.granularity as Granularity)
    ? (q.granularity as Granularity)
    : defaultGranularity(spanDays);

  const data = await leadAnalytics({ from: fromDate, to: toDate, granularity });

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Booking leads and corporate enquiries received over time. All dates are Pakistan time."
      />
      <LeadAnalyticsView
        data={data}
        from={from}
        to={to}
        granularity={granularity}
        preset={preset}
      />
    </div>
  );
}
