"use client";

import { useActionState } from "react";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { submitContact } from "@/lib/actions/public";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { useI18n } from "./LocaleProvider";

const field =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

/** General enquiry form → writes an Enquiry with a 'general' marker. */
export function ContactForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(submitContact, EMPTY_FORM_STATE);
  const err = (name: string) => state.fieldErrors[name]?.[0];

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            {t.form.name} <span className="text-accent">*</span>
          </span>
          <input
            name="name"
            required
            maxLength={120}
            className={field}
            placeholder={t.form.namePlaceholder}
          />
          {err("name") && <span className="mt-1 block text-xs text-red-600">{err("name")}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            {t.form.phone} <span className="text-accent">*</span>
          </span>
          <input
            name="phone"
            required
            type="tel"
            className={field}
            placeholder={t.form.phonePlaceholder}
          />
          {err("phone") && <span className="mt-1 block text-xs text-red-600">{err("phone")}</span>}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink/80">{t.form.email}</span>
        <input name="email" type="email" className={field} placeholder={t.form.emailPlaceholder} />
        {err("email") && <span className="mt-1 block text-xs text-red-600">{err("email")}</span>}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink/80">
          {t.form.message} <span className="text-accent">*</span>
        </span>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={3000}
          className={field}
          placeholder={t.form.messagePlaceholder}
        />
        {err("message") && <span className="mt-1 block text-xs text-red-600">{err("message")}</span>}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60 sm:w-auto"
      >
        <FiSend className="h-4 w-4" /> {pending ? t.common.sending : t.form.send}
      </button>
    </form>
  );
}
