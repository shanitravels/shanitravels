"use client";

import { useActionState } from "react";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { submitContact } from "@/lib/actions/public";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { useI18n } from "./LocaleProvider";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

/**
 * General enquiry form → writes an Enquiry with a 'general' marker.
 *
 * Every field is full width and stacked: the form sits in the middle column of
 * the contact page, which is too narrow to pair two inputs on a row at the
 * width where that layout appears.
 *
 * The labels are `sr-only` and the placeholder carries the visible prompt —
 * the design asks for unlabelled boxes, but a placeholder is not an accessible
 * name, so the label stays in the markup for screen readers and for the larger
 * click target it gives the input.
 */
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

      <label className="block">
        <span className="sr-only">{t.form.name}</span>
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
        <span className="sr-only">{t.form.phone}</span>
        <input
          name="phone"
          required
          type="tel"
          className={field}
          placeholder={t.form.phonePlaceholder}
        />
        {err("phone") && <span className="mt-1 block text-xs text-red-600">{err("phone")}</span>}
      </label>

      <label className="block">
        <span className="sr-only">{t.form.email}</span>
        <input name="email" type="email" className={field} placeholder={t.form.emailPlaceholder} />
        {err("email") && <span className="mt-1 block text-xs text-red-600">{err("email")}</span>}
      </label>

      <label className="block">
        <span className="sr-only">{t.form.message}</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={3000}
          className={`${field} resize-y`}
          placeholder={t.form.messagePlaceholder}
        />
        {err("message") && <span className="mt-1 block text-xs text-red-600">{err("message")}</span>}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
      >
        <FiSend className="h-4 w-4" /> {pending ? t.common.sending : t.form.send}
      </button>
    </form>
  );
}
