import type { Metadata } from "next";
import ActionForm from "@/components/dashboard/ActionForm";
import StaffProfileEditor from "@/components/dashboard/StaffProfileEditor";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, Field, PageHeader, inputClass } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/session";
import { changePasswordAction } from "./actions";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="My profile" description="Your details, photo, signature and files." />
      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StaffProfileEditor userId={user.id} />
        </div>
        <Card title="Change password" className="h-fit">
          <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-space-md">
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
    </>
  );
}
