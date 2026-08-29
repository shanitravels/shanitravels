"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackConversion } from "./track";
import type { ConversionKind } from "@/lib/types";

/**
 * An outbound contact link that records the tap before handing off.
 *
 * A drop-in replacement for `<a href={whatsappHref(...)}>` — it takes the same
 * anchor props, so a server component can keep rendering its own markup and
 * only the click handling crosses into the client.
 *
 * The tracking is a `sendBeacon` (see ./track.ts), which the browser
 * delivers even though the page is unloading. Nothing is awaited and nothing is
 * prevented: the navigation happens exactly as it would on a plain anchor, and
 * if tracking fails the visitor never knows.
 */
export function ContactLink({
  kind,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { kind: ConversionKind }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackConversion(kind);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
