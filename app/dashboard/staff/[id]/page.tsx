import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import StaffProfileEditor from "@/components/dashboard/StaffProfileEditor";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, Field, PageHeader, inputClass } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { deleteStaffAction, setBannedAction, setPasswordAction, setRoleAction } from "../actions";

export const metadata: Metadata = { title: "Staff Member" };

export default async function StaffMemberPage({ params }: PageProps<"/dashboard/staff/[id]">) {
  const { id } = await params;
  const me = await requireAdmin();
  if (id === me.id) redirect("/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { staffProfile: { include: { signatoryFor: { include: { cohort: { select: { name: true } } } } } } },
  });
  if (!user) notFound();
  const signatoryFor = user.staffProfile?.signatoryFor ?? [];

  return (
    <>
      <PageHeader
        title={user.name}
        back={{ href: "/dashboard/staff", label: "Staff" }}
        description={
          <span className="flex items-center gap-space-xs">
            <Badge tone={user.role === "admin" ? "blue" : "gray"}>{user.role ?? "staff"}</Badge>
            {user.banned && <Badge tone="red">Deactivated</Badge>}
            {user.email}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StaffProfileEditor userId={user.id} />
        </div>
        <div className="space-y-space-lg">
          <Card title="Role">
            <ActionForm action={setRoleAction.bind(null, user.id)} className="flex items-end gap-space-xs">
              <Field label="Access level" name="role" className="flex-1">
                <select id="role" name="role" defaultValue={user.role === "admin" ? "admin" : "staff"} className={inputClass}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <SubmitButton variant="secondary">Save</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Reset password">
            <ActionForm action={setPasswordAction.bind(null, user.id)} resetOnSuccess className="space-y-space-sm">
              <Field label="New password" name="newPassword" hint="At least 8 characters. Signs them out everywhere.">
                <input id="newPassword" name="newPassword" type="text" autoComplete="off" required minLength={8} className={inputClass} />
              </Field>
              <SubmitButton variant="secondary">Set password</SubmitButton>
            </ActionForm>
          </Card>

          <Card title={user.banned ? "Reactivate account" : "Deactivate account"}>
            <p className="mb-space-sm text-body-sm text-on-surface-variant">
              {user.banned
                ? "Allow this person to sign in again."
                : "Blocks sign-in and ends their sessions. Their signature stays on certificates already issued."}
            </p>
            <ActionForm action={setBannedAction.bind(null, user.id, !user.banned)}>
              <SubmitButton variant={user.banned ? "secondary" : "danger"} confirm={user.banned ? undefined : `Deactivate ${user.name}?`}>
                {user.banned ? "Reactivate" : "Deactivate"}
              </SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Delete account">
            <p className="mb-space-sm text-body-sm text-on-surface-variant">
              Permanently deletes the account, photo, signature and files.
              {signatoryFor.length > 0 && (
                <strong className="mt-1 block text-error">
                  They sign certificates for {signatoryFor.map((s) => s.cohort.name).join(", ")}; their signature will disappear from those
                  certificates. Deactivate instead to keep it.
                </strong>
              )}
            </p>
            <ActionForm action={deleteStaffAction.bind(null, user.id)}>
              <SubmitButton variant="danger" confirm={`Permanently delete ${user.name}'s account?`}>Delete account</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
