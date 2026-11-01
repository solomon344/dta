import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, inputClass } from "@/components/dashboard/ui";
import { getSession } from "@/lib/session";
import { signInAction } from "../actions";

export const metadata: Metadata = { title: "Staff Sign In" };
export const instant = false;

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <>
      <h1 className="font-display text-headline-lg text-primary-container">Staff sign in</h1>
      <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
        Sign in to manage cohorts, students and certificates.
      </p>
      <ActionForm action={signInAction} className="space-y-space-md">
        <Field label="Email" name="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <Field label="Password" name="password">
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <p className="mt-space-md text-body-sm text-outline">
        Accounts are created by an administrator. Forgot your password? Ask an admin to reset it.
      </p>
    </>
  );
}
