"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FiAward,
  FiCalendar,
  FiFileText,
  FiFlag,
  FiGrid,
  FiHeart,
  FiMic,
  FiTrendingUp,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { clsx } from "clsx";
import { useI18n } from "./LocaleProvider";
import { AWARD_CATEGORIES, type Award, type AwardCategory } from "@/lib/types";

/** One icon per filter, matching the rail in the design. */
const CATEGORY_ICONS: Record<AwardCategory, IconType> = {
  "industry-awards": FiAward,
  "client-appreciations": FiHeart,
  certificates: FiFileText,
  milestones: FiFlag,
  "press-media": FiMic,
};

/**
 * The recognition wall: a filter rail beside a card grid.
 *
 * The rail is a vertical list on desktop and a horizontal scroller on mobile —
 * the same control, laid out for the space available, rather than two
 * components to keep in step.
 */
export function AwardsWall({
  awards,
  yearsOperating,
}: {
  awards: Award[];
  /**
   * The only figure not derivable from `awards`. Passed as a number rather
   * than the whole settings object, and the icons are looked up here rather
   * than handed down — a component function cannot cross the server/client
   * boundary as a prop.
   */
  yearsOperating: number;
}) {
  const { t } = useI18n();
  const [category, setCategory] = useState<AwardCategory | "all">("all");

  // Only categories that hold something get a row: an empty filter is a dead
  // end, and the counts beside each label have to mean something.
  const counts = useMemo(() => {
    const map = new Map<AwardCategory, number>();
    for (const a of awards) map.set(a.category, (map.get(a.category) ?? 0) + 1);
    return map;
  }, [awards]);

  const available = useMemo(
    () => AWARD_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0),
    [counts]
  );

  const filtered = useMemo(
    () => (category === "all" ? awards : awards.filter((a) => a.category === category)),
    [awards, category]
  );

  /**
   * Counted from what is actually published, not typed in — every figure is
   * one the visitor can verify by scrolling the wall underneath it.
   */
  const stats = [
    { Icon: FiAward, value: awards.length, label: t.awards.statAwards },
    {
      Icon: FiHeart,
      value: counts.get("client-appreciations") ?? 0,
      label: t.awards.statAppreciations,
    },
    { Icon: FiFileText, value: counts.get("certificates") ?? 0, label: t.awards.statCertificates },
    { Icon: FiTrendingUp, value: yearsOperating, label: t.awards.statYears },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
      <nav aria-label={t.awards.all} className="lg:sticky lg:top-24 lg:self-start">
        {/* Horizontal scroller below lg; the negative margin lets the row bleed
            to the screen edge so it reads as scrollable rather than clipped. */}
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          <RailItem
            icon={FiGrid}
            label={t.awards.all}
            count={awards.length}
            active={category === "all"}
            onClick={() => setCategory("all")}
          />
          {available.map((c) => (
            <RailItem
              key={c}
              icon={CATEGORY_ICONS[c]}
              label={t.awards.category[c]}
              count={counts.get(c) ?? 0}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </ul>
      </nav>

      <div>
        {/* Aligned with the cards, not the page: the counts describe this
            column's contents, and a full-bleed band would read as a site-wide
            statistic instead. */}
        <ul className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:gap-4 lg:grid-cols-4">
          {stats.map(({ Icon, value, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-xl font-bold tabular leading-tight text-navy sm:text-2xl">
                  {value}
                </span>
                <span className="block text-[11px] leading-tight text-muted sm:text-xs">
                  {label}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {category === "all" ? t.awards.empty : t.awards.emptyFiltered}
          </p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:border-accent/30 hover:shadow-lg"
              >
                {/* `contain`, not `cover`: these are certificates and trophies
                    photographed at every aspect ratio, and cropping one cuts
                    the seal or the signature off. */}
                <div className="relative aspect-[4/3] shrink-0 bg-band">
                  {a.image?.url ? (
                    <Image
                      src={a.image.url}
                      alt={a.image.alt || a.title}
                      fill
                      className="object-contain p-3"
                      sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-navy/15">
                      <FiAward className="h-14 w-14" />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-base font-bold leading-snug text-navy">
                    {a.title}
                  </h3>
                  {a.issuer && <p className="mt-1 text-sm font-medium text-accent">{a.issuer}</p>}
                  {a.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{a.description}</p>
                  )}
                  {a.awardedOn && (
                    <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
                      <FiCalendar className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      <time dateTime={a.awardedOn}>{formatAwardDate(a.awardedOn)}</time>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * "2023-05-15" → "May 15, 2023", with the parts read off the string.
 *
 * Deliberately not `new Date(value)`: that parses a bare date as UTC midnight
 * and then prints it in the viewer's zone, which lands on the previous day for
 * anyone west of Greenwich. These are certificate dates, not instants.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatAwardDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const month = MONTHS[m - 1];
  if (!month) return value;
  return `${month} ${d}, ${y}`;
}

function RailItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: IconType;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li className="shrink-0 lg:shrink">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={clsx(
          "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition lg:w-full",
          active
            ? "bg-accent text-white shadow-card"
            : "border border-line bg-white text-navy hover:border-accent/40 hover:text-accent lg:border-transparent lg:bg-transparent lg:hover:bg-white"
        )}
      >
        <Icon className={clsx("h-4 w-4 shrink-0", active ? "text-white" : "text-accent")} aria-hidden />
        <span className="flex-1 whitespace-nowrap text-left lg:whitespace-normal">{label}</span>
        <span
          className={clsx(
            "tabular text-xs",
            active ? "text-white/70" : "text-muted"
          )}
        >
          {count}
        </span>
      </button>
    </li>
  );
}
