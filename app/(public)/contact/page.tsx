import type { Metadata } from "next";
import Link from "next/link";
import { FiPhone, FiMail, FiMapPin, FiChevronRight } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getSettings } from "@/lib/data/settings";
import { getActiveOffices } from "@/lib/data/content";
import { ContactForm } from "@/components/site/ContactForm";
import { telHref, whatsappHref } from "@/lib/format";
import { ContactLink } from "@/components/site/ContactLink";
import { socialLinks, SOCIAL_ICONS } from "@/lib/social-links";
import { getI18n } from "@/lib/i18n/server";

// Locale-dependent, so a function rather than a static object.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.contact.metaTitle,
    description: t.contact.metaDescription,
    alternates: { canonical: "/contact" },
  };
}

/**
 * Three panels side by side: who to call on the left, the message form in the
 * middle, the map on the right.
 *
 * This page deliberately skips the dark PageIntro band and the full-width
 * Breadcrumbs bar the other interior pages use. Both would push the three
 * panels below the fold, and the whole point of this layout is that a visitor
 * sees a phone number, a form and a location without scrolling. The title and
 * the trail move into the left panel instead, which is why the crumb markup is
 * inline here rather than the shared <Breadcrumbs> component.
 */
export default async function ContactPage() {
  const { t } = await getI18n();
  const [settings, offices] = await Promise.all([getSettings(), getActiveOffices()]);
  const head = offices.find((o) => o.isHeadOffice) ?? offices[0];
  // The admin's own "Embed a map" URL when the head office has one — it points
  // at the actual business listing, pin and zoom included. The address search
  // below is the fallback for an office that has not been given one yet.
  const mapEmbed =
    head?.mapEmbedUrl ||
    `https://www.google.com/maps?q=${encodeURIComponent(
      head?.address ?? settings.headOfficeAddress
    )}&output=embed`;
  const socials = socialLinks(settings.socials, settings.whatsappNumber);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {/*
        One row of three at xl, which is the only width where all three panels
        stay legible. At lg the map drops to a full-width band under the other
        two; below that everything stacks.
      */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ── Details ─────────────────────────────────────────────── */}
        <section className="lg:col-span-4 xl:col-span-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            {t.contact.title}
          </h1>

          <nav aria-label={t.common.breadcrumb} className="mt-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
              <li>
                <Link href="/" className="transition hover:text-navy">
                  {t.nav.home}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <FiChevronRight className="h-3 w-3 text-muted/60" />
                <span className="font-medium text-accent">{t.nav.contact}</span>
              </li>
            </ol>
          </nav>

          <p className="mt-5 text-base leading-relaxed text-muted">{t.contact.description}</p>

          {/* One icon per channel, not per number — two helplines read as one
              way to reach us, which is what the visitor is scanning for. */}
          <ul className="mt-8 space-y-7 text-sm">
            {settings.helplineNumbers.length > 0 && (
              <li className="flex gap-4">
                <FiPhone className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0 space-y-1.5">
                  {settings.helplineNumbers.map((p) => (
                    <ContactLink
                      key={p}
                      kind="call"
                      href={telHref(p)}
                      className="block text-ink/80 transition hover:text-accent"
                    >
                      <span className="tabular">{p}</span>
                    </ContactLink>
                  ))}
                </div>
              </li>
            )}

            {settings.whatsappNumber && (
              <li className="flex gap-4">
                <FaWhatsapp className="mt-0.5 h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
                <ContactLink
                  kind="whatsapp"
                  href={whatsappHref(settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-ink/80 transition hover:text-accent"
                >
                  <span className="tabular">{settings.whatsappNumber}</span>{" "}
                  {t.contact.whatsappSuffix}
                </ContactLink>
              </li>
            )}

            {settings.emails.length > 0 && (
              <li className="flex gap-4">
                <FiMail className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0 space-y-1.5">
                  {settings.emails.map((e) => (
                    <a
                      key={e}
                      href={`mailto:${e}`}
                      className="block truncate text-ink/80 transition hover:text-accent"
                    >
                      {e}
                    </a>
                  ))}
                </div>
              </li>
            )}

            <li className="flex gap-4">
              <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                  {t.contact.headOffice}
                </p>
                <p className="mt-1 leading-relaxed text-ink/80">{settings.headOfficeAddress}</p>
              </div>
            </li>
          </ul>

          {socials.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-3">
              {socials.map(({ key, label, href }) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-card transition hover:border-accent hover:text-accent"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Message form ────────────────────────────────────────── */}
        <section className="lg:col-span-8 xl:col-span-4">
          <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7">
            <h2 className="font-heading text-2xl font-bold text-navy">{t.contact.sendMessage}</h2>
            <p className="mt-1 text-sm text-muted">{t.contact.replyPromise}</p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ── Map ─────────────────────────────────────────────────── */}
        <section className="lg:col-span-12 xl:col-span-5">
          {/* min-h carries the small screens, where the panel has no sibling to
              take its height from; h-full matches the form column at xl. */}
          <div className="h-full min-h-[360px] overflow-hidden rounded-2xl border border-line shadow-card sm:min-h-[420px]">
            <iframe
              title={t.contact.mapTitle}
              src={mapEmbed}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full min-h-[360px] w-full sm:min-h-[420px]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
