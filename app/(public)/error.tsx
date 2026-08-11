"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiRefreshCw, FiHome } from "react-icons/fi";
import { useI18n } from "@/components/site/LocaleProvider";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Unlike app/global-error.tsx, this boundary renders *inside* the (public)
  // layout, so LocaleProvider is above it and the hook works. An error thrown by
  // the layout itself escalates past this to global-error, which reads the
  // cookie directly for exactly that reason.
  const { t } = useI18n();

  useEffect(() => {
    console.error("[public] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-2xl font-bold text-navy">{t.error.title}</h1>
      <p className="mt-2 max-w-md text-muted">{t.error.publicBody}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          <FiRefreshCw className="h-4 w-4" /> {t.error.retry}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
        >
          <FiHome className="h-4 w-4" /> {t.nav.home}
        </Link>
      </div>
    </div>
  );
}
