import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { getI18n } from "@/lib/i18n/server";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail shown below the top level on every interior page. */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = await getI18n();

  return (
    <nav aria-label={t.common.breadcrumb} className="border-b border-line bg-band/50">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3 text-xs text-muted sm:px-6">
        <li>
          <Link href="/" className="transition hover:text-navy">
            {t.nav.home}
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <FiChevronRight className="h-3 w-3 text-muted/60" />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="transition hover:text-navy">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-navy">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
