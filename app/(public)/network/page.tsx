import type { Metadata } from "next";
import { FiPhone, FiMail, FiMapPin, FiExternalLink } from "react-icons/fi";
import { getActiveOffices } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { telHref } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.network.metaTitle,
    description: t.network.metaDescription,
    alternates: { canonical: "/network" },
  };
}

export default async function NetworkPage() {
  const { t } = await getI18n();
  const offices = await getActiveOffices();

  return (
    <>
      <PageIntro
        eyebrow={t.network.eyebrow}
        title={t.network.title}
        description={t.network.description}
      />
      <Breadcrumbs items={[{ label: t.footer.ourNetwork }]} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {offices.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.network.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offices.map((o) => (
              <div key={o.id} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-navy">
                    <FiMapPin className="h-4 w-4 text-accent" /> {o.city}
                  </h2>
                  {o.isHeadOffice && (
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold text-navy">
                      {t.network.headOffice}
                    </span>
                  )}
                </div>
                <p className="mt-3 flex-1 text-sm text-muted">{o.address}</p>
                <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  {o.phones.map((p) => (
                    <a key={p} href={telHref(p)} className="flex items-center gap-2 text-ink/80 transition hover:text-accent">
                      <FiPhone className="h-3.5 w-3.5 text-navy" /> {p}
                    </a>
                  ))}
                  {o.email && (
                    <a href={`mailto:${o.email}`} className="flex items-center gap-2 text-ink/80 transition hover:text-accent">
                      <FiMail className="h-3.5 w-3.5 text-navy" /> {o.email}
                    </a>
                  )}
                  {o.mapUrl && (
                    <a
                      href={o.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-medium text-accent transition hover:underline"
                    >
                      <FiExternalLink className="h-3.5 w-3.5" /> {t.network.viewOnMap}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
