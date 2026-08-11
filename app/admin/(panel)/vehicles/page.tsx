import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { requireAdmin } from "@/lib/auth/session";
import { allVehicles } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { VehiclesTable } from "@/components/admin/VehiclesTable";

export default async function VehiclesPage() {
  await requireAdmin();
  const vehicles = await allVehicles();

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage the fleet catalog. Toggle featured/active inline; edit for full details."
        action={
          <Link
            href="/admin/vehicles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            <FiPlus /> Add vehicle
          </Link>
        }
      />
      <VehiclesTable initial={vehicles} />
    </div>
  );
}
