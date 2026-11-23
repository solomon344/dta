import type { Metadata } from "next";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field, PageHeader, inputClass } from "@/components/dashboard/ui";
import ProjectFields from "@/components/projects/ProjectFields";
import { prisma } from "@/lib/db";
import { createProjectAction } from "../actions";

export const metadata: Metadata = { title: "Add Project" };

export default async function NewProjectPage() {
  const [programs, cohorts] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.cohort.findMany({ orderBy: [{ startDate: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Add project"
        description="Projects you add are published to the showcase straight away."
        back={{ href: "/dashboard/projects", label: "Projects" }}
      />
      <Card>
        <ActionForm action={createProjectAction} className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <ProjectFields programs={programs} cohorts={cohorts} audience="staff" />
          <Field label="Student's email (optional)" name="contactEmail" className="sm:col-span-2" hint="Private. Never shown publicly.">
            <input id="contactEmail" name="contactEmail" type="email" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Publishing…">Publish project</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
