import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { vehicleById } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { formatDateTime } from "@/lib/format";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const vehicle = await vehicleById(id);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit · ${vehicle.name}`}
        description={`Created ${formatDateTime(vehicle.createdAt)} · Last updated ${formatDateTime(vehicle.updatedAt)}`}
      />
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
