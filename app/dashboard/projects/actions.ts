"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import {
  confirmProjectImages,
  deleteProjectImages,
  imagesFrom,
  projectFieldsSchema,
  resolveProgramAndCohort,
  uniqueProjectSlug,
} from "@/lib/projects";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

const staffSchema = projectFieldsSchema.extend({
  contactEmail: z.email("Enter a valid email.").max(200).optional(),
});

function refresh() {
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath("/dashboard/projects");
}

async function parse(formData: FormData) {
  const fail = (state: ActionState) => ({ error: state }) as const;
  const parsed = staffSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(fieldErrorsFrom(parsed.error));
  const imageResult = imagesFrom(formData);
  if ("error" in imageResult) return fail({ error: imageResult.error, fieldErrors: { images: [imageResult.error] } });
  const { programId, cohortId, ...fields } = parsed.data;
  return {
    data: {
      ...fields,
      liveUrl: fields.liveUrl ?? null,
      repoUrl: fields.repoUrl ?? null,
      videoUrl: fields.videoUrl ?? null,
      contactEmail: fields.contactEmail ?? null,
      images: imageResult.images,
      ...(await resolveProgramAndCohort(programId, cohortId)),
    },
  } as const;
}

/** Staff-added projects are published straight away. */
export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = await parse(formData);
  if ("error" in result) return result.error;
  const confirmError = await confirmProjectImages(result.data.images);
  if (confirmError) return { error: confirmError, fieldErrors: { images: [confirmError] } };

  await prisma.project.create({
    data: {
      ...result.data,
      slug: await uniqueProjectSlug(result.data.title),
      status: "APPROVED",
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });
  refresh();
  redirect("/dashboard/projects?status=APPROVED");
}

export async function updateProjectAction(projectId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const existing = await prisma.project.findUnique({ where: { id: projectId }, select: { images: true } });
  if (!existing) return { error: "This project no longer exists." };
  const result = await parse(formData);
  if ("error" in result) return result.error;
  const confirmError = await confirmProjectImages(result.data.images, existing.images);
  if (confirmError) return { error: confirmError, fieldErrors: { images: [confirmError] } };

  await prisma.project.update({ where: { id: projectId }, data: result.data });
  await deleteProjectImages(existing.images.filter((url) => !result.data.images.includes(url)));
  refresh();
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true, message: "Project saved." };
}

export async function reviewProjectAction(
  projectId: string,
  status: "APPROVED" | "REJECTED",
  _: ActionState
): Promise<ActionState> {
  const user = await requireUser();
  if (status !== "APPROVED" && status !== "REJECTED") return { error: "Unknown status." };
  await prisma.project.update({
    where: { id: projectId },
    data: { status, reviewedById: user.id, reviewedAt: new Date(), ...(status === "REJECTED" && { featured: false }) },
  });
  refresh();
  return { ok: true };
}

export async function setProjectFeaturedAction(projectId: string, featured: boolean, _: ActionState): Promise<ActionState> {
  await requireUser();
  const { count } = await prisma.project.updateMany({ where: { id: projectId, status: "APPROVED" }, data: { featured } });
  if (count === 0) return { error: "Only published projects can be featured." };
  refresh();
  return { ok: true };
}

export async function deleteProjectAction(projectId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can delete projects." };
  const project = await prisma.project.delete({ where: { id: projectId }, select: { images: true } }).catch(() => null);
  if (project) await deleteProjectImages(project.images);
  refresh();
  return { ok: true };
}
