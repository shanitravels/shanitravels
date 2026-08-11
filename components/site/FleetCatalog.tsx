"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { FiKey, FiSearch, FiX, FiChevronDown } from "react-icons/fi";
import { VehicleCard } from "./VehicleCard";
import { bestDiscountFor } from "@/lib/pricing";
import { makeOptions, vehicleMake } from "@/lib/vehicle-make";
import type { Discount } from "@/lib/types";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass, isSelfDriveEligible } from "@/lib/types";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";

type SortKey = "featured" | "price-asc" | "price-desc" | "seats-desc";

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

  // Companies present in the fleet, with a count each.
  const companies = useMemo(() => makeOptions(vehicles.map((v) => v.name)), [vehicles]);

  // A company named in the URL that no longer has vehicles is dropped on the
  // way in. Keeping it would filter the grid down to nothing with no checked
  // box on screen to explain why.
  const [makes, setMakes] = useState<string[]>(() =>
    initial.makes.filter((m) => companies.some((c) => c.make === m))
  );

  // Mirror filter state into the URL (replace, so filtering doesn't spam history).
  // A ref skips the first run so we don't rewrite the URL we just arrived on.
  // Debounced because the query changes on every keystroke, and a router call
  // per character is both wasteful and visibly janky.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (cls !== "all") params.set("class", cls);
      if (seats !== "any") params.set("seats", seats);
      if (sort !== "featured") params.set("sort", sort);
      if (selfDriveOnly) params.set("selfdrive", "1");
      if (q.trim()) params.set("q", q.trim());
      if (makes.length) params.set("make", makes.join(","));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cls, seats, sort, selfDriveOnly, q, makes, pathname, router]);

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

  const clearAll = () => {
    setCls("all");
    setSeats("any");
    setSort("featured");
    setSelfDriveOnly(false);
    setQ("");
    setMakes([]);
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
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.fleet.searchPlaceholder}
            // The count below is a live region, so a screen reader hears how
            // many vehicles are left without leaving the field.
            aria-controls="fleet-results"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-muted focus:border-navy focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
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
        <Tab active={cls === "all"} onClick={() => setCls("all")}>
          {t.vehicleClass.all}
        </Tab>
        {availableClasses.map((c) => (
          <Tab key={c} active={cls === c} onClick={() => setCls(c)}>
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
            onChange={setMakes}
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
            onChange={(e) => setSeats(e.target.value)}
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
            onClick={() => setSelfDriveOnly((v) => !v)}
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
            onChange={(e) => setSort(e.target.value as SortKey)}
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

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {t.fleet.showing}{" "}
        <span className="font-semibold text-navy tabular">{filtered.length}</span>{" "}
        {filtered.length === 1 ? t.fleet.vehicle : t.fleet.vehicles}
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
        <div id="fleet-results" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              priority={i < 3}
              showSelfDrive={selfDriveEnabled}
              discount={bestDiscountFor(v, discounts)}
            />
          ))}
        </div>
      )}
    </div>
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
