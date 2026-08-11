import { requireAdmin } from "@/lib/auth/session";
import { allBookings } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { BookingsManager } from "@/components/admin/BookingsManager";

export default async function BookingsPage() {
  await requireAdmin();
  const bookings = await allBookings();
  return (
    <div>
      <PageHeader title="Bookings" description="Retail booking requests. Click a row to view details, advance status, or add notes." />
      <BookingsManager initial={bookings} />
    </div>
  );
}
