import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminSettings } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }
  const settings = await adminSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Site settings"
        description="Global content: contact details, hero, announcement bar, stats, credentials, SEO. Saving updates the whole public site."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
