"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiSearch,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiPhone,
  FiAlertCircle,
  FiUser,
  FiKey,
  FiStar,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { clsx } from "clsx";
import { submitBooking } from "@/lib/actions/public";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { estimateFare, formatPKR, telHref, whatsappHref, rateForType } from "@/lib/format";
import { ContactLink } from "./ContactLink";
import { useI18n } from "./LocaleProvider";
import { fmt } from "@/lib/i18n/format";
import {
  RATE_TYPES,
  VEHICLE_CLASSES,
  type RateType,
  type ServiceMode,
  type Vehicle,
  isSelfDriveEligible,
} from "@/lib/types";

const field =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

const SELF_DRIVE_TYPES: RateType[] = ["day", "week"];

export function BookingWizard({
  vehicles,
  initialVehicleId,
  initialMode,
  selfDriveEnabled,
  cities,
  helpline,
  whatsapp,
  promoCode = "",
}: {
  vehicles: Vehicle[];
  initialVehicleId: string;
  initialMode: ServiceMode;
  selfDriveEnabled: boolean;
  cities: string[];
  helpline: string;
  whatsapp: string;
  /** The live promo's code, or "" when no promo is running. Drives the field. */
  promoCode?: string;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(submitBooking, EMPTY_FORM_STATE);

  // RATE_TYPE_LABELS is a code constant; the visible label comes from the
  // dictionary so the select and the review row both follow the locale.
  const rateTypeLabel: Record<RateType, string> = {
    hour: t.estimator.typeHour,
    day: t.estimator.typeDay,
    week: t.estimator.typeWeek,
    airport: t.estimator.typeAirport,
  };

  // Progressive enhancement: before hydration we render every step stacked so
  // the single form works without JS. After mount we switch to the stepper.
  const [enhanced, setEnhanced] = useState(false);
  const [step, setStep] = useState(0);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setEnhanced(true), []);

  const [mode, setMode] = useState<ServiceMode>(selfDriveEnabled ? initialMode : "chauffeur");
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [query, setQuery] = useState("");
  const [rateType, setRateType] = useState<RateType>("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupCity, setPickupCity] = useState(cities[0] ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  // Pre-filled only when the visitor arrived through the promo bar, which
  // appends ?promo=CODE. Typing /book directly leaves it blank, so the code on
  // a booking means the campaign actually brought them in.
  const [promo, setPromo] = useState(() =>
    (searchParams.get("promo") ?? "").trim().toUpperCase()
  );
  const [consent, setConsent] = useState(false);

  const STEPS = selfDriveEnabled
    ? [t.wizard.stepService, t.wizard.stepVehicle, t.wizard.stepDates, t.wizard.stepDetails, t.wizard.stepReview]
    : [t.wizard.stepVehicle, t.wizard.stepDates, t.wizard.stepDetails, t.wizard.stepReview];
  // Step indices shift by one when the mode step is present.
  const offset = selfDriveEnabled ? 1 : 0;

  const isSelfDrive = mode === "self-drive";
  const pickableVehicles = useMemo(
    () => (isSelfDrive ? vehicles.filter(isSelfDriveEligible) : vehicles),
    [vehicles, isSelfDrive]
  );
  const vehicle = pickableVehicles.find((v) => v.id === vehicleId) ?? null;

  const ratesFor = (v: Vehicle) =>
    isSelfDrive
      ? {
          perHour: null,
          perDay: v.selfDrive?.perDay ?? null,
          perWeek: v.selfDrive?.perWeek ?? null,
          perMonth: v.selfDrive?.perMonth ?? null,
          fuelPerKm: null,
          airportTransfer: null,
        }
      : v.rates;

  const availableTypes = useMemo(() => {
    if (!vehicle) return isSelfDrive ? SELF_DRIVE_TYPES : [...RATE_TYPES];
    if (isSelfDrive) return SELF_DRIVE_TYPES; // null rates still bookable → "on request"
    const withRates = RATE_TYPES.filter((t) => rateForType(vehicle.rates, t) !== null);
    return withRates.length ? withRates : ["day" as RateType];
  }, [vehicle, isSelfDrive]);
  const effectiveType = availableTypes.includes(rateType) ? rateType : availableTypes[0];

  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pickableVehicles;
    // The class name is searchable too now that the picker is grouped by it —
    // typing "sedan" should narrow to the section the visitor can see.
    return pickableVehicles.filter((v) =>
      `${v.name} ${t.vehicleClass[v.class]}`.toLowerCase().includes(q)
    );
  }, [pickableVehicles, query, t]);

  /**
   * The picker's sections: a "Recommended" shelf the admin curates (the
   * `recommended` flag on a vehicle, separate from the homepage `featured`
   * one), then the remaining vehicles by class in VEHICLE_CLASSES order.
   *
   * A recommended vehicle is deliberately listed only once — under
   * Recommended, not again in its class — so a selected card is never drawn
   * twice with two ticks.
   */
  const vehicleGroups = useMemo(() => {
    const groups: { key: string; label: string; pinned: boolean; vehicles: Vehicle[] }[] = [];
    const recommended = filteredVehicles.filter((v) => v.recommended);
    if (recommended.length > 0) {
      groups.push({
        key: "recommended",
        label: t.wizard.recommendedGroup,
        pinned: true,
        vehicles: recommended,
      });
    }
    for (const c of VEHICLE_CLASSES) {
      const inClass = filteredVehicles.filter((v) => !v.recommended && v.class === c);
      if (inClass.length > 0) {
        groups.push({ key: c, label: t.vehicleClass[c], pinned: false, vehicles: inClass });
      }
    }
    return groups;
  }, [filteredVehicles, t]);

  const fare = vehicle ? estimateFare(ratesFor(vehicle), effectiveType, { units: 1 }) : null;

  const err = (n: string) => state.fieldErrors[n]?.[0];
  const stepChecks = [
    ...(selfDriveEnabled ? [true] : []), // mode always chosen
    Boolean(vehicleId && pickableVehicles.some((v) => v.id === vehicleId)),
    Boolean(startDate && pickupCity),
    Boolean(name && phone),
    true,
  ];
  const canNext = stepChecks[step];
  const reviewStep = STEPS.length - 1;

  const switchMode = (m: ServiceMode) => {
    setMode(m);
    // Reset the vehicle if it isn't valid in the new mode.
    const pool = m === "self-drive" ? vehicles.filter(isSelfDriveEligible) : vehicles;
    if (!pool.some((v) => v.id === vehicleId)) setVehicleId(pool[0]?.id ?? "");
    if (m === "self-drive" && !SELF_DRIVE_TYPES.includes(rateType)) setRateType("day");
  };

  return (
    <div>
      {/* Contact alternatives — visible on every step */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-line bg-band px-4 py-3 text-sm">
        <span className="text-muted">{t.wizard.preferToTalk}</span>
        <ContactLink kind="call" href={telHref(helpline)} className="inline-flex items-center gap-1.5 font-semibold text-navy hover:text-accent">
          <FiPhone className="h-4 w-4" /> {t.wizard.callUs}
        </ContactLink>
        <ContactLink
          kind="whatsapp"
          href={whatsappHref(whatsapp, t.wizard.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-[#25D366]"
        >
          <FaWhatsapp className="h-4 w-4" /> {t.nav.whatsapp}
        </ContactLink>
      </div>

      {/* Stepper */}
      {enhanced && (
        <ol className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                    i < step ? "bg-navy text-white" : i === step ? "bg-accent text-white" : "bg-band text-muted"
                  )}
                >
                  {i < step ? <FiCheck className="h-4 w-4" /> : i + 1}
                </span>
                <span className={clsx("mt-1 text-[11px] font-medium", i === step ? "text-navy" : "text-muted")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx("mx-1 h-0.5 flex-1", i < step ? "bg-navy" : "bg-line")} />
              )}
            </li>
          ))}
        </ol>
      )}

      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {/* Hidden controlled values so the single form submits everything */}
        <input type="hidden" name="serviceMode" value={mode} />
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="rateType" value={effectiveType} />

        {/* STEP 0 — Service mode (only when self-drive is live) */}
        {selfDriveEnabled && (
          <Step show={!enhanced || step === 0}>
            <h2 className="font-heading text-lg font-semibold text-navy">{t.wizard.modeQuestion}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ModeCard
                active={mode === "chauffeur"}
                onClick={() => switchMode("chauffeur")}
                icon={<FiUser className="h-6 w-6" />}
                title={t.wizard.chauffeurTitle}
                desc={t.wizard.chauffeurDesc}
              />
              <ModeCard
                active={mode === "self-drive"}
                onClick={() => switchMode("self-drive")}
                icon={<FiKey className="h-6 w-6" />}
                title={t.wizard.selfDriveTitle}
                desc={t.wizard.selfDriveDesc}
                accent="emerald"
              />
            </div>
            {isSelfDrive && (
              <p className="mt-3 text-xs text-muted">
                {t.wizard.newToSelfDrive}{" "}
                <Link href="/self-drive" className="font-medium text-navy underline" target="_blank">
                  {t.wizard.howItWorks}
                </Link>{" "}
                {t.wizard.twoMinuteRead}
              </p>
            )}
          </Step>
        )}

        {/* STEP — Vehicle */}
        <Step show={!enhanced || step === offset + 0}>
          <h2 className="font-heading text-lg font-semibold text-navy">
            {t.wizard.chooseVehicle}
            {isSelfDrive ? t.wizard.selfDriveEligible : ""}
          </h2>
          <div className="relative mt-3">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.wizard.searchFleet}
              className={clsx(field, "pl-9")}
            />
          </div>
          {err("vehicleId") && <p className="mt-1 text-xs text-red-600">{err("vehicleId")}</p>}
          <div className="mt-3 max-h-[420px] space-y-5 overflow-y-auto pr-1">
            {vehicleGroups.map((group) => (
              <section key={group.key}>
                <h3
                  className={clsx(
                    "sticky top-0 z-10 -mx-1 flex items-center gap-1.5 bg-white/95 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur",
                    group.pinned ? "text-accent" : "text-muted"
                  )}
                >
                  {group.pinned && <FiStar className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {group.label}
                  <span className="font-normal text-muted/70">({group.vehicles.length})</span>
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.vehicles.map((v) => {
                    const day = ratesFor(v).perDay;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setVehicleId(v.id)}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl border p-2.5 text-left transition",
                          vehicleId === v.id ? "border-navy bg-navy/5 ring-1 ring-navy" : "border-line bg-white hover:border-navy/40"
                        )}
                      >
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-band">
                          {v.images[0] && (
                            <Image src={v.images[0].url} alt={v.images[0].alt || v.name} fill className="object-cover" sizes="64px" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-navy">{v.name}</p>
                          <p className="text-xs text-muted">
                            {day != null
                              ? `${formatPKR(day)}${t.common.perDay}`
                              : t.wizard.ratesOnRequest}
                            {isSelfDrive ? " · self-drive" : ""}
                          </p>
                        </div>
                        {vehicleId === v.id && <FiCheck className="h-4 w-4 shrink-0 text-navy" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            {vehicleGroups.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">
                {fmt(t.wizard.noVehiclesMatch, {
                  mode: isSelfDrive ? t.wizard.selfDrivePrefix : "",
                })}
              </p>
            )}
          </div>
        </Step>

        {/* STEP — Dates */}
        <Step show={!enhanced || step === offset + 1}>
          <h2 className="font-heading text-lg font-semibold text-navy">{t.wizard.datesTitle}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">{t.wizard.rateType}</span>
              <select value={effectiveType} onChange={(e) => setRateType(e.target.value as RateType)} className={field}>
                {availableTypes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rateTypeLabel[rt]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                {t.wizard.pickupCity} <span className="text-accent">*</span>
              </span>
              <input name="pickupCity" list="cities" value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} className={field} required />
              <datalist id="cities">
                {cities.map((c) => <option key={c} value={c} />)}
              </datalist>
              {err("pickupCity") && <span className="mt-1 block text-xs text-red-600">{err("pickupCity")}</span>}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                {t.wizard.startDate} <span className="text-accent">*</span>
              </span>
              <input name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} required />
              {err("startDate") && <span className="mt-1 block text-xs text-red-600">{err("startDate")}</span>}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">{t.wizard.endDate}</span>
              <input name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
            </label>
          </div>
        </Step>

        {/* STEP — Details */}
        <Step show={!enhanced || step === offset + 2}>
          <h2 className="font-heading text-lg font-semibold text-navy">{t.wizard.detailsTitle}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                {t.wizard.fullName} <span className="text-accent">*</span>
              </span>
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} className={field} required maxLength={120} />
              {err("name") && <span className="mt-1 block text-xs text-red-600">{err("name")}</span>}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                {t.form.phone} <span className="text-accent">*</span>
              </span>
              <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} required placeholder={t.form.phonePlaceholder} />
              {err("phone") && <span className="mt-1 block text-xs text-red-600">{err("phone")}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink/80">{t.wizard.emailOptional}</span>
              <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink/80">{t.wizard.notesOptional}</span>
              <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={field} maxLength={1000} placeholder={t.wizard.notesPlaceholder} />
            </label>
            {/* Only offered while a promo is running — an orphan code box on a
                page with no live offer just invites made-up codes. */}
            {promoCode && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink/80">
                  {t.promo.fieldLabel}{" "}
                  <span className="font-normal text-muted">({t.common.optional})</span>
                </span>
                <input
                  name="promoCode"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  className={`${field} font-mono uppercase`}
                  maxLength={40}
                  placeholder={fmt(t.promo.fieldPlaceholder, { code: promoCode })}
                />
                <span className="mt-1 block text-xs text-muted">
                  {promo.trim()
                    ? fmt(t.promo.applied, { code: promo.trim() })
                    : t.promo.fieldHint}
                </span>
              </label>
            )}
          </div>
        </Step>

        {/* STEP — Review */}
        <Step show={!enhanced || step === reviewStep}>
          <h2 className="font-heading text-lg font-semibold text-navy">{t.wizard.reviewSubmit}</h2>
          <div className="mt-3 space-y-2 rounded-2xl border border-line bg-band p-4 text-sm">
            <Row
              label={t.wizard.rowService}
              value={isSelfDrive ? t.wizard.selfDriveTitle : t.wizard.chauffeurTitle}
            />
            <Row label={t.wizard.rowVehicle} value={vehicle?.name ?? "—"} />
            <Row label={t.wizard.rowRateType} value={rateTypeLabel[effectiveType]} />
            <Row label={t.wizard.rowPickup} value={pickupCity || "—"} />
            <Row label={t.wizard.rowStart} value={startDate || "—"} />
            {endDate && <Row label={t.wizard.rowEnd} value={endDate} />}
            <Row label={t.wizard.rowName} value={name || "—"} />
            <Row label={t.wizard.rowPhone} value={phone || "—"} />
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="text-muted">{t.wizard.indicativeFare}</span>
              <span className="font-heading text-lg font-bold text-navy">
                {fare != null ? formatPKR(fare) : t.common.onRequest}
              </span>
            </div>
          </div>

          {isSelfDrive && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <FiKey className="h-4 w-4" /> {t.wizard.selfDriveReqTitle}
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/80">
                <li>• {t.wizard.selfDriveReq1}</li>
                <li>
                  • {t.wizard.selfDriveReq2Prefix}{" "}
                  {vehicle?.selfDrive?.securityDeposit != null
                    ? fmt(t.wizard.selfDriveReq2Amount, {
                        amount: formatPKR(vehicle.selfDrive.securityDeposit),
                      })
                    : t.wizard.selfDriveReq2Unknown}
                </li>
                <li>• {t.wizard.selfDriveReq3}</li>
              </ul>
              <label className="mt-3 flex items-start gap-2.5 text-sm text-emerald-950">
                <input
                  type="checkbox"
                  name="selfDriveConsent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{t.wizard.consent}</span>
              </label>
              {err("selfDriveConsent") && (
                <p className="mt-1 text-xs text-red-600">{err("selfDriveConsent")}</p>
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-muted">
            {fmt(t.wizard.indicativeNote, {
              extra: isSelfDrive ? t.wizard.indicativeExtraSelfDrive : "",
            })}
          </p>
        </Step>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          {enhanced && step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-band">
              <FiArrowLeft className="h-4 w-4" /> {t.wizard.back}
            </button>
          ) : (
            <span />
          )}

          {enhanced && step < reviewStep ? (
            <button
              type="button"
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
            >
              {t.wizard.continue} <FiArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending || (isSelfDrive && !consent)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
            >
              {pending ? t.wizard.submitting : t.wizard.submitBooking}{" "}
              <FiArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
  accent = "navy",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: "navy" | "emerald";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex flex-col items-start rounded-2xl border-2 p-5 text-left transition",
        active
          ? accent === "emerald"
            ? "border-emerald-600 bg-emerald-50/60"
            : "border-navy bg-navy/5"
          : "border-line bg-white hover:border-navy/40"
      )}
    >
      <span
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          active
            ? accent === "emerald"
              ? "bg-emerald-600 text-white"
              : "bg-navy text-white"
            : "bg-band text-navy"
        )}
      >
        {icon}
      </span>
      <span className="mt-3 font-heading text-base font-bold text-navy">{title}</span>
      <span className="mt-1 text-sm text-muted">{desc}</span>
      {active && (
        <span className={clsx("mt-3 inline-flex items-center gap-1 text-xs font-bold", accent === "emerald" ? "text-emerald-700" : "text-navy")}>
          <FiCheck className="h-3.5 w-3.5" /> Selected
        </span>
      )}
    </button>
  );
}

function Step({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <div className={show ? "block" : "hidden"}>{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink/80">{value}</span>
    </div>
  );
}
