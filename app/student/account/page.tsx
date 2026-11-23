import type { Metadata } from "next";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field, inputClass } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import { requireStudent } from "@/lib/session";
import { changeStudentPasswordAction } from "../actions";

export const metadata: Metadata = { title: "Account" };

export default async function StudentAccountPage({ searchParams }: PageProps<"/student/account">) {
  const { user, student } = await requireStudent();
  const { changed } = await searchParams;

  return (
    <div className="space-y-space-lg">
      <h1 className="font-display text-headline-lg text-primary-container">Account</h1>
      {changed && (
        <p role="status" className="flex items-start gap-space-xs rounded-lg bg-secondary-fixed px-space-sm py-space-xs text-body-sm text-on-secondary-fixed">
          <Icon name="check_circle" className="text-base" /> Password changed. You&apos;ve been signed out on your other devices.
        </p>
      )}
      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        <Card title="Your details">
          <dl className="space-y-space-sm text-body-md">
            {[
              ["Name", student.fullName],
              ["Sign-in email", user.email],
              ["Program", student.program.name],
              ["Cohort", student.cohort.name],
              ["Phone on record", student.phone ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-label-md uppercase tracking-wider text-on-surface-variant">{label}</dt>
                <dd className="text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-space-md text-body-sm text-outline">
            Something wrong? Contact DTA staff at <a href="mailto:info@dta.gm" className="text-secondary hover:underline">info@dta.gm</a>.
            Your name appears on your certificate exactly as shown here.
          </p>
        </Card>

        <Card title="Change password">
          <ActionForm action={changeStudentPasswordAction} className="space-y-space-md">
            <Field label="Current password" name="currentPassword">
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
            </Field>
            <Field label="New password" name="newPassword" hint="At least 8 characters.">
              <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
            </Field>
            <Field label="Confirm new password" name="confirmPassword">
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} />
            </Field>
            <SubmitButton pendingLabel="Saving…">Change password</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
