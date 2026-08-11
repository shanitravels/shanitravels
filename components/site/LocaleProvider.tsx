"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * Makes the active locale and its strings available to client components.
 *
 * Server components call `getI18n()` directly; only interactive pieces — the
 * header, forms, the gallery — need this. The dictionary arrives as a prop
 * from the server layout, so exactly one language crosses the wire and neither
 * dictionary is bundled into the client build.
 */

type I18nValue = { locale: Locale; t: Dictionary };

const LocaleContext = createContext<I18nValue | null>(null);

export function LocaleProvider({
  locale,
  t,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside <LocaleProvider>");
  return value;
}
