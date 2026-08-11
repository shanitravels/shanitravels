import { requireAdmin } from "@/lib/auth/session";
import { allClients } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { ClientsManager } from "@/components/admin/ClientsManager";

export default async function ClientsPage() {
  await requireAdmin();
  const clients = await allClients();
  return (
    <div>
      <PageHeader title="Clients" description="Manage the trusted-by wall. Featured clients appear on the homepage." />
      <ClientsManager initial={clients} />
    </div>
  );
}
