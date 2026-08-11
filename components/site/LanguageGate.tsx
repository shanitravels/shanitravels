"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/config";

/**
 * First-visit language chooser.
 *
 * Rendered only when the locale cookie is absent, so it asks once and never
 * again — including for visitors who pick English, which is why the server
 * distinguishes "chose English" from "hasn't chosen" (see getLocaleState).
 *
 * The copy is deliberately bilingual and hardcoded rather than pulled from a
 * dictionary: at this moment there is no chosen language, so the dialog has to
 * address both audiences at once. It offers no dismiss — the whole point is to
 * come away with a choice, and it is two buttons.
 */
export function LanguageGate() {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<Locale | null>(null);
  const router = useRouter();

  if (!open) return null;

  const choose = (locale: Locale) => {
    setPicked(locale);
    startTransition(async () => {
      await setLocale(locale);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">
            ST
          </span>
          <span className="font-heading text-lg font-bold text-navy">Shani Travels</span>
        </div>

        <h2
          id="language-gate-title"
          className="mt-5 text-center font-heading text-xl font-bold text-navy"
        >
          Choose your language
        </h2>
        <p className="mt-1 text-center font-urdu text-lg leading-loose text-navy">
          اپنی زبان منتخب کریں
        </p>

        <p className="mt-3 text-center text-sm text-muted">
          Read Shani Travels in the language you prefer.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose("en")}
            disabled={pending}
            className="flex min-h-[52px] items-center justify-center rounded-xl border-2 border-navy bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
          >
            {pending && picked === "en" ? "…" : "Continue in English"}
          </button>
          <button
            type="button"
            onClick={() => choose("ur")}
            disabled={pending}
            className="flex min-h-[52px] items-center justify-center rounded-xl border-2 border-navy px-4 font-urdu text-base leading-loose text-navy transition hover:bg-band disabled:opacity-60"
          >
            {pending && picked === "ur" ? "…" : "اردو میں جاری رکھیں"}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          You can switch at any time from the menu bar.
          <span className="mt-1 block font-urdu text-sm leading-loose">
            آپ کسی بھی وقت مینو بار سے زبان تبدیل کر سکتے ہیں۔
          </span>
        </p>
      </div>
    </div>
  );
}
