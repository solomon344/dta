"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { fieldErrorsFrom, formObject, type ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";

const MAX_PER_HOUR = 5;
const THANKS = "Thank you! Our team will review your testimonial before it appears on the site.";

const testimonialSchema = z.object({
  name: z.string({ error: "Enter your full name." }).min(2, "Enter your full name.").max(120),
  email: z.email("Enter a valid email.").optional(),
  role: z.string().max(120, "Keep this under 120 characters.").optional(),
  quote: z
    .string({ error: "Tell us about your experience." })
    .min(20, "Please write at least 20 characters.")
    .max(1000, "Please keep it under 1000 characters."),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  certificateNumber: z.string().max(40).optional(),
  consent: z.literal("on", { error: "Please confirm we may publish your testimonial." }),
});

/** Salted so the stored value can't be turned back into an IP address. */
async function clientIpHash(): Promise<string | null> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.BETTER_AUTH_SECRET}:${ip}`).digest("hex");
}

export async function submitTestimonialAction(_: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: hidden from people, so only bots fill it. Pretend it worked.
  if (formData.get("website")) return { ok: true, message: THANKS };

  const parsed = testimonialSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { name, email, role, quote, rating, certificateNumber } = parsed.data;

  const ipHash = await clientIpHash();
  if (ipHash) {
    const recent = await prisma.testimonial.count({
      where: { ipHash, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_PER_HOUR) return { error: "Too many submissions. Please try again later." };
  }

  let certificateId: string | null = null;
  if (certificateNumber) {
    const certificate = await prisma.certificate.findFirst({
      where: { number: { equals: certificateNumber, mode: "insensitive" }, status: "ISSUED" },
      select: { id: true, student: { select: { fullName: true } } },
    });
    if (!certificate || certificate.student.fullName.toLowerCase() !== name.toLowerCase()) {
      return {
        error: "We couldn't match that certificate ID to your name.",
        fieldErrors: {
          certificateNumber: ["Check the ID, and enter your name exactly as on your certificate, or leave this blank."],
        },
      };
    }
    const existing = await prisma.testimonial.count({
      where: { certificateId: certificate.id, status: { not: "REJECTED" } },
    });
    if (existing > 0) return { error: "A testimonial has already been submitted for this certificate." };
    certificateId = certificate.id;
  }

  await prisma.testimonial.create({ data: { name, email, role, quote, rating, certificateId, ipHash, consentedAt: new Date() } });
  return { ok: true, message: THANKS };
}
