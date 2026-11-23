"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ACTIVATION_TTL_DAYS, createPortalLinks } from "@/lib/student-access";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Activation link for one student, or a password-reset link if they already have an account. */
export async function createStudentPortalLinkAction(studentId: string, _: ActionState): Promise<ActionState> {
  await requireUser();
  const [link] = await createPortalLinks([studentId]);
  if (!link) return { error: "This student no longer exists." };
  revalidatePath(`/dashboard/students/${studentId}`);
  return {
    ok: true,
    message: `${link.reset ? "Password-reset" : "Activation"} link created. It works once and expires in ${ACTIVATION_TTL_DAYS} days.`,
    data: { links: JSON.stringify([link]) },
  };
}

/** Activation links for every student in a cohort who hasn't activated yet (withdrawn students excluded). */
export async function createCohortPortalLinksAction(cohortId: string, _: ActionState): Promise<ActionState> {
  await requireUser();
  const students = await prisma.student.findMany({
    where: { cohortId, userId: null, status: { not: "WITHDRAWN" } },
    select: { id: true },
  });
  if (students.length === 0) return { error: "Everyone in this cohort has already activated their account." };
  const links = await createPortalLinks(students.map((s) => s.id));
  return {
    ok: true,
    message: `Created ${plural(links.length, "activation link")}. Each works once and expires in ${ACTIVATION_TTL_DAYS} days. Any older links for these students no longer work.`,
    data: { links: JSON.stringify(links) },
  };
}

/** Deletes a student's portal account. Their projects stay; staff can send a new activation link later. */
export async function removeStudentPortalAccessAction(studentId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can remove portal access." };
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
  if (!student?.userId) return { error: "This student has no portal account." };
  await prisma.$transaction([
    prisma.student.update({ where: { id: studentId }, data: { userId: null, activationTokenHash: null, activationExpiresAt: null } }),
    // Cascades to the account's sessions and password.
    prisma.user.delete({ where: { id: student.userId } }),
  ]);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, message: "Portal access removed." };
}
