import type { Metadata } from "next";
import Link from "next/link";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { getSettings } from "@/lib/data/settings";
import { getActiveOffices } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { SectionHead, TrustBand } from "@/components/site/sections";
import { renderMarkdown } from "@/lib/markdown";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.about.metaTitle,
    description: t.about.metaDescription,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const [settings, offices] = await Promise.all([getSettings(), getActiveOffices()]);
  const { about } = settings;
  const storyHtml = about.story ? renderMarkdown(about.story) : "";
  const hseHtml = about.hseSummary ? renderMarkdown(about.hseSummary) : "";
  // Falls back to the dictionary, so the section stands up on a database where
  // nobody has written a mission yet. Rendered through markdown either way, so
  // an admin can use the same formatting the story block allows.
  const missionHtml = renderMarkdown(about.mission || t.about.missionBody);

  return (
    <>
      <PageIntro
        eyebrow={t.about.eyebrow}
        title={t.about.title}
        description={t.about.description}
      />
      <Breadcrumbs items={[{ label: t.nav.about }]} />

      <TrustBand settings={settings} />

      {/* Mission — the promise, before the evidence for it below. Banded so the
          page keeps alternating: the CEO quote and the credentials below are
          both banded, and two of these in a row read as one long block. */}
      <section className="bg-band">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHead
            center={false}
            eyebrow={t.about.missionEyebrow}
            title={t.about.missionTitle}
          />
          <div
            className="md-content mt-6 text-ink/80"
            dangerouslySetInnerHTML={{ __html: missionHtml }}
          />
        </div>
      </section>

      {/* Why choose Shani Travels */}
      {storyHtml && (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHead center={false} eyebrow={t.about.storyEyebrow} title={t.about.storyTitle} />
          <div className="md-content mt-6 text-ink/80" dangerouslySetInnerHTML={{ __html: storyHtml }} />
        </section>
      )}

      {/* CEO message */}
      {about.ceoMessage && (
        <section className="bg-band">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <SectionHead
              center={false}
              eyebrow={t.about.leadershipEyebrow}
              title={t.about.leadershipTitle}
            />
            <blockquote className="mt-6 border-l-4 border-accent pl-5 text-lg italic leading-relaxed text-ink/80">
              {about.ceoMessage}
            </blockquote>
            {about.ceoName && (
              <p className="mt-4 font-semibold text-navy">
                — {about.ceoName}
                <span className="font-normal text-muted">{t.about.ceoRole}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* HSE */}
      {hseHtml && (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="md-content text-ink/80" dangerouslySetInnerHTML={{ __html: hseHtml }} />
        </section>
      )}

      {/* Credentials */}
      {settings.credentials.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead eyebrow={t.about.credentialsEyebrow} title={t.about.credentialsTitle} />
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              {settings.credentials.map((c) => (
                <div key={c.label} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
                  <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
                    <p className="text-sm font-medium text-navy">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-navy">{t.about.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          {fmt(t.about.ctaBody, { count: offices.length })}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/corporate" className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-light">
            {t.about.ctaCorporate} <FiArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3 text-sm font-semibold text-navy transition hover:bg-band">
            {t.about.ctaContact}
          </Link>
        </div>
      </section>
    </>
  );
}
