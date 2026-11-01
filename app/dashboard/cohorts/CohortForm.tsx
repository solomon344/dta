import type { Cohort } from "@/generated/prisma/client";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, inputClass } from "@/components/dashboard/ui";
import { saveCohortAction } from "./actions";

const toInput = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default function CohortForm({ cohort }: { cohort?: Cohort }) {
  return (
    <ActionForm action={saveCohortAction.bind(null, cohort?.id ?? null)} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      <Field label="Cohort name" name="name">
        <input id="name" name="name" defaultValue={cohort?.name} required className={inputClass} placeholder="Cohort 3" />
      </Field>
      <Field label="Status" name="status">
        <select id="status" name="status" defaultValue={cohort?.status ?? "UPCOMING"} className={inputClass}>
          <option value="UPCOMING">Upcoming</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </Field>
      <Field label="Start date" name="startDate">
        <input id="startDate" name="startDate" type="date" defaultValue={toInput(cohort?.startDate)} className={inputClass} />
      </Field>
      <Field label="End date" name="endDate">
        <input id="endDate" name="endDate" type="date" defaultValue={toInput(cohort?.endDate)} className={inputClass} />
      </Field>
      <Field label="Description" name="description" className="md:col-span-2">
        <textarea id="description" name="description" defaultValue={cohort?.description ?? ""} rows={2} className={inputClass} />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton pendingLabel="Saving…">{cohort ? "Save changes" : "Create cohort"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
