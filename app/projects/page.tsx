import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Icon from "@/components/Icon";
import ProjectCard from "@/components/projects/ProjectCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getProjectPrograms, getPublicProjects } from "@/lib/projects";
import { OPEN_GRAPH_BASE } from "@/lib/site";

const DESCRIPTION =
  "Apps, dashboards and data stories built by Data Technology Academy students and graduates in The Gambia.";

export const metadata: Metadata = {
  title: "Student Project Showcase",
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "DTA Student Project Showcase", description: DESCRIPTION, url: "/projects" },
  twitter: { title: "DTA Student Project Showcase", description: DESCRIPTION },
};

export const instant = false;

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  await connection();
  const { program } = await searchParams;
  const programs = await getProjectPrograms();
  const active = programs.find((p) => p.code === program)?.code;
  const projects = await getPublicProjects({ programCode: active });

  const chip = (selected: boolean) =>
    `rounded-full px-space-md py-space-xs text-label-lg transition-all ${
      selected ? "bg-primary-container text-surface-container-lowest" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
    }`;

  return (
    <>
      <SiteHeader active="projects" />
      <main className="w-full flex-1 pt-20">
        <section className="w-full bg-primary-container py-space-xl">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md px-4 sm:px-6 md:flex-row md:items-end lg:px-12">
            <div className="space-y-space-sm">
              <span className="text-label-tag uppercase tracking-widest text-secondary-fixed">Built at DTA</span>
              <h1 className="font-display text-headline-xl-mobile text-surface-container-lowest md:text-headline-xl">Project Showcase</h1>
              <p className="max-w-2xl text-body-xl text-surface-container-high">{DESCRIPTION}</p>
            </div>
            <Link
              href="/student/projects/new"
              className="inline-flex shrink-0 items-center justify-center gap-space-xs self-start rounded-lg bg-secondary px-space-md py-space-sm text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(0,81,213,0.3)] transition-all hover:bg-secondary-container md:self-auto"
            >
              <Icon name="upload" className="text-base" />
              Submit your project
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-space-2xl sm:px-6 lg:px-12">
          {programs.length > 1 && (
            <nav aria-label="Filter by program" className="mb-space-lg flex flex-wrap gap-space-xs">
              <Link href="/projects" aria-current={!active ? "page" : undefined} className={chip(!active)}>All projects</Link>
              {programs.map((p) => (
                <Link key={p.code} href={`/projects?program=${encodeURIComponent(p.code)}`} aria-current={active === p.code ? "page" : undefined} className={chip(active === p.code)}>
                  {p.name}
                </Link>
              ))}
            </nav>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-low px-space-lg py-space-2xl text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                <Icon name="rocket_launch" className="text-3xl" />
              </div>
              <h2 className="text-headline-sm text-primary-container">Projects are on their way</h2>
              <p className="max-w-md text-body-md text-on-surface-variant">
                Our students are building. Are you a DTA student or graduate? Sign in to the student portal and be the first to share your work.
              </p>
              <Link href="/student/projects/new" className="mt-space-xs inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-md py-space-xs text-label-lg text-on-secondary hover:bg-secondary-container">
                Submit your project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
