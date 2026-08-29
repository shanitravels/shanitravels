import Link from "next/link";
import {
  TbBuildingBank,
  TbBuildingFactory2,
  TbBuildingSkyscraper,
  TbCar,
  TbCompass,
  TbConfetti,
  TbCrown,
  TbHeartHandshake,
  TbPlane,
  TbPlaneInflight,
  TbRoute,
  TbShieldLock,
  TbSteeringWheel,
  TbUsers,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import type { Service } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

/**
 * One icon per service, keyed by slug.
 *
 * Keyed rather than stored on the Service model: the icon is presentation, and
 * an admin adding a service should not have to pick one for the page to work.
 * Anything unmapped falls back to the car, which is never wrong for a transport
 * service — only less specific.
 */
const SERVICE_ICONS: Record<string, IconType> = {
  "airport-transfers": TbPlane,
  "airline-crew-transportation": TbPlaneInflight,
  "corporate-car-rental": TbBuildingSkyscraper,
  "event-transportation": TbConfetti,
  "executive-vip-transport": TbCrown,
  "government-transport": TbBuildingBank,
  "intercity-travel": TbRoute,
  "ngo-transport": TbHeartHandshake,
  "project-site-transportation": TbBuildingFactory2,
  "secure-specialized-transport": TbShieldLock,
  "self-drive-rental": TbSteeringWheel,
  "staff-transportation": TbUsers,
  "tourism-leisure": TbCompass,
};

/** How many fit one row at the widest step without the titles wrapping oddly. */
const MAX_SHOWN = 6;

/**
 * Homepage services module — six icon cards, each opening its service page.
 *
 * A curated slice rather than the whole list: there are thirteen services, and
 * a homepage teaser that prints all of them stops being a teaser. The full set
 * lives on /services, which the section links to.
 */
export async function ServiceHighlights({ services }: { services: Service[] }) {
  const { t } = await getI18n();
  const shown = services.slice(0, MAX_SHOWN);
  if (shown.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {shown.map((s) => {
        const Icon = SERVICE_ICONS[s.slug] ?? TbCar;
        return (
          <li key={s.id} className="flex">
            <Link
              href={`/services/${s.slug}`}
              className="group flex w-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lift"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                {/* Decorative flourish trailing the badge, as in the design.
                    Hidden from assistive tech and dropped on narrow cards where
                    it would crowd the badge. */}
                <svg
                  aria-hidden
                  viewBox="0 0 64 34"
                  fill="none"
                  className="mt-1 hidden h-6 w-14 shrink-0 text-accent/35 sm:block"
                >
                  <path
                    d="M1 3c14 0 24 6 33 14 5 4.5 12 10 29 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="3 5"
                  />
                </svg>
              </span>

              <h3 className="mt-5 font-heading text-sm font-bold leading-snug text-navy">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.summary}</p>
              <span className="sr-only">{t.common.learnMore}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
