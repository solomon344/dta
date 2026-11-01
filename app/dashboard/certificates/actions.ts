"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { issueCertificates, unissueCertificates } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser } from "@/lib/session";

async function requireAdminAction(): Promise<ActionState | null> {
  const user = await requireUser();
  return user.role === "admin" ? null : { error: "Only admins can change issued certificates." };
}

export async function revokeCertificateAction(certificateId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireAdminAction();
  if (denied) return denied;
  const parsed = z
    .object({ reason: z.string({ error: "Give a reason; it is shown on the public verification page." }).min(3, "Give a reason; it is shown on the public verification page.").max(300) })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: parsed.data.reason },
  });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/certificates/${certificateId}`);
  return { ok: true, message: "Certificate revoked." };
}

export async function reinstateCertificateAction(certificateId: string, _: ActionState): Promise<ActionState> {
  const denied = await requireAdminAction();
  if (denied) return denied;
  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "ISSUED", revokedAt: null, revokeReason: null },
  });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/certificates/${certificateId}`);
  return { ok: true, message: "Certificate reinstated." };
}

export async function updateIssueDateAction(certificateId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireAdminAction();
  if (denied) return denied;
  const issueDate = String(formData.get("issueDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return { error: "Choose a date.", fieldErrors: { issueDate: ["Choose a date."] } };

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { issueDate: new Date(`${issueDate}T00:00:00.000Z`) },
  });
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/certificates/${certificateId}`);
  return { ok: true, message: "Issue date updated." };
}

export async function unissueCertificateAction(certificateId: string, _: ActionState): Promise<ActionState> {
  const denied = await requireAdminAction();
  if (denied) return denied;
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { studentId: true } });
  if (!cert) return { error: "Certificate not found." };
  await unissueCertificates([cert.studentId]);
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/certificates/${certificateId}`);
  return { ok: true, message: "Certificate un-issued." };
}

export async function reissueCertificateAction(certificateId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only admins can change issued certificates." };
  const issueDate = String(formData.get("issueDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return { error: "Choose a date.", fieldErrors: { issueDate: ["Choose a date."] } };
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { studentId: true } });
  if (!cert) return { error: "Certificate not found." };

  await issueCertificates([cert.studentId], new Date(`${issueDate}T00:00:00.000Z`), user.id);
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidatePath(`/dashboard/certificates/${certificateId}`);
  return { ok: true, message: "Certificate issued again with its original ID." };
}
