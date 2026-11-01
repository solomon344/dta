import type { Metadata } from "next";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field, PageHeader, inputClass } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/session";
import { createStaffAction } from "../actions";

export const metadata: Metadata = { title: "Create Staff Account" };

export default async function NewStaffPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Create staff account"
        back={{ href: "/dashboard/staff", label: "Staff" }}
        description="Sets a temporary password you share with the staff member. They can change it from their profile."
      />
      <Card>
        <ActionForm action={createStaffAction} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="Full name" name="name">
            <input id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="Email" name="email">
            <input id="email" name="email" type="email" required className={inputClass} />
          </Field>
          <Field label="Job title" name="jobTitle">
            <input id="jobTitle" name="jobTitle" className={inputClass} />
          </Field>
          <Field label="Role" name="role">
            <select id="role" name="role" defaultValue="staff" className={inputClass}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Temporary password" name="password" hint="At least 8 characters.">
            <input id="password" name="password" type="text" autoComplete="off" required minLength={8} className={inputClass} />
          </Field>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
