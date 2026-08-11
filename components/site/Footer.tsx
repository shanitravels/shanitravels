import Link from "next/link";
import { FiPhone, FiMail, FiMapPin, FiArrowRight } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { telHref, whatsappHref } from "@/lib/format";
import { socialLinks, SOCIAL_ICONS } from "@/lib/social-links";
import type { SiteSettings, Office } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/** Route map with dictionary keys rather than labels — see Header. */
const SITEMAP = [
  {
    titleKey: "explore",
    links: [
      { href: "/fleet", key: "fleet" },
      { href: "/rates", key: "rates" },
      { href: "/services", key: "services" },
      { href: "/industries", key: "industries" },
      { href: "/clients", key: "clients" },
    ],
  },
  {
    titleKey: "company",
    links: [
      { href: "/corporate", key: "corporateTransport" },
      { href: "/safety", key: "safety" },
      { href: "/about", key: "aboutUs" },
      { href: "/network", key: "ourNetwork" },
      { href: "/contact", key: "contact" },
    ],
  },
] as const;

/** Resolves a sitemap key from either namespace: most labels are footer-specific
 *  wording ("About us"), a few reuse the shorter nav labels ("Fleet"). */
function label(t: Dictionary, key: string): string {
  const footer = t.footer as Record<string, string>;
  const nav = t.nav as Record<string, string>;
  return footer[key] ?? nav[key] ?? key;
}

export function Footer({
  settings,
  offices,
  t,
}: {
  settings: SiteSettings;
  offices: Office[];
  t: Dictionary;
}) {
  const year = new Date().getFullYear();
  const headOffice = offices.find((o) => o.isHeadOffice) ?? offices[0];
  const otherOffices = offices.filter((o) => o.id !== headOffice?.id);

  return (
    <footer className="bg-navy-deep text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Brand + primary CTA */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
                ST
              </span>
              <span className="font-heading text-lg font-bold text-white">{t.nav.brandName}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {t.footer.tagline}
            </p>
            {/* Same list the hero shows, from one place — see lib/social-links. */}
            <div className="mt-4 flex gap-2">
              {socialLinks(settings.socials, settings.whatsappNumber).map(
                ({ key, label, href }) => {
                  const Icon = SOCIAL_ICONS[key];
                  return (
                    <SocialLink key={key} href={href} label={label}>
                      <Icon />
                    </SocialLink>
                  );
                }
              )}
            </div>
          </div>

          <Link
            href="/book"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            {t.footer.bookVehicle} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Links — two columns side by side even on the narrowest phone,
            so the footer reads as a map rather than one long list. */}
        <div className="grid gap-8 pt-8 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-2">
            {SITEMAP.map((col) => (
              <nav key={col.titleKey} aria-label={label(t, col.titleKey)}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  {label(t, col.titleKey)}
                </h3>
                {/* py-1 lifts these from a 20px to a ~28px touch target; the
                    list spacing tightens to keep the column height unchanged. */}
                <ul className="mt-3 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-block py-1 text-sm text-white/60 transition hover:text-white"
                      >
                        {label(t, l.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Contact — icon-led rows, comfortable tap targets on mobile */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t.footer.getInTouch}
            </h3>
            <ul className="mt-3 space-y-2">
              {settings.helplineNumbers.slice(0, 2).map((phone) => (
                <li key={phone}>
                  <ContactRow href={telHref(phone)} icon={<FiPhone />}>
                    <span className="tabular">{phone}</span>
                  </ContactRow>
                </li>
              ))}
              {settings.whatsappNumber && (
                <li>
                  <ContactRow
                    href={whatsappHref(settings.whatsappNumber)}
                    icon={<FaWhatsapp />}
                    external
                    accent="whatsapp"
                  >
                    {t.footer.whatsappUs}
                  </ContactRow>
                </li>
              )}
              {settings.emails.slice(0, 1).map((email) => (
                <li key={email}>
                  <ContactRow href={`mailto:${email}`} icon={<FiMail />}>
                    {email}
                  </ContactRow>
                </li>
              ))}
              {headOffice && (
                <li className="flex items-start gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-accent">
                    <FiMapPin className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-snug text-white/60">{headOffice.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Office network */}
        {otherOffices.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t.footer.alsoIn}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherOffices.map((o) => (
                <Link
                  key={o.id}
                  href="/network"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  {o.city}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Credentials */}
        {settings.credentials.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-white/50">
            {settings.credentials.map((c) => (
              <span key={c.label}>
                <span className="font-semibold text-white/70">{c.label}:</span> {c.value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          <p>
            © <span className="tabular">{year}</span> {t.nav.brandName}, {t.footer.partOfGroup}.{" "}
            {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({
  href,
  icon,
  children,
  external = false,
  accent = "default",
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  external?: boolean;
  accent?: "default" | "whatsapp";
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5 transition hover:bg-white/10"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 ${
          accent === "whatsapp" ? "text-[#25D366]" : "text-accent"
        }`}
      >
        <span className="text-[13px]">{icon}</span>
      </span>
      <span className="text-sm text-white/70">{children}</span>
    </a>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
    >
      {children}
    </a>
  );
}
