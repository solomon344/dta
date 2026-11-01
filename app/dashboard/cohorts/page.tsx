import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Badge, EmptyState, PageHeader, Table, btn, td, th } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { cohortTone } from "@/lib/labels";

export const metadata: Metadata = { title: "Cohorts" };

export default async function CohortsPage() {
  const cohorts = await prisma.cohort.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { students: true, signatories: true } } },
  });
  const certCounts = await prisma.student.groupBy({
    by: ["cohortId"],
    where: { certificate: { isNot: null } },
    _count: true,
  });
  const certsByCohort = new Map(certCounts.map((c) => [c.cohortId, c._count]));

  return (
    <>
      <PageHeader
        title="Cohorts"
        description="Group students by intake. Each cohort sets the signatures printed on its certificates."
        actions={
          <Link href="/dashboard/cohorts/new" className={btn.primary}>
            <Icon name="add" className="text-base" /> New cohort
          </Link>
        }
      />
      {cohorts.length === 0 ? (
        <EmptyState icon="calendar_month" title="No cohorts yet" />
      ) : (
        <Table
          head={
            <tr>
              <th className={th}>Cohort</th>
              <th className={th}>Dates</th>
              <th className={th}>Students</th>
              <th className={th}>Certificates</th>
              <th className={th}>Signatories</th>
              <th className={th} />
            </tr>
          }
        >
          {cohorts.map((c) => (
            <tr key={c.id}>
              <td className={td}>
                <div className="flex items-center gap-space-xs">
                  <Link href={`/dashboard/cohorts/${c.id}`} className="text-label-lg text-primary-container hover:text-secondary">{c.name}</Link>
                  <Badge tone={cohortTone[c.status]}>{c.status.toLowerCase()}</Badge>
                </div>
              </td>
              <td className={`${td} text-on-surface-variant`}>
                {c.startDate ? formatDate(c.startDate) : "—"} – {c.endDate ? formatDate(c.endDate) : "—"}
              </td>
              <td className={td}>{c._count.students}</td>
              <td className={td}>{certsByCohort.get(c.id) ?? 0}</td>
              <td className={td}>
                {c._count.signatories === 0 ? <Badge tone="amber">None</Badge> : c._count.signatories}
              </td>
              <td className={`${td} text-right`}>
                <Link href={`/dashboard/cohorts/${c.id}`} className={btn.ghost}>Manage</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
