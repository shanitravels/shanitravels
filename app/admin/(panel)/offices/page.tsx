import { requireAdmin } from "@/lib/auth/session";
import { allOffices } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { OfficesManager } from "@/components/admin/OfficesManager";

export default async function OfficesPage() {
  await requireAdmin();
  const offices = await allOffices();
  return (
    <div>
      <PageHeader title="Offices" description="Manage the national office network. One office can be the head office." />
      <OfficesManager initial={offices} />
    </div>
  );
}
