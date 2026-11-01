"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPendingInvitation } from "@/lib/invitations";

const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: z.email("Enter a valid email."), password: z.string().min(1, "Enter your password.") })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error, "Invalid email or password.") };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

/** Whether /setup may create the first admin. */
export async function isSetupOpen(): Promise<boolean> {
  if (!process.env.SETUP_TOKEN) return false;
  return (await prisma.user.count({ where: { role: "admin" } })) === 0;
}

export async function setupAdminAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isSetupOpen())) return { error: "Setup is closed. An admin account already exists." };

  const parsed = z
    .object({
      name: z.string().min(2, "Enter your full name.").max(120),
      email: z.email("Enter a valid email."),
      password: passwordSchema,
      token: z.string().min(1, "Enter the setup token."),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { name, email, password, token } = parsed.data;

  if (token !== process.env.SETUP_TOKEN) {
    return { error: "The setup token is incorrect.", fieldErrors: { token: ["Incorrect token."] } };
  }

  try {
    const { user } = await auth.api.createUser({ body: { name, email, password, role: "admin" } });
    await prisma.staffProfile.create({ data: { userId: user.id, jobTitle: "Administrator" } });
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect("/dashboard");
}

export async function acceptInvitationAction(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const invitation = await findPendingInvitation(token);
  if (!invitation) return { error: "This invitation is no longer valid. Ask an admin for a new one." };

  const parsed = z
    .object({
      name: z.string().min(2, "Enter your full name.").max(120),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { name, password } = parsed.data;

  try {
    const { user } = await auth.api.createUser({
      body: { name, email: invitation.email, password, role: invitation.role === "admin" ? "admin" : "staff" },
    });
    await prisma.$transaction([
      prisma.staffProfile.create({ data: { userId: user.id, jobTitle: invitation.jobTitle } }),
      prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
    ]);
    await auth.api.signInEmail({ body: { email: invitation.email, password }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect("/dashboard");
}
