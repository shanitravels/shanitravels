import { requireAdmin } from "@/lib/auth/session";
import { allEnquiries } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { EnquiriesManager } from "@/components/admin/EnquiriesManager";

export default async function EnquiriesPage() {
  await requireAdmin();
  const enquiries = await allEnquiries();
  return (
    <div>
      <PageHeader title="Enquiries" description="Corporate proposal requests and general enquiries. Click a row for details and pipeline." />
      <EnquiriesManager initial={enquiries} />
    </div>
  );
}
