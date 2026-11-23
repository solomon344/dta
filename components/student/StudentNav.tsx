"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const links = [
  { href: "/student", label: "Home", icon: "home", exact: true },
  { href: "/student/projects", label: "My projects", icon: "rocket_launch" },
  { href: "/student/account", label: "Account", icon: "person" },
];

export default function StudentNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Student portal">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-space-xs border-b-2 px-space-sm py-space-sm text-label-lg transition-all ${
              active ? "border-secondary text-primary-container" : "border-transparent text-on-surface-variant hover:text-primary-container"
            }`}
          >
            <Icon name={l.icon} filled={active} className="text-lg" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
