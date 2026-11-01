import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { formatDate } from "./certificates";
import { prisma } from "./db";
import { PUBLIC_REGISTRY_TAG } from "./public-cache";

export interface PublicStats {
  /** Holders of a valid (issued) certificate. */
  total: number;
  /** Valid certificates per program code, e.g. { DA: 56, SD: 13 }. */
  byProgram: Record<string, number>;
  latestCohort: { name: string; issueDateLabel: string | null } | null;
}

/**
 * Registry numbers shown on the public pages. Cached and invalidated with
 * PUBLIC_REGISTRY_TAG; callers must await `connection()` first so this never
 * runs at build time (the database isn't reachable during `docker build`).
 */
export async function getPublicStats(): Promise<PublicStats> {
  "use cache";
  cacheTag(PUBLIC_REGISTRY_TAG);
  // Dashboard edits invalidate the tag right away; this bounds staleness for direct DB changes (e.g. seeding).
  cacheLife("minutes");

  const [perProgram, programs, latest] = await Promise.all([
    prisma.student.groupBy({
      by: ["programId"],
      where: { certificate: { status: "ISSUED" } },
      _count: true,
    }),
    prisma.program.findMany({ select: { id: true, code: true } }),
    prisma.certificate.findFirst({
      where: { status: "ISSUED" },
      orderBy: { issueDate: "desc" },
      select: { issueDate: true, student: { select: { cohort: { select: { name: true } } } } },
    }),
  ]);

  const codeById = new Map(programs.map((p) => [p.id, p.code]));
  const byProgram: Record<string, number> = {};
  for (const row of perProgram) byProgram[codeById.get(row.programId) ?? row.programId] = row._count;

  return {
    total: perProgram.reduce((sum, r) => sum + r._count, 0),
    byProgram,
    latestCohort: latest
      ? { name: latest.student.cohort.name, issueDateLabel: formatDate(latest.issueDate) }
      : null,
  };
}
