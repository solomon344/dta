"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

const programSchema = z.object({
  code: z
    .string({ error: "Enter a short code." })
    .min(1, "Enter a short code.")
    .max(10)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9-]+$/.test(v), "Letters, numbers and dashes only."),
  name: z.string({ error: "Enter a name." }).min(2, "Enter a name.").max(120),
  certificateTitle: z.string({ error: "Enter the certificate title." }).min(5, "Enter the certificate title.").max(200),
  certificateDetail: z.string({ error: "Enter a short description." }).min(5, "Enter a short description.").max(400),
  competencies: z
    .string()
    .optional()
    .transform((v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean)),
});

export async function saveProgramAction(programId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = programSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const clash = await prisma.program.findUnique({ where: { code: parsed.data.code } });
  if (clash && clash.id !== programId) {
    return { error: "Another program already uses this code.", fieldErrors: { code: ["Already in use."] } };
  }

  try {
    if (programId) await prisma.program.update({ where: { id: programId }, data: parsed.data });
    else await prisma.program.create({ data: parsed.data });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  updateTag(PUBLIC_REGISTRY_TAG);
  redirect("/dashboard/programs");
}

export async function deleteProgramAction(programId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can delete programs." };
  const students = await prisma.student.count({ where: { programId } });
  if (students > 0) return { error: `This program has ${students} students. Move or remove them first.` };
  await prisma.program.delete({ where: { id: programId } });
  updateTag(PUBLIC_REGISTRY_TAG);
  redirect("/dashboard/programs");
}
