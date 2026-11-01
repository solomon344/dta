import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

export const INVITE_TTL_DAYS = 7;

export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteUrl(token: string): string {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/invite/${token}`;
}

/** A pending (not accepted, revoked or expired) invitation for this token, or null. */
export async function findPendingInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashInviteToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt < new Date()) {
    return null;
  }
  return invitation;
}
