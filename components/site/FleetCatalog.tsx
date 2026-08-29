"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { FiKey, FiSearch, FiX, FiChevronDown, FiChevronLeft, FiChevronRight, FiSliders } from "react-icons/fi";
import { VehicleCard } from "./VehicleCard";
import { bestDiscountFor } from "@/lib/pricing";
import { byEngineSize } from "@/lib/engine-size";
import { makeOptions, vehicleMake } from "@/lib/vehicle-make";
import type { Discount } from "@/lib/types";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass, isSelfDriveEligible } from "@/lib/types";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";

type SortKey = "category" | "engine-asc" | "featured" | "price-asc" | "price-desc" | "seats-desc";

/** Three full rows of the three-column grid, so no page ends on a ragged row. */
const PAGE_SIZE = 9;

/** Sort options carry a dictionary key; the label is resolved at render time. */
const SORTS: {
  key: SortKey;
  labelKey:
    | "sortCategory"
    | "sortEngineAsc"
    | "sortFeatured"
    | "sortPriceAsc"
    | "sortPriceDesc"
    | "sortSeatsDesc";
}[] = [
  { key: "category", labelKey: "sortCategory" },
  { key: "engine-asc", labelKey: "sortEngineAsc" },
  { key: "featured", labelKey: "sortFeatured" },
  { key: "price-asc", labelKey: "sortPriceAsc" },
  { key: "price-desc", labelKey: "sortPriceDesc" },
  { key: "seats-desc", labelKey: "sortSeatsDesc" },
];

/** Position of a vehicle's class in the browse order defined by VEHICLE_CLASSES. */
const classRank = (v: Vehicle) => VEHICLE_CLASSES.indexOf(v.class);

export interface FleetFilters {
  cls: string;
  seats: string;
  sort: SortKey;
  selfDriveOnly: boolean;
  /** Free-text query, matched against name, company and class. */
  q: string;
  /** Companies to keep. Empty means every company. */
  makes: string[];
  /** 1-based, already clamped to a sane range by the server. */
  page: number;
}

/**
 * Fleet catalog. Initial filter state arrives as props resolved on the server
 * from the URL, so a deep link like `/fleet?class=economy` server-renders the
 * filtered grid — no loading flash, and crawlers see real vehicles. Subsequent
 * filter changes are client-side and sync back to the URL so links stay
 * shareable and the back button behaves.
 */
export function FleetCatalog({
  vehicles,
  selfDriveEnabled,
  discounts = [],
  initial,
}: {
  vehicles: Vehicle[];
  selfDriveEnabled: boolean;
  discounts?: Discount[];
  initial: FleetFilters;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const [cls, setCls] = useState<string>(initial.cls);
  const [seats, setSeats] = useState<string>(initial.seats);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  /**
   * Below lg the rail collapses — a full filter column above the grid would
   * push the first vehicle off a phone screen entirely. At lg and up the panel
   * is always shown and this is ignored.
   */
  const [railOpen, setRailOpen] = useState(false);
  const [selfDriveOnly, setSelfDriveOnly] = useState(initial.selfDriveOnly);
  const [q, setQ] = useState(initial.q);
  const [page, setPage] = useState(initial.page);

  // The results grid, so a page change can bring its first row into view
  // instead of leaving the reader stranded at the foot of the previous page.
  const resultsTop = useRef<HTMLDivElement>(null);

  // Companies present in the fleet, with a count each.
  const companies = useMemo(() => makeOptions(vehicles.map((v) => v.name)), [vehicles]);

  // A company named in the URL that no longer has vehicles is dropped on the
  // way in. Keeping it would filter the grid down to nothing with no checked
  // box on screen to explain why.
  const [makes, setMakes] = useState<string[]>(() =>
    initial.makes.filter((m) => companies.some((c) => c.make === m))
  );

  /**
   * Every filter change goes back to page one. Page 4 of the old result set
   * says nothing about the new one and is usually past its end, which would
   * answer a narrowed search with an empty grid.
   */
  const changeCls = (v: string) => { setCls(v); setPage(1); };
  const changeSeats = (v: string) => { setSeats(v); setPage(1); };
  const changeSort = (v: SortKey) => { setSort(v); setPage(1); };
  const changeQ = (v: string) => { setQ(v); setPage(1); };
  const changeMakes = (v: string[]) => { setMakes(v); setPage(1); };
  const toggleSelfDrive = () => { setSelfDriveOnly((v) => !v); setPage(1); };

  // Only list classes that actually have vehicles, and carry the count so the
  // rail can show what each filter would leave — the question a filter list is
  // always implicitly asked.
  const availableClasses = useMemo(
    () =>
      VEHICLE_CLASSES.map((c) => ({ cls: c, count: vehicles.filter((v) => v.class === c).length }))
        .filter((x) => x.count > 0),
    [vehicles]
  );

  /**
   * What the search reads, per vehicle: the name, the company derived from it,
   * and the class in the language on screen — so "SUV" and "بس" find vehicles
   * whose names contain neither word.
   */
  const haystack = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of vehicles) {
      map.set(
        v.id,
        [v.name, vehicleMake(v.name) ?? "", t.vehicleClass[v.class]].join(" ").toLowerCase()
      );
    }
    return map;
  }, [vehicles, t]);

  // Every word has to appear somewhere, in any order: "prado armored" and
  // "armored prado" both find the same vehicle, which a plain substring
  // match on the whole phrase would not.
  const terms = useMemo(
    () => q.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [q]
  );

  const filtered = useMemo(() => {
    const list = vehicles.filter((v) => {
      if (cls !== "all" && v.class !== cls) return false;
      if (seats !== "any" && v.seats < Number(seats)) return false;
      if (selfDriveOnly && !isSelfDriveEligible(v)) return false;
      if (makes.length && !makes.includes(vehicleMake(v.name) ?? "")) return false;
      if (terms.length) {
        const text = haystack.get(v.id) ?? "";
        if (!terms.every((term) => text.includes(term))) return false;
      }
      return true;
    });
    // Unpriced vehicles ("on request") sort last on price-ascending.
    const day = (v: Vehicle) => v.rates.perDay ?? Number.POSITIVE_INFINITY;
    return [...list].sort((a, b) => {
      switch (sort) {
        // Default. Groups the grid by category and walks up the engine range
        // inside each one. Sorting by price instead used to strand every
        // "on request" vehicle in one undifferentiated block at the end —
        // which is how the Honda City and Hyundai sedans ended up sitting
        // among the armoured B-6 units rather than with the other saloons.
        case "category":
          return classRank(a) - classRank(b) || byEngineSize(a, b);
        case "engine-asc":
          return byEngineSize(a, b);
        case "price-asc":
          return day(a) - day(b);
        case "price-desc":
          return (b.rates.perDay ?? 0) - (a.rates.perDay ?? 0);
        case "seats-desc":
          return b.seats - a.seats;
        default:
          return Number(b.featured) - Number(a.featured) || day(a) - day(b);
      }
    });
  }, [vehicles, cls, seats, sort, selfDriveOnly, makes, terms, haystack]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  /**
   * Derived rather than corrected in state: a hand-typed `?page=99` must not
   * slice past the end and answer with an empty grid. `current` is what the
   * grid, the controls and the URL all use, so the out-of-range number never
   * escapes this line.
   */
  const current = Math.min(page, totalPages);

  const start = (current - 1) * PAGE_SIZE;
  const paged = useMemo(
    () => filtered.slice(start, start + PAGE_SIZE),
    [filtered, start]
  );

  /**
   * The URL for the current filters on a given page. Shared by the effect that
   * mirrors state into the address bar and by the page links, so the address
   * someone copies and the address they land on are built the same way.
   */
  const urlFor = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      if (cls !== "all") params.set("class", cls);
      if (seats !== "any") params.set("seats", seats);
      if (sort !== "category") params.set("sort", sort);
      if (selfDriveOnly) params.set("selfdrive", "1");
      if (q.trim()) params.set("q", q.trim());
      if (makes.length) params.set("make", makes.join(","));
      if (targetPage > 1) params.set("page", String(targetPage));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [cls, seats, sort, selfDriveOnly, q, makes, pathname]
  );

  // Identifies the filter set, to tell paging apart from filtering below.
  const filterKey = useMemo(
    () => JSON.stringify([cls, seats, sort, selfDriveOnly, q.trim(), makes]),
    [cls, seats, sort, selfDriveOnly, q, makes]
  );

  /**
   * Mirror the state into the URL. Runs after `current` is derived, so the URL
   * carries the page actually on screen rather than an out-of-range one typed
   * into the address bar. A ref skips the first run so we don't rewrite the URL
   * we just arrived on. Debounced because the query changes on every keystroke,
   * and a router call per character is both wasteful and visibly janky.
   */
  const isFirstRun = useRef(true);
  const lastFilterKey = useRef("");
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      lastFilterKey.current = filterKey;
      return;
    }
    const timer = window.setTimeout(() => {
      // Only the page moved → push, so Back walks back through the pages.
      // Otherwise replace, so filtering doesn't spam history a keystroke at a time.
      const pagedOnly = filterKey === lastFilterKey.current;
      lastFilterKey.current = filterKey;
      const url = urlFor(current);
      if (pagedOnly) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filterKey, current, urlFor, router]);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    // Scrolled to the results rather than the document top: the filters stay in
    // view, so the reader can see the search that produced the page they landed on.
    resultsTop.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const clearAll = () => {
    setCls("all");
    setSeats("any");
    setSort("category");
    setSelfDriveOnly(false);
    setQ("");
    setMakes([]);
    setPage(1);
  };

  /** Drives the "Clear filters" affordance and the badge on the mobile toggle. */
  const activeCount =
    (cls !== "all" ? 1 : 0) +
    (seats !== "any" ? 1 : 0) +
    (selfDriveOnly ? 1 : 0) +
    (q.trim() ? 1 : 0) +
    makes.length;

  const toggleMake = (make: string) =>
    changeMakes(makes.includes(make) ? makes.filter((m) => m !== make) : [...makes, make]);

  const seatOptions = [
    { value: "any", label: t.fleet.any },
    { value: "4", label: "4+" },
    { value: "7", label: "7+" },
    { value: "12", label: "12+" },
    { value: "22", label: "22+" },
  ];

  return (
    /**
     * Filters sit in a left rail rather than stacked above the grid. The set
     * had grown past what reads cleanly as a toolbar, and a rail keeps every
     * filter and its current state visible while the results scroll past.
     *
     * minmax(0,1fr) on the results track, not a plain 1fr: a grid track sizes
     * to its content by default, so a long vehicle name would widen the column
     * past the space available instead of wrapping inside it.
     */
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="mb-6 lg:sticky lg:top-24 lg:mb-0">
        {/* Collapsed on phones — a full filter column above the grid would push
            the first vehicle off the screen. Hidden at lg, where it is open. */}
        <button
          type="button"
          onClick={() => setRailOpen((v) => !v)}
          aria-expanded={railOpen}
          aria-controls="fleet-filters"
          className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy lg:hidden"
        >
          <span className="flex items-center gap-2">
            <FiSliders aria-hidden className="h-4 w-4 text-accent" />
            {railOpen ? t.fleet.hideFilters : t.fleet.showFilters}
            {activeCount > 0 && (
              <span className="tabular rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <FiChevronDown
            aria-hidden
            className={clsx("h-4 w-4 transition-transform", railOpen && "rotate-180")}
          />
        </button>

        <div
          id="fleet-filters"
          className={clsx(
            "mt-2 overflow-hidden rounded-2xl border border-line bg-white lg:mt-0 lg:block",
            railOpen ? "block" : "hidden"
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t.fleet.filters}
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {t.fleet.clearFilters}
              </button>
            )}
          </div>

          <RailSection>
            <label htmlFor="fleet-search" className="sr-only">
              {t.fleet.searchLabel}
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                id="fleet-search"
                type="search"
                value={q}
                onChange={(e) => changeQ(e.target.value)}
                placeholder={t.fleet.searchPlaceholder}
                aria-controls="fleet-results"
                className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-8 text-sm text-ink placeholder:text-muted focus:border-navy focus:outline-none"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => changeQ("")}
                  aria-label={t.fleet.searchClear}
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-band hover:text-navy"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </RailSection>

          <RailSection title={t.fleet.vehicleType}>
            <div className="space-y-0.5">
              <RailChoice
                name="fleet-class"
                checked={cls === "all"}
                onSelect={() => changeCls("all")}
                label={t.vehicleClass.all}
                count={vehicles.length}
              />
              {availableClasses.map(({ cls: c, count }) => (
                <RailChoice
                  key={c}
                  name="fleet-class"
                  checked={cls === c}
                  onSelect={() => changeCls(c)}
                  label={t.vehicleClass[c as VehicleClass]}
                  count={count}
                />
              ))}
            </div>
          </RailSection>

          {companies.length > 1 && (
            <RailSection title={t.fleet.company}>
              {/* Capped and scrollable: the make list grows with the fleet and
                  must not push the seating filter below the fold. */}
              <div className="-mr-1 max-h-52 space-y-0.5 overflow-y-auto pr-1">
                {companies.map(({ make, count }) => (
                  <label
                    key={make}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink transition hover:bg-band"
                  >
                    <input
                      type="checkbox"
                      checked={makes.includes(make)}
                      onChange={() => toggleMake(make)}
                      className="h-4 w-4 shrink-0 accent-navy"
                    />
                    <span className="flex-1 truncate">{make}</span>
                    <span className="tabular text-xs text-muted">{count}</span>
                  </label>
                ))}
              </div>
            </RailSection>
          )}

          <RailSection title={t.fleet.minSeats}>
            <div className="space-y-0.5">
              {seatOptions.map((o) => (
                <RailChoice
                  key={o.value}
                  name="fleet-seats"
                  checked={seats === o.value}
                  onSelect={() => changeSeats(o.value)}
                  label={o.label}
                />
              ))}
            </div>
          </RailSection>

          {selfDriveEnabled && (
            <RailSection title={t.fleet.selfDriveGroup}>
              <button
                type="button"
                onClick={toggleSelfDrive}
                aria-pressed={selfDriveOnly}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                  selfDriveOnly
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-line bg-white text-ink/70 hover:border-navy/40 hover:text-navy"
                )}
              >
                <FiKey className="h-3.5 w-3.5 shrink-0" /> {t.fleet.selfDriveAvailable}
              </button>
            </RailSection>
          )}
        </div>
      </aside>

      <div>
        {/* The anchor a page change scrolls to — above the count, so the new
            page announces its own range. */}
        <div ref={resultsTop} className="scroll-mt-24" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {totalPages > 1
              ? fmt(t.fleet.countRange, {
                  from: start + 1,
                  to: start + paged.length,
                  total: filtered.length,
                  noun: filtered.length === 1 ? t.fleet.vehicle : t.fleet.vehicles,
                })
              : fmt(t.fleet.countAll, {
                  total: filtered.length,
                  noun: filtered.length === 1 ? t.fleet.vehicle : t.fleet.vehicles,
                })}
            {cls !== "all" && fmt(t.fleet.inClass, { label: t.vehicleClass[cls as VehicleClass] })}
          </p>

          {/* Sort stays with the results rather than in the rail: it reorders
              what is already there instead of narrowing it. */}
          <label className="flex items-center gap-2 text-sm text-muted">
            {t.fleet.sort}
            <select
              value={sort}
              onChange={(e) => changeSort(e.target.value as SortKey)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink"
            >
              {SORTS.map((so) => (
                <option key={so.key} value={so.key}>
                  {t.fleet[so.labelKey]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div
            id="fleet-results"
            className="rounded-2xl border border-dashed border-line bg-white p-12 text-center"
          >
            <p className="text-sm text-muted">{t.fleet.noMatch}</p>
            <button
              onClick={clearAll}
              className="mt-3 text-sm font-semibold text-accent hover:underline"
            >
              {t.fleet.clearFilters}
            </button>
          </div>
        ) : (
          <>
            {/* Two columns once the rail appears, three only at xl. The rail
                takes 15rem out of the row, and holding three columns at lg
                would squeeze each card below the width its 16:10 image needs
                to stay legible. */}
            <div id="fleet-results" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((v, i) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  priority={i < 3}
                  showSelfDrive={selfDriveEnabled}
                  discount={bestDiscountFor(v, discounts)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                current={current}
                total={totalPages}
                onGo={goToPage}
                hrefFor={urlFor}
                labels={{
                  nav: t.fleet.pagination,
                  prev: t.fleet.pagePrev,
                  next: t.fleet.pageNext,
                  goTo: t.fleet.pageGoTo,
                  summary: t.fleet.pageCurrent,
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** One labelled block in the filter rail, separated by a hairline. */
function RailSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-4 py-3.5 last:border-b-0">
      {title && (
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * A single-choice row. A real radio input, not a styled button: sharing a
 * `name` makes the group one tab stop with arrow-key movement between options,
 * and screen readers announce it as a choice of one rather than as N buttons.
 */
function RailChoice({
  name,
  checked,
  onSelect,
  label,
  count,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition",
        checked ? "bg-band font-medium text-navy" : "text-ink/80 hover:bg-band"
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 shrink-0 accent-navy"
      />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="tabular text-xs text-muted">{count}</span>}
    </label>
  );
}

/**
 * The page numbers to draw: the ends, the current page and its neighbours, with
 * gaps for the rest. A fleet of forty fits on five buttons today, but the list
 * grows with the business and a row of twenty numbers would wrap into the grid.
 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const kept = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const [i, p] of kept.entries()) {
    if (i > 0 && p - (kept[i - 1] as number) > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

/**
 * Pages are links, not buttons.
 *
 * The filters above are buttons because they change a view; moving between
 * pages changes the address, and every address here is one the server can
 * render on its own. So it gets an `<a href>`: crawlers can follow it,
 * cmd-click opens page three in a new tab, and the status bar tells you where
 * you are going. The click handler is the enhancement, not the mechanism —
 * modified clicks fall through to the browser.
 */
function Pagination({
  current,
  total,
  onGo,
  hrefFor,
  labels,
}: {
  current: number;
  total: number;
  onGo: (page: number) => void;
  hrefFor: (page: number) => string;
  labels: { nav: string; prev: string; next: string; goTo: string; summary: string };
}) {
  return (
    <nav aria-label={labels.nav} className="mt-8 flex items-center justify-center gap-1.5">
      <PageLink
        page={current - 1}
        disabled={current === 1}
        label={labels.prev}
        onGo={onGo}
        hrefFor={hrefFor}
        className="px-2.5 sm:px-3"
      >
        <FiChevronLeft aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">{labels.prev}</span>
      </PageLink>

      {/* Numbers where there is room; a plain "Page 2 of 5" on a phone, where
          five tap targets plus two arrows would not fit the row. */}
      <span className="px-3 text-sm text-muted sm:hidden">
        {fmt(labels.summary, { n: current, total })}
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        {pageWindow(current, total).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </span>
          ) : (
            <PageLink
              key={p}
              page={p}
              label={fmt(labels.goTo, { n: p })}
              onGo={onGo}
              hrefFor={hrefFor}
              currentPage={p === current}
              className="min-w-9 justify-center px-2"
            >
              {p}
            </PageLink>
          )
        )}
      </span>

      <PageLink
        page={current + 1}
        disabled={current === total}
        label={labels.next}
        onGo={onGo}
        hrefFor={hrefFor}
        className="px-2.5 sm:px-3"
      >
        <span className="hidden sm:inline">{labels.next}</span>
        <FiChevronRight aria-hidden className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  page,
  label,
  onGo,
  hrefFor,
  disabled = false,
  currentPage = false,
  className,
  children,
}: {
  page: number;
  label: string;
  onGo: (page: number) => void;
  hrefFor: (page: number) => string;
  disabled?: boolean;
  currentPage?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = "inline-flex h-9 items-center gap-1 rounded-lg text-sm font-medium tabular-nums transition";

  // A dead end is a disabled control, not a link to nowhere: no href, so it is
  // skipped by the keyboard and ignored by crawlers.
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className={clsx(base, "cursor-not-allowed border border-line bg-white text-ink/70 opacity-40", className)}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={hrefFor(page)}
      scroll={false}
      aria-label={label}
      aria-current={currentPage ? "page" : undefined}
      onClick={(e) => {
        // Let the browser have cmd/ctrl/shift-click and middle-click.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onGo(page);
      }}
      className={clsx(
        base,
        currentPage
          ? "bg-navy text-white"
          : "border border-line bg-white text-ink/70 hover:border-navy/40 hover:text-navy",
        className
      )}
    >
      {children}
    </Link>
  );
}
