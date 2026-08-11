import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClipboard,
  FiKey,
  FiRotateCcw,
  FiUserCheck,
  FiX,
  FiCheck,
  FiPhone,
} from "react-icons/fi";
import { getSettings } from "@/lib/data/settings";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { VehicleCard } from "@/components/site/VehicleCard";
import { getActiveDiscounts } from "@/lib/data/discounts";
import { bestDiscountFor } from "@/lib/pricing";
import { telHref } from "@/lib/format";
import { isSelfDriveEligible } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

/**
 * Evaluated per request, not baked at build time. The self-drive line is a
 * launch switch: flipping it in Settings must publish (or unpublish) this page
 * immediately, and while it's off the route must return a genuine 404 rather
 * than a cached 200 carrying self-drive metadata.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const settings = await getSettings();
  if (!settings.selfDriveEnabled) {
    // Don't advertise the service while the line is dark.
    return { title: t.selfDrive.notFound, robots: { index: false, follow: false } };
  }
  return {
    title: t.selfDrive.metaTitle,
    description: t.selfDrive.metaDescription,
    alternates: { canonical: "/self-drive" },
  };
}

/** Steps, requirement and rule lists carry dictionary keys — see Header. */
const STEPS = [
  { icon: <FiUserCheck className="h-5 w-5" />, titleKey: "step1Title", textKey: "step1Text" },
  { icon: <FiClipboard className="h-5 w-5" />, titleKey: "step2Title", textKey: "step2Text" },
  { icon: <FiKey className="h-5 w-5" />, titleKey: "step3Title", textKey: "step3Text" },
  { icon: <FiRotateCcw className="h-5 w-5" />, titleKey: "step4Title", textKey: "step4Text" },
] as const;

const REQUIREMENT_KEYS = ["req1", "req2", "req3", "req4", "req5"] as const;

const PERMITTED_KEYS = ["perm1", "perm2", "perm3", "perm4"] as const;

const PROHIBITED_KEYS = ["proh1", "proh2", "proh3", "proh4"] as const;

export default async function SelfDrivePage() {
  const { t } = await getI18n();
  const [settings, vehicles, discounts] = await Promise.all([
    getSettings(),
    getActiveVehicles(),
    getActiveDiscounts(),
  ]);
  // Launch-dark switch: the page exists only when the line is enabled.
  if (!settings.selfDriveEnabled) notFound();

  const eligible = vehicles.filter(isSelfDriveEligible).slice(0, 6);

  return (
    <>
      <PageIntro
        eyebrow={t.selfDrive.eyebrow}
        title={t.selfDrive.title}
        description={t.selfDrive.description}
      />
      <Breadcrumbs items={[{ label: t.selfDrive.breadcrumb }]} />

      {/* The 4 steps */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.titleKey} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                {s.icon}
              </span>
              <h2 className="mt-4 font-heading text-base font-semibold text-navy">
                {t.selfDrive[s.titleKey]}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.selfDrive[s.textKey]}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          {t.selfDrive.protocolPrefix}{" "}
          <Link href="/safety#self-drive" className="font-semibold text-navy underline hover:text-accent">
            {t.selfDrive.protocolLink}
          </Link>
          .
        </p>
      </section>

      {/* Requirements + use rules */}
      <section className="bg-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold text-navy">{t.selfDrive.whatToBring}</h2>
            <ul className="mt-4 space-y-2.5">
              {REQUIREMENT_KEYS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t.selfDrive[k]}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold text-navy">{t.selfDrive.permittedUse}</h2>
            <ul className="mt-4 space-y-2.5">
              {PERMITTED_KEYS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t.selfDrive[k]}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold text-navy">{t.selfDrive.notPermitted}</h2>
            <ul className="mt-4 space-y-2.5">
              {PROHIBITED_KEYS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <FiX className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> {t.selfDrive[k]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Eligible vehicles */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-2xl font-bold text-navy">{t.selfDrive.vehiclesTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.selfDrive.vehiclesDesc}</p>
          </div>
          <Link
            href="/fleet?selfdrive=1"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
          >
            {t.selfDrive.allEligible} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {eligible.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
            {t.selfDrive.noneYet}
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eligible.map((v) => (
              <VehicleCard key={v.id} vehicle={v} showSelfDrive discount={bestDiscountFor(v, discounts)} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-navy">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-heading text-2xl font-bold text-white">{t.selfDrive.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{t.selfDrive.ctaBody}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/book?mode=self-drive"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
            >
              {t.selfDrive.ctaBook} <FiArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={telHref(settings.helplineNumbers[0] ?? "")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiPhone className="h-4 w-4" /> {t.selfDrive.ctaTalk}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
