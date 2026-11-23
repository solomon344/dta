import Link from "next/link";
import Icon from "@/components/Icon";
import type { PublicProject } from "@/lib/projects";

/** Cover image, or a branded placeholder for projects without screenshots. */
export function ProjectCover({ project, className = "" }: { project: Pick<PublicProject, "title" | "images">; className?: string }) {
  if (project.images[0]) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={project.images[0]} alt={`${project.title} cover`} loading="lazy" className={`aspect-video w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-container to-secondary ${className}`}>
      <Icon name="rocket_launch" className="text-5xl text-surface-container-lowest/80" />
    </div>
  );
}

export default function ProjectCard({ project: p }: { project: PublicProject }) {
  return (
    <Link
      href={`/projects/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-surface-variant transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative overflow-hidden">
        <ProjectCover project={p} className="transition-transform duration-300 group-hover:scale-[1.02]" />
        {p.featured && (
          <span className="absolute left-space-sm top-space-sm inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/95 px-space-xs py-0.5 text-label-tag uppercase tracking-wider text-on-tertiary-container shadow-sm">
            <Icon name="star" filled className="text-sm" /> Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-space-xs p-space-md">
        {p.program && <span className="text-label-tag uppercase tracking-widest text-secondary">{p.program.name}</span>}
        <h3 className="text-headline-sm text-primary-container group-hover:text-secondary">{p.title}</h3>
        <p className="line-clamp-3 text-body-sm text-on-surface-variant">{p.summary}</p>
        {p.techStack.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1 pt-space-xs">
            {p.techStack.slice(0, 4).map((t) => (
              <li key={t} className="rounded-full bg-surface-container px-space-xs py-0.5 text-label-md text-on-surface-variant">{t}</li>
            ))}
            {p.techStack.length > 4 && <li className="px-1 py-0.5 text-label-md text-outline">+{p.techStack.length - 4}</li>}
          </ul>
        )}
        <div className="flex items-center gap-1 border-t border-surface-variant pt-space-xs text-body-sm text-on-surface-variant">
          <span className="truncate">By {p.builtBy}</span>
          {p.verified && <Icon name="verified" className="shrink-0 text-base text-secondary" />}
        </div>
      </div>
    </Link>
  );
}
