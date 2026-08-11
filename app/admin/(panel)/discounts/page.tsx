import { requireAdmin } from "@/lib/auth/session";
import { allVehicles, allDiscounts } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { DiscountsManager } from "@/components/admin/DiscountsManager";

export default async function DiscountsPage() {
  await requireAdmin();
  const [discounts, vehicles] = await Promise.all([allDiscounts(), allVehicles()]);
  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Reduce published rates across the fleet, a class, or specific vehicles. Live discounts show on the public site immediately."
      />
      <DiscountsManager initial={discounts} vehicles={vehicles} />
    </div>
  );
}
