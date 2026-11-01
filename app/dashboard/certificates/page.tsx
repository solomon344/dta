import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import Icon from "@/components/Icon";
import { Badge, EmptyState, PageHeader, Pagination, Table, btn, inputClass, td, th } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone } from "@/lib/labels";

export const metadata: Metadata = { title: "Certificates" };

const PAGE_SIZE = 25;

export default async function CertificatesPage({ searchParams }: PageProps<"/dashboard/certificates">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = get("q").trim();
  const cohort = get("cohort");
  const STATUSES = ["ISSUED", "REVOKED", "VOIDED"] as const;
  const status = STATUSES.find((s) => s === get("status"));
  const page = Math.max(1, Number(get("page")) || 1);

  const where: Prisma.CertificateWhereInput = {
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { student: { fullName: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(cohort && { student: { cohortId: cohort } }),
    ...(status && { status }),
  };

  const [certificates, total, cohorts] = await Promise.all([
    prisma.certificate.findMany({
      where,
      include: { student: { include: { program: true, cohort: true } } },
      orderBy: { number: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.certificate.count({ where }),
    prisma.cohort.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const filterParams = new URLSearchParams({ ...(cohort && { cohort }), ...(status && { status }) });
  const makeHref = (p: number) =>
    `/dashboard/certificates?${new URLSearchParams({ ...(q && { q }), ...(cohort && { cohort }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Certificates are issued from a cohort or a student's page. Admins can revoke or reinstate them here."
        actions={
          <a href={`/api/certificates/batch?format=csv&${filterParams}`} className={btn.secondary}>
            <Icon name="download" className="text-base" /> Export CSV
          </a>
        }
      />

      <form className="mb-space-md grid grid-cols-1 gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm ring-1 ring-surface-variant md:grid-cols-12">
        <input name="q" defaultValue={q} placeholder="Search certificate ID or name" className={`${inputClass} md:col-span-6`} />
        <select name="cohort" defaultValue={cohort} className={`${inputClass} md:col-span-3`}>
          <option value="">All cohorts</option>
          {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className={`${inputClass} md:col-span-2`}>
          <option value="">Any status</option>
          <option value="ISSUED">Issued</option>
          <option value="REVOKED">Revoked</option>
          <option value="VOIDED">Un-issued</option>
        </select>
        <button type="submit" className={`${btn.dark} md:col-span-1`}>
          <Icon name="search" className="text-base" />
        </button>
      </form>

      {certificates.length === 0 ? (
        <EmptyState icon="workspace_premium" title="No certificates found" />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Certificate ID</th>
                <th className={th}>Graduate</th>
                <th className={th}>Program</th>
                <th className={th}>Cohort</th>
                <th className={th}>Issued</th>
                <th className={th}>Status</th>
              </tr>
            }
          >
            {certificates.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container-low">
                <td className={td}>
                  <Link href={`/dashboard/certificates/${c.id}`} className="font-mono text-label-lg text-secondary hover:underline">{c.number}</Link>
                </td>
                <td className={td}>
                  <Link href={`/dashboard/students/${c.studentId}`} className="text-primary-container hover:text-secondary">{c.student.fullName}</Link>
                </td>
                <td className={td}>{c.student.program.name}</td>
                <td className={td}>{c.student.cohort.name}</td>
                <td className={`${td} text-on-surface-variant`}>{formatDate(c.issueDate)}</td>
                <td className={td}><Badge tone={certificateTone[c.status]}>{certificateLabel[c.status]}</Badge></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} makeHref={makeHref} />
        </>
      )}
    </>
  );
}
