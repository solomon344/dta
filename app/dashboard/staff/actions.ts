"use server";

import { headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { errorMessage, fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { edgeStoreBackend } from "@/lib/edgestore-server";
import { INVITE_TTL_DAYS, createInviteToken, inviteUrl } from "@/lib/invitations";
import { PUBLIC_REGISTRY_TAG } from "@/lib/public-cache";
import { requireUser, type CurrentUser } from "@/lib/session";

async function requireAdminUser(): Promise<CurrentUser | null> {
  const user = await requireUser();
  return user.role === "admin" ? user : null;
}

const NOT_ADMIN: ActionState = { error: "Only admins can manage staff." };
const roleSchema = z.enum(["admin", "staff"]);

export async function inviteStaffAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdminUser();
  if (!admin) return NOT_ADMIN;
  const parsed = z
    .object({
      email: z.email("Enter a valid email.").transform((v) => v.toLowerCase()),
      name: z.string().max(120).optional(),
      jobTitle: z.string().max(80).optional(),
      role: roleSchema.default("staff"),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { email, name, jobTitle, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "A staff account with this email already exists.", fieldErrors: { email: ["Already has an account."] } };
  }

  const { token, tokenHash } = createInviteToken();
  await prisma.$transaction([
    // Only the newest invitation for an email stays usable.
    prisma.invitation.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.invitation.create({
      data: {
        email,
        name: name ?? null,
        jobTitle: jobTitle ?? null,
        role,
        tokenHash,
        invitedById: admin.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  revalidatePath("/dashboard/staff");
  return {
    ok: true,
    message: `Invitation created for ${email}. Send them this link; it expires in ${INVITE_TTL_DAYS} days and works once.`,
    data: { inviteUrl: inviteUrl(token) },
  };
}

export async function revokeInvitationAction(invitationId: string, _: ActionState): Promise<ActionState> {
  if (!(await requireAdminUser())) return NOT_ADMIN;
  await prisma.invitation.update({ where: { id: invitationId }, data: { revokedAt: new Date() } });
  revalidatePath("/dashboard/staff");
  return { ok: true, message: "Invitation revoked." };
}

export async function createStaffAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdminUser())) return NOT_ADMIN;
  const parsed = z
    .object({
      name: z.string({ error: "Enter a name." }).min(2, "Enter a name.").max(120),
      email: z.email("Enter a valid email.").transform((v) => v.toLowerCase()),
      jobTitle: z.string().max(80).optional(),
      role: roleSchema.default("staff"),
      password: z.string({ error: "Use at least 8 characters." }).min(8, "Use at least 8 characters.").max(128),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { name, email, jobTitle, role, password } = parsed.data;

  let userId: string;
  try {
    const { user } = await auth.api.createUser({ body: { name, email, password, role }, headers: await headers() });
    userId = user.id;
    await prisma.staffProfile.create({ data: { userId, jobTitle: jobTitle ?? null } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect(`/dashboard/staff/${userId}`);
}

export async function setRoleAction(userId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdminUser();
  if (!admin) return NOT_ADMIN;
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) return { error: "Choose a role." };
  if (userId === admin.id && role.data !== "admin") return { error: "You can't remove your own admin role." };

  try {
    await auth.api.setRole({ body: { userId, role: role.data }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/dashboard/staff/${userId}`);
  return { ok: true, message: "Role updated." };
}

export async function setPasswordAction(userId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdminUser())) return NOT_ADMIN;
  const password = z.string().min(8).max(128).safeParse(formData.get("newPassword"));
  if (!password.success) return { error: "Use at least 8 characters.", fieldErrors: { newPassword: ["Use at least 8 characters."] } };

  try {
    await auth.api.setUserPassword({ body: { userId, newPassword: password.data }, headers: await headers() });
    await auth.api.revokeUserSessions({ body: { userId }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { ok: true, message: "Password reset. Share it with the staff member securely; they've been signed out everywhere." };
}

export async function setBannedAction(userId: string, banned: boolean, _: ActionState): Promise<ActionState> {
  const admin = await requireAdminUser();
  if (!admin) return NOT_ADMIN;
  if (userId === admin.id) return { error: "You can't deactivate your own account." };

  try {
    if (banned) await auth.api.banUser({ body: { userId, banReason: "Deactivated by an administrator" }, headers: await headers() });
    else await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/dashboard/staff/${userId}`);
  revalidatePath("/dashboard/staff");
  return { ok: true, message: banned ? "Account deactivated and signed out." : "Account reactivated." };
}

export async function deleteStaffAction(userId: string, _: ActionState): Promise<ActionState> {
  const admin = await requireAdminUser();
  if (!admin) return NOT_ADMIN;
  if (userId === admin.id) return { error: "You can't delete your own account." };

  const profile = await prisma.staffProfile.findUnique({ where: { userId }, include: { documents: true } });
  try {
    await auth.api.removeUser({ body: { userId }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  // Best-effort cleanup of the person's stored files.
  const images = [profile?.photoUrl, profile?.signatureUrl].filter((u): u is string => !!u);
  await Promise.all([
    ...images.map((url) => edgeStoreBackend().staffImages.delete({ url }).catch(() => undefined)),
    ...(profile?.documents ?? []).map((d) => edgeStoreBackend().staffDocuments.delete({ url: d.url }).catch(() => undefined)),
  ]);
  updateTag(PUBLIC_REGISTRY_TAG);
  redirect("/dashboard/staff");
}
