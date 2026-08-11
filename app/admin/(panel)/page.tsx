import Link from "next/link";
import { FiTruck, FiDollarSign, FiSettings, FiImage } from "react-icons/fi";
import { requireAdmin } from "@/lib/auth/session";
import { dashboardData } from "@/lib/data/admin";
import { PageHeader, StatCard, Card } from "@/components/admin/parts";
import {
  DashboardBookings,
  DashboardEnquiries,
  ViewAllLink,
} from "@/components/admin/DashboardLists";

export default async function DashboardPage() {
  await requireAdmin();
  const { stats, recentBookings, recentEnquiries } = await dashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="A live overview of requests and content." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="New bookings" value={stats.newBookings} href="/admin/bookings" accent={stats.newBookings > 0} />
        <StatCard label="New enquiries" value={stats.newEnquiries} href="/admin/enquiries" accent={stats.newEnquiries > 0} />
        <StatCard label="Active vehicles" value={stats.activeVehicles} href="/admin/vehicles" />
        <StatCard label="Published testimonials" value={stats.publishedTestimonials} href="/admin/testimonials" />
      </div>

      {/* min-w-0: without it these grid items keep their `min-width: auto`,
          so the nowrap row content sets the floor and the truncate classes
          inside never get a chance to truncate. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Latest bookings</h2>
            <ViewAllLink href="/admin/bookings" label="All bookings" />
          </div>
          <DashboardBookings items={recentBookings} />
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Latest enquiries</h2>
            <ViewAllLink href="/admin/enquiries" label="All enquiries" />
          </div>
          <DashboardEnquiries items={recentEnquiries} />
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink href="/admin/vehicles/new" icon={<FiTruck />} label="Add a vehicle" />
          <QuickLink href="/admin/rates" icon={<FiDollarSign />} label="Update rates" />
          <QuickLink href="/admin/media" icon={<FiImage />} label="Media library" />
          <QuickLink href="/admin/settings" icon={<FiSettings />} label="Site settings" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-navy/40 hover:shadow-lift"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/10 text-navy">
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  );
}
