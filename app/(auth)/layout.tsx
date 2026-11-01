import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-b from-surface-container-lowest to-surface-container-low px-4 py-space-2xl">
      <Link href="/" className="mb-space-lg" aria-label="Data Technology Academy home">
        <Image src="/assets/dta-logo-full.png" alt="Data Technology Academy" width={870} height={520} priority className="h-28 w-auto" />
      </Link>
      <div className="w-full max-w-md rounded-2xl border-t-4 border-secondary bg-surface-container-lowest p-space-lg shadow-xl sm:p-space-xl">
        {children}
      </div>
      <p className="mt-space-lg text-body-sm text-on-surface-variant">
        Looking to verify a certificate?{" "}
        <Link href="/verify" className="text-secondary hover:underline">
          Go to the verification portal
        </Link>
      </p>
    </main>
  );
}
