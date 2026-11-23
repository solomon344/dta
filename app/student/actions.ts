"use server";

import { headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmProjectImages, deleteProjectImages, imagesFrom, projectFieldsSchema, uniqueProjectSlug } from "@/lib/projects";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireStudent } from "@/lib/session";

const MAX_IN_REVIEW = 5;

const studentProjectSchema = projectFieldsSchema.omit({ programId: true, cohortId: true });

async function parseProject(formData: FormData) {
  const fail = (state: ActionState) => ({ error: state }) as const;
  const parsed = studentProjectSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(fieldErrorsFrom(parsed.error));
  const imageResult = imagesFrom(formData);
  if ("error" in imageResult) return fail({ error: imageResult.error, fieldErrors: { images: [imageResult.error] } });
  return {
    data: {
      ...parsed.data,
      liveUrl: parsed.data.liveUrl ?? null,
      repoUrl: parsed.data.repoUrl ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
      images: imageResult.images,
    },
  } as const;
}

/** Program, cohort and graduate badge come from the student's own record. */
function linksFor(student: Awaited<ReturnType<typeof requireStudent>>["student"]) {
  return {
    programId: student.programId,
    cohortId: student.cohortId,
    certificateId: student.certificate?.status === "ISSUED" ? student.certificate.id : null,
  };
}

function refresh() {
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath("/student", "layout");
  revalidatePath("/dashboard/projects");
}

export async function createStudentProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, student } = await requireStudent();
  if (formData.get("consent") !== "on") {
    return { error: "Please confirm we may publish your project.", fieldErrors: { consent: ["Required."] } };
  }
  const result = await parseProject(formData);
  if ("error" in result) return result.error;

  const inReview = await prisma.project.count({ where: { studentId: student.id, status: "PENDING" } });
  if (inReview >= MAX_IN_REVIEW) {
    return { error: `You already have ${MAX_IN_REVIEW} projects waiting for review. Please wait for DTA staff to review them.` };
  }

  const confirmError = await confirmProjectImages(result.data.images);
  if (confirmError) return { error: confirmError, fieldErrors: { images: [confirmError] } };

  await prisma.project.create({
    data: {
      ...result.data,
      ...linksFor(student),
      slug: await uniqueProjectSlug(result.data.title),
      studentId: student.id,
      contactEmail: user.email,
      consentedAt: new Date(),
    },
  });
  refresh();
  redirect("/student/projects?submitted=1");
}

/** Saving any change sends the project back to DTA staff for review. */
export async function updateStudentProjectAction(projectId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { student } = await requireStudent();
  const existing = await prisma.project.findFirst({ where: { id: projectId, studentId: student.id }, select: { images: true } });
  if (!existing) return { error: "Project not found." };
  const result = await parseProject(formData);
  if ("error" in result) return result.error;

  const confirmError = await confirmProjectImages(result.data.images, existing.images);
  if (confirmError) return { error: confirmError, fieldErrors: { images: [confirmError] } };

  await prisma.project.update({
    where: { id: projectId },
    data: { ...result.data, ...linksFor(student), status: "PENDING", featured: false, reviewedAt: null, reviewedById: null },
  });
  await deleteProjectImages(existing.images.filter((url) => !result.data.images.includes(url)));
  refresh();
  redirect("/student/projects?updated=1");
}

export async function deleteStudentProjectAction(projectId: string, _: ActionState): Promise<ActionState> {
  const { student } = await requireStudent();
  const project = await prisma.project.findFirst({ where: { id: projectId, studentId: student.id }, select: { images: true } });
  if (!project) return { error: "Project not found." };
  await prisma.project.delete({ where: { id: projectId } });
  await deleteProjectImages(project.images);
  refresh();
  redirect("/student/projects");
}

export async function changeStudentPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireStudent();
  const parsed = z
    .object({
      currentPassword: z.string({ error: "Enter your current password." }).min(1, "Enter your current password."),
      newPassword: z.string({ error: "Use at least 8 characters." }).min(8, "Use at least 8 characters.").max(128),
      confirmPassword: z.string({ error: "Confirm your new password." }),
    })
    .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error, "Could not change your password."), fieldErrors: { currentPassword: ["Check your current password."] } };
  }
  // The session cookie was replaced (other devices were signed out), so reload with the new one.
  redirect("/student/account?changed=1");
}
