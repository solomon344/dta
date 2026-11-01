"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { issueCertificates, unissueCertificates } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

const studentSchema = z.object({
  fullName: z.string({ error: "Enter the student's full name." }).min(2, "Enter the student's full name.").max(120),
  email: z.email("Enter a valid email.").optional().transform((v) => v ?? null),
  phone: z.string().max(40).optional().transform((v) => v ?? null),
  programId: z.string({ error: "Choose a program." }).min(1, "Choose a program."),
  cohortId: z.string({ error: "Choose a cohort." }).min(1, "Choose a cohort."),
  status: z.enum(["ENROLLED", "GRADUATED", "WITHDRAWN"]).default("ENROLLED"),
  notes: z.string().max(1000).optional().transform((v) => v ?? null),
});

export async function saveStudentAction(studentId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = studentSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  let id = studentId;
  try {
    if (studentId) await prisma.student.update({ where: { id: studentId }, data: parsed.data });
    else id = (await prisma.student.create({ data: parsed.data })).id;
  } catch (error) {
    return { error: errorMessage(error) };
  }
  updateTag(PUBLIC_REGISTRY_TAG);
  if (!studentId) redirect(`/dashboard/students/${id}`);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, message: "Student saved." };
}

/** Adds many students at once: one per line, "Full Name, email, phone" (email and phone optional). */
export async function bulkAddStudentsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z
    .object({
      programId: z.string({ error: "Choose a program." }).min(1, "Choose a program."),
      cohortId: z.string({ error: "Choose a cohort." }).min(1, "Choose a cohort."),
      status: z.enum(["ENROLLED", "GRADUATED"]).default("ENROLLED"),
      rows: z.string({ error: "Paste at least one student." }).min(2, "Paste at least one student."),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { programId, cohortId, status, rows } = parsed.data;

  const students: { fullName: string; email: string | null; phone: string | null }[] = [];
  const problems: string[] = [];
  rows.split(/\r?\n/).forEach((line, i) => {
    const [fullName = "", email = "", phone = ""] = line.split(/[,\t]/).map((c) => c.trim());
    if (!fullName) return;
    if (fullName.length < 2) problems.push(`Line ${i + 1}: name too short`);
    else if (email && !z.email().safeParse(email).success) problems.push(`Line ${i + 1}: invalid email "${email}"`);
    else students.push({ fullName, email: email || null, phone: phone || null });
  });

  if (problems.length) return { error: problems.slice(0, 5).join("; "), fieldErrors: { rows: ["Fix the lines listed above."] } };
  if (students.length === 0) return { error: "No students found in the pasted text.", fieldErrors: { rows: ["Paste at least one student."] } };
  if (students.length > 500) return { error: "Add at most 500 students at a time." };

  await prisma.student.createMany({ data: students.map((s) => ({ ...s, programId, cohortId, status })) });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath("/dashboard/students");
  return { ok: true, message: `Added ${students.length} student${students.length === 1 ? "" : "s"}.` };
}

export async function issueStudentCertificateAction(studentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const issueDate = String(formData.get("issueDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return { error: "Choose an issue date.", fieldErrors: { issueDate: ["Choose a date."] } };

  const count = await issueCertificates([studentId], new Date(`${issueDate}T00:00:00.000Z`), user.id);
  if (count === 0) return { error: "This student already has a certificate." };
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, message: "Certificate issued." };
}

export async function unissueStudentCertificateAction(studentId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can un-issue certificates." };
  const count = await unissueCertificates([studentId]);
  if (count === 0) return { error: "This student has no issued certificate." };
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, message: "Certificate un-issued. Re-issuing restores the same ID." };
}

export async function deleteStudentAction(studentId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can delete students." };
  await prisma.student.delete({ where: { id: studentId } });
  updateTag(PUBLIC_REGISTRY_TAG);
  redirect("/dashboard/students");
}
