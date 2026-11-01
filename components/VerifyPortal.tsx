"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CertificateView } from "@/lib/certificate-view";
import CredentialResult from "./CredentialResult";
import Icon from "./Icon";

type Match = { number: string; studentName: string; programName: string; cohortName: string };

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; certificate: CertificateView }
  | { kind: "matches"; matches: Match[] }
  | { kind: "error"; message: string };

export default function VerifyPortal({ totalGraduates }: { totalGraduates: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [input, setInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  const [result, setResult] = useState<{ query: string; status: Status } | null>(null);

  // Keep the search box in sync when the URL changes (back/forward, match links).
  if (query !== prevQuery) {
    setPrevQuery(query);
    setInput(query);
  }

  // The URL (?q=) is the source of truth, so verification links can be shared.
  const status: Status = !query
    ? { kind: "idle" }
    : result?.query === query
      ? result.status
      : { kind: "loading" };

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const settle = (next: Status) => setResult({ query, status: next });
    fetch(`/api/verify?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) settle({ kind: "error", message: data.error || "Certificate not found" });
        else if (data.matches) settle({ kind: "matches", matches: data.matches });
        else settle({ kind: "found", certificate: data.certificate });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        settle({ kind: "error", message: "Failed to verify certificate. Please try again." });
      });
    return () => controller.abort();
  }, [query]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    router.replace(`${pathname}?q=${encodeURIComponent(value)}`, { scroll: false });
  }

  const loading = status.kind === "loading";

  return (
    <>
      <SearchHero
        totalGraduates={totalGraduates}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Result */}
      <section className="mx-auto w-full max-w-7xl px-4 py-space-2xl sm:px-6 lg:px-12" aria-live="polite">
        {status.kind === "idle" && (
          <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-lg py-space-2xl text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
              <Icon name="search" className="text-3xl" />
            </div>
            <h2 className="font-display text-headline-lg text-primary-container">Look up a certificate</h2>
            <p className="max-w-md text-body-md text-on-surface-variant">
              Enter the Certificate ID printed on the certificate (for example <span className="font-mono">DTA2000</span>) or the graduate&apos;s full name.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-lg py-space-2xl text-center shadow-sm">
            <Icon name="progress_activity" className="animate-spin text-4xl text-secondary" />
            <p className="text-body-md text-on-surface-variant">Checking the DTA registry…</p>
          </div>
        )}

        {status.kind === "error" && (
          <div className="animate-fade-in flex flex-col items-center gap-space-sm rounded-xl border-t-4 border-error bg-surface-container-lowest px-space-lg py-space-2xl text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
              <Icon name="error" className="text-3xl" />
            </div>
            <h2 className="font-display text-headline-lg text-primary-container">No matching certificate</h2>
            <p className="max-w-md text-body-md text-on-surface-variant">{status.message}</p>
            <p className="text-body-sm text-outline">
              Check the ID for typos, or contact <a className="text-secondary hover:underline" href="mailto:admin@dta.gm">admin@dta.gm</a>.
            </p>
          </div>
        )}

        {status.kind === "matches" && (
          <div className="animate-fade-in rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <h2 className="font-display text-headline-lg text-primary-container">Several graduates match</h2>
            <p className="mb-space-md text-body-md text-on-surface-variant">Choose the certificate you want to verify.</p>
            <ul className="divide-y divide-surface-variant">
              {status.matches.map((m) => (
                <li key={m.number}>
                  <Link
                    href={`${pathname}?q=${encodeURIComponent(m.number)}`}
                    replace
                    scroll={false}
                    className="flex items-center justify-between gap-space-sm py-space-sm hover:text-secondary"
                  >
                    <span>
                      <span className="block text-label-lg text-primary-container">{m.studentName}</span>
                      <span className="text-body-sm text-on-surface-variant">{m.programName} · {m.cohortName}</span>
                    </span>
                    <span className="flex items-center gap-space-xs font-mono text-label-md text-secondary">
                      {m.number} <Icon name="arrow_forward" className="text-base" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {status.kind === "found" && status.certificate.status === "REVOKED" && (
          <div className="animate-fade-in flex flex-col items-center gap-space-sm rounded-xl border-t-4 border-error bg-surface-container-lowest px-space-lg py-space-2xl text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
              <Icon name="block" className="text-3xl" />
            </div>
            <div className="text-label-tag uppercase tracking-widest text-error">Registry Status: Revoked</div>
            <h2 className="font-display text-headline-lg text-primary-container">This certificate has been revoked</h2>
            <p className="max-w-md text-body-md text-on-surface-variant">
              Certificate <span className="font-mono">{status.certificate.number}</span> issued to {status.certificate.studentName} is no
              longer valid.{status.certificate.revokeReason ? ` Reason: ${status.certificate.revokeReason}` : ""}
            </p>
            <p className="text-body-sm text-outline">
              Questions? Contact <a className="text-secondary hover:underline" href="mailto:admin@dta.gm">admin@dta.gm</a>.
            </p>
          </div>
        )}

        {status.kind === "found" && status.certificate.status === "ISSUED" && (
          <>
            <div className="mb-space-lg flex flex-col justify-between gap-space-md md:flex-row md:items-end">
              <div>
                <div className="text-label-tag uppercase tracking-widest text-on-tertiary-container">Registry Status: Valid</div>
                <h2 className="font-display text-headline-lg text-primary-container">Verified Credential</h2>
              </div>
            </div>
            <CredentialResult key={status.certificate.number} certificate={status.certificate} />
          </>
        )}
      </section>
    </>
  );
}

interface SearchHeroProps {
  totalGraduates: number;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}

function SearchHero({ totalGraduates, input, onInputChange, onSubmit, loading }: SearchHeroProps) {
  return (
      <section className="relative w-full overflow-hidden bg-primary-container py-space-xl text-on-primary-container">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary-container/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-tertiary-fixed-dim/5 blur-2xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col justify-between gap-space-lg pb-space-lg lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-space-sm">
              <div className="inline-flex items-center gap-space-xs rounded-full bg-white/10 px-space-sm py-space-2xs backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-fixed-dim" />
                <span className="text-label-tag uppercase tracking-widest text-tertiary-fixed">
                  Official DTA Registry • The Gambia
                </span>
              </div>
              <h1 className="font-display text-headline-xl-mobile tracking-tight text-surface-container-lowest md:text-headline-xl">
                Official Credential Verification Portal
              </h1>
              <p className="text-body-xl leading-relaxed text-on-primary-container">
                Verify the authenticity of certificates issued to graduates of Data Technology Academy.
              </p>
            </div>
            <div className="flex items-center gap-space-md rounded-xl bg-white/5 p-space-md backdrop-blur-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20 text-secondary-fixed">
                <Icon name="verified_user" className="text-3xl" />
              </div>
              <div>
                <div className="text-label-tag uppercase tracking-wider text-tertiary-fixed">DTA Registry</div>
                <div className="text-headline-sm text-surface-container-lowest">{totalGraduates} Certified Graduates</div>
              </div>
            </div>
          </div>

          <div className="mt-space-md rounded-xl bg-surface-container-lowest p-space-lg text-on-surface shadow-2xl lg:p-space-xl">
            <form onSubmit={onSubmit} className="grid grid-cols-1 items-end gap-space-md md:grid-cols-12">
              <div className="space-y-space-2xs md:col-span-9">
                <label htmlFor="certId" className="block text-label-md uppercase tracking-wider text-on-surface-variant">
                  Certificate ID or Graduate Full Name
                </label>
                <div className="relative">
                  <Icon name="badge" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                  <input
                    id="certId"
                    type="text"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    placeholder="e.g. DTA2000 or 'Abba Tamba'"
                    className="w-full rounded-lg bg-surface-container-low py-3 pl-10 pr-4 text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-md py-3 text-label-lg text-on-secondary shadow-lg shadow-secondary/30 transition-all hover:bg-secondary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name={loading ? "progress_activity" : "search"} className={`text-lg ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Verifying…" : "Verify Credential"}
                </button>
              </div>
            </form>
            <div className="mt-space-md flex flex-col justify-between gap-space-sm rounded-lg bg-surface-container-low px-space-md py-space-xs text-body-sm text-on-surface-variant sm:flex-row sm:items-center">
              <div className="flex items-center gap-space-xs">
                <Icon name="lock" className="text-base text-secondary" />
                <span>Every DTA certificate is listed in the official DTA registry under a unique ID.</span>
              </div>
              <a href="#registry-stats" className="inline-flex items-center gap-space-2xs text-label-md text-secondary hover:underline">
                View Registry Census
                <Icon name="arrow_forward" className="text-xs" />
              </a>
            </div>
          </div>
        </div>
      </section>
  );
}

// Shown while the URL query is read on the client (prerendered shell).
export function VerifyPortalFallback({ totalGraduates }: { totalGraduates: number }) {
  return (
    <SearchHero
      totalGraduates={totalGraduates}
      input=""
      onInputChange={() => {}}
      onSubmit={(e) => e.preventDefault()}
      loading={false}
    />
  );
}
