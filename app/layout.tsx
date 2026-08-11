import type { Metadata } from "next";
import { Poppins, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Urdu face. Nastaliq is the calligraphic style Urdu is conventionally set in;
 * the Naskh alternative reads as Arabic to an Urdu audience. It is a heavy
 * font, so it is loaded on every page but only *applied* under [lang="ur"] —
 * `display: swap` keeps that from blocking the English render.
 */
const notoNastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shani Travels — Car Rental & Corporate Transport, Islamabad",
    template: "%s · Shani Travels",
  },
  description:
    "Chauffeur-driven car rental in Islamabad and nationwide project transport for organizations. Insured, GPS-tracked fleet, serving Pakistan since 1997.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `lang` has to be right on the <html> element itself, which is only rendered
  // here — so the root layout is where the locale cookie gets read, and why
  // every route is dynamic. `dir` stays "ltr" in both languages by design: the
  // layout was kept left-to-right, and the browser's bidi algorithm still lays
  // out each Urdu run correctly inside it.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${inter.variable} ${notoNastaliq.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning covers this element's own attributes only —
          not its subtree — so real mismatches inside the app still surface.
          Extensions like Grammarly stamp attributes (data-gr-ext-installed,
          data-new-gr-c-s-check-loaded) onto <body> before React hydrates, which
          React otherwise reports as a mismatch on every page load. Nothing here
          renders differently between server and client. */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
