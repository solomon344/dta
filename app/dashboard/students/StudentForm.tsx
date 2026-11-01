import type { Student } from "@/generated/prisma/client";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, inputClass } from "@/components/dashboard/ui";
import { saveStudentAction } from "./actions";

type Option = { id: string; name: string };

export default function StudentForm({
  student,
  cohorts,
  programs,
  defaultCohortId,
}: {
  student?: Student;
  cohorts: Option[];
  programs: Option[];
  defaultCohortId?: string;
}) {
  return (
    <ActionForm action={saveStudentAction.bind(null, student?.id ?? null)} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      <Field label="Full name" name="fullName" className="md:col-span-2" hint="Exactly as it should appear on the certificate.">
        <input id="fullName" name="fullName" defaultValue={student?.fullName} required className={inputClass} />
      </Field>
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" defaultValue={student?.email ?? ""} className={inputClass} />
      </Field>
      <Field label="Phone" name="phone">
        <input id="phone" name="phone" defaultValue={student?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="Program" name="programId">
        <select id="programId" name="programId" defaultValue={student?.programId ?? ""} required className={inputClass}>
          <option value="" disabled>Choose…</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Cohort" name="cohortId">
        <select id="cohortId" name="cohortId" defaultValue={student?.cohortId ?? defaultCohortId ?? ""} required className={inputClass}>
          <option value="" disabled>Choose…</option>
          {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Status" name="status">
        <select id="status" name="status" defaultValue={student?.status ?? "ENROLLED"} className={inputClass}>
          <option value="ENROLLED">Enrolled</option>
          <option value="GRADUATED">Graduated</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </Field>
      <Field label="Notes" name="notes" className="md:col-span-2">
        <textarea id="notes" name="notes" defaultValue={student?.notes ?? ""} rows={2} className={inputClass} />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton pendingLabel="Saving…">{student ? "Save changes" : "Add student"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
