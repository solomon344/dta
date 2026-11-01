import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import { FieldError } from "./ActionForm";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-md py-2 text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60",
  dark:
    "inline-flex items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-md py-2 text-label-lg text-on-primary shadow-sm transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-space-xs rounded-lg bg-surface-container-high px-space-md py-2 text-label-lg text-on-surface transition-all hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-space-xs rounded-lg bg-error-container px-space-md py-2 text-label-lg text-on-error-container transition-all hover:bg-error hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-space-2xs rounded-lg px-space-sm py-1.5 text-label-md text-secondary transition-all hover:bg-surface-container disabled:opacity-60",
};

export const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 disabled:opacity-60";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-space-lg flex flex-col justify-between gap-space-md md:flex-row md:items-end">
      <div className="space-y-space-2xs">
        {back && (
          <Link href={back.href} className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline">
            <Icon name="arrow_back" className="text-sm" /> {back.label}
          </Link>
        )}
        <h1 className="font-display text-headline-lg text-primary-container">{title}</h1>
        {description && <p className="max-w-2xl text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-space-xs">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-xl bg-surface-container-lowest p-space-lg shadow-sm ring-1 ring-surface-variant ${className}`}>
      {(title || actions) && (
        <div className="mb-space-md flex items-center justify-between gap-space-sm">
          {title && <h2 className="text-headline-sm text-primary-container">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  name,
  id,
  hint,
  children,
  className = "",
}: {
  label: string;
  /** Form field name; validation errors are looked up by it. */
  name: string;
  /** The input's id, when it differs from `name`. */
  id?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id ?? name} className="block text-label-md uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
      <FieldError name={name} hint={hint} />
    </div>
  );
}

const badgeTones = {
  blue: "bg-secondary-fixed text-on-secondary-fixed",
  green: "bg-[#d3f5dd] text-[#0b5a2a]",
  amber: "bg-tertiary-fixed text-on-tertiary-fixed",
  red: "bg-error-container text-on-error-container",
  gray: "bg-surface-container-high text-on-surface-variant",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-space-xs py-0.5 text-label-tag uppercase tracking-wider ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-space-xs px-space-lg py-space-2xl text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
        <Icon name={icon} className="text-2xl" />
      </div>
      <h3 className="text-headline-sm text-primary-container">{title}</h3>
      {children && <div className="max-w-md text-body-sm text-on-surface-variant">{children}</div>}
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm ring-1 ring-surface-variant">
      <table className="w-full min-w-[640px] text-left text-body-sm">
        <thead className="border-b border-surface-variant bg-surface-container-low text-label-tag uppercase tracking-wider text-on-surface-variant">
          {head}
        </thead>
        <tbody className="divide-y divide-surface-variant">{children}</tbody>
      </table>
    </div>
  );
}

export const th = "px-space-md py-space-sm font-bold";
export const td = "px-space-md py-space-sm align-middle";

export function Pagination({ page, pageCount, makeHref }: { page: number; pageCount: number; makeHref: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-space-md flex items-center justify-between text-body-sm text-on-surface-variant">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-space-xs">
        {page > 1 && (
          <Link href={makeHref(page - 1)} className={btn.secondary}>
            Previous
          </Link>
        )}
        {page < pageCount && (
          <Link href={makeHref(page + 1)} className={btn.secondary}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, src, size = "h-10 w-10" }: { name: string; src?: string | null; size?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover ring-2 ring-surface-container`} />;
  }
  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-primary-container text-label-md text-secondary-fixed`}>
      {initials(name)}
    </span>
  );
}
