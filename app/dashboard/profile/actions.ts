"use server";

import { headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { edgeStoreBackend, isEdgeStoreUrl } from "@/lib/edgestore-server";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser, type CurrentUser } from "@/lib/session";

/** Staff may edit their own profile; admins may edit anyone's. Returns the acting user, or null if not allowed. */
async function authorizeFor(ownerId: string): Promise<CurrentUser | null> {
  const user = await requireUser();
  return user.role === "admin" || user.id === ownerId ? user : null;
}

function revalidateStaff(ownerId: string) {
  revalidatePath("/dashboard/profile");
  revalidatePath(`/dashboard/staff/${ownerId}`);
  revalidatePath("/dashboard", "layout");
}

async function ensureProfile(userId: string) {
  return prisma.staffProfile.upsert({ where: { userId }, update: {}, create: { userId } });
}

export async function updateProfileAction(ownerId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await authorizeFor(ownerId))) return { error: "You can only edit your own profile." };
  const parsed = z
    .object({
      name: z.string({ error: "Enter a name." }).min(2, "Enter a name.").max(120),
      jobTitle: z.string().max(80).optional().transform((v) => v ?? null),
      phone: z.string().max(40).optional().transform((v) => v ?? null),
      bio: z.string().max(1000).optional().transform((v) => v ?? null),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { name, ...profile } = parsed.data;

  await prisma.$transaction([
    prisma.user.update({ where: { id: ownerId }, data: { name } }),
    prisma.staffProfile.upsert({ where: { userId: ownerId }, update: profile, create: { userId: ownerId, ...profile } }),
  ]);
  updateTag(PUBLIC_REGISTRY_TAG);
  revalidateStaff(ownerId);
  return { ok: true, message: "Profile saved." };
}

/**
 * Saves a photo or signature that the browser uploaded to EdgeStore as a temporary file:
 * stores the URL, confirms the file, and deletes the one it replaces.
 */
export async function saveStaffImageAction(ownerId: string, kind: "photo" | "signature", url: string): Promise<ActionState> {
  if (kind !== "photo" && kind !== "signature") return { error: "Unknown file type." };
  if (!(await authorizeFor(ownerId))) return { error: "You can only change your own files." };
  if (!isEdgeStoreUrl(url)) return { error: "Invalid file URL." };

  const profile = await ensureProfile(ownerId);
  const previous = kind === "photo" ? profile.photoUrl : profile.signatureUrl;

  try {
    await edgeStoreBackend().staffImages.confirm({ url });
  } catch (error) {
    return { error: errorMessage(error, "Could not save the uploaded file.") };
  }
  await prisma.staffProfile.update({
    where: { userId: ownerId },
    data: kind === "photo" ? { photoUrl: url } : { signatureUrl: url },
  });
  if (previous && previous !== url) {
    await edgeStoreBackend().staffImages.delete({ url: previous }).catch(() => undefined);
  }
  if (kind === "signature") updateTag(PUBLIC_REGISTRY_TAG);
  revalidateStaff(ownerId);
  return { ok: true, message: kind === "photo" ? "Photo updated." : "Signature updated." };
}

export async function removeStaffImageAction(ownerId: string, kind: "photo" | "signature"): Promise<ActionState> {
  if (kind !== "photo" && kind !== "signature") return { error: "Unknown file type." };
  if (!(await authorizeFor(ownerId))) return { error: "You can only change your own files." };
  const profile = await prisma.staffProfile.findUnique({ where: { userId: ownerId } });
  const current = kind === "photo" ? profile?.photoUrl : profile?.signatureUrl;
  if (!profile || !current) return { ok: true };

  await prisma.staffProfile.update({
    where: { userId: ownerId },
    data: kind === "photo" ? { photoUrl: null } : { signatureUrl: null },
  });
  await edgeStoreBackend().staffImages.delete({ url: current }).catch(() => undefined);
  if (kind === "signature") updateTag(PUBLIC_REGISTRY_TAG);
  revalidateStaff(ownerId);
  return { ok: true, message: kind === "photo" ? "Photo removed." : "Signature removed." };
}

export async function addStaffDocumentAction(
  ownerId: string,
  file: { url: string; name: string; size: number; mimeType?: string }
): Promise<ActionState> {
  if (!(await authorizeFor(ownerId))) return { error: "You can only add files to your own profile." };
  if (!isEdgeStoreUrl(String(file?.url)) || typeof file.name !== "string") return { error: "Invalid file." };

  const profile = await ensureProfile(ownerId);
  try {
    await edgeStoreBackend().staffDocuments.confirm({ url: file.url });
  } catch (error) {
    return { error: errorMessage(error, "Could not save the uploaded file.") };
  }
  await prisma.staffDocument.create({
    data: {
      profileId: profile.id,
      url: file.url,
      name: file.name.slice(0, 200),
      size: Number.isFinite(file.size) ? Math.max(0, Math.round(file.size)) : 0,
      mimeType: typeof file.mimeType === "string" ? file.mimeType.slice(0, 100) || null : null,
    },
  });
  revalidateStaff(ownerId);
  return { ok: true, message: "File uploaded." };
}

export async function deleteStaffDocumentAction(documentId: string): Promise<ActionState> {
  const doc = await prisma.staffDocument.findUnique({ where: { id: documentId }, include: { profile: true } });
  if (!doc) return { ok: true };
  if (!(await authorizeFor(doc.profile.userId))) return { error: "You can only delete your own files." };

  await prisma.staffDocument.delete({ where: { id: documentId } });
  await edgeStoreBackend().staffDocuments.delete({ url: doc.url }).catch(() => undefined);
  revalidateStaff(doc.profile.userId);
  return { ok: true, message: "File deleted." };
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z
    .object({
      currentPassword: z.string({ error: "Enter your current password." }).min(1, "Enter your current password."),
      newPassword: z.string({ error: "Use at least 8 characters." }).min(8, "Use at least 8 characters.").max(128),
      confirmPassword: z.string({ error: "Confirm the new password." }),
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
    return { error: errorMessage(error, "Could not change the password.") };
  }
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}
