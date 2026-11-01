import type { Program } from "@/generated/prisma/client";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field, inputClass } from "@/components/dashboard/ui";
import { saveProgramAction } from "./actions";

export default function ProgramForm({ program }: { program?: Program }) {
  return (
    <Card>
      <ActionForm action={saveProgramAction.bind(null, program?.id ?? null)} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Field label="Program name" name="name">
          <input id="name" name="name" defaultValue={program?.name} required className={inputClass} placeholder="Data Analytics" />
        </Field>
        <Field label="Code" name="code" hint="Short identifier, e.g. DA or SD.">
          <input id="code" name="code" defaultValue={program?.code} required className={`${inputClass} font-mono uppercase`} placeholder="DA" />
        </Field>
        <Field label="Certificate title" name="certificateTitle" className="md:col-span-2" hint="Printed in large type on the certificate.">
          <input id="certificateTitle" name="certificateTitle" defaultValue={program?.certificateTitle} required className={inputClass} />
        </Field>
        <Field label="Certificate description" name="certificateDetail" className="md:col-span-2" hint="One sentence printed under the title.">
          <textarea id="certificateDetail" name="certificateDetail" defaultValue={program?.certificateDetail} rows={2} required className={inputClass} />
        </Field>
        <Field label="Competencies" name="competencies" className="md:col-span-2" hint="Comma-separated. Shown on the verification page.">
          <input id="competencies" name="competencies" defaultValue={program?.competencies.join(", ")} className={inputClass} placeholder="Excel, Power BI, Statistics" />
        </Field>
        <div className="md:col-span-2">
          <SubmitButton pendingLabel="Saving…">{program ? "Save changes" : "Create program"}</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
