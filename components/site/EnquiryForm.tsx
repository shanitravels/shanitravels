"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { submitEnquiry } from "@/lib/actions/public";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { CLIENT_SECTORS, CLIENT_SECTOR_LABELS } from "@/lib/types";
import { useI18n } from "./LocaleProvider";

const field =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

/**
 * Corporate proposal form → writes an Enquiry, redirects to a reference page.
 * Industry pages link here with ?sector=<name> to pre-fill the sector.
 */
export function EnquiryForm({ cities }: { cities: string[] }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(submitEnquiry, EMPTY_FORM_STATE);
  const err = (name: string) => state.fieldErrors[name]?.[0];
  const sectorParam = useSearchParams().get("sector") ?? "";
  // The *submitted* value stays the English label so a record means the same
  // thing whichever language it was entered in; only the display text follows
  // the locale. This list is matched against the ?sector= param that industry
  // pages link with, which also carries the English label.
  const sectorOptions = Object.values(CLIENT_SECTOR_LABELS) as string[];
  const extraSector = sectorParam && !sectorOptions.includes(sectorParam) ? sectorParam : null;

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <Group label={t.form.organization} error={err("company")} required>
          <input name="company" required maxLength={160} className={field} placeholder={t.form.organizationPlaceholder} />
        </Group>
        <Group label={t.form.contactName} error={err("contactName")} required>
          <input name="contactName" required maxLength={120} className={field} placeholder={t.form.namePlaceholder} />
        </Group>
        <Group label={t.form.phone} error={err("phone")} required>
          <input name="phone" required type="tel" className={field} placeholder={t.form.phonePlaceholder} />
        </Group>
        <Group label={t.form.email} error={err("email")} required>
          <input name="email" required type="email" className={field} placeholder={t.form.workEmailPlaceholder} />
        </Group>
        <Group label={t.form.sector} error={err("sector")}>
          <select name="sector" className={field} defaultValue={sectorParam}>
            <option value="">{t.form.selectSector}</option>
            {extraSector && <option value={extraSector}>{extraSector}</option>}
            {CLIENT_SECTORS.map((s) => (
              <option key={s} value={CLIENT_SECTOR_LABELS[s]}>
                {t.clientSector[s]}
              </option>
            ))}
          </select>
        </Group>
        <Group label={t.form.duration} error={err("duration")} required>
          <input
            name="duration"
            required
            maxLength={120}
            className={field}
            placeholder={t.form.durationPlaceholder}
          />
        </Group>
      </div>

      <Group label={t.form.vehiclesNeeded} error={err("vehiclesNeeded")} required>
        <input
          name="vehiclesNeeded"
          required
          maxLength={300}
          className={field}
          placeholder={t.form.vehiclesPlaceholder}
        />
      </Group>

      {cities.length > 0 && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t.form.citiesOfOperation}
          </span>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink/80 has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white"
              >
                <input type="checkbox" name="cities" value={c} className="sr-only" />
                {c}
              </label>
            ))}
          </div>
        </div>
      )}

      <Group label={t.form.projectDetails} error={err("details")}>
        <textarea
          name="details"
          rows={4}
          maxLength={3000}
          className={field}
          placeholder={t.form.projectPlaceholder}
        />
      </Group>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60 sm:w-auto"
      >
        <FiSend className="h-4 w-4" /> {pending ? t.common.sending : t.form.requestProposal}
      </button>
      <p className="text-xs text-muted">{t.form.enquiryFootnote}</p>
    </form>
  );
}

function Group({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/80">
        {label}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
