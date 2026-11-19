"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Bulk actions on selected waitlist entries; the clicked button's `intent` picks the action. */
export async function bulkWaitlistAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const intent = String(formData.get("intent") ?? "");
  if (ids.length === 0) return { error: "Select at least one person first." };

  let result: ActionState;
  if (intent === "NEW" || intent === "CONTACTED" || intent === "ARCHIVED") {
    // Enrolled entries stay enrolled; they're linked to a student record.
    const { count } = await prisma.waitlistEntry.updateMany({
      where: { id: { in: ids }, status: { not: "ENROLLED" } },
      data: { status: intent },
    });
    const label = { NEW: "new", CONTACTED: "contacted", ARCHIVED: "archived" }[intent];
    result = { ok: true, message: `Marked ${plural(count, "person", "people")} as ${label}.` };
  } else if (intent === "DELETE") {
    if (user.role !== "admin") return { error: "Only admins can delete waitlist entries." };
    const { count } = await prisma.waitlistEntry.deleteMany({ where: { id: { in: ids } } });
    result = { ok: true, message: `Deleted ${plural(count, "entry", "entries")}.` };
  } else if (intent === "ENROLL") {
    result = await enroll(ids, String(formData.get("cohortId") ?? ""), String(formData.get("fallbackProgramId") ?? ""));
  } else {
    return { error: "Unknown action." };
  }

  revalidatePath("/dashboard/waitlist");
  return result;
}

/** Turns waitlist entries into enrolled students in a cohort. */
async function enroll(ids: string[], cohortId: string, fallbackProgramId: string): Promise<ActionState> {
  if (!cohortId) return { error: "Choose the cohort to enroll them into.", fieldErrors: { cohortId: ["Choose a cohort."] } };
  const [cohort, fallback] = await Promise.all([
    prisma.cohort.findUnique({ where: { id: cohortId }, select: { id: true, name: true } }),
    fallbackProgramId ? prisma.program.findUnique({ where: { id: fallbackProgramId }, select: { id: true } }) : null,
  ]);
  if (!cohort) return { error: "That cohort no longer exists." };

  const entries = await prisma.waitlistEntry.findMany({
    where: { id: { in: ids }, studentId: null },
    orderBy: { fullName: "asc" },
  });
  if (entries.length === 0) return { error: "Everyone selected is already enrolled." };

  const missing = entries.filter((e) => !e.programId && !fallback);
  if (missing.length > 0) {
    return {
      error: `Choose a program for people who picked "Not sure yet": ${missing.map((e) => e.fullName).join(", ")}.`,
      fieldErrors: { fallbackProgramId: ["Needed for people without a program."] },
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const e of entries) {
      const student = await tx.student.create({
        data: {
          fullName: e.fullName,
          email: e.email,
          phone: e.phone,
          programId: (e.programId ?? fallback?.id)!,
          cohortId: cohort.id,
          status: "ENROLLED",
        },
      });
      await tx.waitlistEntry.update({ where: { id: e.id }, data: { status: "ENROLLED", studentId: student.id } });
    }
  });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/cohorts/${cohort.id}`);
  return { ok: true, message: `Enrolled ${plural(entries.length, "student")} in ${cohort.name}.` };
}
