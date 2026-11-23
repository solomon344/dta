import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import StudentNav from "@/components/student/StudentNav";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { requireStudent } from "@/lib/session";
import { signOutAction } from "../(auth)/actions";

export const metadata: Metadata = {
  title: { default: "Student Portal", template: "%s | DTA Student Portal" },
  robots: { index: false, follow: false },
};

// Every page depends on the signed-in student, so navigations wait for the server.
export const instant = false;

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const { student } = await requireStudent();

  return (
    <EdgeStoreProvider>
      <div className="flex min-h-screen flex-1 flex-col bg-surface">
        <header className="border-b border-surface-variant bg-surface-container-lowest">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-space-sm px-4 sm:px-6">
            <Link href="/student" className="flex items-center gap-space-sm">
              <Image src="/assets/dta-mark.png" alt="DTA" width={790} height={300} className="h-8 w-auto mix-blend-multiply" />
              <span className="hidden text-label-tag uppercase tracking-widest text-secondary sm:inline">Student Portal</span>
            </Link>
            <div className="flex items-center gap-space-sm">
              <Avatar name={student.fullName} size="h-8 w-8" />
              <span className="hidden max-w-48 truncate text-label-lg text-primary-container sm:inline">{student.fullName}</span>
              <form action={signOutAction}>
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg px-space-xs py-1.5 text-label-md text-on-surface-variant hover:bg-surface-container">
                  <Icon name="logout" className="text-base" /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
          <StudentNav />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-space-lg sm:px-6 lg:py-space-xl">{children}</main>
        <footer className="border-t border-surface-variant py-space-md text-center text-body-sm text-on-surface-variant">
          <Link href="/" className="hover:text-secondary">dta.gm</Link> · Need help? <a href="mailto:info@dta.gm" className="text-secondary hover:underline">info@dta.gm</a>
        </footer>
      </div>
    </EdgeStoreProvider>
  );
}
