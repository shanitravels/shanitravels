import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sidebarBadges } from "@/lib/data/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already guards this, but we re-check here to load the session
  // for the shell and to enforce authorization at the server boundary.
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const badges = await sidebarBadges();

  return (
    <AdminShell userName={session.name} role={session.role} badges={badges}>
      {children}
    </AdminShell>
  );
}
