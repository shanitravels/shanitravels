import Link from "next/link";
import { formatRateCell } from "@/lib/format";
import { VehicleClassIcon } from "./VehicleClassIcon";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

interface Category {
  cls: VehicleClass;
  count: number;
  fromPerDay: number | null;
}

/**
 * Homepage fleet catalog — one icon card per vehicle class, each deep-linking
 * into the fleet page with that class pre-selected (`/fleet?class=economy`).
 * Classes with no active vehicles are omitted so a card never leads nowhere.
 *
 * Brand colour is applied sparingly, matching the wider system: navy carries
 * the structure (icon tile, labels), accent red marks only the price and the
 * hover state — the two things we want the eye to catch.
 */
export async function FleetCategories({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = await getI18n();
  const categories: Category[] = VEHICLE_CLASSES.map((cls) => {
    const inClass = vehicles.filter((v) => v.class === cls);
    const priced = inClass.map((v) => v.rates.perDay).filter((n): n is number => n != null);
    return {
      cls,
      count: inClass.length,
      fromPerDay: priced.length ? Math.min(...priced) : null,
    };
  }).filter((c) => c.count > 0);

  if (categories.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {categories.map((cat) => (
        <li key={cat.cls}>
          <Link
            href={`/fleet?class=${cat.cls}`}
            className="group relative flex h-full flex-col items-center justify-start overflow-hidden rounded-2xl border border-line bg-white px-3 pb-5 pt-5 text-center shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-lift"
          >
            {/* Icon tile — soft navy wash, filling to solid navy on hover */}
            <span className="flex h-16 w-20 items-center justify-center rounded-xl bg-navy/[0.06] text-navy transition-colors duration-300 group-hover:bg-navy group-hover:text-white">
              <VehicleClassIcon cls={cat.cls} className="block w-14 [&>svg]:h-auto [&>svg]:w-full" />
            </span>

            <span className="mt-3 text-sm font-semibold leading-tight text-navy">
              {t.vehicleClass[cat.cls]}
            </span>

            {cat.fromPerDay != null ? (
              <span className="mt-1 text-[11px] text-muted">
                {cat.count} · {t.common.fromLower}{" "}
                <span className="font-semibold text-accent">
                  PKR {formatRateCell(cat.fromPerDay)}
                </span>
              </span>
            ) : (
              <span className="mt-1 text-[11px] text-muted">
                {cat.count} {cat.count === 1 ? t.fleet.vehicle : t.fleet.vehicles}
              </span>
            )}

            {/* Accent underline sweeps in on hover */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
