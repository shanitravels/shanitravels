import { requireAdmin } from "@/lib/auth/session";
import { allSafetySections } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { SafetyManager } from "@/components/admin/SafetyManager";

export default async function SafetyAdminPage() {
  await requireAdmin();
  const sections = await allSafetySections();
  return (
    <div>
      <PageHeader
        title="Safety & Security"
        description="The published security protocol, section by section. Changes appear on /safety immediately."
      />
      <SafetyManager initial={sections} />
    </div>
  );
}
