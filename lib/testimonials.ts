import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "./db";
import { PUBLIC_REGISTRY_TAG } from "./public-cache";

export interface PublicTestimonial {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number | null;
  /** Program and cohort, only while the submitter's certificate is valid. */
  verified: { programName: string; cohortName: string } | null;
}

/**
 * Approved testimonials for the public pages, newest first. Like getPublicStats,
 * callers must await `connection()` first so this never runs at build time.
 */
export async function getPublicTestimonials(limit?: number): Promise<PublicTestimonial[]> {
  "use cache";
  cacheTag(PUBLIC_REGISTRY_TAG);
  cacheLife("minutes");

  const rows = await prisma.testimonial.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    take: limit,
    include: {
      certificate: {
        select: {
          status: true,
          student: { select: { program: { select: { name: true } }, cohort: { select: { name: true } } } },
        },
      },
    },
  });

  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    quote: t.quote,
    rating: t.rating,
    verified:
      t.certificate?.status === "ISSUED"
        ? { programName: t.certificate.student.program.name, cohortName: t.certificate.student.cohort.name }
        : null,
  }));
}
