import type { Metadata } from "next";
import { connection } from "next/server";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, inputClass } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WhatsAppButton from "@/components/WhatsAppButton";
import { prisma } from "@/lib/db";
import { OPEN_GRAPH_BASE, whatsappCommunityUrl } from "@/lib/site";
import { joinWaitlistAction } from "./actions";

const DESCRIPTION =
  "Join the Data Technology Academy waitlist to hear first when the next Software Development and Data Analytics cohorts open.";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description: DESCRIPTION,
  alternates: { canonical: "/waitlist" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "Join the DTA Waitlist", description: DESCRIPTION, url: "/waitlist" },
  twitter: { title: "Join the DTA Waitlist", description: DESCRIPTION },
};

export const instant = false;

export default async function WaitlistPage() {
  await connection();
  const programs = await prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const hasWhatsApp = whatsappCommunityUrl() !== null;

  return (
    <>
      <SiteHeader active="waitlist" />
      <main className="w-full flex-1 pt-20">
        <section className="w-full bg-primary-container py-space-xl">
          <div className="mx-auto max-w-7xl space-y-space-sm px-4 sm:px-6 lg:px-12">
            <span className="inline-flex items-center gap-space-xs rounded-full bg-white/10 px-space-sm py-space-2xs text-label-tag uppercase tracking-widest text-tertiary-fixed">
              <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-fixed-dim" /> Next cohort
            </span>
            <h1 className="font-display text-headline-xl-mobile text-surface-container-lowest md:text-headline-xl">Join the Waitlist</h1>
            <p className="max-w-2xl text-body-xl text-surface-container-high">{DESCRIPTION}</p>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-space-xl px-4 py-space-2xl sm:px-6 lg:grid-cols-12 lg:px-12">
          <section className="rounded-2xl border-t-4 border-secondary bg-surface-container-lowest p-space-lg shadow-lg sm:p-space-xl lg:col-span-8">
            <h2 className="font-display text-headline-lg text-primary-container">Register your interest</h2>
            <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
              It only takes a minute. We&apos;ll reach out when applications open.
            </p>
            <ActionForm action={joinWaitlistAction} resetOnSuccess className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field label="Full name" name="fullName">
                <input id="fullName" name="fullName" autoComplete="name" required className={inputClass} />
              </Field>
              <Field label="Phone / WhatsApp number" name="phone">
                <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="+220 …" className={inputClass} />
              </Field>
              <Field label="Email (optional)" name="email">
                <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Program of interest" name="programId">
                <select id="programId" name="programId" defaultValue="" className={inputClass}>
                  <option value="">Not sure yet</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Where are you based? (optional)" name="location" className="sm:col-span-2">
                <input id="location" name="location" placeholder="e.g. Serekunda" className={inputClass} />
              </Field>
              <Field label="Anything we should know? (optional)" name="note" className="sm:col-span-2">
                <textarea id="note" name="note" rows={3} maxLength={1000} placeholder="Your background, goals or questions" className={inputClass} />
              </Field>
              {/* Honeypot: hidden from people, so only bots fill it in. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Field label="Permission" name="consent" className="sm:col-span-2">
                <label className="flex items-start gap-space-xs text-body-md text-on-surface">
                  <input id="consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-secondary" />
                  I agree that Data Technology Academy may contact me about upcoming cohorts by phone, WhatsApp or email.
                </label>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Joining…">Join the waitlist</SubmitButton>
              </div>
            </ActionForm>
          </section>

          <aside className="space-y-space-lg lg:col-span-4">
            {hasWhatsApp && (
              <div className="space-y-space-sm rounded-2xl bg-[#e7f8ee] p-space-lg ring-1 ring-[#b9e8cb]">
                <h2 className="text-headline-sm text-[#0b2e13]">Join our WhatsApp community</h2>
                <p className="text-body-sm text-[#1d4d2c]">
                  Get cohort announcements, events and opportunities first, and meet other learners.
                </p>
                <WhatsAppButton label="Join on WhatsApp" className="w-full" />
              </div>
            )}
            <div className="space-y-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm ring-1 ring-surface-variant">
              <h2 className="text-headline-sm text-primary-container">What happens next</h2>
              <ol className="space-y-space-sm text-body-sm text-on-surface-variant">
                {[
                  ["mail", "We contact everyone on the waitlist when applications for the next cohort open."],
                  ["school", "Each program is three months of hands-on learning with a capstone project."],
                  ["workspace_premium", "Graduates receive a verifiable DTA certificate."],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-space-xs">
                    <Icon name={icon} className="text-lg text-secondary" />
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
