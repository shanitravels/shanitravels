import { requireAdmin } from "@/lib/auth/session";
import { allAwards } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { AwardsManager } from "@/components/admin/AwardsManager";

export default async function AwardsAdminPage() {
  await requireAdmin();
  const awards = await allAwards();
  return (
    <div>
      <PageHeader
        title="Awards & appreciations"
        description="Awards, certificates, appreciation letters and press mentions. The counters on the public page are derived from what is published here."
      />
      <AwardsManager initial={awards} />
    </div>
  );
}
