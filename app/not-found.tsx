import Link from "next/link";
import { FiHome, FiTruck } from "react-icons/fi";
import { getI18n } from "@/lib/i18n/server";

/**
 * Root 404. Sits outside the (public) group, so there is no LocaleProvider —
 * but this is a server component, so it reads the locale directly.
 */
export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-offwhite px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white">
        ST
      </span>
      <p className="mt-6 font-heading text-6xl font-bold text-navy tabular">{t.notFound.code}</p>
      <h1 className="mt-2 font-heading text-xl font-semibold text-navy">{t.notFound.title}</h1>
      <p className="mt-2 max-w-md text-muted">{t.notFound.body}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          <FiHome className="h-4 w-4" /> {t.nav.home}
        </Link>
        <Link
          href="/fleet"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
        >
          <FiTruck className="h-4 w-4" /> {t.common.browseFleet}
        </Link>
      </div>
    </div>
  );
}
