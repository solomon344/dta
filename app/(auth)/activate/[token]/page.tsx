import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, btn, inputClass } from "@/components/dashboard/ui";
import { findStudentByActivationToken } from "@/lib/student-access";
import { activateStudentAction } from "../actions";

export const metadata: Metadata = { title: "Student Portal Activation" };
export const instant = false;

export default async function ActivatePage({ params }: PageProps<"/activate/[token]">) {
  const { token } = await params;
  const student = await findStudentByActivationToken(token);

  if (!student) {
    return (
      <>
        <h1 className="font-display text-headline-lg text-primary-container">Link not valid</h1>
        <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
          This link has expired or has already been used. Ask DTA staff to send you a new one.
        </p>
        <Link href="/login" className={`${btn.secondary} w-full`}>Go to sign in</Link>
      </>
    );
  }

  const reset = Boolean(student.userId);
  return (
    <>
      <h1 className="font-display text-headline-lg text-primary-container">
        {reset ? "Set a new password" : `Welcome, ${student.fullName.split(" ")[0]}!`}
      </h1>
      <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
        {reset ? (
          <>Choose a new password for {student.user?.email}.</>
        ) : (
          <>
            Create your DTA student portal account ({student.program.name}, {student.cohort.name}). You&apos;ll sign in with
            this email from now on.
          </>
        )}
      </p>
      <ActionForm action={activateStudentAction.bind(null, token)} className="space-y-space-md">
        <Field label="Full name" name="fullName" hint="Ask DTA staff if your name needs correcting.">
          <input id="fullName" value={student.fullName} disabled className={inputClass} />
        </Field>
        {!reset && (
          <Field label="Email" name="email">
            <input id="email" name="email" type="email" autoComplete="email" required defaultValue={student.email ?? ""} className={inputClass} />
          </Field>
        )}
        <Field label={reset ? "New password" : "Password"} name="password" hint="At least 8 characters.">
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        </Field>
        <Field label="Confirm password" name="confirmPassword">
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} />
        </Field>
        <SubmitButton className="w-full" pendingLabel={reset ? "Saving…" : "Creating account…"}>
          {reset ? "Save password and sign in" : "Create my account"}
        </SubmitButton>
      </ActionForm>
    </>
  );
}
