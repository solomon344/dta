import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import type { CertificateView } from "./certificate-view";

export const certificateInclude = {
  student: {
    include: {
      program: true,
      cohort: {
        include: {
          signatories: {
            orderBy: { sortOrder: "asc" },
            include: { staffProfile: { include: { user: { select: { name: true } } } } },
          },
        },
      },
    },
  },
} satisfies Prisma.CertificateInclude;

type CertificateWithRelations = Prisma.CertificateGetPayload<{ include: typeof certificateInclude }>;

const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export function formatDate(date: Date): string {
  return dateLabel.format(date);
}

export function toCertificateView(cert: CertificateWithRelations): CertificateView {
  const { student } = cert;
  return {
    number: cert.number,
    status: cert.status,
    revokeReason: cert.revokeReason,
    studentName: student.fullName,
    programName: student.program.name,
    programCode: student.program.code,
    title: student.program.certificateTitle,
    detail: student.program.certificateDetail,
    competencies: student.program.competencies,
    cohortName: student.cohort.name,
    issueDate: cert.issueDate.toISOString().slice(0, 10),
    issueDateLabel: formatDate(cert.issueDate),
    signatories: student.cohort.signatories.map((s) => ({
      name: s.staffProfile.user.name,
      title: s.title,
      signatureUrl: s.staffProfile.signatureUrl,
    })),
  };
}

/** A certificate by its public ID. Un-issued (voided) certificates are treated as nonexistent unless asked for. */
export async function getCertificateViewByNumber(
  number: string,
  { includeVoided = false }: { includeVoided?: boolean } = {}
): Promise<CertificateView | null> {
  const cert = await prisma.certificate.findFirst({
    where: {
      number: { equals: number.trim(), mode: "insensitive" },
      ...(includeVoided ? {} : { status: { not: "VOIDED" } }),
    },
    include: certificateInclude,
  });
  return cert ? toCertificateView(cert) : null;
}

export interface CertificateMatch {
  number: string;
  studentName: string;
  programName: string;
  cohortName: string;
}

export type CertificateSearchResult =
  | { kind: "found"; certificate: CertificateView }
  | { kind: "matches"; matches: CertificateMatch[] }
  | { kind: "none" };

/** Public lookup: an exact certificate ID, or a graduate name (3+ characters). */
export async function searchCertificates(query: string): Promise<CertificateSearchResult> {
  const q = query.trim();
  if (!q) return { kind: "none" };

  const byNumber = await getCertificateViewByNumber(q);
  if (byNumber) return { kind: "found", certificate: byNumber };
  if (q.length < 3) return { kind: "none" };

  const certs = await prisma.certificate.findMany({
    where: { status: { not: "VOIDED" }, student: { fullName: { contains: q, mode: "insensitive" } } },
    include: certificateInclude,
    orderBy: { student: { fullName: "asc" } },
    take: 10,
  });

  if (certs.length === 0) return { kind: "none" };
  const exact = certs.filter((c) => c.student.fullName.toLowerCase() === q.toLowerCase());
  if (certs.length === 1 || exact.length === 1) {
    return { kind: "found", certificate: toCertificateView(exact[0] ?? certs[0]) };
  }
  return {
    kind: "matches",
    matches: certs.map((c) => ({
      number: c.number,
      studentName: c.student.fullName,
      programName: c.student.program.name,
      cohortName: c.student.cohort.name,
    })),
  };
}

/** Next sequential "DTA####" ID. Un-issued certificates keep their IDs, so numbers are never reused. */
export async function nextCertificateNumber(tx: Prisma.TransactionClient = prisma): Promise<string> {
  const rows = await tx.certificate.findMany({
    where: { number: { startsWith: "DTA" } },
    select: { number: true },
  });
  const max = rows.reduce((acc, { number }) => {
    const n = /^DTA(\d+)$/.exec(number);
    return n ? Math.max(acc, Number(n[1])) : acc;
  }, 1999);
  return `DTA${max + 1}`;
}

/**
 * Issues certificates for the given students inside a single transaction.
 * Students whose certificate was un-issued get it back with its original ID;
 * students without one get the next sequential IDs. Already-issued and revoked
 * certificates are left alone. Returns how many certificates were issued.
 */
export async function issueCertificates(
  studentIds: string[],
  issueDate: Date,
  issuedById: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const eligible = await tx.student.findMany({
      where: {
        id: { in: studentIds },
        OR: [{ certificate: null }, { certificate: { status: "VOIDED" } }],
      },
      select: { id: true, certificate: { select: { id: true } } },
      orderBy: { fullName: "asc" },
    });
    if (eligible.length === 0) return 0;

    let next = Number((await nextCertificateNumber(tx)).slice(3));
    for (const student of eligible) {
      if (student.certificate) {
        await tx.certificate.update({
          where: { id: student.certificate.id },
          data: { status: "ISSUED", voidedAt: null, issueDate, issuedById },
        });
      } else {
        await tx.certificate.create({
          data: { number: `DTA${next++}`, studentId: student.id, issueDate, issuedById },
        });
      }
      await tx.student.update({ where: { id: student.id }, data: { status: "GRADUATED" } });
    }
    return eligible.length;
  });
}

/**
 * Un-issues the given students' certificates: they disappear from the public
 * verification page but keep their IDs for a possible re-issue. Students are
 * set to `studentStatus` (ENROLLED by default). Returns how many were un-issued.
 */
export async function unissueCertificates(
  studentIds: string[],
  studentStatus: "ENROLLED" | "WITHDRAWN" = "ENROLLED"
): Promise<number> {
  if (studentIds.length === 0) return 0;
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.certificate.updateMany({
      where: { studentId: { in: studentIds }, status: "ISSUED" },
      data: { status: "VOIDED", voidedAt: new Date() },
    });
    await tx.student.updateMany({
      where: { id: { in: studentIds }, status: { not: "WITHDRAWN" } },
      data: { status: studentStatus },
    });
    return count;
  });
}

/** The most recent issue date used in a cohort (yyyy-mm-dd), for defaulting re-issue forms. */
export async function latestCohortIssueDate(cohortId: string): Promise<string | null> {
  const cert = await prisma.certificate.findFirst({
    where: { student: { cohortId } },
    orderBy: { issueDate: "desc" },
    select: { issueDate: true },
  });
  return cert ? cert.issueDate.toISOString().slice(0, 10) : null;
}
