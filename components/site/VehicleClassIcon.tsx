import type { VehicleClass } from "@/lib/types";

/**
 * Vehicle-class icons as bold solid silhouettes on a shared 64×30 viewBox.
 *
 * Solid rather than line art on purpose: these render at roughly 56px, where
 * thin strokes and interior detail turn muddy. Windows are knocked out with
 * `fill-rule="evenodd"` so they read as true holes on any background — the
 * icon tile changes colour on hover, so a painted-on window would break.
 *
 * Classes are separated by silhouette first (length, roof height, body shape),
 * then by a mark that carries meaning where two outlines would still be close:
 * a roof rack on the SUV, a star on the executive saloon, a shield on the
 * armoured vehicle. All face right; wheels sit on a common baseline.
 */

const base = {
  viewBox: "0 0 64 30",
  fill: "currentColor",
  fillRule: "evenodd" as const,
  clipRule: "evenodd" as const,
};

/** Economy — short hatchback: compact body, tall cabin, steep tail. */
function Economy() {
  return (
    <svg {...base} aria-hidden>
      <path d="M11 22V15.6c0-.7.5-1.3 1.2-1.5l5.2-1.2 4.6-5.8c.5-.7 1.3-1.1 2.2-1.1h11c.9 0 1.7.4 2.2 1.1l4.6 5.8 5.2 1.2c.7.2 1.2.8 1.2 1.5V22H11Zm13-12.9-2.9 3.8h5.6V9.1H24Zm5.6 0v3.8h6.7l-2.9-3.8h-3.8Z" />
      <circle cx="19" cy="22.4" r="4.4" />
      <circle cx="41" cy="22.4" r="4.4" />
    </svg>
  );
}

/** Sedan — long, low three-box saloon with extended bonnet and boot. */
function Sedan() {
  return (
    <svg {...base} aria-hidden>
      <path d="M4 22v-5.2c0-.8.5-1.4 1.3-1.6l10.4-2.1 7.6-5.6c.5-.4 1.2-.6 1.9-.6h11.4c.7 0 1.4.2 2 .7l7.4 5.5 10.6 2.1c.8.2 1.4.9 1.4 1.6V22H4Zm21-13.2-4.6 3.4h6.2V8.8H25Zm5 0v3.4h9.2l-4.6-3.4H30Z" />
      <circle cx="17" cy="22.4" r="4.4" />
      <circle cx="47" cy="22.4" r="4.4" />
    </svg>
  );
}

/** SUV / 4x4 — tall boxy wagon, roof rack, chunky wheels. */
function Suv() {
  return (
    <svg {...base} aria-hidden>
      <path d="M20.5 2h23v2h-23V2Zm1.6 2h2v2.6h-2V4Zm18.2 0h2v2.6h-2V4Z" />
      <path d="M9 21.6v-8.4c0-.8.5-1.4 1.3-1.6l5.4-1.3 4.6-4.6c.4-.4 1-.7 1.7-.7h18.6c.7 0 1.3.3 1.8.7l4.9 4.6 5.4 1.3c.8.2 1.3.8 1.3 1.6v8.4H9Zm13-14.4-3 3.4h5.8V7.2H22Zm5.8 0v3.4h8.9l-2.9-3.4h-6Z" />
      <circle cx="18" cy="22" r="4.8" />
      <circle cx="46" cy="22" r="4.8" />
    </svg>
  );
}

/** Event transport — bus / coaster: flat roof, full window band. */
function EventTransport() {
  return (
    <svg {...base} aria-hidden>
      <path d="M5 21.4V6.2C5 4.4 6.4 3 8.2 3h47.6C57.6 3 59 4.4 59 6.2v15.2H5ZM9.6 7.2v6.4h9V7.2h-9Zm12.8 0v6.4h9V7.2h-9Zm12.8 0v6.4h9V7.2h-9Zm12.8 0v6.4h6.4V7.2h-6.4Z" />
      <circle cx="16" cy="21.8" r="4.4" />
      <circle cx="48" cy="21.8" r="4.4" />
    </svg>
  );
}

/** Executive — longest, lowest limousine, three windows, star for protocol. */
function Executive() {
  return (
    <svg {...base} aria-hidden>
      <path d="M2 22.4v-4.6c0-.8.6-1.5 1.4-1.6l11-2.2 8.4-6.2c.5-.4 1.1-.6 1.8-.6h14c.7 0 1.4.2 1.9.7l8.2 6.1 10.9 2.2c.8.1 1.4.8 1.4 1.6v4.6H2Zm22.4-12.6-4.6 3.6h6.4V9.8h-1.8Zm4.4 0v3.6h7.4V9.8h-7.4Zm10 0v3.6h8.4l-4.8-3.6h-3.6Z" />
      <circle cx="15" cy="22.8" r="4.2" />
      <circle cx="48" cy="22.8" r="4.2" />
      <path d="m55.6 1.6 1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4 1.3-2.7Z" />
    </svg>
  );
}

/**
 * Specialized — armoured 4x4. Heavy boxy stance (no roof rack, so it can't be
 * confused with the SUV) and narrow window slits, which is both authentic to
 * an armoured build and the clearest way to separate it at icon size. The
 * shield is drawn large enough to read as a shield rather than a blob.
 */
function Armored() {
  return (
    <svg {...base} aria-hidden>
      <path d="M5 21.6v-8.2c0-.8.5-1.4 1.3-1.6l5-1.2 4.4-4.5c.4-.5 1-.7 1.7-.7h16.4c.7 0 1.3.2 1.8.7l4.5 4.5 5 1.2c.8.2 1.3.8 1.3 1.6v8.2H5Zm12-13.8-2.4 2.8h4.8V7.8H17Zm4.8 0v2.8h7.4l-2.4-2.8h-5Z" />
      <circle cx="14" cy="22" r="4.8" />
      <circle cx="37" cy="22" r="4.8" />
      <path d="M53.4 1.4 60 3.7v4.5c0 3.7-3.9 6.2-6.6 7.1-2.7-.9-6.6-3.4-6.6-7.1V3.7l6.6-2.3Z" />
    </svg>
  );
}

/** Logistics — box truck: tall cargo body behind a stepped cab. */
function Logistics() {
  return (
    <svg {...base} aria-hidden>
      <path d="M3 21.4V5.4c0-1.3 1-2.4 2.4-2.4h27.2c1.3 0 2.4 1 2.4 2.4v16H3Z" />
      <path d="M37 21.4V8.4h10.2l7.8 6.8v6.2H37Zm10-11v4.2h5.4L47.6 10.4H47Z" />
      <circle cx="14" cy="21.8" r="4.4" />
      <circle cx="47" cy="21.8" r="4.4" />
    </svg>
  );
}

const ICONS: Record<VehicleClass, () => React.ReactElement> = {
  economy: Economy,
  sedan: Sedan,
  suv: Suv,
  event: EventTransport,
  vip: Executive,
  specialized: Armored,
  logistics: Logistics,
};

export function VehicleClassIcon({
  cls,
  className,
}: {
  cls: VehicleClass;
  className?: string;
}) {
  const Icon = ICONS[cls] ?? Sedan;
  return (
    <span className={className}>
      <Icon />
    </span>
  );
}
