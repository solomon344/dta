"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { Avatar } from "./ui";

const links = [
  { href: "/dashboard", label: "Overview", icon: "dashboard", exact: true },
  { href: "/dashboard/students", label: "Students", icon: "group" },
  { href: "/dashboard/cohorts", label: "Cohorts", icon: "calendar_month" },
  { href: "/dashboard/programs", label: "Programs", icon: "menu_book" },
  { href: "/dashboard/certificates", label: "Certificates", icon: "workspace_premium" },
  { href: "/dashboard/staff", label: "Staff", icon: "badge", adminOnly: true },
  { href: "/dashboard/profile", label: "My Profile", icon: "person" },
];

export default function Sidebar({
  user,
  signOut,
}: {
  user: { name: string; email: string; role: "admin" | "staff"; photoUrl: string | null };
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links
        .filter((l) => !l.adminOnly || user.role === "admin")
        .map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-space-sm rounded-lg px-space-sm py-2 text-label-lg transition-all ${
                active ? "bg-white/10 text-surface-container-lowest" : "text-on-primary-container hover:bg-white/5 hover:text-surface-container-lowest"
              }`}
            >
              <Icon name={link.icon} filled={active} className="text-xl" />
              {link.label}
            </Link>
          );
        })}
    </nav>
  );

  const footer = (
    <div className="space-y-space-sm border-t border-white/10 pt-space-md">
      <div className="flex items-center gap-space-sm">
        <Avatar name={user.name} src={user.photoUrl} size="h-9 w-9" />
        <div className="min-w-0">
          <div className="truncate text-label-lg text-surface-container-lowest">{user.name}</div>
          <div className="truncate text-label-tag uppercase tracking-wider text-tertiary-fixed-dim">{user.role}</div>
        </div>
      </div>
      <div className="flex gap-space-xs">
        <Link href="/" className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-label-md text-on-primary-container hover:bg-white/10 hover:text-surface-container-lowest">
          <Icon name="public" className="text-base" /> Site
        </Link>
        <form action={signOut} className="flex-1">
          <button type="submit" className="flex w-full items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-label-md text-on-primary-container hover:bg-white/10 hover:text-surface-container-lowest">
            <Icon name="logout" className="text-base" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-space-sm">
      <span className="rounded-lg bg-surface-container-lowest px-2 py-1">
        <Image src="/assets/dta-mark.png" alt="DTA" width={790} height={300} className="h-6 w-auto" />
      </span>
      <span className="text-label-tag uppercase tracking-widest text-surface-container-high">Staff Portal</span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between bg-primary-container px-4 py-space-sm lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1 text-surface-container-lowest hover:bg-white/10">
          <Icon name="menu" className="text-2xl" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-space-lg bg-primary-container p-space-md">
            <div className="flex items-center justify-between">
              {brand}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1 text-surface-container-lowest hover:bg-white/10">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-space-lg bg-primary-container p-space-md lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
