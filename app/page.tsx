import Link from "next/link";
import Icon from "@/components/Icon";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connection } from "next/server";
import { getPublicStats, type PublicStats } from "@/lib/public-stats";

// Registry numbers are read from the database at request time (cached; see lib/public-stats.ts).
export const instant = false;

const buildTracks = (stats: PublicStats) => [
  {
    key: "da",
    count: stats.byProgram.DA ?? 0,
    icon: "query_stats",
    iconClass: "bg-secondary text-on-secondary",
    badgeClass: "bg-secondary-fixed text-on-secondary-fixed",
    label: "Track A",
    title: "Data Analytics",
    certificateTitle: "Data Analytics Fundamentals with Excel, Power BI and Basic Python",
    summary:
      "Learn to extract insights from data: cleaning and modelling in Excel, applying statistics, building Power BI dashboards and getting started with Python.",
    stack: ["Microsoft Excel", "Power BI", "Statistics", "Basic Python", "Data Visualization"],
    modules: [
      "Spreadsheet modelling & data cleaning in Excel",
      "Descriptive statistics for real-world data",
      "Interactive dashboards with Power BI",
      "Python basics for data analysis",
    ],
    capstone: "Analyze a real-world dataset and present the findings in a dashboard.",
  },
  {
    key: "sd",
    count: stats.byProgram.SD ?? 0,
    icon: "code_blocks",
    iconClass: "bg-primary-container text-secondary-fixed",
    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    label: "Track B",
    title: "Software Development",
    certificateTitle: "Software Development Fundamentals in Web Frontend and APIs",
    summary:
      "Master the fundamentals of building for the web: semantic HTML, modern CSS, JavaScript and the DOM, and integrating with real APIs.",
    stack: ["HTML", "CSS", "JavaScript", "DOM", "REST APIs"],
    modules: [
      "Semantic HTML & responsive CSS",
      "JavaScript fundamentals & DOM manipulation",
      "Working with APIs & asynchronous JavaScript",
      "Software development principles & best practices",
    ],
    capstone: "Build a frontend application in HTML, CSS and JavaScript with API integration.",
  },
];

export default async function Home() {
  await connection();
  const stats = await getPublicStats();
  const tracks = buildTracks(stats);
  const da = stats.byProgram.DA ?? 0;
  const sd = stats.byProgram.SD ?? 0;
  const cohortName = stats.latestCohort?.name ?? "Latest cohort";
  const issueDate = stats.latestCohort?.issueDateLabel;

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 pt-20">
        {/* Top ambient banner */}
        <div className="w-full bg-primary-container text-on-primary">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-space-sm px-4 py-space-xs text-center sm:px-6 md:justify-between md:text-left lg:px-12">
            <div className="flex flex-wrap items-center justify-center gap-space-xs">
              <span className="inline-flex items-center rounded-full bg-secondary px-space-xs py-0.5 text-label-tag uppercase tracking-wider text-on-secondary">
                {cohortName} Completed
              </span>
              <span className="text-body-sm text-secondary-fixed">
                {stats.total} graduates certified{issueDate ? ` on ${issueDate}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-space-md text-label-tag uppercase tracking-widest text-surface-container-high">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-fixed-dim" /> Software Development
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-fixed-dim" /> Data Analytics
              </span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-lowest via-surface to-surface-container-low pb-space-2xl pt-space-xl">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <svg className="h-full w-full" fill="none" viewBox="0 0 1200 800" preserveAspectRatio="xMaxYMin slice">
              <circle className="text-secondary-fixed-dim" cx="1100" cy="120" r="340" stroke="currentColor" strokeDasharray="6 6" strokeWidth="1.5" />
              <circle className="text-secondary" cx="1100" cy="120" opacity="0.3" r="220" stroke="currentColor" strokeWidth="1" />
              <path className="text-secondary-container" d="M780,200 L940,320 L1080,240 L1020,440 L860,400 Z" opacity="0.4" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
              <circle className="text-secondary" cx="780" cy="200" fill="currentColor" r="4" />
              <circle className="text-tertiary-fixed-dim" cx="940" cy="320" fill="currentColor" r="5" />
              <circle className="text-secondary" cx="1080" cy="240" fill="currentColor" r="4" />
              <circle className="text-secondary" cx="1020" cy="440" fill="currentColor" r="5" />
              <circle className="text-tertiary-fixed-dim" cx="860" cy="400" fill="currentColor" r="4" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
            <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-space-2xs shadow-sm">
              <Icon name="flag" className="text-base text-secondary" />
              <span className="text-label-tag uppercase tracking-wider text-on-tertiary-container">
                Empowering the next generation of Gambian tech talent
              </span>
            </div>

            <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
              <div className="space-y-space-md lg:col-span-7">
                <h1 className="font-display text-display-hero-mobile leading-[1.08] tracking-tight text-primary-container md:text-display-hero">
                  Equipping Young Gambians with <span className="italic text-secondary">World-Class</span> Data &amp; Software Skills.
                </h1>
                <p className="max-w-2xl text-body-xl leading-relaxed text-on-surface-variant">
                  Data Technology Academy is dedicated to bridging the digital skills gap in The Gambia.
                  We provide hands-on education in Software Development and Data Analytics, preparing
                  students for careers in the global tech industry.
                </p>

                <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                  <a
                    href="#tracks"
                    className="inline-flex items-center gap-space-xs rounded-lg bg-primary-container px-space-lg py-space-sm text-label-lg text-on-primary shadow-md transition-all hover:bg-secondary"
                  >
                    Explore Tracks &amp; Curriculum
                    <Icon name="arrow_forward" className="text-base" />
                  </a>
                  <Link
                    href="/verify"
                    className="inline-flex items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-lg py-space-sm text-label-lg text-primary-container shadow-sm transition-all hover:bg-surface-container-high"
                  >
                    <Icon name="verified" className="text-base text-secondary" />
                    Verify Certificates
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-space-md pt-space-xs text-label-md text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="terminal" className="text-sm text-secondary" /> Hands-on projects</span>
                  <span className="flex items-center gap-1"><Icon name="workspace_premium" className="text-sm text-secondary" /> Verifiable certificate IDs</span>
                  <span className="flex items-center gap-1"><Icon name="school" className="text-sm text-secondary" /> Capstone-assessed</span>
                </div>
              </div>

              {/* Terminal card */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl bg-primary-container p-space-md text-on-primary shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-space-md">
                    <div className="flex items-center gap-space-xs">
                      <span className="h-3 w-3 rounded-full bg-error" />
                      <span className="h-3 w-3 rounded-full bg-tertiary-fixed-dim" />
                      <span className="h-3 w-3 rounded-full bg-secondary-fixed" />
                      <span className="ml-space-xs text-label-tag uppercase tracking-wider text-surface-container-high">
                        dta // cohort_02
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-secondary/30 px-space-xs py-0.5 text-label-tag text-secondary-fixed">
                      CERTIFIED
                    </span>
                  </div>

                  <div className="space-y-space-sm py-space-md">
                    {tracks.map((track) => (
                      <div key={track.key} className="rounded-lg bg-white/5 p-space-sm">
                        <div className="flex items-center justify-between text-label-tag text-surface-container-high">
                          <span className="uppercase">{track.title}</span>
                          <span className="font-bold text-secondary-fixed">{track.count} graduates</span>
                        </div>
                        <div className="mt-space-xs h-2 w-full overflow-hidden rounded-full bg-white/15">
                          <div
                            className="h-full rounded-full bg-secondary-fixed"
                            style={{ width: `${Math.round((track.count / Math.max(stats.total, 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 rounded-lg bg-white/10 p-space-sm font-mono text-body-sm text-surface-container-high">
                    <div className="font-bold text-secondary-fixed-dim">SELECT track, COUNT(*) AS graduates</div>
                    <div className="pl-4 text-surface-container-highest">FROM dta.cohort_02</div>
                    <div className="pl-4 text-surface-container-highest">GROUP BY track;</div>
                    <div className="flex items-center gap-1 pt-1 text-label-tag text-tertiary-fixed-dim">
                      <Icon name="check_circle" className="text-sm" /> {stats.total} graduates certified
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-space-2xl grid grid-cols-2 gap-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-xl lg:grid-cols-4">
              <Stat value={String(stats.total)} unit="Certified" label="Certified Graduates" note="Graduated with verifiable digital certificates" />
              <Stat value={`${da} & ${sd}`} label="Specialist Split" note={`${da} Data Analysts & ${sd} Software Developers`} alt />
              <Stat value="3" unit="Months" label="Intensive Program" note="Hands-on learning with a capstone project" />
              <Stat value="2" unit="Tracks" label="Specializations" note="Software Development and Data Analytics" alt />
            </div>
          </div>
        </section>

        {/* Mission & vision */}
        <section id="mission" className="w-full bg-surface-container-low py-space-2xl">
          <div className="mx-auto max-w-7xl space-y-space-xl px-4 sm:px-6 lg:px-12">
            <div className="max-w-3xl space-y-space-xs">
              <span className="text-label-tag uppercase tracking-widest text-secondary">Rooted in The Gambia</span>
              <h2 className="font-display text-headline-xl-mobile text-primary-container md:text-headline-xl">
                Building the bridge between raw talent and global tech careers.
              </h2>
              <p className="text-body-xl leading-relaxed text-on-surface-variant">
                The Gambia&apos;s youth are our greatest resource. We give them the practical skills,
                projects and credentials to compete for opportunities at home and abroad.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
              <InfoCard
                icon="flag"
                iconClass="bg-primary-container text-secondary-fixed"
                title="Our Mission"
                body="Bridge the digital skills gap in The Gambia by delivering world-class education in Software Development and Data Analytics."
                footerIcon="check_circle"
                footer="Practical, project-based learning"
              />
              <InfoCard
                icon="visibility"
                iconClass="bg-secondary text-on-secondary"
                title="Our Vision"
                body="A Gambia where young software developers and data analysts solve local problems and deliver digital services to the world."
                footerIcon="trending_up"
                footer="Local talent, global standard"
              />
              <div className="flex flex-col justify-between space-y-space-md rounded-xl bg-primary-container p-space-lg text-on-primary shadow-md">
                <div className="space-y-space-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 text-tertiary-fixed-dim">
                    <Icon name="volunteer_activism" className="text-2xl" />
                  </div>
                  <h3 className="text-headline-md text-surface-container-lowest">Industry Best Practices</h3>
                  <p className="text-body-md leading-relaxed text-surface-container-high">
                    Students learn the way professionals work: real tools, real datasets, code
                    reviews and a capstone project that demonstrates what they can do.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs pt-space-xs text-label-md font-bold text-tertiary-fixed-dim">
                  <Icon name="groups" className="text-base" />
                  Career-ready graduates
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Graduate impact */}
        <section id="cohort-impact" className="w-full bg-surface py-space-2xl">
          <div className="mx-auto max-w-7xl space-y-space-xl px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
              <div className="max-w-2xl space-y-space-2xs">
                <span className="text-label-tag uppercase tracking-widest text-on-tertiary-container">Proven Cohort Impact</span>
                <h2 className="font-display text-headline-xl-mobile text-primary-container md:text-headline-xl">
                  Our Graduates &amp; Outcomes.
                </h2>
                <p className="text-body-xl text-on-surface-variant">
                  {stats.total} graduates completed the three-month program and a capstone project in
                  one of our two specialization tracks.
                </p>
              </div>
              <Link
                href="/verify"
                className="inline-flex items-center gap-space-xs self-start rounded-lg bg-surface-container px-space-md py-space-xs text-label-lg text-primary-container transition-all hover:bg-surface-container-highest md:self-auto"
              >
                Search Certified Roster
                <Icon name="search" className="text-base" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
              {tracks.map((track) => (
                <div key={track.key} className="flex flex-col justify-between space-y-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm sm:p-space-xl">
                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-space-sm py-1 text-label-tag uppercase ${track.badgeClass}`}>
                        {track.count} Certified Graduates
                      </span>
                      <span className="text-label-tag uppercase text-on-surface-variant">{track.label}</span>
                    </div>
                    <h3 className="font-display text-headline-lg text-primary-container">{track.title}</h3>
                    <p className="text-body-md text-on-surface-variant">{track.summary}</p>
                    <div className="flex flex-wrap gap-space-xs pt-space-xs">
                      {track.stack.map((item) => (
                        <span key={item} className="rounded-full bg-surface-container px-space-sm py-1 text-label-tag text-on-surface-variant">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-space-xs rounded-xl bg-surface-container-low p-space-md">
                    <div className="flex items-center gap-space-xs text-label-tag uppercase text-secondary">
                      <Icon name="workspace_premium" className="text-sm" />
                      Certificate awarded
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{track.certificateTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tracks */}
        <section id="tracks" className="w-full bg-surface-container-lowest py-space-2xl">
          <div className="mx-auto max-w-7xl space-y-space-xl px-4 sm:px-6 lg:px-12">
            <div className="mx-auto max-w-3xl space-y-space-xs text-center">
              <span className="text-label-tag uppercase tracking-widest text-secondary">Curriculum &amp; Tracks</span>
              <h2 className="font-display text-headline-xl-mobile text-primary-container md:text-headline-xl">
                Two Immersive Specialization Pathways.
              </h2>
              <p className="text-body-xl text-on-surface-variant">
                Each track is a three-month, hands-on program that ends with a capstone project and a
                verifiable DTA certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-space-xl md:grid-cols-2">
              {tracks.map((track) => (
                <div key={track.key} className="flex flex-col justify-between space-y-space-lg rounded-2xl bg-surface-container-low p-space-lg shadow-sm transition-transform hover:-translate-y-1 sm:p-space-xl">
                  <div className="space-y-space-md">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl shadow-md ${track.iconClass}`}>
                        <Icon name={track.icon} className="text-3xl" />
                      </div>
                      <span className="rounded-full bg-surface-container-high px-space-md py-1 text-label-tag uppercase text-primary-container">
                        3-Month Program
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-headline-lg text-primary-container">{track.title}</h3>
                      <p className="pt-space-xs text-body-md text-on-surface-variant">{track.summary}</p>
                    </div>
                    <ul className="space-y-space-xs pt-space-xs">
                      {track.modules.map((module, i) => (
                        <li key={module} className="flex items-start gap-space-xs text-body-sm text-on-surface">
                          <Icon name="check_circle" className="text-base text-secondary" />
                          <span><strong>Module {i + 1}:</strong> {module}</span>
                        </li>
                      ))}
                      <li className="flex items-start gap-space-xs text-body-sm text-on-surface">
                        <Icon name="check_circle" className="text-base text-secondary" />
                        <span><strong>Capstone:</strong> {track.capstone}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verification portal teaser */}
        <section id="verification-portal" className="w-full bg-surface-container-low py-space-2xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
            <div className="space-y-space-lg rounded-2xl border-t-4 border-secondary bg-surface-container-lowest p-space-lg shadow-lg sm:p-space-xl">
              <div className="flex flex-col justify-between gap-space-md border-b border-surface-variant pb-space-sm md:flex-row md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="verified_user" className="text-secondary" />
                    <span className="text-label-tag uppercase tracking-widest text-secondary">Official Credential Registry</span>
                  </div>
                  <h3 className="font-display text-headline-lg text-primary-container">Verify Graduate Credentials</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Employers and institutions can validate the authenticity of any DTA Certificate ID.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start rounded-lg bg-surface-container-low px-space-md py-space-xs font-mono text-label-tag text-on-surface md:self-auto">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-container" />
                  REGISTRY LIVE: COHORT 2
                </div>
              </div>

              <form action="/verify" method="get" className="max-w-2xl space-y-space-xs">
                <label htmlFor="home-cert-input" className="block text-label-md uppercase tracking-wider text-on-surface-variant">
                  Enter Certificate ID or Graduate Full Name
                </label>
                <div className="flex flex-col gap-space-xs sm:flex-row">
                  <input
                    id="home-cert-input"
                    name="q"
                    type="text"
                    required
                    placeholder="e.g. DTA2000 or 'Abba Tamba'"
                    className="flex-1 rounded-lg border border-outline-variant bg-surface px-space-md py-space-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-lg py-space-sm text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary-container"
                  >
                    <Icon name="search" className="text-base" />
                    Verify Credential
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-primary-container py-space-2xl text-on-primary">
          <div className="mx-auto max-w-3xl space-y-space-md px-4 text-center sm:px-6">
            <h2 className="font-display text-headline-xl-mobile text-surface-container-lowest md:text-headline-xl">
              Be Part of The Gambia&apos;s Next Generation of Data &amp; Tech Leaders.
            </h2>
            <p className="text-body-xl leading-relaxed text-surface-container-high">
              Interested in a future cohort, or want to hire or mentor our graduates? Get in touch with
              the academy.
            </p>
            <div className="grid grid-cols-1 gap-space-md pt-space-md text-left sm:grid-cols-2">
              <div className="space-y-space-sm rounded-xl bg-white/10 p-space-lg backdrop-blur-md">
                <Icon name="school" className="text-3xl text-secondary-fixed" />
                <h3 className="text-headline-sm text-surface-container-lowest">Have a Certificate?</h3>
                <p className="text-body-sm text-surface-container-high">
                  Confirm a DTA certificate instantly using its ID or the graduate&apos;s name.
                </p>
                <Link href="/verify" className="inline-flex items-center gap-space-xs pt-space-2xs text-label-lg font-bold text-secondary-fixed hover:text-surface-container-lowest">
                  Verify Now <Icon name="arrow_forward" className="text-base" />
                </Link>
              </div>
              <div className="space-y-space-sm rounded-xl bg-white/10 p-space-lg backdrop-blur-md">
                <Icon name="volunteer_activism" className="text-3xl text-tertiary-fixed-dim" />
                <h3 className="text-headline-sm text-surface-container-lowest">Join, Hire or Mentor</h3>
                <p className="text-body-sm text-surface-container-high">
                  Students, employers and volunteer mentors — we&apos;d love to hear from you.
                </p>
                <a href="mailto:admin@dta.gm" className="inline-flex items-center gap-space-xs pt-space-2xs text-label-lg font-bold text-tertiary-fixed-dim hover:text-surface-container-lowest">
                  admin@dta.gm <Icon name="arrow_forward" className="text-base" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ value, unit, label, note, alt = false }: { value: string; unit?: string; label: string; note: string; alt?: boolean }) {
  return (
    <div className="space-y-space-2xs">
      <div className={`flex items-baseline gap-1 font-display text-headline-xl-mobile md:text-headline-xl ${alt ? "text-primary-container" : "text-secondary"}`}>
        <span>{value}</span>
        {unit && <span className="font-sans text-headline-md text-primary-container">{unit}</span>}
      </div>
      <div className={`text-label-tag uppercase tracking-wider ${alt ? "text-secondary" : "text-on-tertiary-container"}`}>{label}</div>
      <p className="text-body-sm text-on-surface-variant">{note}</p>
    </div>
  );
}

function InfoCard({ icon, iconClass, title, body, footerIcon, footer }: { icon: string; iconClass: string; title: string; body: string; footerIcon: string; footer: string }) {
  return (
    <div className="flex flex-col justify-between space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="space-y-space-sm">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon name={icon} className="text-2xl" />
        </div>
        <h3 className="text-headline-md text-primary-container">{title}</h3>
        <p className="text-body-md leading-relaxed text-on-surface-variant">{body}</p>
      </div>
      <div className="flex items-center gap-space-xs pt-space-xs text-label-md font-bold text-secondary">
        <Icon name={footerIcon} className="text-base" />
        {footer}
      </div>
    </div>
  );
}
