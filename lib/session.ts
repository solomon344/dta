import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, isStaffRole, STUDENT_ROLE, type Role } from "./auth";
import { prisma } from "./db";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
}

/** The signed-in session for this request, or null. Deduplicated per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in staff member, or null (also null for students). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) return null;
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role === "admin" ? "admin" : "staff",
  };
}

/** For pages and actions that need any signed-in staff member. Students are sent to their portal. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect((await getSession())?.user.role === STUDENT_ROLE ? "/student" : "/login");
  return user;
}

/** Where a signed-in account belongs. */
export function homeFor(role: string | null | undefined): "/dashboard" | "/student" {
  return role === STUDENT_ROLE ? "/student" : "/dashboard";
}

/**
 * The signed-in student and their record. For student portal pages and actions;
 * staff are sent to the dashboard and visitors to the sign-in page.
 */
export const requireStudent = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== STUDENT_ROLE) redirect("/dashboard");
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { program: true, cohort: true, certificate: true },
  });
  // The record was deleted or unlinked, so the account no longer belongs to anyone.
  if (!student) {
    await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
    redirect("/login");
  }
  return { user: session.user, student };
});

/** For admin-only pages. Server actions should check `user.role` and return an error instead. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
