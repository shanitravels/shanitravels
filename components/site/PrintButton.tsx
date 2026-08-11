"use client";

import { FiPrinter } from "react-icons/fi";
import { useI18n } from "./LocaleProvider";

/** Opens the browser print dialog — the print stylesheet produces the PDF. */
export function PrintButton({ label }: { label?: string }) {
  const { t } = useI18n();
  const text = label ?? t.misc.downloadPdf;
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-band print:hidden"
    >
      <FiPrinter className="h-4 w-4" /> {text}
    </button>
  );
}
