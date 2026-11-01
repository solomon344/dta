import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { prisma } from "./db";

export const ROLES = ["admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const auth = betterAuth({
  appName: "DTA Staff Portal",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Accounts are only created by an admin or through an invitation.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    admin({
      roles: { admin: adminAc, staff: userAc },
      adminRoles: ["admin"],
      defaultRole: "staff",
    }),
    nextCookies(),
  ],
});
