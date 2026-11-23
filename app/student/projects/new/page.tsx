import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import ProjectFields from "@/components/projects/ProjectFields";
import { requireStudent } from "@/lib/session";
import { createStudentProjectAction } from "../../actions";

export const metadata: Metadata = { title: "Submit a Project" };

export default async function NewStudentProjectPage() {
  const { student } = await requireStudent();
  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-2xs">
        <Link href="/student/projects" className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline">
          <Icon name="arrow_back" className="text-sm" /> My projects
        </Link>
        <h1 className="font-display text-headline-lg text-primary-container">Submit a project</h1>
        <p className="text-body-md text-on-surface-variant">
          DTA staff review every project before it appears in the public showcase. It will be listed under {student.program.name},{" "}
          {student.cohort.name}.
        </p>
      </div>
      <Card>
        <ActionForm action={createStudentProjectAction} className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <ProjectFields audience="student" defaults={{ builtBy: student.fullName }} />
          <Field label="Permission" name="consent" className="sm:col-span-2">
            <label className="flex items-start gap-space-xs text-body-md text-on-surface">
              <input id="consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-secondary" />
              I built this project (alone or with the people listed), and I agree that Data Technology Academy may publish it,
              including the names, images and links above, on its website.
            </label>
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
