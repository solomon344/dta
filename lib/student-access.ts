import "server-only";
import { createInviteToken, hashInviteToken } from "./invitations";
import { prisma } from "./db";
import { whatsappChatUrl } from "./phone";

/** How long a student activation or password-reset link stays valid. */
export const ACTIVATION_TTL_DAYS = 14;

function linkFor(token: string): string {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/activate/${token}`;
}

export interface PortalLink {
  studentId: string;
  fullName: string;
  url: string;
  /** Opens WhatsApp with the link ready to send, when the student has a phone number. */
  whatsappUrl: string | null;
  /** True when the student already has an account, so the link resets their password. */
  reset: boolean;
}

/**
 * Creates a fresh activation link for each student (or a password-reset link for
 * students who already activated). Any earlier link for those students stops working.
 */
export async function createPortalLinks(studentIds: string[]): Promise<PortalLink[]> {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true, userId: true },
  });
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const links: PortalLink[] = [];
  for (const s of students) {
    const { token, tokenHash } = createInviteToken();
    await prisma.student.update({ where: { id: s.id }, data: { activationTokenHash: tokenHash, activationExpiresAt: expiresAt } });
    const url = linkFor(token);
    const reset = Boolean(s.userId);
    const digits = s.phone?.replace(/\D/g, "") ?? "";
    const message = reset
      ? `Hi ${s.fullName.split(" ")[0]}, here is your link to set a new password for the DTA student portal: ${url}`
      : `Hi ${s.fullName.split(" ")[0]}, welcome to the DTA student portal! Open this link to create your account: ${url}`;
    links.push({
      studentId: s.id,
      fullName: s.fullName,
      url,
      whatsappUrl: digits.length >= 7 ? `${whatsappChatUrl(digits)}?text=${encodeURIComponent(message)}` : null,
      reset,
    });
  }
  return links;
}

/** The student a valid, unexpired link belongs to, or null. */
export async function findStudentByActivationToken(token: string) {
  if (!token || token.length > 200) return null;
  const student = await prisma.student.findUnique({
    where: { activationTokenHash: hashInviteToken(token) },
    include: { program: { select: { name: true } }, cohort: { select: { name: true } }, user: { select: { email: true } } },
  });
  if (!student || !student.activationExpiresAt || student.activationExpiresAt < new Date()) return null;
  return student;
}
