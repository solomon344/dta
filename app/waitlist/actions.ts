"use server";

import { z } from "zod";
import { fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { clientIpHash } from "@/lib/client-ip";
import { prisma } from "@/lib/db";

const MAX_PER_HOUR = 5;
const THANKS = "You're on the waitlist! We'll contact you when the next cohort opens.";

const waitlistSchema = z.object({
  fullName: z.string({ error: "Enter your full name." }).min(2, "Enter your full name.").max(120),
  phone: z
    .string({ error: "Enter your phone or WhatsApp number." })
    .max(30)
    .refine((v) => /^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, "").length >= 7, "Enter a valid phone number."),
  email: z.email("Enter a valid email.").optional(),
  programId: z.string().max(50).optional(),
  location: z.string().max(80).optional(),
  note: z.string().max(1000, "Please keep it under 1000 characters.").optional(),
  consent: z.literal("on", { error: "Please confirm we may contact you." }),
});

export async function joinWaitlistAction(_: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: hidden from people, so only bots fill it. Pretend it worked.
  if (formData.get("website")) return { ok: true, message: THANKS };

  const parsed = waitlistSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { fullName, phone, email, location, note } = parsed.data;
  const phoneDigits = phone.replace(/\D/g, "");

  const programId = parsed.data.programId
    ? ((await prisma.program.findUnique({ where: { id: parsed.data.programId }, select: { id: true } }))?.id ?? null)
    : null;

  // Same number already waiting: update their details instead of adding a duplicate.
  const existing = await prisma.waitlistEntry.findFirst({
    where: { phoneDigits, status: { in: ["NEW", "CONTACTED"] } },
    select: { id: true },
  });
  if (existing) {
    await prisma.waitlistEntry.update({
      where: { id: existing.id },
      data: { fullName, phone, email, location, note, programId, consentedAt: new Date() },
    });
    return { ok: true, message: "You're already on the waitlist. We've updated your details." };
  }

  const ipHash = await clientIpHash();
  if (ipHash) {
    const recent = await prisma.waitlistEntry.count({
      where: { ipHash, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_PER_HOUR) return { error: "Too many sign-ups from this connection. Please try again later." };
  }

  await prisma.waitlistEntry.create({
    data: { fullName, phone, phoneDigits, email, location, note, programId, ipHash, consentedAt: new Date() },
  });
  return { ok: true, message: THANKS };
}
