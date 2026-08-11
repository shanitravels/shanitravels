import Link from "next/link";
import { FiPhone, FiCalendar } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { telHref, whatsappHref } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";

/**
 * Sticky bottom action bar on mobile — Call · WhatsApp · Book.
 * Hidden on md+ where the header CTA and contact buttons are visible.
 */
export async function MobileActionBar({
  helpline,
  whatsapp,
}: {
  helpline: string;
  whatsapp: string;
}) {
  const { t } = await getI18n();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 divide-x divide-line">
        <a href={telHref(helpline)} className="flex flex-col items-center gap-0.5 py-2.5 text-navy">
          <FiPhone className="h-5 w-5" />
          <span className="text-[11px] font-medium">{t.nav.call}</span>
        </a>
        <a
          href={whatsappHref(whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 py-2.5 text-[#25D366]"
        >
          <FaWhatsapp className="h-5 w-5" />
          <span className="text-[11px] font-medium">{t.nav.whatsapp}</span>
        </a>
        <Link href="/book" className="flex flex-col items-center gap-0.5 bg-accent py-2.5 text-white">
          <FiCalendar className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{t.nav.bookShort}</span>
        </Link>
      </div>
    </div>
  );
}
