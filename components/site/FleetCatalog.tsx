"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { FiKey, FiSearch, FiX, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { VehicleCard } from "./VehicleCard";
import { bestDiscountFor } from "@/lib/pricing";
import { makeOptions, vehicleMake } from "@/lib/vehicle-make";
import type { Discount } from "@/lib/types";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass, isSelfDriveEligible } from "@/lib/types";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";

type SortKey = "featured" | "price-asc" | "price-desc" | "seats-desc";

/** Three full rows of the three-column grid, so no page ends on a ragged row. */
const PAGE_SIZE = 9;

/** Sort options carry a dictionary key; the label is resolved at render time. */
const SORTS: { key: SortKey; labelKey: "sortFeatured" | "sortPriceAsc" | "sortPriceDesc" | "sortSeatsDesc" }[] = [
  { key: "featured", labelKey: "sortFeatured" },
  { key: "price-asc", labelKey: "sortPriceAsc" },
  { key: "price-desc", labelKey: "sortPriceDesc" },
  { key: "seats-desc", labelKey: "sortSeatsDesc" },
];

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

  // Only show class tabs for classes that actually have vehicles.
  const availableClasses = useMemo(
    () => VEHICLE_CLASSES.filter((c) => vehicles.some((v) => v.class === c)),
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
      if (sort !== "featured") params.set("sort", sort);
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
    setSort("featured");
    setSelfDriveOnly(false);
    setQ("");
    setMakes([]);
    setPage(1);
  };

  return (
    <div>
      {/* Search sits above the class tabs: it searches the whole fleet, not the
          tab in front of it, and reading it first makes that order plain. */}
      <div className="mb-5">
        <label htmlFor="fleet-search" className="sr-only">
          {t.fleet.searchLabel}
        </label>
        <div className="relative">
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            id="fleet-search"
            type="search"
            value={q}
            onChange={(e) => changeQ(e.target.value)}
            placeholder={t.fleet.searchPlaceholder}
            // The count below is a live region, so a screen reader hears how
            // many vehicles are left without leaving the field.
            aria-controls="fleet-results"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-muted focus:border-navy focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => changeQ("")}
              aria-label={t.fleet.searchClear}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-band hover:text-navy"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Class tabs — wrap so every category stays visible at any width;
          no horizontal scroll, nothing hidden off-screen. */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Tab active={cls === "all"} onClick={() => changeCls("all")}>
          {t.vehicleClass.all}
        </Tab>
        {availableClasses.map((c) => (
          <Tab key={c} active={cls === c} onClick={() => changeCls(c)}>
            {t.vehicleClass[c as VehicleClass]}
          </Tab>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {companies.length > 1 && (
          <CompanyFilter
            options={companies}
            selected={makes}
            onChange={changeMakes}
            label={t.fleet.company}
            allLabel={t.fleet.allCompanies}
            countLabel={t.fleet.companiesSelected}
            clearLabel={t.fleet.clearFilters}
          />
        )}

        <label className="flex items-center gap-2 text-sm text-muted">
          {t.fleet.minSeats}
          <select
            value={seats}
            onChange={(e) => changeSeats(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink"
          >
            <option value="any">{t.fleet.any}</option>
            <option value="4">4+</option>
            <option value="7">7+</option>
            <option value="12">12+</option>
            <option value="22">22+</option>
          </select>
        </label>

        {selfDriveEnabled && (
          <button
            type="button"
            onClick={toggleSelfDrive}
            aria-pressed={selfDriveOnly}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
              selfDriveOnly
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-line bg-white text-ink/70 hover:text-navy"
            )}
          >
            <FiKey className="h-3.5 w-3.5" /> {t.fleet.selfDriveAvailable}
          </button>
        )}

        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          {t.fleet.sort}
          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {t.fleet[s.labelKey]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* The anchor a page change scrolls to — above the count, so the new
          page announces its own range. */}
      <div ref={resultsTop} className="scroll-mt-24" />

      <p className="mb-4 text-sm text-muted" aria-live="polite">
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

      {filtered.length === 0 ? (
        <div id="fleet-results" className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="text-sm text-muted">{t.fleet.noMatch}</p>
          <button onClick={clearAll} className="mt-3 text-sm font-semibold text-accent hover:underline">
            {t.fleet.clearFilters}
          </button>
        </div>
      ) : (
        <>
          <div id="fleet-results" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

/**
 * Company picker — a checkbox list behind a button.
 *
 * Not the class tabs' chip treatment: there are fifteen companies against nine
 * classes, and a fourth row of chips would push the fleet itself below the fold.
 * Not a native `<select multiple>` either — on a phone that is a scroll trap,
 * and it cannot show the per-company counts that tell someone whether a filter
 * is worth applying.
 */
function CompanyFilter({
  options,
  selected,
  onChange,
  label,
  allLabel,
  countLabel,
  clearLabel,
}: {
  options: { make: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
  label: string;
  allLabel: string;
  countLabel: string;
  clearLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape. Bound only while open, so the page is not
  // carrying two document listeners for a panel nobody has opened.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (make: string) =>
    onChange(
      selected.includes(make) ? selected.filter((m) => m !== make) : [...selected, make]
    );

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? selected[0]
        : fmt(countLabel, { n: selected.length });

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm transition",
          selected.length ? "border-navy text-navy" : "border-line text-ink/70 hover:text-navy"
        )}
      >
        <span className="text-muted">{label}</span>
        <span className="font-medium">{summary}</span>
        <FiChevronDown
          aria-hidden
          className={clsx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="group"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lift"
        >
          {options.map(({ make, count }) => (
            <label
              key={make}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-band"
            >
              <input
                type="checkbox"
                checked={selected.includes(make)}
                onChange={() => toggle(make)}
                className="h-4 w-4 shrink-0 accent-navy"
              />
              <span className="flex-1 truncate">{make}</span>
              <span className="tabular text-xs text-muted">{count}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-accent hover:bg-band"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "rounded-full px-3 py-1.5 text-[13px] font-medium transition sm:px-4 sm:py-2 sm:text-sm",
        active
          ? "bg-navy text-white"
          : "border border-line bg-white text-ink/70 hover:border-navy/40 hover:text-navy"
      )}
    >
      {children}
    </button>
  );
}
