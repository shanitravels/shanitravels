import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { formatRateCell } from "@/lib/format";
import { VehicleClassIcon } from "./VehicleClassIcon";
import { CLASS_IMAGE } from "@/lib/vehicle-art";
import { VEHICLE_CLASSES, type Vehicle, type VehicleClass } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

interface Category {
  cls: VehicleClass;
  count: number;
  fromPerDay: number | null;
}

/**
 * Homepage fleet catalog — one card per vehicle class, each deep-linking into
 * the fleet page with that class pre-selected (`/fleet?class=economy`).
 * Classes with no active vehicles are omitted so a card never leads nowhere.
 *
 * Two marks per card, doing different jobs: the silhouette badge names the body
 * shape at a glance even before the photograph loads, and the photograph is the
 * actual vehicle. Brand colour stays sparing — navy for structure, accent red on
 * the badge, the rule, the price and the arrow.
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
    /* Seven across only from xl. At lg a seven-column grid left each card
       129px wide — under the ~120px of inner width where "Event Transport"
       starts breaking mid-word — so it steps 2 / 3 / 4 / 7.

       Wrapped flex rather than a grid, matching LogoRow and RateCategories:
       seven cards over four columns leaves a short last row, and only a flex
       row can centre one. Widths mirror the columns, each subtracting its
       share of the 0.75rem gap — gap x (columns - 1) / columns. */
    <ul className="flex flex-wrap justify-center gap-3">
      {categories.map((cat) => (
        <li
          key={cat.cls}
          className="flex w-[calc(50%-0.38rem)] sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.57rem)] xl:w-[calc(14.285%-0.65rem)]"
        >
          <Link
            href={`/fleet?class=${cat.cls}`}
            className="group relative flex w-full flex-col items-center rounded-2xl border border-line bg-white px-3 pb-4 pt-4 text-center shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lift"
          >
            {/* Silhouette badge, top-left as in the design. Absolute so it never
                pushes the photograph off the card's vertical centre. */}
            <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
              <VehicleClassIcon cls={cat.cls} className="block w-5 [&>svg]:h-auto [&>svg]:w-full" />
            </span>

            {/* mt-9 clears the badge; the photograph still reads as centred
                because the badge is out of flow. */}
            <span className="relative mt-9 h-20 w-full">
              <Image
                src={CLASS_IMAGE[cat.cls]}
                alt=""
                fill
                sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 45vw"
                // Local /public asset: the Cloudinary loader passes it through
                // with no width to resolve. See lib/cloudinary-loader.ts.
                unoptimized
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </span>

            <span className="mt-3 font-heading text-sm font-bold leading-tight text-navy">
              {t.vehicleClass[cat.cls]}
            </span>
            <span aria-hidden className="mt-2 h-0.5 w-8 rounded-full bg-accent" />

            <span className="mt-2 text-[11px] leading-tight text-muted">
              {cat.fromPerDay != null ? (
                <>
                  {cat.count} {cat.count === 1 ? t.fleet.vehicle : t.fleet.vehicles} ·{" "}
                  {t.common.fromLower}{" "}
                  <span className="font-semibold text-accent">
                    PKR {formatRateCell(cat.fromPerDay)}
                  </span>
                </>
              ) : (
                <>
                  {cat.count} {cat.count === 1 ? t.fleet.vehicle : t.fleet.vehicles}
                </>
              )}
            </span>

            {/* mt-auto pins the arrow to the bottom so it lines up across cards
                whose meta line wraps to a different number of rows. The padding
                lives on the wrapper — putting it on the circle would inflate it. */}
            <span className="mt-auto pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
