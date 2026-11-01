import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyState, PageHeader, Table, btn, td, th } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  return (
    <>
      <PageHeader
        title="Programs"
        description="Each program defines the title, description and competencies printed on its certificates."
        actions={
          <Link href="/dashboard/programs/new" className={btn.primary}>
            <Icon name="add" className="text-base" /> New program
          </Link>
        }
      />
      {programs.length === 0 ? (
        <EmptyState icon="menu_book" title="No programs yet">Create a program before adding students.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <th className={th}>Program</th>
              <th className={th}>Certificate title</th>
              <th className={th}>Students</th>
              <th className={th} />
            </tr>
          }
        >
          {programs.map((p) => (
            <tr key={p.id}>
              <td className={td}>
                <div className="text-label-lg text-primary-container">{p.name}</div>
                <div className="font-mono text-label-md text-secondary">{p.code}</div>
              </td>
              <td className={`${td} max-w-md text-on-surface-variant`}>{p.certificateTitle}</td>
              <td className={td}>{p._count.students}</td>
              <td className={`${td} text-right`}>
                <Link href={`/dashboard/programs/${p.id}`} className={btn.ghost}>
                  <Icon name="edit" className="text-base" /> Edit
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
