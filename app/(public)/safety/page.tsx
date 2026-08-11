import type { Metadata } from "next";
import Link from "next/link";
import { FiCheck, FiShield, FiArrowRight } from "react-icons/fi";
import { getActiveSafetySections } from "@/lib/data/industries";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PrintButton } from "@/components/site/PrintButton";
import { SAFETY_CATEGORIES, type SafetySection } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

/** Category -> dictionary key. SAFETY_CATEGORY_LABELS stays for the admin side. */
const CATEGORY_KEYS = {
  chauffeur: "categoryChauffeur",
  "self-drive": "categorySelfDrive",
  general: "categoryGeneral",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.safety.metaTitle,
    description: t.safety.metaDescription,
    alternates: { canonical: "/safety" },
  };
}

export default async function SafetyPage() {
  const { t } = await getI18n();
  const [sections, settings] = await Promise.all([getActiveSafetySections(), getSettings()]);
  const visibleCategories = SAFETY_CATEGORIES.filter(
    (c) =>
      sections.some((s) => s.category === c) &&
      // Hide the self-drive protocol while the line is launched dark.
      (c !== "self-drive" || settings.selfDriveEnabled)
  );

  return (
    <>
      <section className="bg-navy-deep print:bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-light print:text-navy">
            <FiShield className="h-4 w-4" /> {t.safety.kicker}
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl print:text-navy">
            {t.safety.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70 print:text-ink">
            {t.safety.description}
          </p>
          <div className="mt-6 print:hidden">
            <PrintButton />
          </div>
        </div>
      </section>
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: t.footer.safety }]} />
      </div>

      {/* In-page nav */}
      <nav className="sticky top-[65px] z-30 border-b border-line bg-white/95 backdrop-blur print:hidden" aria-label={t.safety.sectionsNav}>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {visibleCategories.map((c) => (
            <a
              key={c}
              href={`#${c}`}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 transition hover:bg-band hover:text-navy"
            >
              {t.safety[CATEGORY_KEYS[c]]}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {sections.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.safety.empty}</p>
        ) : (
          <div className="space-y-16">
            {visibleCategories.map((category) => (
              <section key={category} id={category} className="scroll-mt-28">
                <h2 className="font-heading text-2xl font-bold text-navy">
                  {t.safety[CATEGORY_KEYS[category]]}
                </h2>
                <div className="mt-6 space-y-6">
                  {sections
                    .filter((s) => s.category === category)
                    .map((s) => (
                      <ProtocolCard key={s.id} section={s} />
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-line bg-band p-6 text-center print:hidden sm:p-8">
          <h2 className="font-heading text-xl font-bold text-navy">{t.safety.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.safety.ctaBody}</p>
          <Link
            href="/corporate#proposal"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            {t.safety.ctaButton} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

function ProtocolCard({ section }: { section: SafetySection }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-6 shadow-card print:break-inside-avoid print:border-slate-300 print:shadow-none">
      <h3 className="font-heading text-lg font-semibold text-navy">{section.title}</h3>
      {section.intro && <p className="mt-1 text-sm text-muted">{section.intro}</p>}
      <ul className="mt-4 space-y-2">
        {section.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/80">
            <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
