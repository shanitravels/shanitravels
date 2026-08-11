import { requireAdmin } from "@/lib/auth/session";
import { allMarketingContacts } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { MailingList } from "@/components/admin/MailingList";

export default async function MailingListPage() {
  await requireAdmin();
  const contacts = await allMarketingContacts();
  return (
    <div>
      <PageHeader
        title="Mailing list"
        description="Every email address collected from bookings and enquiries, ready for offer and discount campaigns. Export the subscribed list to send."
      />
      <MailingList initial={contacts} />
    </div>
  );
}
