import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { allAdminUsers } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function UsersPage() {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    redirect("/admin");
  }
  const users = await allAdminUsers();
  return (
    <div>
      <PageHeader title="Users" description="Manage who can access this dashboard and what they can do." />
      <UsersManager initial={users} currentUserId={session.userId} />
    </div>
  );
}
