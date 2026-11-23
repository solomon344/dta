import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { prisma } from "./db";

/** Staff roles; they reach the dashboard. */
export const ROLES = ["admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

/** Students sign in to the student portal only. */
export const STUDENT_ROLE = "student" as const;

export function isStaffRole(role: string | null | undefined): role is Role {
  return role === "admin" || role === "staff";
}

export const auth = betterAuth({
  appName: "DTA Portal",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Accounts are only created by an admin, a staff invitation or a student activation link.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    admin({
      roles: { admin: adminAc, staff: userAc, student: userAc },
      adminRoles: ["admin"],
      defaultRole: "staff",
    }),
    nextCookies(),
  ],
});
