import Link from "next/link";
import Icon from "@/components/Icon";
import { Badge, Card, EmptyState, PageHeader, btn } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";

export default async function DashboardHome() {
  const user = await requireUser();

  const [students, graduates, issued, revoked, cohorts, staff, recent, activeCohorts] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "GRADUATED" } }),
    prisma.certificate.count({ where: { status: "ISSUED" } }),
    prisma.certificate.count({ where: { status: "REVOKED" } }),
    prisma.cohort.count(),
    prisma.user.count(),
    prisma.certificate.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { student: { include: { program: true, cohort: true } } },
    }),
    prisma.cohort.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { startDate: "asc" },
      include: { _count: { select: { students: true } } },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Students", value: students, icon: "group", href: "/dashboard/students" },
    { label: "Graduates", value: graduates, icon: "school", href: "/dashboard/students?status=GRADUATED" },
    { label: "Certificates issued", value: issued, icon: "workspace_premium", href: "/dashboard/certificates" },
    { label: "Cohorts", value: cohorts, icon: "calendar_month", href: "/dashboard/cohorts" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Manage cohorts, students and certificates for Data Technology Academy."
        actions={
          <>
            <Link href="/dashboard/students/new" className={btn.secondary}>
              <Icon name="person_add" className="text-base" /> Add student
            </Link>
            <Link href="/dashboard/cohorts/new" className={btn.primary}>
              <Icon name="add" className="text-base" /> New cohort
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-space-md lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm ring-1 ring-surface-variant transition-all hover:ring-secondary">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-label-tag uppercase tracking-wider">{s.label}</span>
              <Icon name={s.icon} className="text-xl text-secondary" />
            </div>
            <div className="mt-space-xs font-display text-headline-xl text-primary-container">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <Card title="Recently issued certificates" className="lg:col-span-2" actions={<Link href="/dashboard/certificates" className={btn.ghost}>View all</Link>}>
          {recent.length === 0 ? (
            <EmptyState icon="workspace_premium" title="No certificates yet" />
          ) : (
            <ul className="divide-y divide-surface-variant">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-space-sm py-space-sm">
                  <div className="min-w-0">
                    <Link href={`/dashboard/certificates/${c.id}`} className="text-label-lg text-primary-container hover:text-secondary">
                      {c.student.fullName}
                    </Link>
                    <div className="text-body-sm text-on-surface-variant">
                      {c.student.program.name} · {c.student.cohort.name} · {formatDate(c.issueDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-mono text-label-md text-secondary">{c.number}</span>
                    {c.status !== "ISSUED" && <Badge tone={certificateTone[c.status]}>{certificateLabel[c.status]}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-space-lg">
          <Card title="Active & upcoming cohorts">
            {activeCohorts.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No active or upcoming cohorts.</p>
            ) : (
              <ul className="space-y-space-sm">
                {activeCohorts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link href={`/dashboard/cohorts/${c.id}`} className="text-label-lg text-primary-container hover:text-secondary">{c.name}</Link>
                    <span className="flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                      {c._count.students} students
                      <Badge tone={c.status === "ACTIVE" ? "green" : "blue"}>{c.status.toLowerCase()}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="At a glance">
            <dl className="space-y-space-xs text-body-sm">
              <div className="flex justify-between"><dt className="text-on-surface-variant">Revoked certificates</dt><dd className="font-bold">{revoked}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Staff accounts</dt><dd className="font-bold">{staff}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
