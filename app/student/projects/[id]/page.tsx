import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import ProjectFields from "@/components/projects/ProjectFields";
import { prisma } from "@/lib/db";
import { projectStudentLabel, projectTone } from "@/lib/labels";
import { requireStudent } from "@/lib/session";
import { deleteStudentProjectAction, updateStudentProjectAction } from "../../actions";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditStudentProjectPage({ params }: PageProps<"/student/projects/[id]">) {
  const { id } = await params;
  const { student } = await requireStudent();
  const project = await prisma.project.findFirst({ where: { id, studentId: student.id } });
  if (!project) notFound();

  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-2xs">
        <Link href="/student/projects" className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline">
          <Icon name="arrow_back" className="text-sm" /> My projects
        </Link>
        <h1 className="flex flex-wrap items-center gap-space-sm font-display text-headline-lg text-primary-container">
          {project.title} <Badge tone={projectTone[project.status]}>{projectStudentLabel[project.status]}</Badge>
        </h1>
        {project.status === "APPROVED" && (
          <p className="flex items-start gap-space-xs rounded-lg bg-tertiary-fixed px-space-sm py-space-xs text-body-sm text-on-tertiary-fixed">
            <Icon name="info" className="text-base" />
            This project is published. Saving changes takes it out of the showcase until DTA staff approve it again.
          </p>
        )}
      </div>
      <Card>
        <ActionForm action={updateStudentProjectAction.bind(null, project.id)} className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <ProjectFields audience="student" defaults={project} />
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Saving…">Save and send for review</SubmitButton>
          </div>
        </ActionForm>
      </Card>
      <Card title="Delete project">
        <ActionForm action={deleteStudentProjectAction.bind(null, project.id)}>
          <p className="mb-space-sm text-body-sm text-on-surface-variant">Removes it from the showcase and deletes its images. This cannot be undone.</p>
          <SubmitButton variant="danger" confirm={`Delete "${project.title}"?`}>Delete project</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
