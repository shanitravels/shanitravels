"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiCheckCircle, FiArrowRight, FiUsers, FiTruck } from "react-icons/fi";
import type { IconType } from "react-icons";
import { clsx } from "clsx";
import { formatRateCell } from "@/lib/format";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";
import { RATE_GROUPS, type RateGroup, type VehicleClass } from "@/lib/types";

/**
 * One card's worth of facts, computed on the server from real vehicles so
 * nothing here is invented. `null` price means every vehicle in the class is
 * unpublished — "on request" rather than a made-up number.
 */
export interface RateCategory {
  cls: VehicleClass;
  group: RateGroup;
  image: string;
  count: number;
  fromPerDay: number | null;
  seatsFrom: number;
  seatsTo: number;
  selfDrive: boolean;
}

const GROUP_ICONS: Record<RateGroup, IconType> = {
  passenger: FiUsers,
  transport: FiTruck,
};

/**
 * The rate card's category grid, split by super-category.
 *
 * The toggle filters in the browser rather than through the URL: both groups
 * arrive in the same payload, and the whole point of a segmented control is
 * that it flips instantly.
 */
export function RateCategories({ categories }: { categories: RateCategory[] }) {
  const { t } = useI18n();
  const [group, setGroup] = useState<RateGroup>("passenger");

  const shown = categories.filter((c) => c.group === group);

  return (
    <div>
      {/* Segmented control, centred above the cards it filters */}
      <div className="flex flex-col items-center">
        <div className="inline-flex rounded-2xl border border-line bg-white p-1.5 shadow-card">
        {RATE_GROUPS.map((g) => {
          const Icon = GROUP_ICONS[g];
          const active = group === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              aria-pressed={active}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-5",
                active ? "bg-accent/10 text-accent" : "text-muted hover:text-navy"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{t.rates.group[g]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">{t.rates.emptyGroup}</p>
        ) : (
          /* Wrapped flex rather than a grid, for the same reason LogoRow in
             sections.tsx is: the two groups hold four cards and three, and a
             four-column grid leaves the Transport row hanging off the left with
             a hole beside it. Centring a short row needs the row to know it is
             short, which a grid track does not.

             The widths mirror what the grid columns were (1 / 2 / 4 up the
             breakpoints), each subtracting its share of the 1rem gap —
             gap x (columns - 1) / columns — so a full row still lines up
             exactly as it did. */
          <ul className="flex flex-wrap justify-center gap-4">
          {shown.map((c) => (
            <li
              key={c.cls}
              className="flex w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
            >
              {/* The whole card is the link — a card that only responds on its
                  button is a smaller target than it looks. */}
              <Link
                href={`/rates/${c.cls}`}
                className="group flex w-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift"
              >
                <div className="flex items-center gap-3">
                  <span className="relative h-12 w-14 shrink-0">
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading text-base font-bold leading-tight text-navy">
                      {t.vehicleClass[c.cls]}
                    </span>
                    <span className="block text-xs text-muted">
                      {seatLabel(c, t.rates.featSeats)}
                    </span>
                  </span>
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  {c.fromPerDay != null ? (
                    <p className="font-heading text-sm font-bold text-navy">
                      PKR{" "}
                      <span className="text-2xl text-accent tabular">
                        {formatRateCell(c.fromPerDay)}
                      </span>{" "}
                      <span className="text-xs font-medium text-muted">{t.rates.fromPerDay}</span>
                    </p>
                  ) : (
                    <p className="font-heading text-lg font-bold text-navy">{t.rates.onRequest}</p>
                  )}
                </div>

                <ul className="mt-4 flex-1 space-y-2.5 text-sm text-ink/80">
                  <Feature>{fmt(t.rates.featVehicles, { count: c.count })}</Feature>
                  <Feature>{seatLabel(c, t.rates.featSeats)}</Feature>
                  <Feature>{t.rates.featChauffeur}</Feature>
                  <Feature>{t.rates.featTracked}</Feature>
                  {c.selfDrive && <Feature>{t.rates.featSelfDrive}</Feature>}
                </ul>

                <span className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition group-hover:bg-accent group-hover:text-white">
                  {t.rates.viewRates}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** "4" when the class is uniform, "4–7" when it is not. */
function seatLabel(c: RateCategory, template: string): string {
  const range = c.seatsFrom === c.seatsTo ? `${c.seatsFrom}` : `${c.seatsFrom}–${c.seatsTo}`;
  return fmt(template, { range });
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
