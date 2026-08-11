import { requireAdmin } from "@/lib/auth/session";
import { allVehicles } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { RatesGrid } from "@/components/admin/RatesGrid";

export default async function RatesPage() {
  await requireAdmin();
  const vehicles = (await allVehicles()).filter((v) => v.active);

  return (
    <div>
      <PageHeader
        title="Rates"
        description="Bulk-edit the rate card. Edit any cell, then Save all. Export a CSV for circulation."
      />
      <RatesGrid vehicles={vehicles} />
    </div>
  );
}
