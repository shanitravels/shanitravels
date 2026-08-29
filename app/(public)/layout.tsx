import { getSettings } from "@/lib/data/settings";
import { getActiveOffices } from "@/lib/data/content";
import { getLocaleState, getDictionary } from "@/lib/i18n/server";
import { localize } from "@/lib/i18n/localize";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import { Analytics } from "@/components/site/Analytics";
import { LanguageGate } from "@/components/site/LanguageGate";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileActionBar } from "@/components/site/MobileActionBar";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PromoBar } from "@/components/site/PromoBar";
import { PROMO_DISMISS_COOKIE, promoSignature } from "@/lib/promo";
import { isPromoLive } from "@/lib/types";
import { cookies } from "next/headers";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { locale, chosen } = await getLocaleState();
  const t = getDictionary(locale);

  const [rawSettings, rawOffices] = await Promise.all([getSettings(), getActiveOffices()]);

  // Cached data comes back bilingual; it is collapsed to a single language here
  // at the boundary, so every component downstream still receives plain strings.
  const settings = localize(rawSettings, locale);
  const offices = localize(rawOffices, locale);

  const helpline = settings.helplineNumbers[0] ?? "";

  // The promo owns the bar slot whenever it is live, so the page never carries
  // two stacked bars. Switching it off — or letting its end date pass — hands
  // the slot straight back to the announcement notice with no further edits.
  const promo = settings.promo ?? null;
  const promoLive = isPromoLive(promo) && Boolean(promo?.message);

  // Read the dismissal here rather than hiding on mount: the server already
  // decides whether to render the bar, so a dismissed promo never reaches the
  // HTML — no flash, and nothing for hydration to disagree about.
  //
  // The signature is language-independent by construction (see lib/promo), and
  // the bar is handed the value rather than recomputing it, so the side that
  // writes the cookie and the side that checks it cannot drift apart.
  const promoSig = promo ? promoSignature(promo) : "";
  const dismissedSignature = (await cookies()).get(PROMO_DISMISS_COOKIE)?.value;
  const showPromo = promoLive && promo != null && dismissedSignature !== promoSig;

  const announcement =
    !promoLive && settings.announcementBar?.active && settings.announcementBar.text
      ? settings.announcementBar.text
      : "";

  return (
    <LocaleProvider locale={locale} t={t}>
      <div className="flex min-h-screen flex-col">
        {showPromo && promo && <PromoBar promo={promo} signature={promoSig} />}
        {announcement && <AnnouncementBar text={announcement} />}
        <Header helpline={helpline} whatsapp={settings.whatsappNumber} />
        {/* pb-16 leaves room for the sticky mobile action bar */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer settings={settings} offices={offices} t={t} />
        <MobileActionBar helpline={helpline} whatsapp={settings.whatsappNumber} />
      </div>
      {/* No cookie means the visitor has never chosen — ask once. */}
      {!chosen && <LanguageGate />}
      {/* Renders nothing unless PLAUSIBLE_DOMAIN or GA_MEASUREMENT_ID is set.
          Conversion counts in the admin panel are first-party and do not
          depend on this. */}
      <Analytics />
    </LocaleProvider>
  );
}
