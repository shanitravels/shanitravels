"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiX, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useToast } from "./Toast";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { ImageManager } from "./ImageManager";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicles";
import { slugify } from "@/lib/format";
import {
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  SELF_DRIVE_CLASSES,
  ARMOR_LEVELS,
  type VehicleDoc,
  type VehicleClass,
  type MediaImage,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

type Errors = Record<string, string[]>;

interface FormState {
  name: string;
  slug: string;
  slugTouched: boolean;
  class: string;
  modelYears: string;
  seats: string;
  engine: LocalizedString;
  transmission: LocalizedString;
  driveType: LocalizedString;
  interiorFeatures: LocalizedString[];
  images: MediaImage[];
  perHour: string;
  perDay: string;
  perWeek: string;
  perMonth: string;
  fuelPerKm: string;
  airportTransfer: string;
  currency: string;
  armorLevel: string;
  rollCage: boolean;
  selfDriveAvailable: boolean;
  sdPerDay: string;
  sdPerWeek: string;
  sdPerMonth: string;
  sdDeposit: string;
  featured: boolean;
  recommended: boolean;
  active: boolean;
  order: string;
}

function fromVehicle(v?: VehicleDoc): FormState {
  return {
    name: v?.name ?? "",
    slug: v?.slug ?? "",
    slugTouched: !!v,
    class: v?.class ?? "sedan",
    modelYears: v?.modelYears ?? "",
    seats: v ? String(v.seats) : "4",
    engine: v?.engine ?? emptyPair,
    transmission: v?.transmission ?? emptyPair,
    driveType: v?.driveType ?? emptyPair,
    interiorFeatures: v?.interiorFeatures ?? [],
    images: v?.images ?? [],
    perHour: numToStr(v?.rates.perHour),
    perDay: numToStr(v?.rates.perDay),
    perWeek: numToStr(v?.rates.perWeek),
    perMonth: numToStr(v?.rates.perMonth),
    fuelPerKm: numToStr(v?.rates.fuelPerKm),
    airportTransfer: numToStr(v?.rates.airportTransfer),
    currency: v?.currency ?? "PKR",
    armorLevel: v?.armorLevel ?? "",
    rollCage: v?.rollCage ?? false,
    selfDriveAvailable: v?.selfDriveAvailable ?? false,
    sdPerDay: numToStr(v?.selfDrive?.perDay),
    sdPerWeek: numToStr(v?.selfDrive?.perWeek),
    sdPerMonth: numToStr(v?.selfDrive?.perMonth),
    sdDeposit: numToStr(v?.selfDrive?.securityDeposit),
    featured: v?.featured ?? false,
    recommended: v?.recommended ?? false,
    active: v?.active ?? true,
    order: v ? String(v.order) : "0",
  };
}

const numToStr = (n?: number | null) => (n === null || n === undefined ? "" : String(n));
const strToNum = (s: string) => (s.trim() === "" ? null : Number(s));

export function VehicleForm({ vehicle }: { vehicle?: VehicleDoc }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => fromVehicle(vehicle));
  const [errors, setErrors] = useState<Errors>({});

  // Self-drive is a property of the class, not of the individual vehicle.
  const selfDriveClassAllowed = SELF_DRIVE_CLASSES.includes(form.class as VehicleClass);
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  // Editing the name auto-fills the slug until the user edits the slug directly.
  const setName = (name: string) => {
    setForm((f) => ({ ...f, name, slug: f.slugTouched ? f.slug : slugify(name) }));
    setDirty(true);
  };

  // Unsaved-changes guard.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // New features are added in English; the Urdu box next to the row is filled
  // in afterwards, so a half-translated list is a normal intermediate state.
  const addFeature = () => {
    const f = newFeature.trim();
    if (!f) return;
    set("interiorFeatures", [...form.interiorFeatures, { en: f, ur: "" }]);
    setNewFeature("");
  };
  const updateFeature = (i: number, pair: LocalizedString) =>
    set("interiorFeatures", form.interiorFeatures.map((f, idx) => (idx === i ? pair : f)));
  const removeFeature = (i: number) =>
    set("interiorFeatures", form.interiorFeatures.filter((_, idx) => idx !== i));
  const moveFeature = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= form.interiorFeatures.length) return;
    const next = [...form.interiorFeatures];
    [next[i], next[t]] = [next[t], next[i]];
    set("interiorFeatures", next);
  };

  const submit = () => {
    const payload = {
      name: form.name,
      slug: form.slug,
      class: form.class,
      modelYears: form.modelYears,
      seats: form.seats,
      engine: form.engine,
      transmission: form.transmission,
      driveType: form.driveType,
      interiorFeatures: form.interiorFeatures,
      images: form.images,
      rates: {
        perHour: strToNum(form.perHour),
        // Blank stays null rather than falling back to 0: clearing the field is
        // how a vehicle is moved from a printed price back to "On request".
        perDay: strToNum(form.perDay),
        perWeek: strToNum(form.perWeek),
        perMonth: strToNum(form.perMonth),
        fuelPerKm: strToNum(form.fuelPerKm),
        airportTransfer: strToNum(form.airportTransfer),
      },
      currency: form.currency,
      armorLevel: form.armorLevel || null,
      rollCage: form.rollCage,
      selfDriveAvailable: selfDriveClassAllowed && form.selfDriveAvailable,
      selfDrive: selfDriveClassAllowed && form.selfDriveAvailable
        ? {
            perDay: strToNum(form.sdPerDay),
            perWeek: strToNum(form.sdPerWeek),
            perMonth: strToNum(form.sdPerMonth),
            securityDeposit: strToNum(form.sdDeposit),
          }
        : null,
      featured: form.featured,
      recommended: form.recommended,
      active: form.active,
      order: form.order,
    };

    start(async () => {
      setErrors({});
      const res = vehicle ? await updateVehicle(vehicle.id, payload) : await createVehicle(payload);
      if (res.ok) {
        setDirty(false);
        toast.success(res.message ?? "Saved");
        router.push("/admin/vehicles");
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      {/* Identity */}
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name} className="sm:col-span-2">
            <TextInput
              value={form.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Toyota Corolla Altis 1.8"
              invalid={!!errors.name}
            />
          </Field>
          <Field label="Slug" required error={errors.slug} hint="Used in the vehicle's URL">
            <TextInput
              value={form.slug}
              onChange={(e) => {
                setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }));
                setDirty(true);
              }}
              invalid={!!errors.slug}
            />
          </Field>
          <Field label="Class" required error={errors.class}>
            <Select value={form.class} onChange={(e) => set("class", e.target.value)}>
              {VEHICLE_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {VEHICLE_CLASS_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Model years" error={errors.modelYears}>
            <TextInput
              value={form.modelYears}
              onChange={(e) => set("modelYears", e.target.value)}
              placeholder="2024–2026"
            />
          </Field>
          <Field label="Seats" required error={errors.seats}>
            <TextInput
              type="number"
              min={1}
              value={form.seats}
              onChange={(e) => set("seats", e.target.value)}
              invalid={!!errors.seats}
            />
          </Field>
        </div>
      </Section>

      {/* Specs */}
      <Section title="Specifications">
        <div className="grid gap-4 sm:grid-cols-3">
          <LocalizedField
            label="Engine"
            error={errors.engine}
            value={form.engine}
            onChange={(engine) => set("engine", engine)}
          />
          <LocalizedField
            label="Transmission"
            error={errors.transmission}
            value={form.transmission}
            onChange={(transmission) => set("transmission", transmission)}
          />
          <LocalizedField
            label="Drive type"
            error={errors.driveType}
            value={form.driveType}
            onChange={(driveType) => set("driveType", driveType)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Interior features</label>
          <div className="flex gap-2">
            <TextInput
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
              placeholder="e.g. Leather seats"
            />
            <Button type="button" variant="secondary" onClick={addFeature}>
              <FiPlus /> Add
            </Button>
          </div>
          {form.interiorFeatures.length > 0 && (
            <ul className="mt-2 space-y-1">
              {form.interiorFeatures.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <div className="flex flex-1 flex-col gap-1 sm:flex-row">
                    <TextInput
                      value={f.en}
                      onChange={(e) => updateFeature(i, { ...f, en: e.target.value })}
                      className="py-1 text-sm"
                      aria-label={`Feature ${i + 1}, English`}
                    />
                    <TextInput
                      value={f.ur}
                      onChange={(e) => updateFeature(i, { ...f, ur: e.target.value })}
                      lang="ur"
                      placeholder="اردو ترجمہ"
                      className="py-1 font-urdu text-sm leading-loose"
                      aria-label={`Feature ${i + 1}, Urdu`}
                    />
                  </div>
                  <button type="button" onClick={() => moveFeature(i, -1)} disabled={i === 0} className="p-1 text-slate-400 hover:text-navy disabled:opacity-30">
                    <FiArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveFeature(i, 1)} disabled={i === form.interiorFeatures.length - 1} className="p-1 text-slate-400 hover:text-navy disabled:opacity-30">
                    <FiArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeFeature(i)} className="p-1 text-red-400 hover:text-red-600">
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Rates */}
      <Section
        title="Rates"
        subtitle="Clear a field — or press “On request” — to unpublish that rate; the vehicle page and the public rate list then read “On request” in its place. A rate that is filled in must be greater than zero."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <RateField label="Per hour" value={form.perHour} onChange={(v) => set("perHour", v)} error={errors["rates.perHour"]} />
          <RateField label="Per day" value={form.perDay} onChange={(v) => set("perDay", v)} error={errors["rates.perDay"]} />
          <RateField label="Per week" value={form.perWeek} onChange={(v) => set("perWeek", v)} error={errors["rates.perWeek"]} />
          <RateField label="Per month" value={form.perMonth} onChange={(v) => set("perMonth", v)} error={errors["rates.perMonth"]} />
          <RateField label="Fuel per km" value={form.fuelPerKm} onChange={(v) => set("fuelPerKm", v)} error={errors["rates.fuelPerKm"]} />
          <RateField label="Airport transfer" value={form.airportTransfer} onChange={(v) => set("airportTransfer", v)} error={errors["rates.airportTransfer"]} />
        </div>
      </Section>

      {/* Images */}
      <Section
        title="Photos"
        subtitle="Upload as many as you like. The primary image opens the gallery and is what fleet cards and link previews use — set it with the star. Add clear alt text for accessibility & SEO."
      >
        <ImageManager value={form.images} onChange={(imgs) => set("images", imgs)} subfolder="vehicles" />
      </Section>

      {/* Self-drive — offered on everyday classes only */}
      <Section
        title="Self-drive"
        subtitle="When enabled, this vehicle appears in the self-drive picker (once the self-drive line is switched on in Settings). Blank rates show “on request”."
      >
        {selfDriveClassAllowed ? (
          <>
            <FlagRow
              label="Available for self-drive"
              checked={form.selfDriveAvailable}
              onChange={(v) => set("selfDriveAvailable", v)}
            />
            {form.selfDriveAvailable && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <RateField label="Self-drive per day" value={form.sdPerDay} onChange={(v) => set("sdPerDay", v)} error={errors["selfDrive.perDay"]} />
                <RateField label="Self-drive per week" value={form.sdPerWeek} onChange={(v) => set("sdPerWeek", v)} error={errors["selfDrive.perWeek"]} />
                <RateField label="Self-drive per month" value={form.sdPerMonth} onChange={(v) => set("sdPerMonth", v)} error={errors["selfDrive.perMonth"]} />
                {/* Blank here means "confirmed at booking", and zero is allowed:
                    it is how a no-deposit vehicle is published. */}
                <RateField
                  label="Security deposit"
                  value={form.sdDeposit}
                  onChange={(v) => set("sdDeposit", v)}
                  error={errors["selfDrive.securityDeposit"]}
                  allowZero
                  clearLabel="Clear"
                  placeholder="Confirmed at booking"
                />
              </div>
            )}
          </>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            Self-drive is offered on{" "}
            {SELF_DRIVE_CLASSES.map((c) => VEHICLE_CLASS_LABELS[c]).join(", ")} only. Change the
            vehicle class above to enable it.
          </p>
        )}
      </Section>

      {/* Flags */}
      <Section title="Flags & visibility">
        <div className="grid gap-3 sm:grid-cols-2">
          <FlagRow label="Featured on homepage" checked={form.featured} onChange={(v) => set("featured", v)} />
          <FlagRow
            label="Recommended in booking flow"
            checked={form.recommended}
            onChange={(v) => set("recommended", v)}
          />
          <FlagRow label="Active (visible on site)" checked={form.active} onChange={(v) => set("active", v)} />
          <Field label="Armor level" hint="B-6 is the fleet standard for protected movement">
            <Select value={form.armorLevel} onChange={(e) => set("armorLevel", e.target.value)}>
              <option value="">Not armored</option>
              {ARMOR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <FlagRow label="Roll cage" checked={form.rollCage} onChange={(v) => set("rollCage", v)} />
        </div>
      </Section>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 py-3 backdrop-blur">
        {dirty && <span className="mr-auto text-xs text-amber-600">Unsaved changes</span>}
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/vehicles")}>
          Cancel
        </Button>
        <Button type="submit" pending={pending}>
          {vehicle ? "Save vehicle" : "Create vehicle"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * One money field, with an explicit way back to "unpublished".
 *
 * Emptying the box is what unpublishes a rate, but an empty box is an easy
 * thing to mistake for "not filled in yet", so the state is spelled out: the
 * placeholder names what the public site will print, and the button next to a
 * filled field clears it in one press. `step="any"` keeps the browser from
 * rejecting whole rupee amounts against the fractional minimum.
 */
function RateField({
  label,
  value,
  onChange,
  error,
  allowZero = false,
  clearLabel = "On request",
  placeholder = "On request",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string[];
  /** Security deposit only: zero is a term, not an unset rate. */
  allowZero?: boolean;
  clearLabel?: string;
  placeholder?: string;
}) {
  const filled = value.trim() !== "";
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          PKR
        </span>
        <TextInput
          type="number"
          min={allowZero ? 0 : 0.01}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          // Spinners off: they are useless on a rupee amount and would sit
          // underneath the clear button.
          className={`pl-11 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${filled ? "pr-24" : ""}`}
          invalid={!!error}
        />
        {filled && (
          <button
            type="button"
            onClick={() => onChange("")}
            title={`Clear this rate — the site will show “${clearLabel}”`}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-navy"
          >
            {clearLabel}
          </button>
        )}
      </div>
    </Field>
  );
}

function FlagRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
      <span className="text-sm text-slate-700">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </label>
  );
}
