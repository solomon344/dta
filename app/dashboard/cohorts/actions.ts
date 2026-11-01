"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { issueCertificates, unissueCertificates } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

const optionalDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return d;
  });

const cohortSchema = z.object({
  name: z.string({ error: "Enter a name." }).min(2, "Enter a name.").max(80),
  description: z.string().max(500).optional().transform((v) => v ?? null),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]),
  startDate: optionalDate,
  endDate: optionalDate,
});

export async function saveCohortAction(cohortId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = cohortSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const clash = await prisma.cohort.findUnique({ where: { name: parsed.data.name } });
  if (clash && clash.id !== cohortId) {
    return { error: "A cohort with this name already exists.", fieldErrors: { name: ["Already in use."] } };
  }

  let id = cohortId;
  try {
    if (cohortId) await prisma.cohort.update({ where: { id: cohortId }, data: parsed.data });
    else id = (await prisma.cohort.create({ data: parsed.data })).id;
  } catch (error) {
    return { error: errorMessage(error) };
  }
  updateTag(PUBLIC_REGISTRY_TAG);
  if (!cohortId) redirect(`/dashboard/cohorts/${id}`);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  return { ok: true, message: "Cohort saved." };
}

export async function deleteCohortAction(cohortId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can delete cohorts." };
  const students = await prisma.student.count({ where: { cohortId } });
  if (students > 0) return { error: `This cohort has ${students} students. Move or remove them first.` };
  await prisma.cohort.delete({ where: { id: cohortId } });
  updateTag(PUBLIC_REGISTRY_TAG);
  redirect("/dashboard/cohorts");
}

export async function addSignatoryAction(cohortId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z
    .object({
      staffProfileId: z.string({ error: "Choose a staff member." }).min(1, "Choose a staff member."),
      title: z.string({ error: "Enter the title printed under the signature." }).min(2, "Enter the title printed under the signature.").max(80),
      sortOrder: z.coerce.number().int().min(0).max(99).default(0),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const count = await prisma.cohortSignatory.count({ where: { cohortId } });
  if (count >= 4) return { error: "A certificate can show at most 4 signatures." };

  try {
    await prisma.cohortSignatory.create({ data: { cohortId, ...parsed.data } });
  } catch {
    return { error: "This staff member is already a signatory for this cohort." };
  }
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  return { ok: true, message: "Signatory added." };
}

export async function removeSignatoryAction(signatoryId: string, cohortId: string, _: ActionState): Promise<ActionState> {
  await requireUser();
  await prisma.cohortSignatory.deleteMany({ where: { id: signatoryId, cohortId } });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  return { ok: true, message: "Signatory removed." };
}

export async function issueCohortCertificatesAction(cohortId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z
    .object({
      issueDate: z.string({ error: "Choose an issue date." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an issue date."),
      scope: z.enum(["graduated", "all"]),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const students = await prisma.student.findMany({
    where: {
      cohortId,
      OR: [{ certificate: null }, { certificate: { status: "VOIDED" } }],
      status: parsed.data.scope === "graduated" ? "GRADUATED" : { in: ["ENROLLED", "GRADUATED"] },
    },
    select: { id: true },
  });
  if (students.length === 0) return { error: "No eligible students without a certificate." };

  const count = await issueCertificates(
    students.map((s) => s.id),
    new Date(`${parsed.data.issueDate}T00:00:00.000Z`),
    user.id
  );
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  return { ok: true, message: `Issued ${count} certificate${count === 1 ? "" : "s"}.` };
}

export async function unissueCohortCertificatesAction(cohortId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can un-issue certificates." };

  const students = await prisma.student.findMany({
    where: { cohortId, certificate: { status: "ISSUED" } },
    select: { id: true },
  });
  const count = await unissueCertificates(students.map((s) => s.id));
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  return {
    ok: true,
    message: `Un-issued ${count} certificate${count === 1 ? "" : "s"}. Their IDs are kept and come back if you issue to those students again.`,
  };
}

/**
 * Attendance: students ticked as completed are marked graduated (and optionally issued
 * certificates, restoring any un-issued IDs); everyone else is marked withdrawn and
 * their certificates are un-issued.
 */
export async function saveAttendanceAction(cohortId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can update attendance, because it can un-issue certificates." };

  const issue = formData.get("issue") === "on";
  const issueDate = String(formData.get("issueDate") ?? "");
  if (issue && !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    return { error: "Choose an issue date.", fieldErrors: { issueDate: ["Choose a date."] } };
  }

  const students = await prisma.student.findMany({ where: { cohortId }, select: { id: true } });
  const completed = new Set(formData.getAll("completed").map(String));
  const completedIds = students.filter((s) => completed.has(s.id)).map((s) => s.id);
  const otherIds = students.filter((s) => !completed.has(s.id)).map((s) => s.id);

  const unissued = await unissueCertificates(otherIds, "WITHDRAWN");
  let issued = 0;
  if (issue) {
    issued = await issueCertificates(completedIds, new Date(`${issueDate}T00:00:00.000Z`), user.id);
  }
  // Completed students who already held a certificate (or weren't issued one now) are still graduates.
  await prisma.student.updateMany({ where: { id: { in: completedIds } }, data: { status: "GRADUATED" } });

  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  revalidatePath(`/dashboard/cohorts/${cohortId}/attendance`);
  return {
    ok: true,
    message: `${completedIds.length} completed, ${otherIds.length} did not complete. Issued ${issued}, un-issued ${unissued}.`,
  };
}
