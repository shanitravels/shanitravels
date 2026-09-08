import { getActiveVehicleSlugs } from "@/lib/data/vehicles";
import { getActiveServices } from "@/lib/data/content";
import { getActiveIndustries } from "@/lib/data/industries";
import { getSettings } from "@/lib/data/settings";
import { SITE_URL } from "@/lib/seo";

/**
 * The sitemap, written as a Route Handler rather than the `app/sitemap.ts`
 * metadata convention.
 *
 * The convention serialises the XML itself and exposes no hook for the
 * `<?xml-stylesheet?>` processing instruction, which is the one line that makes
 * a browser render /sitemap.xml as a readable page (public/sitemap.xsl) instead
 * of a wall of raw tags. Emitting the document by hand is the only way to get
 * that instruction in front of the root element, so the route moved here and
 * app/sitemap.ts was removed. Everything else — the route table, the settings
 * gates, the priorities — is unchanged, and the path is still /sitemap.xml, so
 * robots.ts keeps pointing at the right place.
 *
 * Crawlers ignore the stylesheet entirely: it is a processing instruction, not
 * content, so the XML Google parses is byte-identical to what it was before.
 *
 * `force-dynamic` looks expensive but isn't. Every read below goes through
 * `cachedRead`, so the response is assembled from tag-cached data and rebuilt
 * only when an admin edit purges the matching tag — the same freshness path the
 * rest of the site uses. Caching the response on top of that would just add a
 * second layer that the existing revalidateTag() calls don't know how to clear.
 */
export const dynamic = "force-dynamic";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
};

/** Slugs are authored in /admin, so no URL here is guaranteed XML-safe. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `<url>\n` +
        `<loc>${escapeXml(e.url)}</loc>\n` +
        `<lastmod>${e.lastModified.toISOString()}</lastmod>\n` +
        `<changefreq>${e.changeFrequency}</changefreq>\n` +
        `<priority>${e.priority}</priority>\n` +
        `</url>`
    )
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

export async function GET() {
  const [slugs, services, industries, settings] = await Promise.all([
    getActiveVehicleSlugs(),
    getActiveServices(),
    getActiveIndustries(),
    getSettings(),
  ]);
  const now = new Date();

  // /clients exists only while client identities may be published; listing a
  // route that 404s is what makes Search Console report coverage errors.
  const optionalRoutes = settings.showClientIdentities
    ? ([{ path: "/clients", changeFrequency: "monthly", priority: 0.6 }] as const)
    : ([] as const);

  const staticRoutes: SitemapEntry[] = (
    [
      { path: "/", changeFrequency: "weekly", priority: 1 },
      { path: "/fleet", changeFrequency: "weekly", priority: 0.9 },
      { path: "/rates", changeFrequency: "monthly", priority: 0.9 },
      { path: "/corporate", changeFrequency: "monthly", priority: 0.9 },
      { path: "/industries", changeFrequency: "monthly", priority: 0.9 },
      { path: "/services", changeFrequency: "monthly", priority: 0.8 },
      { path: "/safety", changeFrequency: "monthly", priority: 0.7 },
      { path: "/network", changeFrequency: "monthly", priority: 0.6 },
      { path: "/about", changeFrequency: "yearly", priority: 0.6 },
      { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
      { path: "/book", changeFrequency: "monthly", priority: 0.8 },
      ...optionalRoutes,
    ] as const
  ).map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Self-drive is only indexed once the service line is switched on.
  if (settings.selfDriveEnabled) {
    staticRoutes.push({
      url: `${SITE_URL}/self-drive`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  const vehicleRoutes: SitemapEntry[] = slugs.map((slug) => ({
    url: `${SITE_URL}/fleet/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const serviceRoutes: SitemapEntry[] = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Industry landing pages are the sector SEO play — priority above services.
  const industryRoutes: SitemapEntry[] = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: new Date(i.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const body = toXml([...staticRoutes, ...vehicleRoutes, ...serviceRoutes, ...industryRoutes]);

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Crawlers refetch this often; a short shared-cache window keeps that
      // cheap without holding an edit back for long.
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
