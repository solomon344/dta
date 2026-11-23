import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, btn } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { projectStudentLabel, projectTone, studentTone } from "@/lib/labels";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default async function StudentHomePage() {
  const { student } = await requireStudent();
  const projects = await prisma.project.findMany({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: { id: true, title: true, status: true, slug: true },
  });
  const cert = student.certificate?.status === "ISSUED" ? student.certificate : null;

  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-2xs">
        <h1 className="font-display text-headline-lg text-primary-container">Welcome, {student.fullName.split(" ")[0]}</h1>
        <p className="flex flex-wrap items-center gap-space-xs text-body-md text-on-surface-variant">
          {student.program.name} · {student.cohort.name}
          <Badge tone={studentTone[student.status]}>{student.status.toLowerCase()}</Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        <Card title="Your certificate">
          {cert ? (
            <div className="space-y-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <Icon name="workspace_premium" className="text-2xl" />
                </div>
                <div>
                  <div className="font-mono text-headline-sm text-secondary">{cert.number}</div>
                  <div className="text-body-sm text-on-surface-variant">Issued {formatDate(cert.issueDate)}</div>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Share your verification link with employers so they can confirm your certificate.
              </p>
              <div className="flex flex-wrap gap-space-xs">
                <Link href={`/verify?q=${cert.number}`} target="_blank" className={btn.primary}>
                  <Icon name="verified" className="text-base" /> View & share
                </Link>
                <a href={`/api/certificates/download?id=${cert.number}&format=pdf`} className={btn.secondary}>
                  <Icon name="download" className="text-base" /> PDF
                </a>
                <a href={`/api/certificates/download?id=${cert.number}&format=png`} className={btn.secondary}>
                  <Icon name="image" className="text-base" /> Image
                </a>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Your certificate will appear here once DTA issues it at the end of your program.
            </p>
          )}
        </Card>

        <Card
          title="Your projects"
          actions={
            <Link href="/student/projects/new" className={btn.ghost}>
              <Icon name="add" className="text-base" /> Submit
            </Link>
          }
        >
          {projects.length === 0 ? (
            <div className="space-y-space-sm">
              <p className="text-body-sm text-on-surface-variant">
                Built something during the program? Share it in the DTA project showcase so employers can see your work.
              </p>
              <Link href="/student/projects/new" className={btn.primary}>
                <Icon name="rocket_launch" className="text-base" /> Submit a project
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-surface-variant">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-space-sm py-space-xs">
                  <Link href={`/student/projects/${p.id}`} className="min-w-0 truncate text-label-lg text-primary-container hover:text-secondary">
                    {p.title}
                  </Link>
                  <Badge tone={projectTone[p.status]}>{projectStudentLabel[p.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Share your experience">
          <p className="mb-space-sm text-body-sm text-on-surface-variant">
            Tell future students what DTA was like for you. Your feedback also helps us improve.
          </p>
          <Link href="/testimonials#share" className={btn.secondary}>
            <Icon name="format_quote" className="text-base" /> Write a testimonial
          </Link>
        </Card>

        <Card title="Project showcase">
          <p className="mb-space-sm text-body-sm text-on-surface-variant">See what other DTA students have built.</p>
          <Link href="/projects" className={btn.secondary}>
            <Icon name="open_in_new" className="text-base" /> Browse projects
          </Link>
        </Card>
      </div>
    </div>
  );
}
