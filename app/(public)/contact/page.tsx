import type { Metadata } from "next";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getSettings } from "@/lib/data/settings";
import { getActiveOffices } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { ContactForm } from "@/components/site/ContactForm";
import { telHref, whatsappHref } from "@/lib/format";
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

export default async function ContactPage() {
  const { t } = await getI18n();
  const [settings, offices] = await Promise.all([getSettings(), getActiveOffices()]);
  const head = offices.find((o) => o.isHeadOffice) ?? offices[0];
  const mapQuery = encodeURIComponent(head?.address ?? settings.headOfficeAddress);

  return (
    <>
      <PageIntro
        eyebrow={t.contact.eyebrow}
        title={t.contact.title}
        description={t.contact.description}
      />
      <Breadcrumbs items={[{ label: t.nav.contact }]} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact details */}
          <div>
            <h2 className="font-heading text-xl font-bold text-navy">{t.contact.headOffice}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-start gap-3 text-ink/80">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {settings.headOfficeAddress}
              </p>
              {settings.helplineNumbers.map((p) => (
                <a key={p} href={telHref(p)} className="flex items-center gap-3 text-ink/80 transition hover:text-accent">
                  <FiPhone className="h-4 w-4 shrink-0 text-accent" /> {p}
                </a>
              ))}
              {settings.whatsappNumber && (
                <a
                  href={whatsappHref(settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-ink/80 transition hover:text-accent"
                >
                  <FaWhatsapp className="h-4 w-4 shrink-0 text-[#25D366]" />{" "}
                  <span className="tabular">{settings.whatsappNumber}</span> {t.contact.whatsappSuffix}
                </a>
              )}
              {settings.emails.map((e) => (
                <a key={e} href={`mailto:${e}`} className="flex items-center gap-3 text-ink/80 transition hover:text-accent">
                  <FiMail className="h-4 w-4 shrink-0 text-accent" /> {e}
                </a>
              ))}
            </div>

            {/* Map embed */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-line shadow-card">
              <iframe
                title={t.contact.mapTitle}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[16/10] w-full"
              />
            </div>

            {/* Other offices */}
            {offices.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-navy">{t.contact.alsoIn}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {offices
                    .filter((o) => o.id !== head?.id)
                    .map((o) => (
                      <span key={o.id} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-navy">
                        {o.city}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Enquiry form */}
          <div>
            <h2 className="font-heading text-xl font-bold text-navy">{t.contact.sendMessage}</h2>
            <p className="mt-1 text-sm text-muted">{t.contact.replyPromise}</p>
            <div className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-card">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
