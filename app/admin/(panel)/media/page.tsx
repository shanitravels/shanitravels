import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/parts";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default async function MediaPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Media library"
        description="All images uploaded through the dashboard. Copy URLs or delete unused assets."
      />
      <MediaLibrary />
    </div>
  );
}
