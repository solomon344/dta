import type { Metadata } from "next";
import { Suspense } from "react";
import Icon from "@/components/Icon";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VerifyPortal, { VerifyPortalFallback } from "@/components/VerifyPortal";
import { connection } from "next/server";
import { getCertificateViewByNumber } from "@/lib/certificates";
import { getPublicStats } from "@/lib/public-stats";
import { OPEN_GRAPH_BASE } from "@/lib/site";

const VERIFY_DESCRIPTION =
  "Verify the authenticity of a Data Technology Academy (DTA) certificate by its certificate ID or the graduate's name.";

export async function generateMetadata({ searchParams }: PageProps<"/verify">): Promise<Metadata> {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const base: Metadata = {
    title: "Verify a Certificate",
    description: VERIFY_DESCRIPTION,
    alternates: { canonical: "/verify" },
    openGraph: { ...OPEN_GRAPH_BASE, title: "Verify a DTA Certificate", description: VERIFY_DESCRIPTION, url: "/verify" },
    twitter: { title: "Verify a DTA Certificate", description: VERIFY_DESCRIPTION },
  };
  if (!query) return base;

  // Shared result links get a descriptive preview, but stay out of search indexes.
  const cert = await getCertificateViewByNumber(query);
  const noindex = { robots: { index: false, follow: true } };
  if (!cert) return { ...base, ...noindex };

  const valid = cert.status === "ISSUED";
  const title = `${valid ? "Verified" : "Revoked"}: ${cert.studentName} — ${cert.number}`;
  const description = valid
    ? `${cert.studentName} completed ${cert.programName} (${cert.cohortName}) at Data Technology Academy. Certificate ${cert.number}, issued ${cert.issueDateLabel}.`
    : `Certificate ${cert.number} issued by Data Technology Academy has been revoked.`;
  return {
    ...base,
    ...noindex,
    title,
    description,
    openGraph: { ...OPEN_GRAPH_BASE, title, description, url: `/verify?q=${encodeURIComponent(cert.number)}` },
    twitter: { title, description },
  };
}

export const instant = false;

export default async function VerifyPage() {
  await connection();
  const stats = await getPublicStats();
  const da = stats.byProgram.DA ?? 0;
  const sd = stats.byProgram.SD ?? 0;

  return (
    <>
      <SiteHeader active="verify" />
      <main className="w-full flex-1 pt-20">
        <Suspense fallback={<VerifyPortalFallback totalGraduates={stats.total} />}>
          <VerifyPortal totalGraduates={stats.total} />
        </Suspense>

        {/* Registry census */}
        <section id="registry-stats" className="w-full bg-surface-container-low py-space-2xl">
          <div className="mx-auto max-w-7xl space-y-space-xl px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
              <div className="space-y-space-2xs">
                <span className="text-label-tag uppercase tracking-widest text-secondary">Official Census &amp; Directory</span>
                <h2 className="font-display text-headline-xl-mobile text-primary-container md:text-headline-xl">
                  Graduation Metrics
                </h2>
                <p className="max-w-2xl text-body-md text-on-surface-variant">
                  DTA graduates complete a three-month, hands-on program in one of our
                  specialization tracks.
                </p>
              </div>
              <div className="inline-flex items-center gap-space-xs self-start rounded-lg bg-surface-container-lowest px-space-md py-space-xs shadow-sm md:self-auto">
                <Icon name="verified" className="text-base text-secondary" />
                <span className="text-label-lg font-bold text-primary-container">{stats.total} Certified Graduates</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
              <MetricCard
                eyebrow="Track Breakdown"
                icon="query_stats"
                iconClass="bg-secondary-fixed text-secondary"
                value={String(da)}
                valueClass="text-secondary"
                title="Data Analytics Graduates"
                body="Trained in Excel, statistics, Power BI dashboards and basic Python."
              />
              <MetricCard
                eyebrow="Track Breakdown"
                icon="code_blocks"
                iconClass="bg-primary-fixed text-primary-container"
                value={String(sd)}
                valueClass="text-primary-container"
                title="Software Developers"
                body="Trained in HTML, CSS, JavaScript and frontend development with API integration."
              />
              <MetricCard
                eyebrow="Program Length"
                icon="school"
                iconClass="bg-tertiary-fixed text-on-tertiary-container"
                value="3"
                valueClass="text-on-tertiary-container"
                title="Months of Intensive Learning"
                body="Each graduate completed a capstone project to earn their certificate."
              />
            </div>

            {/* How verification works */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-md lg:p-space-xl">
              <h3 className="mb-space-sm font-display text-headline-lg text-primary-container">How Verification Works</h3>
              <p className="mb-space-lg max-w-3xl text-body-md text-on-surface-variant">
                Every DTA certificate carries a unique Certificate ID. This portal checks that ID against
                the academy&apos;s official graduate registry.
              </p>
              <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
                <Step icon="badge" title="Find the Certificate ID" body="The ID (e.g. DTA2000) is printed at the bottom of every DTA certificate." />
                <Step icon="search" title="Search the Registry" body="Enter the ID or the graduate's full name above. Results come straight from DTA's records." />
                <Step icon="verified_user" title="Compare the Details" body="Confirm the name, track and issue date match the certificate you were given." />
              </div>
            </div>
          </div>
        </section>

        {/* Employer support */}
        <section className="mx-auto w-full max-w-7xl px-4 py-space-2xl sm:px-6 lg:px-12">
          <div className="relative overflow-hidden rounded-xl bg-primary-container p-space-lg text-on-primary-container shadow-2xl lg:p-space-2xl">
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-space-md">
              <h2 className="font-display text-headline-xl-mobile leading-tight text-surface-container-lowest md:text-headline-xl">
                Hiring Gambian Data Analysts &amp; Software Developers?
              </h2>
              <p className="text-body-xl leading-relaxed text-on-primary-container">
                Questions about a certificate, or interested in connecting with DTA graduates? Contact
                the academy directly.
              </p>
              <a
                href="mailto:admin@dta.gm"
                className="inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-lg py-3 text-label-lg text-on-secondary shadow-lg transition-all hover:bg-secondary-container"
              >
                Contact admin@dta.gm
                <Icon name="arrow_forward" className="text-base" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function MetricCard({ eyebrow, icon, iconClass, value, valueClass, title, body }: { eyebrow: string; icon: string; iconClass: string; value: string; valueClass: string; title: string; body: string }) {
  return (
    <div className="space-y-space-xs rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-label-tag uppercase tracking-wider text-on-surface-variant">{eyebrow}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon name={icon} className="text-lg" />
        </span>
      </div>
      <div className={`font-display text-headline-xl ${valueClass}`}>{value}</div>
      <div className="text-headline-sm text-primary-container">{title}</div>
      <p className="text-body-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

function Step({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="space-y-space-2xs rounded-lg bg-surface-container-low p-space-md">
      <div className="mb-space-2xs flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        <Icon name={icon} className="text-xl" />
      </div>
      <h4 className="text-headline-sm text-primary-container">{title}</h4>
      <p className="text-body-sm leading-relaxed text-on-surface-variant">{body}</p>
    </div>
  );
}
