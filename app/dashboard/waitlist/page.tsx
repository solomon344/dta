import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, WaitlistStatus } from "@/generated/prisma/client";
import ActionForm from "@/components/dashboard/ActionForm";
import CheckAllButtons from "@/components/dashboard/CheckAllButtons";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, EmptyState, Field, PageHeader, Pagination, Table, btn, inputClass, td, th } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { waitlistTone } from "@/lib/labels";
import { whatsappChatUrl } from "@/lib/phone";
import { requireUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site";
import { bulkWaitlistAction } from "./actions";

export const metadata: Metadata = { title: "Waitlist" };

const PAGE_SIZE = 50;
const TABS: { status: WaitlistStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "ENROLLED", label: "Enrolled" },
  { status: "ARCHIVED", label: "Archived" },
];

export default async function WaitlistAdminPage({ searchParams }: PageProps<"/dashboard/waitlist">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const user = await requireUser();
  const status = TABS.find((t) => t.status === get("status"))?.status ?? "NEW";
  const program = get("program");
  const q = get("q").trim();
  const page = Math.max(1, Number(get("page")) || 1);

  const where: Prisma.WaitlistEntryWhereInput = {
    status,
    ...(program === "none" ? { programId: null } : program ? { programId: program } : {}),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phoneDigits: { contains: q.replace(/\D/g, "") || q } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [entries, total, counts, programs, cohorts] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { program: { select: { name: true } }, student: { select: { id: true, cohort: { select: { name: true } } } } },
    }),
    prisma.waitlistEntry.count({ where }),
    prisma.waitlistEntry.groupBy({ by: ["status"], _count: true }),
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.cohort.findMany({
      where: { status: { in: ["UPCOMING", "ACTIVE"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const countOf = (s: WaitlistStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const filterQs = (extra: Record<string, string>) =>
    new URLSearchParams({ status, ...(program && { program }), ...(q && { q }), ...extra }).toString();

  return (
    <>
      <PageHeader
        title="Waitlist"
        description={
          <>
            People interested in a future cohort. Share the sign-up link:{" "}
            <Link href="/waitlist" target="_blank" className="text-secondary hover:underline">{SITE_URL}/waitlist</Link>
          </>
        }
        actions={
          <a href={`/api/waitlist/export?${filterQs({})}`} className={btn.secondary}>
            <Icon name="download" className="text-base" /> Export CSV
          </a>
        }
      />

      <div className="mb-space-md flex flex-wrap gap-space-xs">
        {TABS.map((t) => (
          <Link key={t.status} href={`/dashboard/waitlist?status=${t.status}`} className={t.status === status ? btn.dark : btn.secondary}>
            {t.label} ({countOf(t.status)})
          </Link>
        ))}
      </div>

      <form className="mb-space-md grid grid-cols-1 gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm ring-1 ring-surface-variant md:grid-cols-12">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} placeholder="Search name, phone, email or location" className={`${inputClass} md:col-span-7`} />
        <select name="program" defaultValue={program} className={`${inputClass} md:col-span-4`}>
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="none">Not sure yet</option>
        </select>
        <button type="submit" className={`${btn.dark} md:col-span-1`}>
          <Icon name="search" className="text-base" />
        </button>
      </form>

      {/* The form stays mounted when the list empties, so the result of the last action stays visible. */}
      <ActionForm action={bulkWaitlistAction} messagePosition="top" className="space-y-space-md">
        {entries.length === 0 ? (
          <Card>
            <EmptyState icon="how_to_reg" title="No one here">Share the waitlist link to collect sign-ups.</EmptyState>
          </Card>
        ) : (
          <>
          <div className="flex flex-wrap items-center justify-between gap-space-xs">
            <p className="text-body-sm text-on-surface-variant">{total} {total === 1 ? "person" : "people"}</p>
            <CheckAllButtons name="ids" />
          </div>

          <Table
            head={
              <tr>
                <th className={`${th} w-10`} />
                <th className={th}>Name</th>
                <th className={th}>Contact</th>
                <th className={th}>Program</th>
                <th className={th}>Signed up</th>
                <th className={th}>Status</th>
              </tr>
            }
          >
            {entries.map((e) => (
              <tr key={e.id} className="align-top hover:bg-surface-container-low">
                <td className={td}>
                  <input type="checkbox" name="ids" value={e.id} aria-label={`Select ${e.fullName}`} className="h-4 w-4 accent-secondary" />
                </td>
                <td className={td}>
                  <div className="text-label-lg text-primary-container">{e.fullName}</div>
                  {e.location && <div className="text-body-sm text-on-surface-variant">{e.location}</div>}
                  {e.note && <p className="mt-1 max-w-sm whitespace-pre-line text-body-sm text-on-surface-variant">“{e.note}”</p>}
                </td>
                <td className={td}>
                  <div className="flex flex-col gap-0.5">
                    <a href={whatsappChatUrl(e.phoneDigits)} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                      {e.phone}
                    </a>
                    {e.email && <a href={`mailto:${e.email}`} className="text-body-sm text-secondary hover:underline">{e.email}</a>}
                  </div>
                </td>
                <td className={td}>{e.program?.name ?? <span className="text-outline">Not sure yet</span>}</td>
                <td className={`${td} whitespace-nowrap text-on-surface-variant`}>{formatDate(e.createdAt)}</td>
                <td className={td}>
                  <Badge tone={waitlistTone[e.status]}>{e.status.toLowerCase()}</Badge>
                  {e.student && (
                    <Link href={`/dashboard/students/${e.student.id}`} className="mt-1 block text-body-sm text-secondary hover:underline">
                      {e.student.cohort.name}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} makeHref={(p) => `/dashboard/waitlist?${filterQs({ page: String(p) })}`} />

          <Card title="With selected">
            <div className="flex flex-wrap gap-space-xs">
              {status !== "CONTACTED" && status !== "ENROLLED" && (
                <SubmitButton name="intent" value="CONTACTED" variant="secondary">Mark contacted</SubmitButton>
              )}
              {status !== "NEW" && status !== "ENROLLED" && (
                <SubmitButton name="intent" value="NEW" variant="secondary">Move back to new</SubmitButton>
              )}
              {status !== "ARCHIVED" && status !== "ENROLLED" && (
                <SubmitButton name="intent" value="ARCHIVED" variant="secondary">Archive</SubmitButton>
              )}
              {user.role === "admin" && (
                <SubmitButton name="intent" value="DELETE" variant="ghost" confirm="Permanently delete the selected entries?">
                  Delete
                </SubmitButton>
              )}
            </div>

            {status !== "ENROLLED" && (
              <div className="mt-space-md border-t border-surface-variant pt-space-md">
                <h3 className="mb-space-xs text-label-lg text-primary-container">Enroll into a cohort</h3>
                {cohorts.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">
                    No upcoming or active cohorts. <Link href="/dashboard/cohorts/new" className="text-secondary hover:underline">Create one</Link> first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 items-end gap-space-sm md:grid-cols-12">
                    <Field label="Cohort" name="cohortId" className="md:col-span-4">
                      <select id="cohortId" name="cohortId" defaultValue="" className={inputClass}>
                        <option value="" disabled>Choose…</option>
                        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </Field>
                    <Field label='Program for "not sure yet"' name="fallbackProgramId" className="md:col-span-4">
                      <select id="fallbackProgramId" name="fallbackProgramId" defaultValue="" className={inputClass}>
                        <option value="">Only if needed…</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                    <div className="md:col-span-4">
                      <SubmitButton name="intent" value="ENROLL" pendingLabel="Enrolling…" confirm="Create student records for the selected people?">
                        <Icon name="person_add" className="text-base" /> Enroll selected
                      </SubmitButton>
                    </div>
                  </div>
                )}
                <p className="mt-space-xs text-body-sm text-outline">Creates them as enrolled students in that cohort with their chosen program.</p>
              </div>
            )}
          </Card>
          </>
        )}
      </ActionForm>
    </>
  );
}
