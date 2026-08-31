import type { MetadataRoute } from "next";
import { getActiveVehicleSlugs } from "@/lib/data/vehicles";
import { getActiveServices } from "@/lib/data/content";
import { getActiveIndustries } from "@/lib/data/industries";
import { getSettings } from "@/lib/data/settings";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticRoutes: MetadataRoute.Sitemap = (
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

  const vehicleRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/fleet/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Industry landing pages are the sector SEO play — priority above services.
  const industryRoutes: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: new Date(i.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...serviceRoutes, ...industryRoutes];
}
