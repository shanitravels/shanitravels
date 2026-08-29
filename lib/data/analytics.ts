import "server-only";
import { connectDB } from "@/lib/db";
import { BookingModel, EnquiryModel, ConversionEventModel } from "@/lib/models";
import type {
  Granularity,
  LeadBucket,
  LeadAnalytics,
  ConversionKind,
  ConversionTotals,
  ConversionSource,
} from "@/lib/types";

/**
 * Lead volume over time — booking requests and corporate enquiries.
 *
 * Buckets are computed by MongoDB in Pakistan time, not UTC. Islamabad is UTC+5,
 * so a UTC-bucketed "day" would push every enquiry taken between midnight and
 * 5am into the previous day's column.
 */
const TZ = "Asia/Karachi";

const EMPTY: LeadAnalytics = {
  buckets: [],
  totals: { bookings: 0, corporate: 0, general: 0 },
  previous: { bookings: 0, corporate: 0, general: 0 },
};

type Row = { _id: Date | null; n: number };

function bucketStage(granularity: Granularity) {
  return {
    $dateTrunc: {
      date: "$createdAt",
      unit: granularity,
      timezone: TZ,
      // Pakistan's working week starts Monday; without this Mongo splits on Sunday.
      ...(granularity === "week" ? { startOfWeek: "monday" } : {}),
    },
  };
}

/**
 * Fills gaps so a quiet day renders as a zero rather than vanishing — a line
 * that skips empty buckets silently misreports the shape of the trend.
 */
function buildSeries(
  from: Date,
  to: Date,
  granularity: Granularity,
  rows: { bookings: Row[]; corporate: Row[]; general: Row[] }
): LeadBucket[] {
  const key = (d: Date) => d.toISOString();
  const index = (list: Row[]) => {
    const m = new Map<string, number>();
    for (const r of list) if (r._id) m.set(key(r._id), r.n);
    return m;
  };
  const b = index(rows.bookings);
  const c = index(rows.corporate);
  const g = index(rows.general);

  // Union of every bucket any series reported, so nothing is dropped even if the
  // cursor walk below and Mongo's truncation disagree at a DST-style edge.
  const seen = new Set<string>([...b.keys(), ...c.keys(), ...g.keys()]);

  const cursor = truncate(from, granularity);
  const end = to.getTime();
  let guard = 0;
  while (cursor.getTime() <= end && guard++ < 2000) {
    seen.add(key(new Date(cursor)));
    advance(cursor, granularity);
  }

  return [...seen]
    .sort()
    .map((period) => ({
      period,
      bookings: b.get(period) ?? 0,
      corporate: c.get(period) ?? 0,
      general: g.get(period) ?? 0,
    }));
}

/** Mirrors $dateTrunc in Pakistan time so generated gaps line up with Mongo's keys. */
function truncate(date: Date, granularity: Granularity): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  let y = get("year");
  let m = get("month");
  let d = get("day");

  if (granularity === "year") { m = 1; d = 1; }
  else if (granularity === "month") { d = 1; }

  if (granularity === "week") {
    // Take the weekday from the bare local calendar date. Deriving it from the
    // UTC instant of local midnight reads the PREVIOUS UTC day (Karachi is
    // UTC+5, so local midnight is 19:00 the day before) and lands the week
    // start one day late — which silently zeroes every weekly bucket.
    const probe = new Date(Date.UTC(y, m - 1, d));
    const dow = (probe.getUTCDay() + 6) % 7; // Monday = 0
    probe.setUTCDate(probe.getUTCDate() - dow);
    y = probe.getUTCFullYear();
    m = probe.getUTCMonth() + 1;
    d = probe.getUTCDate();
  }

  // Local midnight in Karachi is 19:00 UTC the day before (UTC+5, no DST).
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5 * 3600_000);
}

function advance(d: Date, granularity: Granularity): void {
  if (granularity === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (granularity === "week") d.setUTCDate(d.getUTCDate() + 7);
  else if (granularity === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
}

export async function leadAnalytics(opts: {
  from: Date;
  to: Date;
  granularity: Granularity;
}): Promise<LeadAnalytics> {
  const { from, to, granularity } = opts;
  try {
    await connectDB();

    const group = (match: Record<string, unknown>) => [
      { $match: { createdAt: { $gte: from, $lte: to }, ...match } },
      { $group: { _id: bucketStage(granularity), n: { $sum: 1 } } },
      { $sort: { _id: 1 as const } },
    ];

    // Equal-length window ending where this one starts.
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);
    const prevRange = { createdAt: { $gte: prevFrom, $lt: from } };

    const [bookings, corporate, general, pb, pc, pg] = await Promise.all([
      BookingModel.aggregate<Row>(group({})),
      EnquiryModel.aggregate<Row>(group({ type: "corporate" })),
      EnquiryModel.aggregate<Row>(group({ type: "general" })),
      BookingModel.countDocuments(prevRange),
      EnquiryModel.countDocuments({ ...prevRange, type: "corporate" }),
      EnquiryModel.countDocuments({ ...prevRange, type: "general" }),
    ]);

    const buckets = buildSeries(from, to, granularity, { bookings, corporate, general });

    return {
      buckets,
      totals: {
        bookings: buckets.reduce((s, x) => s + x.bookings, 0),
        corporate: buckets.reduce((s, x) => s + x.corporate, 0),
        general: buckets.reduce((s, x) => s + x.general, 0),
      },
      previous: { bookings: pb, corporate: pc, general: pg },
    };
  } catch (err) {
    console.error("[analytics] leadAnalytics failed:", err);
    return EMPTY;
  }
}

/**
 * Outbound contact taps over a window — WhatsApp, phone, email, directions.
 *
 * These never produce a Booking or an Enquiry document, so before this existed
 * the most common way people contact Shani Travels was entirely absent from the
 * dashboard. Recorded first-party by /api/track, which means the numbers hold
 * up even for visitors who block third-party analytics.
 */
export async function conversionAnalytics(opts: {
  from: Date;
  to: Date;
}): Promise<{ totals: ConversionTotals; previous: ConversionTotals; topSources: ConversionSource[] }> {
  const { from, to } = opts;
  const empty: ConversionTotals = { whatsapp: 0, call: 0, email: 0, directions: 0 };

  try {
    await connectDB();

    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);

    const byKind = (range: Record<string, unknown>) => [
      { $match: { createdAt: range } },
      { $group: { _id: "$kind", n: { $sum: 1 } } },
    ];

    const [current, previous, sources] = await Promise.all([
      ConversionEventModel.aggregate<{ _id: ConversionKind; n: number }>(
        byKind({ $gte: from, $lte: to })
      ),
      ConversionEventModel.aggregate<{ _id: ConversionKind; n: number }>(
        byKind({ $gte: prevFrom, $lt: from })
      ),
      // Which pages actually drive contact — the question the lead counts
      // alone can never answer.
      ConversionEventModel.aggregate<{ _id: { path: string; kind: ConversionKind }; n: number }>([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { path: "$path", kind: "$kind" }, n: { $sum: 1 } } },
        { $sort: { n: -1 as const } },
        { $limit: 12 },
      ]),
    ]);

    const fold = (rows: { _id: ConversionKind; n: number }[]): ConversionTotals => {
      const out = { ...empty };
      for (const r of rows) if (r._id in out) out[r._id] = r.n;
      return out;
    };

    return {
      totals: fold(current),
      previous: fold(previous),
      topSources: sources.map((r) => ({ path: r._id.path, kind: r._id.kind, count: r.n })),
    };
  } catch (err) {
    console.error("[analytics] conversionAnalytics failed:", err);
    return { totals: empty, previous: empty, topSources: [] };
  }
}
