import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, Field, PageHeader, btn, inputClass } from "@/components/dashboard/ui";
import { formatDate, latestCohortIssueDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone, studentTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { deleteStudentAction, issueStudentCertificateAction, unissueStudentCertificateAction } from "../actions";
import StudentForm from "../StudentForm";

export const metadata: Metadata = { title: "Student" };

export default async function StudentPage({ params }: PageProps<"/dashboard/students/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [student, cohorts, programs] = await Promise.all([
    prisma.student.findUnique({ where: { id }, include: { certificate: true, cohort: true, program: true } }),
    prisma.cohort.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!student) notFound();
  const defaultIssueDate = (await latestCohortIssueDate(student.cohortId)) ?? new Date().toISOString().slice(0, 10);
  const cert = student.certificate;
  const isAdmin = user.role === "admin";

  return (
    <>
      <PageHeader
        title={student.fullName}
        back={{ href: "/dashboard/students", label: "Students" }}
        description={
          <span className="flex items-center gap-space-xs">
            <Badge tone={studentTone[student.status]}>{student.status.toLowerCase()}</Badge>
            {student.program.name} · <Link href={`/dashboard/cohorts/${student.cohortId}`} className="text-secondary hover:underline">{student.cohort.name}</Link>
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <StudentForm student={student} cohorts={cohorts} programs={programs} />
        </Card>

        <div className="space-y-space-lg">
          <Card title="Certificate">
            {cert && cert.status !== "VOIDED" ? (
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-headline-sm text-secondary">{cert.number}</span>
                  <Badge tone={certificateTone[cert.status]}>{certificateLabel[cert.status]}</Badge>
                </div>
                <p className="text-body-sm text-on-surface-variant">Issued {formatDate(cert.issueDate)}</p>
                <div className="flex flex-wrap gap-space-xs">
                  <Link href={`/dashboard/certificates/${cert.id}`} className={btn.secondary}>
                    <Icon name="visibility" className="text-base" /> View
                  </Link>
                  <Link href={`/verify?q=${cert.number}`} target="_blank" className={btn.ghost}>
                    <Icon name="open_in_new" className="text-base" /> Public page
                  </Link>
                </div>
                {isAdmin && cert.status === "ISSUED" && (
                  <ActionForm action={unissueStudentCertificateAction.bind(null, student.id)} className="border-t border-surface-variant pt-space-sm">
                    <p className="mb-space-xs text-body-sm text-on-surface-variant">
                      Didn&apos;t complete? Un-issuing hides the certificate publicly and keeps {cert.number} reserved for this student.
                    </p>
                    <SubmitButton variant="secondary" confirm={`Un-issue ${cert.number}?`}>Un-issue certificate</SubmitButton>
                  </ActionForm>
                )}
              </div>
            ) : student.status === "WITHDRAWN" ? (
              <p className="text-body-sm text-on-surface-variant">
                Withdrawn students cannot receive a certificate.{cert ? ` Their un-issued ID ${cert.number} is kept.` : ""} Change the
                status to enrolled or graduated to issue one.
              </p>
            ) : (
              <ActionForm action={issueStudentCertificateAction.bind(null, student.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  {cert
                    ? `Certificate ${cert.number} was un-issued. Issuing again restores the same ID.`
                    : "No certificate yet. Issuing assigns the next ID and marks the student graduated."}
                </p>
                <Field label="Issue date" name="issueDate">
                  <input id="issueDate" name="issueDate" type="date" defaultValue={defaultIssueDate} required className={inputClass} />
                </Field>
                <SubmitButton className="w-full" pendingLabel="Issuing…">
                  <Icon name="workspace_premium" className="text-base" /> {cert ? "Issue again" : "Issue certificate"}
                </SubmitButton>
              </ActionForm>
            )}
          </Card>

          {isAdmin && (
            <Card title="Delete student">
              <p className="mb-space-sm text-body-sm text-on-surface-variant">
                {cert
                  ? "This also permanently deletes the certificate. Consider un-issuing or revoking it instead."
                  : "This cannot be undone."}
              </p>
              <ActionForm action={deleteStudentAction.bind(null, student.id)}>
                <SubmitButton variant="danger" confirm={`Permanently delete ${student.fullName}?`}>Delete student</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
