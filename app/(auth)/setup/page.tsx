import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, btn, inputClass } from "@/components/dashboard/ui";
import { isSetupOpen, setupAdminAction } from "../actions";

export const metadata: Metadata = { title: "Create Admin Account" };
export const instant = false;

export default async function SetupPage() {
  await connection();

  if (!(await isSetupOpen())) {
    return (
      <>
        <h1 className="font-display text-headline-lg text-primary-container">Setup is closed</h1>
        <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
          An admin account already exists, or no <code className="font-mono">SETUP_TOKEN</code> is configured on the server.
        </p>
        <Link href="/login" className={`${btn.primary} w-full`}>Go to sign in</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-headline-lg text-primary-container">Create the first admin</h1>
      <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
        This one-time page creates the administrator account. You will need the{" "}
        <code className="font-mono">SETUP_TOKEN</code> configured on the server.
      </p>
      <ActionForm action={setupAdminAction} className="space-y-space-md">
        <Field label="Full name" name="name">
          <input id="name" name="name" autoComplete="name" required className={inputClass} />
        </Field>
        <Field label="Email" name="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <Field label="Password" name="password" hint="At least 8 characters.">
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        </Field>
        <Field label="Setup token" name="token">
          <input id="token" name="token" type="password" autoComplete="off" required className={inputClass} />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Creating account…">Create admin account</SubmitButton>
      </ActionForm>
    </>
  );
}
