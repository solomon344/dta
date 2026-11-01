import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";

const navLinks = [
  { href: "/#mission", label: "Mission" },
  { href: "/#tracks", label: "Curriculum & Tracks" },
  { href: "/#cohort-impact", label: "Impact" },
  { href: "/verify", label: "Verify Certificate", key: "verify" },
];

export default function SiteHeader({ active }: { active?: "verify" }) {
  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 w-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-space-md px-4 sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-space-sm" aria-label="Data Technology Academy home">
          <Image
            src="/assets/dta-mark.png"
            alt=""
            width={790}
            height={300}
            priority
            className="h-10 w-auto mix-blend-multiply"
          />
          <span className="hidden flex-col sm:flex">
            <span className="text-headline-sm leading-tight tracking-tight text-primary-container">
              DTA Gambia
            </span>
            <span className="text-label-tag uppercase tracking-wider text-secondary">
              Data Technology Academy
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-space-xs lg:flex">
          {navLinks.map((link) => {
            const isActive = active !== undefined && link.key === active;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-space-sm py-space-xs text-label-lg transition-all ${
                  isActive
                    ? "bg-surface-container-high font-bold text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/verify"
          className="inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-md py-space-xs text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(0,81,213,0.2)] transition-all hover:bg-secondary-container lg:hidden"
        >
          <Icon name="verified" className="text-base" />
          Verify
        </Link>
        <a
          href="mailto:admin@dta.gm"
          className="hidden items-center justify-center rounded-lg bg-secondary px-space-md py-space-xs text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(0,81,213,0.2)] transition-all hover:bg-secondary-container lg:inline-flex"
        >
          Contact Admissions
        </a>
      </div>
    </header>
  );
}
