import { NextRequest, NextResponse } from "next/server";
import type { WaitlistStatus } from "@/generated/prisma/client";
import { auth, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATUSES: WaitlistStatus[] = ["NEW", "CONTACTED", "ENROLLED", "ARCHIVED"];

/** Staff-only CSV export of the waitlist. Filters: ?status=NEW|CONTACTED|ENROLLED|ARCHIVED&program=<id>|none */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !isStaffRole(session.user.role)) return NextResponse.json({ error: "Staff sign-in required" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status = STATUSES.find((s) => s === sp.get("status"));
  const program = sp.get("program");

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      ...(status && { status }),
      ...(program === "none" ? { programId: null } : program ? { programId: program } : {}),
    },
    include: { program: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const header = ["Name", "Phone", "Email", "Program", "Location", "Note", "Status", "Signed up"];
  const rows = entries.map((e) => [
    e.fullName,
    e.phone,
    e.email ?? "",
    e.program?.name ?? "Not sure yet",
    e.location ?? "",
    e.note ?? "",
    e.status,
    e.createdAt.toISOString().slice(0, 10),
  ]);
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dta-waitlist.csv"`,
    },
  });
}
