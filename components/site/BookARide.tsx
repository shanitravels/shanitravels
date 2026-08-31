import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { FiPhone, FiMail, FiChevronRight, FiMapPin } from "react-icons/fi";
import { TbShieldCheck, TbTag, TbClock, TbHeadset } from "react-icons/tb";
import { telHref, whatsappHref, mailtoHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { ContactLink } from "./ContactLink";
import { SOCIAL_ICONS, type SocialLinkItem } from "@/lib/social-links";
import type { ConversionKind } from "@/lib/types";

/**
 * Supplied backdrop artwork, if it has been dropped into /public.
 *
 * Checked once at module load rather than per render — the filesystem does not
 * change under a running server, and this is server-only code.
 *
 * The point of the check is that the drawn `BlueprintCity` below stays as the
 * fallback: add the files and the panel upgrades to them on the next restart,
 * remove them and it falls back rather than rendering two broken images.
 */
const BACKDROP_ART = { left: "/book-left.png", right: "/book-right.png" } as const;

const hasBackdropArt =
  existsSync(join(process.cwd(), "public", "book-left.png")) &&
  existsSync(join(process.cwd(), "public", "book-right.png"));

/**
 * One booking channel. `id` doubles as the conversion kind, so the tracking
 * beacon and the card can never disagree about what was clicked.
 */
interface Channel {
  id: ConversionKind;
  title: string;
  description: string;
  /** The number or address itself — the accessible name, and the tooltip. */
  hint: string;
  badge: string;
  href: string;
  icon: ReactNode;
  /** Per-channel colour: rail, icon disc, title, chevron and badge. */
  rail: string;
  disc: string;
  text: string;
  badgeTint: string;
  external?: boolean;
}

/**
 * "Book a ride" — the three contact channels as cards, with the social
 * accounts beneath and the service promises along the bottom.
 *
 * Every channel a visitor might reach for is in one place, which is the point:
 * this sits at the bottom of the homepage, where someone who has finished
 * reading wants to make contact and should not have to hunt for the footer.
 *
 * Channels absent from settings are dropped and the row re-columns around
 * whatever remains.
 */
export async function BookARide({
  whatsapp,
  helpline,
  email,
  socials = [],
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
  /** Built by `socialLinks()` on the server — see lib/social-links.ts. */
  socials?: SocialLinkItem[];
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

  const channels: Channel[] = [];

  if (whatsapp) {
    channels.push({
      id: "whatsapp",
      title: t.bookARide.whatsappTitle,
      description: t.bookARide.whatsappDesc,
      hint: whatsapp,
      badge: t.bookARide.whatsappBadge,
      href: whatsappHref(whatsapp, resolvedMessage),
      icon: <FaWhatsapp />,
      rail: "bg-[#128C4A]",
      disc: "bg-[#128C4A]/10 text-[#128C4A]",
      text: "text-[#128C4A]",
      badgeTint: "bg-[#128C4A]/10 text-[#128C4A]",
      external: true,
    });
  }

  if (helpline) {
    channels.push({
      id: "call",
      title: t.bookARide.callTitle,
      description: t.bookARide.callDesc,
      hint: helpline,
      badge: t.bookARide.callBadge,
      href: telHref(helpline),
      icon: <FiPhone />,
      rail: "bg-navy",
      disc: "bg-navy/10 text-navy",
      text: "text-navy",
      badgeTint: "bg-navy/10 text-navy",
    });
  }

  if (email) {
    channels.push({
      id: "email",
      title: t.bookARide.emailTitle,
      description: t.bookARide.emailDesc,
      hint: email,
      badge: t.bookARide.emailBadge,
      // Address only, no subject or body: an email client opens a full
      // composer, and pre-filling it means the sender deletes our words before
      // writing their own.
      href: mailtoHref(email),
      icon: <FiMail />,
      rail: "bg-accent",
      disc: "bg-accent/10 text-accent",
      text: "text-accent",
      badgeTint: "bg-accent/10 text-accent",
    });
  }

  if (channels.length === 0) return null;

  const promises = [
    { Icon: TbShieldCheck, title: t.bookARide.trustSafeTitle, desc: t.bookARide.trustSafeDesc },
    { Icon: TbTag, title: t.bookARide.trustPriceTitle, desc: t.bookARide.trustPriceDesc },
    { Icon: TbClock, title: t.bookARide.trustTimeTitle, desc: t.bookARide.trustTimeDesc },
    { Icon: TbHeadset, title: t.bookARide.trustAlwaysTitle, desc: t.bookARide.trustAlwaysDesc },
  ];

  // WhatsApp already has a card of its own; repeating it in the social row
  // would offer the same destination twice.
  const otherSocials = socials.filter((s) => s.key !== "whatsapp");

  return (
    <section className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white to-band/60 px-4 py-10 shadow-card sm:px-8 sm:py-12">
        {/* Decoration: two blueprint cities, a dashed route arcing between
            them, and a pin at each end. aria-hidden and clipped by the panel,
            so it can neither be read out nor widen the page. Hidden on small
            screens, where it would sit under the copy. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {hasBackdropArt ? (
            <>
              <Image
                src={BACKDROP_ART.left}
                alt=""
                width={420}
                height={340}
                unoptimized
                className="absolute -left-6 top-2 w-[22rem] object-contain xl:w-[26rem]"
              />
              <Image
                src={BACKDROP_ART.right}
                alt=""
                width={420}
                height={340}
                unoptimized
                className="absolute -right-6 top-2 w-[22rem] object-contain xl:w-[26rem]"
              />
            </>
          ) : (
            <>
              {/* Fallback until the supplied artwork is added. Anchored to the
                  top and sized generously — smaller reads as clip-art in the
                  corners rather than as a backdrop. */}
              <BlueprintCity className="absolute -left-10 top-4 w-[22rem] text-navy/[0.11] xl:w-[26rem]" />
              {/* Mirrored, so the far city is not a copy of the near one. */}
              <BlueprintCity className="absolute -right-10 top-4 w-[22rem] -scale-x-100 text-navy/[0.11] xl:w-[26rem]" />
            </>
          )}

          {/* Drawn route and pins belong to the fallback only — the supplied
              artwork carries its own. */}
          {!hasBackdropArt && (
            <>
              <svg
                viewBox="0 0 1000 130"
                fill="none"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-8 h-28 w-full text-navy/25"
              >
                <path
                  d="M150 104C270 104 340 26 500 26s230 78 350 78"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5 7"
                  strokeLinecap="round"
                />
              </svg>
              <FiMapPin className="absolute left-[14%] top-[4.5rem] h-8 w-8 text-navy/30" />
              <FiMapPin className="absolute right-[14%] top-[4.5rem] h-8 w-8 text-navy/30" />
            </>
          )}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute right-8 top-8 hidden h-16 w-16 lg:block"
          style={{
            backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
            backgroundSize: "11px 11px",
            color: "rgba(11,36,71,0.12)",
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* No frame: logo.png is genuinely transparent, so it sits directly
              on the panel. The mark is already an oval. */}
          <Image
            src={logoSrc}
            alt={resolvedLogoAlt}
            width={247}
            height={160}
            // Local /public asset: the Cloudinary loader passes it through, so
            // there is no width to resolve. See lib/cloudinary-loader.ts.
            unoptimized={logoSrc.startsWith("/")}
            className="h-auto w-auto max-h-20 object-contain sm:max-h-28"
          />

          <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">
            {resolvedTitle}
          </h2>
          <span className="section-heading-line mt-3" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {resolvedDescription}
          </p>
        </div>

        {/* Channels */}
        <ul className="relative mt-8 grid gap-4 md:grid-cols-3">
          {channels.map((c) => (
            <li key={c.id} className="flex flex-col items-center">
              <ContactLink
                kind={c.id}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={`${c.title} — ${c.hint}`}
                title={c.hint}
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-line bg-white py-4 pl-5 pr-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                {/* The coloured rail is what identifies the channel at a
                    glance, so it is a block rather than a border — a border
                    would be lost against the card's own. */}
                <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", c.rail)} />
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl",
                    c.disc
                  )}
                >
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className={cn("block font-heading text-base font-bold", c.text)}>
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                    {c.description}
                  </span>
                </span>
                <FiChevronRight
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5",
                    c.text
                  )}
                  aria-hidden
                />
              </ContactLink>

              <span
                className={cn(
                  "mt-3 rounded-full px-3 py-1 text-[11px] font-semibold",
                  c.badgeTint
                )}
              >
                {c.badge}
              </span>
            </li>
          ))}
        </ul>

        {/* Socials — the remaining channels, so every way to reach us is in
            one place rather than only in the footer. */}
        {otherSocials.length > 0 && (
          <div className="relative mt-8 flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {t.bookARide.followUs}
            </span>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {otherSocials.map(({ key, label, href }) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-card transition hover:border-accent hover:text-accent"
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Service promises */}
        <ul className="relative mt-8 grid gap-5 rounded-2xl border border-line bg-white px-5 py-5 shadow-card sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
          {promises.map(({ Icon, title: pTitle, desc }, i) => (
            <li
              key={pTitle}
              className={cn("flex items-center gap-3", i > 0 && "lg:pl-5")}
            >
              <Icon className="h-8 w-8 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-navy">
                  {pTitle}
                </span>
                <span className="block text-xs leading-snug text-muted">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Blueprint backdrop: a city skyline with a saloon outlined in front of it.
 *
 * Line art rather than a photograph — at the opacity this sits behind the
 * panel's copy a photograph turns to mud, whereas strokes stay legible as
 * shapes. Drawn once and mirrored for the right-hand side, so the two ends of
 * the route read as two cities rather than the same one twice.
 *
 * Deliberately no ground line: a stroke spanning the full width read as a rule
 * drawn across the panel rather than as a horizon.
 *
 * Decorative: the caller marks the wrapper aria-hidden.
 */
function BlueprintCity({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 170" fill="none" className={className}>
      {/* Skyline — separate blocks with window rows, so it reads as buildings
          rather than a bar chart. Lighter stroke than the car, so the car
          stays in front of it. */}
      <g opacity="0.55" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M10 150V96h18v-14h10v14h16V70h22v80" />
        <path d="M76 150V58h26v-12h8v12h24v92" />
        <path d="M134 150V88h30v-18h9v18h27v62" />
        <path d="M200 150V64h22v92" />
        <path d="M222 150V102h34v48" />
        <g strokeWidth="0.9" opacity="0.8">
          <path d="M86 74h8M86 86h8M86 98h8M110 74h8M110 86h8M110 98h8" />
          <path d="M146 100h7M146 112h7M170 100h7M170 112h7M194 100h7" />
          <path d="M206 78h8M206 92h8M206 106h8" />
        </g>
      </g>

      {/* Saloon profile: bonnet, screen, roof, boot, with the wheel arches cut
          back into the sill as quadratics. Door line, handle and wing mirror
          are what stop it reading as a plain blob at this size. */}
      <g
        transform="translate(28 44)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M6 92 L6 76 Q9 62 40 56 L86 22 Q95 16 112 16 L164 16 Q182 16 194 24 L232 54 Q266 59 272 70 L272 92 L244 92 Q228 62 212 92 L96 92 Q80 62 64 92 Z" />
        <path d="M94 52 L118 25 L152 25 L176 52 Z" />
        <path d="M136 25 L136 52" />
        <path d="M96 60 L232 60" />
        <path d="M150 60 L150 76" />
        <path d="M166 66 h16" />
        <path d="M88 40 L74 44 L76 50 L94 48" />
        <circle cx="228" cy="92" r="20" />
        <circle cx="228" cy="92" r="8" />
        <circle cx="80" cy="92" r="20" />
        <circle cx="80" cy="92" r="8" />
      </g>
    </svg>
  );
}
