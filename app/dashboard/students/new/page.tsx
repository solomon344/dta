import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, EmptyState, Field, PageHeader, btn, inputClass } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { bulkAddStudentsAction } from "../actions";
import StudentForm from "../StudentForm";

export const metadata: Metadata = { title: "Add Students" };

export default async function NewStudentPage({ searchParams }: PageProps<"/dashboard/students/new">) {
  const { cohort } = await searchParams;
  const defaultCohortId = typeof cohort === "string" ? cohort : undefined;
  const [cohorts, programs] = await Promise.all([
    prisma.cohort.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (cohorts.length === 0 || programs.length === 0) {
    return (
      <>
        <PageHeader title="Add students" back={{ href: "/dashboard/students", label: "Students" }} />
        <Card>
          <EmptyState icon="info" title="Create a cohort and a program first">
            <div className="mt-space-sm flex justify-center gap-space-xs">
              <Link href="/dashboard/cohorts/new" className={btn.secondary}>New cohort</Link>
              <Link href="/dashboard/programs/new" className={btn.secondary}>New program</Link>
            </div>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Add students" back={{ href: "/dashboard/students", label: "Students" }} />
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <Card title="One student">
          <StudentForm cohorts={cohorts} programs={programs} defaultCohortId={defaultCohortId} />
        </Card>
        <Card title="Many students">
          <ActionForm action={bulkAddStudentsAction} resetOnSuccess className="space-y-space-md">
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field label="Program" name="programId" id="bulk-programId">
                <select id="bulk-programId" name="programId" defaultValue="" required className={inputClass}>
                  <option value="" disabled>Choose…</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Cohort" name="cohortId" id="bulk-cohortId">
                <select id="bulk-cohortId" name="cohortId" defaultValue={defaultCohortId ?? ""} required className={inputClass}>
                  <option value="" disabled>Choose…</option>
                  {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Status" name="status" id="bulk-status">
              <select id="bulk-status" name="status" defaultValue="ENROLLED" className={inputClass}>
                <option value="ENROLLED">Enrolled</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </Field>
            <Field label="Students" name="rows" hint="One per line: Full Name, email, phone. Email and phone are optional. You can paste from a spreadsheet.">
              <textarea
                id="rows"
                name="rows"
                rows={10}
                required
                className={`${inputClass} font-mono text-body-sm`}
                placeholder={"Awa Jallow, awa@example.com, +220 700 0000\nLamin Ceesay"}
              />
            </Field>
            <SubmitButton pendingLabel="Adding…">Add students</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
