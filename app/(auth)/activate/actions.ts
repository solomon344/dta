"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { auth, STUDENT_ROLE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findStudentByActivationToken } from "@/lib/student-access";

const passwordsSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

/**
 * Activation link: creates the student's portal account. If the student already has
 * one, the same link sets a new password instead (staff send it when a student forgets).
 */
export async function activateStudentAction(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const student = await findStudentByActivationToken(token);
  if (!student) return { error: "This link is no longer valid. Ask DTA staff for a new one." };
  const values = formObject(formData);

  let email: string;
  if (student.userId) {
    const parsed = passwordsSchema.safeParse(values);
    if (!parsed.success) return fieldErrorsFrom(parsed.error);
    const ctx = await auth.$context;
    await ctx.internalAdapter.updatePassword(student.userId, await ctx.password.hash(parsed.data.password));
    await ctx.internalAdapter.deleteUserSessions(student.userId);
    await prisma.student.update({ where: { id: student.id }, data: { activationTokenHash: null, activationExpiresAt: null } });
    email = student.user!.email;
    try {
      await auth.api.signInEmail({ body: { email, password: parsed.data.password }, headers: await headers() });
    } catch (error) {
      return { error: errorMessage(error) };
    }
    redirect("/student");
  }

  const parsed = z
    .object({ email: z.email("Enter a valid email.").max(200).transform((e) => e.toLowerCase()) })
    .and(passwordsSchema)
    .safeParse(values);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  email = parsed.data.email;
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "That email is already used by another account.", fieldErrors: { email: ["Use a different email."] } };
  }

  try {
    const { user } = await auth.api.createUser({
      body: { name: student.fullName, email, password: parsed.data.password, role: STUDENT_ROLE },
    });
    // Linking clears the token so the link can't be used twice; the unique userId stops double activation.
    const linked = await prisma.student.updateMany({
      where: { id: student.id, userId: null },
      data: { userId: user.id, activationTokenHash: null, activationExpiresAt: null, email: student.email ?? email },
    });
    if (linked.count === 0) {
      await prisma.user.delete({ where: { id: user.id } });
      return { error: "This account was already activated. Sign in instead." };
    }
    await auth.api.signInEmail({ body: { email, password: parsed.data.password }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect("/student");
}
