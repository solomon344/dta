import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";

/** Staff-only export of certificates as JSON or CSV. Filters: ?cohort=<id>&program=<id>&status=ISSUED|REVOKED|VOIDED */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") === "csv" ? "csv" : "json";
  const status = sp.get("status");

  const certificates = await prisma.certificate.findMany({
    where: {
      ...(status === "ISSUED" || status === "REVOKED" || status === "VOIDED" ? { status } : {}),
      student: {
        ...(sp.get("cohort") ? { cohortId: sp.get("cohort")! } : {}),
        ...(sp.get("program") ? { programId: sp.get("program")! } : {}),
      },
    },
    include: { student: { include: { program: true, cohort: true } } },
    orderBy: { number: "asc" },
  });

  const rows = certificates.map((c) => ({
    number: c.number,
    name: c.student.fullName,
    email: c.student.email ?? "",
    program: c.student.program.name,
    cohort: c.student.cohort.name,
    issueDate: c.issueDate.toISOString().slice(0, 10),
    issueDateLabel: formatDate(c.issueDate),
    status: c.status,
  }));

  if (format === "json") return NextResponse.json({ count: rows.length, certificates: rows });

  const header = ["Certificate ID", "Name", "Email", "Program", "Cohort", "Issue Date", "Status"];
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [header, ...rows.map((r) => [r.number, r.name, r.email, r.program, r.cohort, r.issueDate, r.status])]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dta-certificates.csv"`,
    },
  });
}
