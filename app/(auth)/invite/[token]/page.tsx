import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, btn, inputClass } from "@/components/dashboard/ui";
import { findPendingInvitation } from "@/lib/invitations";
import { acceptInvitationAction } from "../../actions";

export const metadata: Metadata = { title: "Accept Invitation" };
export const instant = false;

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const invitation = await findPendingInvitation(token);

  if (!invitation) {
    return (
      <>
        <h1 className="font-display text-headline-lg text-primary-container">Invitation not valid</h1>
        <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
          This invitation has expired, was revoked, or has already been used. Ask an administrator to send a new one.
        </p>
        <Link href="/login" className={`${btn.secondary} w-full`}>Go to sign in</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-headline-lg text-primary-container">Join the DTA staff portal</h1>
      <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
        You&apos;ve been invited as {invitation.role === "admin" ? "an administrator" : "a staff member"}
        {invitation.jobTitle ? ` (${invitation.jobTitle})` : ""}. Set your name and password to finish.
      </p>
      <ActionForm action={acceptInvitationAction.bind(null, token)} className="space-y-space-md">
        <Field label="Email" name="email">
          <input id="email" value={invitation.email} disabled className={inputClass} />
        </Field>
        <Field label="Full name" name="name">
          <input id="name" name="name" defaultValue={invitation.name ?? ""} autoComplete="name" required className={inputClass} />
        </Field>
        <Field label="Password" name="password" hint="At least 8 characters.">
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        </Field>
        <Field label="Confirm password" name="confirmPassword">
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Creating account…">Create my account</SubmitButton>
      </ActionForm>
    </>
  );
}
