import type { VehicleClass } from "@/lib/types";

/**
 * Cutout photograph per vehicle class, from /public/fleet.
 *
 * These are the shadow-stripped, tightly cropped versions produced by
 * `npm run fleet:art`; the originals in /public still carry the baked-in
 * ground shadow and a wide transparent margin. Re-run that script if the
 * source artwork is ever replaced.
 *
 * Spaces are percent-encoded here rather than by renaming the files: these are
 * the artwork as supplied, and a raw space in a URL is the kind of thing that
 * works locally and 404s behind a stricter server.
 *
 * Shared rather than declared per component — the homepage catalog and the rate
 * card both draw the same classes, and two copies of this map is two chances
 * for one of them to point at a file that no longer exists.
 */
export const CLASS_IMAGE: Record<VehicleClass, string> = {
  economy: "/fleet/Economy.png",
  sedan: "/fleet/Sedan.png",
  suv: "/fleet/SUV.png",
  event: "/fleet/Event%20Transport.png",
  vip: "/fleet/Executive.png",
  specialized: "/fleet/Specialized.png",
  logistics: "/fleet/Logistics.png",
};
