import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { ProjectCover } from "@/components/projects/ProjectCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getPublicProject } from "@/lib/projects";
import { OPEN_GRAPH_BASE, SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };

  const title = `${project.title} by ${project.builtBy}`;
  const url = `/projects/${project.slug}`;
  const images = project.images[0] ? [{ url: project.images[0], alt: `${project.title} cover` }] : undefined;
  return {
    title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: { ...OPEN_GRAPH_BASE, type: "article", title, description: project.summary, url, ...(images && { images }) },
    twitter: { title, description: project.summary, ...(images && { images: images.map((i) => i.url) }) },
  };
}

export const instant = false;

const linkClass =
  "flex items-center gap-space-sm rounded-lg bg-surface-container-low px-space-md py-space-sm text-label-lg text-primary-container ring-1 ring-surface-variant transition-all hover:bg-surface-container hover:text-secondary";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  await connection();
  const { slug } = await params;
  const p = await getPublicProject(slug);
  if (!p) notFound();

  const links = [
    p.liveUrl && { href: p.liveUrl, label: "View live project", icon: "open_in_new" },
    p.repoUrl && { href: p.repoUrl, label: "View the code", icon: "code_blocks" },
    p.videoUrl && { href: p.videoUrl, label: "Watch the demo", icon: "play_circle" },
  ].filter((l): l is { href: string; label: string; icon: string } => Boolean(l));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: p.title,
          description: p.summary,
          url: `${SITE_URL}/projects/${p.slug}`,
          ...(p.images[0] && { image: p.images[0] }),
          creator: { "@type": "Person", name: p.builtBy },
          ...(p.techStack.length > 0 && { keywords: p.techStack.join(", ") }),
          ...(p.publishedAt && { datePublished: p.publishedAt.toISOString() }),
          publisher: { "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <SiteHeader active="projects" />
      <main className="w-full flex-1 pt-20">
        <section className="w-full bg-primary-container pb-space-2xl pt-space-xl">
          <div className="mx-auto max-w-6xl space-y-space-sm px-4 sm:px-6 lg:px-12">
            <Link href="/projects" className="inline-flex items-center gap-1 text-label-md text-secondary-fixed hover:underline">
              <Icon name="arrow_back" className="text-sm" /> All projects
            </Link>
            <div className="flex flex-wrap gap-space-xs">
              {p.program && <span className="rounded-full bg-white/10 px-space-sm py-0.5 text-label-tag uppercase tracking-wider text-secondary-fixed">{p.program.name}</span>}
              {p.cohortName && <span className="rounded-full bg-white/10 px-space-sm py-0.5 text-label-tag uppercase tracking-wider text-surface-container-high">{p.cohortName}</span>}
              {p.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-space-sm py-0.5 text-label-tag uppercase tracking-wider text-on-tertiary-fixed">
                  <Icon name="star" filled className="text-sm" /> Featured
                </span>
              )}
            </div>
            <h1 className="font-display text-headline-xl-mobile text-surface-container-lowest md:text-headline-xl">{p.title}</h1>
            <p className="max-w-3xl text-body-xl text-surface-container-high">{p.summary}</p>
            <p className="flex flex-wrap items-center gap-x-space-xs text-body-md text-surface-container-high">
              <span>Built by <span className="font-bold text-surface-container-lowest">{p.builtBy}</span></span>
              {p.verified && (
                <span className="inline-flex items-center gap-1 text-label-md text-secondary-fixed">
                  <Icon name="verified" className="text-base" /> Verified DTA graduate
                </span>
              )}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-space-xl px-4 py-space-2xl sm:px-6 lg:grid-cols-3 lg:px-12">
          <div className="min-w-0 space-y-space-lg lg:col-span-2">
            <div className="-mt-space-2xl overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg ring-1 ring-surface-variant">
              {p.images[0] ? (
                <a href={p.images[0]} target="_blank" rel="noopener noreferrer" aria-label="Open the cover image">
                  <ProjectCover project={p} />
                </a>
              ) : (
                <ProjectCover project={p} />
              )}
            </div>
            {p.images.length > 1 && (
              <div className="grid grid-cols-3 gap-space-sm">
                {p.images.slice(1).map((src, i) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl ring-1 ring-surface-variant transition-all hover:ring-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${p.title} screenshot ${i + 2}`} loading="lazy" className="aspect-video w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            <section className="space-y-space-sm">
              <h2 className="text-headline-sm text-primary-container">About the project</h2>
              <div className="whitespace-pre-line break-words text-body-md leading-relaxed text-on-surface">{p.description}</div>
            </section>
          </div>

          <aside className="space-y-space-lg">
            {links.length > 0 && (
              <div className="space-y-space-xs">
                {links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer nofollow ugc" className={linkClass}>
                    <Icon name={l.icon} className="text-xl text-secondary" />
                    {l.label}
                  </a>
                ))}
              </div>
            )}
            {p.techStack.length > 0 && (
              <div className="space-y-space-xs">
                <h2 className="text-label-md uppercase tracking-wider text-on-surface-variant">Tools and technologies</h2>
                <ul className="flex flex-wrap gap-space-xs">
                  {p.techStack.map((t) => (
                    <li key={t} className="rounded-full bg-secondary-fixed px-space-sm py-0.5 text-label-md text-on-secondary-fixed">{t}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-space-sm rounded-2xl bg-surface-container-low p-space-md">
              <h2 className="text-label-lg text-primary-container">Built something at DTA?</h2>
              <p className="text-body-sm text-on-surface-variant">Students and graduates can share their own projects from the student portal.</p>
              <Link href="/student/projects/new" className="inline-flex items-center gap-1 text-label-lg text-secondary hover:underline">
                Submit your project <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
