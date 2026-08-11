"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiBriefcase,
  FiAward,
  FiMessageSquare,
  FiLayers,
  FiMapPin,
  FiImage,
  FiSettings,
  FiUsers,
  FiMenu,
  FiX,
  FiLogOut,
  FiExternalLink,
  FiMail,
  FiTrendingUp,
  FiTag,
  FiGlobe,
  FiShield,
} from "react-icons/fi";
import { clsx } from "clsx";
import { ToastProvider } from "./Toast";
import { logout } from "@/lib/actions/auth";
import type { AdminRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

export function AdminShell({
  children,
  userName,
  role,
  badges,
}: {
  children: React.ReactNode;
  userName: string;
  role: AdminRole;
  badges: { bookings: number; enquiries: number };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Dashboard", icon: <FiGrid /> },
        { href: "/admin/analytics", label: "Analytics", icon: <FiTrendingUp /> },
      ],
    },
    {
      title: "Requests",
      items: [
        { href: "/admin/bookings", label: "Bookings", icon: <FiCalendar />, badge: badges.bookings },
        { href: "/admin/enquiries", label: "Enquiries", icon: <FiBriefcase />, badge: badges.enquiries },
        { href: "/admin/mailing-list", label: "Mailing list", icon: <FiMail /> },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/vehicles", label: "Vehicles", icon: <FiTruck /> },
        { href: "/admin/rates", label: "Rates", icon: <FiDollarSign /> },
        { href: "/admin/discounts", label: "Discounts", icon: <FiTag /> },
        { href: "/admin/clients", label: "Clients", icon: <FiAward /> },
        { href: "/admin/testimonials", label: "Testimonials", icon: <FiMessageSquare /> },
        { href: "/admin/services", label: "Services", icon: <FiLayers /> },
        { href: "/admin/industries", label: "Industries", icon: <FiGlobe /> },
        { href: "/admin/safety", label: "Safety", icon: <FiShield /> },
        { href: "/admin/offices", label: "Offices", icon: <FiMapPin /> },
        { href: "/admin/media", label: "Media", icon: <FiImage /> },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/admin/settings", label: "Settings", icon: <FiSettings /> },
        { href: "/admin/users", label: "Users", icon: <FiUsers /> },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const visibleGroups = groups;

  const allItems = visibleGroups.flatMap((g) => g.items);

  const navList = (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {visibleGroups.map((group, gi) => (
        <div key={gi}>
          {group.title && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(item.href)
                    ? "bg-navy text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebarInner = (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">
          ST
        </span>
        <div>
          <p className="text-sm font-bold text-white">Shani Travels</p>
          <p className="text-[11px] capitalize text-slate-400">{role} console</p>
        </div>
      </div>
      {navList}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <FiExternalLink /> View live site
        </Link>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy-deep print:!hidden md:flex">
          {sidebarInner}
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-navy-deep">
              {sidebarInner}
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="md:pl-60 print:pl-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 print:hidden">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <FiMenu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {allItems.find((i) => isActive(i.href))?.label ?? "Admin"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-700">{userName}</p>
                <p className="text-[11px] capitalize text-slate-400">{role}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <FiLogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </form>
            </div>
          </header>

          <main className="p-4 print:p-0 sm:p-6">{children}</main>
        </div>

        {/* close button for mobile drawer */}
        {open && (
          <button
            className="fixed right-4 top-3 z-50 rounded-lg bg-white p-2 text-slate-700 shadow md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
    </ToastProvider>
  );
}
