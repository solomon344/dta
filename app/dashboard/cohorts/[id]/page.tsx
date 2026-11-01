import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, Field, PageHeader, btn, inputClass } from "@/components/dashboard/ui";
import { latestCohortIssueDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { cohortTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import {
  addSignatoryAction,
  deleteCohortAction,
  issueCohortCertificatesAction,
  unissueCohortCertificatesAction,
  removeSignatoryAction,
} from "../actions";
import CohortForm from "../CohortForm";

export const metadata: Metadata = { title: "Cohort" };

export default async function CohortPage({ params }: PageProps<"/dashboard/cohorts/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const cohort = await prisma.cohort.findUnique({
    where: { id },
    include: {
      signatories: {
        orderBy: { sortOrder: "asc" },
        include: { staffProfile: { include: { user: { select: { name: true } } } } },
      },
    },
  });
  if (!cohort) notFound();

  const noCertificate = { OR: [{ certificate: null }, { certificate: { status: "VOIDED" as const } }] };
  const [byProgram, staff, withoutCert, graduatedWithoutCert, issuedCount, voidedCount, lastIssueDate] = await Promise.all([
    prisma.student.groupBy({ by: ["programId", "status"], where: { cohortId: id }, _count: true }),
    prisma.staffProfile.findMany({
      where: { user: { banned: { not: true } } },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.student.count({ where: { cohortId: id, ...noCertificate, status: { not: "WITHDRAWN" } } }),
    prisma.student.count({ where: { cohortId: id, ...noCertificate, status: "GRADUATED" } }),
    prisma.certificate.count({ where: { status: "ISSUED", student: { cohortId: id } } }),
    prisma.certificate.count({ where: { status: "VOIDED", student: { cohortId: id } } }),
    latestCohortIssueDate(id),
  ]);
  const programs = await prisma.program.findMany({ where: { id: { in: [...new Set(byProgram.map((r) => r.programId))] } } });

  const signatoryIds = new Set(cohort.signatories.map((s) => s.staffProfileId));
  const availableStaff = staff.filter((s) => !signatoryIds.has(s.id));
  const defaultIssueDate = lastIssueDate ?? new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title={cohort.name}
        back={{ href: "/dashboard/cohorts", label: "Cohorts" }}
        description={<Badge tone={cohortTone[cohort.status]}>{cohort.status.toLowerCase()}</Badge>}
        actions={
          <>
            <Link href={`/dashboard/students?cohort=${cohort.id}`} className={btn.secondary}>
              <Icon name="group" className="text-base" /> View students
            </Link>
            {user.role === "admin" && (
              <Link href={`/dashboard/cohorts/${cohort.id}/attendance`} className={btn.secondary}>
                <Icon name="checklist" className="text-base" /> Attendance & certificates
              </Link>
            )}
            <Link href={`/dashboard/students/new?cohort=${cohort.id}`} className={btn.primary}>
              <Icon name="person_add" className="text-base" /> Add students
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <div className="space-y-space-lg lg:col-span-2">
          <Card title="Details">
            <CohortForm cohort={cohort} />
          </Card>

          <Card title="Certificate signatories">
            <p className="mb-space-md text-body-sm text-on-surface-variant">
              These staff signatures are printed on every certificate in this cohort, left to right. Staff upload their
              signature from their profile page.
            </p>
            {cohort.signatories.length === 0 ? (
              <p className="mb-space-md rounded-lg bg-tertiary-fixed px-space-sm py-space-xs text-body-sm text-on-tertiary-fixed">
                No signatories yet. Certificates will show blank Director, CEO and CTO signature lines.
              </p>
            ) : (
              <ul className="mb-space-md divide-y divide-surface-variant rounded-lg ring-1 ring-surface-variant">
                {cohort.signatories.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-space-sm p-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-6 text-center font-mono text-label-md text-outline">{s.sortOrder}</span>
                      <div>
                        <div className="text-label-lg text-primary-container">{s.staffProfile.user.name}</div>
                        <div className="text-body-sm text-on-surface-variant">{s.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      {s.staffProfile.signatureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.staffProfile.signatureUrl} alt="Signature" className="h-10 max-w-32 object-contain" />
                      ) : (
                        <Badge tone="amber">No signature uploaded</Badge>
                      )}
                      <ActionForm action={removeSignatoryAction.bind(null, s.id, cohort.id)}>
                        <SubmitButton variant="ghost" confirm={`Remove ${s.staffProfile.user.name} as a signatory?`}>
                          <Icon name="delete" className="text-base" />
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {cohort.signatories.length < 4 && availableStaff.length === 0 && (
              <p className="text-body-sm text-outline">
                Every active staff member is already a signatory. Invite more staff from the Staff page to add them here.
              </p>
            )}
            {cohort.signatories.length < 4 && availableStaff.length > 0 && (
              <ActionForm action={addSignatoryAction.bind(null, cohort.id)} resetOnSuccess className="grid grid-cols-1 items-end gap-space-sm md:grid-cols-12">
                <Field label="Staff member" name="staffProfileId" className="md:col-span-4">
                  <select id="staffProfileId" name="staffProfileId" className={inputClass} required defaultValue="">
                    <option value="" disabled>Choose…</option>
                    {availableStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user.name}{s.jobTitle ? ` — ${s.jobTitle}` : ""}{s.signatureUrl ? "" : " (no signature)"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Printed title" name="title" className="md:col-span-4">
                  <input id="title" name="title" required placeholder="Director, DTA" className={inputClass} />
                </Field>
                <Field label="Order" name="sortOrder" className="md:col-span-2">
                  <input id="sortOrder" name="sortOrder" type="number" min={0} max={99} defaultValue={cohort.signatories.length + 1} className={inputClass} />
                </Field>
                <div className="md:col-span-2">
                  <SubmitButton className="w-full">Add</SubmitButton>
                </div>
              </ActionForm>
            )}
          </Card>
        </div>

        <div className="space-y-space-lg">
          <Card title="Students">
            {byProgram.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No students in this cohort yet.</p>
            ) : (
              <ul className="space-y-space-sm text-body-sm">
                {programs.map((p) => {
                  const rows = byProgram.filter((r) => r.programId === p.id);
                  const total = rows.reduce((a, r) => a + r._count, 0);
                  return (
                    <li key={p.id}>
                      <div className="flex justify-between text-label-lg text-primary-container">
                        <span>{p.name}</span>
                        <span>{total}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rows.map((r) => (
                          <Badge key={r.status} tone={r.status === "GRADUATED" ? "green" : r.status === "ENROLLED" ? "blue" : "gray"}>
                            {r._count} {r.status.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Issue certificates">
            <p className="mb-space-sm text-body-sm text-on-surface-variant">
              {withoutCert} student{withoutCert === 1 ? "" : "s"} without a certificate ({graduatedWithoutCert} marked graduated). Students whose certificate was un-issued get their original ID back.
              Issuing assigns the next certificate IDs and marks students as graduated.
            </p>
            <ActionForm action={issueCohortCertificatesAction.bind(null, cohort.id)} className="space-y-space-sm">
              <Field label="Issue date" name="issueDate">
                <input id="issueDate" name="issueDate" type="date" defaultValue={defaultIssueDate} required className={inputClass} />
              </Field>
              <Field label="Who" name="scope">
                <select id="scope" name="scope" className={inputClass} defaultValue="graduated">
                  <option value="graduated">Only students marked graduated</option>
                  <option value="all">All enrolled and graduated students</option>
                </select>
              </Field>
              <SubmitButton className="w-full" pendingLabel="Issuing…" confirm="Issue certificates now? Certificate IDs cannot be reused.">
                <Icon name="workspace_premium" className="text-base" /> Issue certificates
              </SubmitButton>
            </ActionForm>
          </Card>

          {user.role === "admin" && (issuedCount > 0 || voidedCount > 0) && (
            <Card title="Un-issue certificates">
              {/* The form stays mounted after un-issuing so its confirmation remains visible. */}
              <ActionForm action={unissueCohortCertificatesAction.bind(null, cohort.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  {issuedCount > 0
                    ? `Hides all ${issuedCount} issued certificates in this cohort from the public verification page. `
                    : `No issued certificates. ${voidedCount} are un-issued. `}
                  IDs are kept: re-issuing on the{" "}
                  <Link href={`/dashboard/cohorts/${cohort.id}/attendance`} className="text-secondary hover:underline">attendance page</Link>{" "}
                  restores each student&apos;s original ID.
                </p>
                {issuedCount > 0 && (
                  <SubmitButton variant="danger" pendingLabel="Un-issuing…" confirm={`Un-issue all ${issuedCount} certificates in ${cohort.name}?`}>
                    Un-issue all certificates
                  </SubmitButton>
                )}
              </ActionForm>
            </Card>
          )}

          {user.role === "admin" && (
            <Card title="Delete cohort">
              <p className="mb-space-sm text-body-sm text-on-surface-variant">Only empty cohorts can be deleted.</p>
              <ActionForm action={deleteCohortAction.bind(null, cohort.id)}>
                <SubmitButton variant="danger" confirm={`Delete ${cohort.name}?`}>Delete cohort</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
