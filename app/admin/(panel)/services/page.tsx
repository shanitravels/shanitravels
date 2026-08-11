import { requireAdmin } from "@/lib/auth/session";
import { allServicesBilingual } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default async function ServicesPage() {
  await requireAdmin();
  const services = await allServicesBilingual();
  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the services shown across the public site, in English and Urdu."
      />
      <ServicesManager initial={services} />
    </div>
  );
}
