import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, btn } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import { ProjectCover } from "@/components/projects/ProjectCard";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { projectStudentLabel, projectTone } from "@/lib/labels";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "My Projects" };

export default async function StudentProjectsPage({ searchParams }: PageProps<"/student/projects">) {
  const { student } = await requireStudent();
  const sp = await searchParams;
  const projects = await prisma.project.findMany({ where: { studentId: student.id }, orderBy: { updatedAt: "desc" } });
  const notice = sp.submitted
    ? "Thanks! Your project was sent to DTA staff for review. It appears in the showcase once approved."
    : sp.updated
      ? "Changes saved and sent to DTA staff for review."
      : null;

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-headline-lg text-primary-container">My projects</h1>
          <p className="text-body-md text-on-surface-variant">Projects you share here appear in the public showcase once DTA staff approve them.</p>
        </div>
        <Link href="/student/projects/new" className={btn.primary}>
          <Icon name="add" className="text-base" /> Submit a project
        </Link>
      </div>

      {notice && (
        <p role="status" className="flex items-start gap-space-xs rounded-lg bg-secondary-fixed px-space-sm py-space-xs text-body-sm text-on-secondary-fixed">
          <Icon name="check_circle" className="text-base" /> {notice}
        </p>
      )}

      {projects.length === 0 ? (
        <Card>
          <EmptyState icon="rocket_launch" title="No projects yet">
            Share an app, dashboard or analysis you built. Add screenshots and links so employers can see your work.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className="overflow-hidden p-0!">
              <ProjectCover project={p} />
              <div className="space-y-space-xs p-space-md">
                <div className="flex items-start justify-between gap-space-xs">
                  <h2 className="text-headline-sm text-primary-container">{p.title}</h2>
                  <Badge tone={projectTone[p.status]}>{projectStudentLabel[p.status]}</Badge>
                </div>
                <p className="text-body-sm text-on-surface-variant">{p.summary}</p>
                <p className="text-body-sm text-outline">
                  {p.status === "PENDING" && `Waiting for review since ${formatDate(p.updatedAt)}.`}
                  {p.status === "APPROVED" && `Published ${p.reviewedAt ? formatDate(p.reviewedAt) : ""}${p.featured ? " · Featured" : ""}.`}
                  {p.status === "REJECTED" && "Not approved. Update it and it will be reviewed again, or contact DTA staff."}
                </p>
                <div className="flex flex-wrap gap-space-xs pt-space-xs">
                  <Link href={`/student/projects/${p.id}`} className={btn.secondary}>
                    <Icon name="edit" className="text-base" /> Edit
                  </Link>
                  {p.status === "APPROVED" && (
                    <Link href={`/projects/${p.slug}`} target="_blank" className={btn.ghost}>
                      <Icon name="open_in_new" className="text-base" /> View live
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
