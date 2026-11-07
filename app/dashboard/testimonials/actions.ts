"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

function refresh() {
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath("/dashboard/testimonials");
}

export async function reviewTestimonialAction(
  testimonialId: string,
  status: "APPROVED" | "REJECTED",
  _: ActionState
): Promise<ActionState> {
  const user = await requireUser();
  if (status !== "APPROVED" && status !== "REJECTED") return { error: "Unknown status." };
  await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { status, reviewedById: user.id, reviewedAt: new Date() },
  });
  refresh();
  return { ok: true };
}

export async function deleteTestimonialAction(testimonialId: string, _: ActionState): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can delete testimonials." };
  await prisma.testimonial.delete({ where: { id: testimonialId } });
  refresh();
  return { ok: true };
}
