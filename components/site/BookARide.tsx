import type { ReactNode } from "react";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { FiPhone, FiMail } from "react-icons/fi";
import { telHref, whatsappHref, mailtoHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";


type ActionKey = {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: ReactNode;
  /** Icon tint + the dimmed background the key drops to while held. */
  tint: string;
  external?: boolean;
};

/** Tailwind needs literal class names, so the column count is mapped, not built. */
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/**
 * "Book a ride" — oval logo, title, and the three contact channels as pill keys.
 *
 * The keys sit in a recessed well and are pressed by `.press-key` (globals.css):
 * holding one sinks it, shrinks it to 96%, dims it to its channel tint and flips
 * its drop shadow inward, all in the same 70ms. Channels absent from settings
 * are dropped and the row re-columns around what remains.
 */
export async function BookARide({
  whatsapp,
  helpline,
  email,
  logoSrc = "/logo.png",
  logoAlt,
  title,
  description,
  message,
  className,
}: {
  whatsapp?: string;
  helpline?: string;
  email?: string;
  logoSrc?: string;
  logoAlt?: string;
  title?: string;
  description?: string;
  message?: string;
  className?: string;
}) {
  const { t } = await getI18n();

  // Props still win when a caller passes copy explicitly; the dictionary only
  // supplies the default, which is why these are no longer default parameters.
  const resolvedLogoAlt = logoAlt ?? t.nav.brandName;
  const resolvedTitle = title ?? t.bookARide.title;
  const resolvedDescription = description ?? t.bookARide.description;
  const resolvedMessage = message ?? t.bookARide.defaultMessage;

  const keys: ActionKey[] = [];

  if (whatsapp) {
    keys.push({
      id: "whatsapp",
      label: t.nav.whatsapp,
      hint: whatsapp,
      href: whatsappHref(whatsapp, resolvedMessage),
      icon: <FaWhatsapp />,
      tint: "text-[#128C4A] [--press-bg-down:#e6f6ec]",
      external: true,
    });
  }

  if (helpline) {
    keys.push({
      id: "call",
      label: t.nav.call,
      hint: helpline,
      href: telHref(helpline),
      icon: <FiPhone />,
      tint: "text-navy [--press-bg-down:#e4eaf3]",
    });
  }

  if (email) {
    keys.push({
      id: "email",
      label: t.bookARide.email,
      hint: email,
      href: mailtoHref(email, t.bookARide.emailSubject, resolvedMessage),
      icon: <FiMail />,
      tint: "text-accent [--press-bg-down:#fbe8eb]",
    });
  }

  if (keys.length === 0) return null;

  return (
    <section className={cn("mx-auto w-full max-w-3xl px-4 sm:px-6", className)}>
      <div className="flex flex-col items-center text-center">
        {/* No frame: logo.png is genuinely transparent (verified — corners are
            rgba(0,0,0,0)), so it sits directly on the page background. The mark
            is already an oval, which is what the frame was duplicating. */}
        <Image
          src={logoSrc}
          alt={resolvedLogoAlt}
          width={247}
          height={160}
          // Local /public asset: the Cloudinary loader passes it through, so
          // there is no width to resolve. See lib/cloudinary-loader.ts.
          unoptimized={logoSrc.startsWith("/")}
          className="h-auto w-auto max-h-24 object-contain sm:max-h-32"
        />

        <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          {resolvedTitle}
        </h2>
        <span className="section-heading-line mt-3" />
        {description && (
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            {resolvedDescription}
          </p>
        )}
      </div>

      {/* The well the keys sink into */}
      <div className="mt-7 rounded-full border border-line bg-band p-2 shadow-[inset_0_2px_8px_rgba(11,36,71,0.10)] sm:p-2.5">
        <div className={cn("grid gap-2 sm:gap-2.5", COLS[keys.length])}>
          {keys.map((k) => (
            <a
              key={k.id}
              href={k.href}
              {...(k.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={`${k.label} — ${k.hint}`}
              title={k.hint}
              className={cn(
                "press-key flex items-center justify-center gap-1.5 rounded-full px-2 py-3.5 sm:gap-2 sm:px-4 sm:py-4",
                k.tint
              )}
            >
              <span className="text-base sm:text-lg">{k.icon}</span>
              <span className="font-heading text-xs font-semibold leading-none tracking-tight sm:text-sm">
                {k.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
