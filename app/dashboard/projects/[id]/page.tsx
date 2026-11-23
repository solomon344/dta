import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, Field, PageHeader, btn, inputClass } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import ProjectFields from "@/components/projects/ProjectFields";
import { prisma } from "@/lib/db";
import { projectTone } from "@/lib/labels";
import { updateProjectAction } from "../actions";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await params;
  const [project, programs, cohorts] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.cohort.findMany({ orderBy: [{ startDate: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.title}
        description={<Badge tone={projectTone[project.status]}>{project.status === "APPROVED" ? "published" : project.status.toLowerCase()}</Badge>}
        back={{ href: `/dashboard/projects?status=${project.status}`, label: "Projects" }}
        actions={
          project.status === "APPROVED" && (
            <Link href={`/projects/${project.slug}`} target="_blank" className={btn.secondary}>
              <Icon name="open_in_new" className="text-base" /> View live
            </Link>
          )
        }
      />
      <Card>
        <ActionForm action={updateProjectAction.bind(null, project.id)} className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <ProjectFields programs={programs} cohorts={cohorts} defaults={project} audience="staff" />
          <Field label="Contact email (optional)" name="contactEmail" className="sm:col-span-2" hint="Private. Never shown publicly.">
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={project.contactEmail ?? ""} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
