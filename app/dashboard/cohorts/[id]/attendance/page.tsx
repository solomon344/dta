import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import CheckAllButtons from "@/components/dashboard/CheckAllButtons";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, EmptyState, Field, PageHeader, Table, inputClass, td, th } from "@/components/dashboard/ui";
import { latestCohortIssueDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone, studentTone } from "@/lib/labels";
import { requireAdmin } from "@/lib/session";
import { saveAttendanceAction } from "../../actions";

export const metadata: Metadata = { title: "Attendance & Certificates" };

export default async function AttendancePage({ params }: PageProps<"/dashboard/cohorts/[id]/attendance">) {
  const { id } = await params;
  await requireAdmin();
  const cohort = await prisma.cohort.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!cohort) notFound();

  const [students, lastIssueDate] = await Promise.all([
    prisma.student.findMany({
      where: { cohortId: id },
      include: { program: { select: { name: true } }, certificate: { select: { number: true, status: true } } },
      orderBy: [{ program: { name: "asc" } }, { fullName: "asc" }],
    }),
    latestCohortIssueDate(id),
  ]);
  const issueDate = lastIssueDate ?? new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Attendance & certificates"
        back={{ href: `/dashboard/cohorts/${cohort.id}`, label: cohort.name }}
        description={
          <>
            Tick the students who attended and completed {cohort.name}. On save, they&apos;re marked graduated and issued a
            certificate. Everyone else is marked withdrawn and their certificate is un-issued (hidden from the public
            verification page). Un-issued students who are ticked again get their original certificate ID back.
          </>
        }
      />

      {students.length === 0 ? (
        <Card>
          <EmptyState icon="group" title="No students in this cohort" />
        </Card>
      ) : (
        <ActionForm action={saveAttendanceAction.bind(null, cohort.id)} messagePosition="top" className="space-y-space-md">
          <Card>
            <div className="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
              <div className="flex flex-wrap items-end gap-space-md">
                <label className="flex items-center gap-space-xs text-label-lg text-primary-container">
                  <input type="checkbox" name="issue" defaultChecked className="h-4 w-4 accent-secondary" />
                  Issue certificates to completed students
                </label>
                <Field label="Issue date" name="issueDate" hint="Used for newly issued and restored certificates.">
                  <input id="issueDate" name="issueDate" type="date" defaultValue={issueDate} className={inputClass} />
                </Field>
              </div>
              <SubmitButton
                pendingLabel="Saving…"
                confirm="Save attendance? Students who aren't ticked will have their certificates un-issued."
              >
                Save attendance
              </SubmitButton>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">{students.length} students</p>
            <CheckAllButtons name="completed" />
          </div>

          <Table
            head={
              <tr>
                <th className={`${th} w-24`}>Completed</th>
                <th className={th}>Student</th>
                <th className={th}>Program</th>
                <th className={th}>Status</th>
                <th className={th}>Certificate</th>
              </tr>
            }
          >
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low">
                <td className={td}>
                  <input
                    type="checkbox"
                    name="completed"
                    value={s.id}
                    defaultChecked={s.status === "GRADUATED"}
                    aria-label={`${s.fullName} completed`}
                    className="h-5 w-5 accent-secondary"
                  />
                </td>
                <td className={td}>
                  <Link href={`/dashboard/students/${s.id}`} className="text-label-lg text-primary-container hover:text-secondary">
                    {s.fullName}
                  </Link>
                </td>
                <td className={td}>{s.program.name}</td>
                <td className={td}><Badge tone={studentTone[s.status]}>{s.status.toLowerCase()}</Badge></td>
                <td className={td}>
                  {s.certificate ? (
                    <span className="flex items-center gap-space-xs">
                      <span className="font-mono text-label-md text-secondary">{s.certificate.number}</span>
                      <Badge tone={certificateTone[s.certificate.status]}>{certificateLabel[s.certificate.status]}</Badge>
                    </span>
                  ) : (
                    <span className="text-outline">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </ActionForm>
      )}
    </>
  );
}
