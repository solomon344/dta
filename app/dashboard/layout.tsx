import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import { prisma } from "@/lib/db";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { requireUser } from "@/lib/session";
import { signOutAction } from "../(auth)/actions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | DTA Staff Portal" } };

// Every dashboard page depends on the signed-in user, so navigations wait for the server.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await prisma.staffProfile.findUnique({
    where: { userId: user.id },
    select: { photoUrl: true },
  });

  return (
    <EdgeStoreProvider>
      <div className="flex min-h-screen flex-1 flex-col bg-surface lg:flex-row">
        <Sidebar
          user={{ name: user.name, email: user.email, role: user.role, photoUrl: profile?.photoUrl ?? null }}
          signOut={signOutAction}
        />
        <main className="min-w-0 flex-1 px-4 py-space-lg sm:px-6 lg:px-10 lg:py-space-xl">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </EdgeStoreProvider>
  );
}
