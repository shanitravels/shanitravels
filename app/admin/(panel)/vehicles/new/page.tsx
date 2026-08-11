import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/parts";
import { VehicleForm } from "@/components/admin/VehicleForm";

export default async function NewVehiclePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add vehicle" description="Create a new vehicle in the catalog." />
      <VehicleForm />
    </div>
  );
}
