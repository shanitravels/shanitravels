import Link from "next/link";
import { FiHome, FiTruck } from "react-icons/fi";
import { getI18n } from "@/lib/i18n/server";

/**
 * 404 boundary for the public site.
 *
 * The root `app/not-found.tsx` already covers URLs that match no route at all.
 * This one exists for `notFound()` thrown *inside* a segment — a `/fleet/[slug]`
 * with no such vehicle, say. Without a boundary inside this route group, Next
 * cannot reach the root one across the group edge and bails to its bare
 * `__next_error__` shell, which serves an empty body and only paints the 404
 * after hydration.
 *
 * Being here also means it renders inside app/(public)/layout.tsx, so a visitor
 * who lands on a dead vehicle link keeps the header, footer and language
 * switcher instead of being dumped on a standalone page.
 */
export default async function PublicNotFound() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-heading text-6xl font-bold text-navy tabular-nums">{t.notFound.code}</p>
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
