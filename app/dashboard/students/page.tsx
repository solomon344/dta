import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import Icon from "@/components/Icon";
import { Badge, EmptyState, PageHeader, Pagination, Table, btn, inputClass, td, th } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone, studentTone } from "@/lib/labels";

export const metadata: Metadata = { title: "Students" };

const PAGE_SIZE = 25;
const STATUSES = ["ENROLLED", "GRADUATED", "WITHDRAWN"] as const;

export default async function StudentsPage({ searchParams }: PageProps<"/dashboard/students">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = get("q").trim();
  const cohort = get("cohort");
  const program = get("program");
  const status = STATUSES.find((s) => s === get("status"));
  const page = Math.max(1, Number(get("page")) || 1);

  const where: Prisma.StudentWhereInput = {
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { certificate: { number: { equals: q, mode: "insensitive" } } },
      ],
    }),
    ...(cohort && { cohortId: cohort }),
    ...(program && { programId: program }),
    ...(status && { status }),
  };

  const [students, total, cohorts, programs] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { program: true, cohort: true, certificate: { select: { id: true, number: true, status: true } } },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({ where }),
    prisma.cohort.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams({ ...(q && { q }), ...(cohort && { cohort }), ...(program && { program }), ...(status && { status }), page: String(p) });
    return `/dashboard/students?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} student${total === 1 ? "" : "s"}${q || cohort || program || status ? " match your filters" : ""}.`}
        actions={
          <Link href={`/dashboard/students/new${cohort ? `?cohort=${cohort}` : ""}`} className={btn.primary}>
            <Icon name="person_add" className="text-base" /> Add students
          </Link>
        }
      />

      <form className="mb-space-md grid grid-cols-1 gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm ring-1 ring-surface-variant md:grid-cols-12">
        <input name="q" defaultValue={q} placeholder="Search name, email or certificate ID" className={`${inputClass} md:col-span-4`} />
        <select name="cohort" defaultValue={cohort} className={`${inputClass} md:col-span-2`}>
          <option value="">All cohorts</option>
          {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="program" defaultValue={program} className={`${inputClass} md:col-span-3`}>
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className={`${inputClass} md:col-span-2`}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
        </select>
        <button type="submit" className={`${btn.dark} md:col-span-1`}>
          <Icon name="search" className="text-base" />
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState icon="group" title="No students found">Try different filters, or add students to a cohort.</EmptyState>
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Program</th>
                <th className={th}>Cohort</th>
                <th className={th}>Status</th>
                <th className={th}>Certificate</th>
              </tr>
            }
          >
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low">
                <td className={td}>
                  <Link href={`/dashboard/students/${s.id}`} className="text-label-lg text-primary-container hover:text-secondary">{s.fullName}</Link>
                  {s.email && <div className="text-body-sm text-on-surface-variant">{s.email}</div>}
                </td>
                <td className={td}>{s.program.name}</td>
                <td className={td}>{s.cohort.name}</td>
                <td className={td}><Badge tone={studentTone[s.status]}>{s.status.toLowerCase()}</Badge></td>
                <td className={td}>
                  {s.certificate ? (
                    <Link href={`/dashboard/certificates/${s.certificate.id}`} className="inline-flex items-center gap-1 font-mono text-label-md text-secondary hover:underline">
                      {s.certificate.number}
                      {s.certificate.status !== "ISSUED" && <Badge tone={certificateTone[s.certificate.status]}>{certificateLabel[s.certificate.status]}</Badge>}
                    </Link>
                  ) : (
                    <span className="text-outline">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} makeHref={makeHref} />
        </>
      )}
    </>
  );
}
