"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiGlobe } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { setLocale } from "@/lib/actions/locale";
import { useI18n } from "./LocaleProvider";

/**
 * Navbar language toggle.
 *
 * With exactly two languages a toggle beats a dropdown: the button shows the
 * language you would switch *to*, always written in that language, so it reads
 * correctly whichever side you are on.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const next = locale === "en" ? "ur" : "en";
  const nextLabel = next === "ur" ? t.language.urdu : t.language.english;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      aria-label={`${t.language.switchLabel}: ${nextLabel}`}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm font-semibold text-navy/70 transition hover:border-navy/30 hover:text-navy disabled:opacity-50",
        next === "ur" && "font-urdu leading-loose",
        className
      )}
    >
      <FiGlobe className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      {nextLabel}
    </button>
  );
}
