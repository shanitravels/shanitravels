import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { TbBuilding, TbHeartHandshake, TbPhone } from "react-icons/tb";
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
  // Markdown, like every other long-text block on this page. It used to render
  // as a bare string in a single <blockquote>, which silently collapsed a
  // multi-paragraph letter into one unbroken italic slab.
  const ceoHtml = about.ceoMessage ? renderMarkdown(about.ceoMessage) : "";

  return (
    <>
      <PageIntro
        eyebrow={t.about.eyebrow}
        title={t.about.title}
        description={t.about.description}
      />
      <Breadcrumbs items={[{ label: t.nav.about }]} />

      {/* 6xl, not the default 7xl: every section on this page is 6xl, and the
          band is content rather than chrome — its edges should line up. */}
      <TrustBand settings={settings} width="6xl" />

      {/* Mission — the promise, before the evidence for it below. Banded so the
          page keeps alternating: the CEO quote and the credentials below are
          both banded, and two of these in a row read as one long block. */}
      <section className="bg-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHead
            center={false}
            eyebrow={t.about.missionEyebrow}
            title={t.about.missionTitle}
          />
          {/* md-grid-list turns the "we strive to" bullets into a two-column
              card grid — the list is long enough that plain bullets read as a
              wall, and cards echo the credentials grid further down. */}
          <div
            className="md-content md-grid-list mt-6 text-ink/80 md-justify"
            dangerouslySetInnerHTML={{ __html: missionHtml }}
          />
        </div>
      </section>

      {/* Why choose Shani Travels */}
      {storyHtml && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHead center={false} eyebrow={t.about.storyEyebrow} title={t.about.storyTitle} />
          <div
            className="md-content mt-6 text-ink/80 md-justify"
            dangerouslySetInnerHTML={{ __html: storyHtml }}
          />
        </section>
      )}

      {/* CEO message */}
      {ceoHtml && (
        <section className="bg-band">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHead
              center={false}
              eyebrow={t.about.leadershipEyebrow}
              title={t.about.leadershipTitle}
            />
            {/* The accent rule carries the "this is a quoted voice" cue that
                the italics used to. Body text stays upright: a 200-word letter
                set entirely in italic is punishing to read.

                `flow-root` is load-bearing: it makes this div contain the
                floated portrait below, so a letter shorter than the photograph
                cannot spill the image out over the HSE section that follows. */}
            <div className="mt-6 flow-root border-l-4 border-accent pl-5 sm:pl-6">
              {about.ceoImage?.url && (
                /* Floated rather than placed in a column so the letter wraps
                   around it and then resumes full width underneath — a portrait
                   in a rigid two-column grid leaves a ragged empty gutter under
                   whichever side is shorter. Below `sm` it stacks: there is not
                   enough measure left beside a float on a phone. */
                <figure className="mb-5 sm:float-right sm:mb-3 sm:ml-6 sm:w-56 lg:w-64">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-band shadow-card">
                    <Image
                      src={about.ceoImage.url}
                      alt={about.ceoImage.alt || about.ceoName || t.about.leadershipTitle}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 256px, (min-width: 640px) 224px, 100vw"
                    />
                  </div>
                </figure>
              )}
              <div
                className="md-content text-[15px] leading-relaxed text-ink/80 sm:text-base md-justify"
                dangerouslySetInnerHTML={{ __html: ceoHtml }}
              />
              {about.ceoName && (
                /* Clears the float so the rule above the signature always spans
                   the full measure instead of stopping at the portrait. */
                <figcaption className="mt-6 clear-both border-t border-line pt-4">
                  <p className="font-heading font-semibold text-navy">{about.ceoName}</p>
                  <p className="text-sm text-muted">{t.about.ceoRoleBare}</p>
                </figcaption>
              )}
            </div>
          </div>
        </section>
      )}

      {/* HSE */}
      {hseHtml && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div
            className="md-content text-ink/80 md-justify"
            dangerouslySetInnerHTML={{ __html: hseHtml }}
          />
        </section>
      )}

      {/* Credentials */}
      {settings.credentials.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHead eyebrow={t.about.credentialsEyebrow} title={t.about.credentialsTitle} />
            {/* Four across at lg so the set reads as one row rather than
                three-and-a-stray. Narrower tiles need the height back, which
                the stacked layout provides: badge, then label, then value.
                A scanned certificate replaces the tick where one is uploaded. */}
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {settings.credentials.map((c) => (
                <li
                  key={c.label}
                  className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift"
                >
                  {c.image?.url ? (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-line">
                      <Image
                        src={c.image.url}
                        alt={c.image.alt || c.label}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <FiCheckCircle className="h-5 w-5" aria-hidden />
                    </span>
                  )}
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    {c.label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold leading-snug text-navy">{c.value}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA — a raised panel rather than bare centred text, so the page ends
          on an object instead of trailing off. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white to-band/70 px-6 py-12 text-center shadow-card sm:px-10 sm:py-16">
          {/* Decoration: dot fields in two corners and a road sweeping across
              the right. All of it is aria-hidden and clipped by the panel, so
              it can never widen the page or reach a screen reader. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-6 top-6 hidden h-20 w-28 sm:block"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "12px 12px",
              color: "rgba(11,36,71,0.10)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-6 right-6 hidden h-20 w-28 sm:block"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "12px 12px",
              color: "rgba(11,36,71,0.10)",
            }}
          />
          <svg
            aria-hidden
            viewBox="0 0 400 300"
            fill="none"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -right-10 top-0 hidden h-full w-2/5 text-navy/[0.05] lg:block"
          >
            <path d="M330 -20C250 60 300 150 200 230 140 280 120 300 110 320" stroke="currentColor" strokeWidth="46" strokeLinecap="round" />
            <path d="M356 -20C276 60 326 150 226 230 166 280 146 300 136 320" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          </svg>

          <div className="relative">
            {/* Eyebrow: rule, badge, label, rule */}
            <span className="flex items-center justify-center gap-3">
              <span aria-hidden className="h-px w-6 bg-accent sm:w-8" />
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-accent shadow-card">
                <TbHeartHandshake className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-accent">
                {t.about.ctaEyebrow}
              </span>
              <span aria-hidden className="h-px w-6 bg-accent sm:w-8" />
            </span>

            <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">
              {t.about.ctaTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {fmt(t.about.ctaBody, { count: offices.length })}
            </p>

            {/* The "or" divider is a rule on desktop and a plain word stacked
                between the buttons on mobile, where a vertical rule has no
                height to occupy. */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Link
                href="/corporate"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-navy px-6 py-4 text-sm font-semibold text-white shadow-card transition hover:bg-navy-light sm:w-auto"
              >
                <TbBuilding className="h-5 w-5 shrink-0" aria-hidden />
                {t.about.ctaCorporate}
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
                {t.about.ctaOr}
                <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
              </span>

              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-6 py-4 text-sm font-semibold text-navy shadow-card transition hover:border-navy/25 hover:bg-band sm:w-auto"
              >
                <TbPhone className="h-5 w-5 shrink-0" aria-hidden />
                {t.about.ctaContact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
