import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom =
    from && (from.startsWith("/admin") || from.startsWith("/ops")) && !from.includes("//")
      ? from
      : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white">
            ST
          </div>
          <h1 className="text-xl font-bold text-navy">Shani Travels Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage the website</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <LoginForm from={safeFrom} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Authorized personnel only · Shani Travels since 1997
        </p>
      </div>
    </div>
  );
}
