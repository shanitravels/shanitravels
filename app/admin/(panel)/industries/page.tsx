import { requireAdmin } from "@/lib/auth/session";
import { allIndustries, allServices } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { IndustriesManager } from "@/components/admin/IndustriesManager";

export default async function IndustriesAdminPage() {
  await requireAdmin();
  const [industries, services] = await Promise.all([allIndustries(), allServices()]);
  return (
    <div>
      <PageHeader
        title="Industries"
        description="Per-industry landing pages — the sector SEO play. Each page cross-links services, fleet classes and sector references."
      />
      <IndustriesManager initial={industries} services={services} />
    </div>
  );
}
