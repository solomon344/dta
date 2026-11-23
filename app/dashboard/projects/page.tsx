import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, EmptyState, PageHeader, Pagination, btn } from "@/components/dashboard/ui";
import Icon from "@/components/Icon";
import { ProjectCover } from "@/components/projects/ProjectCard";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { projectTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site";
import { deleteProjectAction, reviewProjectAction, setProjectFeaturedAction } from "./actions";

export const metadata: Metadata = { title: "Projects" };

const PAGE_SIZE = 20;
const TABS = [
  { status: "PENDING", label: "Awaiting review" },
  { status: "APPROVED", label: "Published" },
  { status: "REJECTED", label: "Rejected" },
] as const;

export default async function ProjectsAdminPage({ searchParams }: PageProps<"/dashboard/projects">) {
  const sp = await searchParams;
  const user = await requireUser();
  const status = TABS.find((t) => t.status === sp.status)?.status ?? "PENDING";
  const page = Math.max(1, Number(sp.page) || 1);
  const studentId = typeof sp.student === "string" ? sp.student : undefined;

  const [projects, counts] = await Promise.all([
    prisma.project.findMany({
      where: { status, ...(studentId && { studentId }) },
      orderBy: status === "APPROVED" ? [{ featured: "desc" }, { reviewedAt: "desc" }] : { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        program: { select: { name: true } },
        cohort: { select: { name: true } },
        certificate: { select: { id: true, number: true, status: true } },
        reviewedBy: { select: { name: true } },
        student: { select: { id: true, fullName: true } },
      },
    }),
    prisma.project.groupBy({ by: ["status"], where: studentId ? { studentId } : {}, _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          <>
            Student and graduate projects for the public showcase. Students submit them from the student portal
            ({SITE_URL}/student), and they appear publicly only once approved.
          </>
        }
        actions={
          <Link href="/dashboard/projects/new" className={btn.primary}>
            <Icon name="add" className="text-base" /> Add project
          </Link>
        }
      />

      <div className="mb-space-md flex flex-wrap gap-space-xs">
        {TABS.map((t) => (
          <Link key={t.status} href={`/dashboard/projects?status=${t.status}${studentId ? `&student=${studentId}` : ""}`} className={t.status === status ? btn.dark : btn.secondary}>
            {t.label} ({countOf(t.status)})
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState icon="rocket_launch" title="Nothing here yet" />
        </Card>
      ) : (
        <div className="space-y-space-md">
          {projects.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col gap-space-md md:flex-row">
                <Link href={`/dashboard/projects/${p.id}`} className="w-full shrink-0 self-start overflow-hidden rounded-lg ring-1 ring-surface-variant md:w-56">
                  <ProjectCover project={p} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-space-xs">
                    <div className="min-w-0">
                      <Link href={`/dashboard/projects/${p.id}`} className="text-headline-sm text-primary-container hover:text-secondary">
                        {p.title}
                      </Link>
                      <div className="text-body-sm text-on-surface-variant">By {p.builtBy}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-xs">
                      {p.featured && <Badge tone="amber">featured</Badge>}
                      <Badge tone={projectTone[p.status]}>{p.status === "APPROVED" ? "published" : p.status.toLowerCase()}</Badge>
                    </div>
                  </div>
                  <p className="mt-space-xs text-body-md text-on-surface">{p.summary}</p>
                  <p className="mt-space-xs text-body-sm text-on-surface-variant">
                    {[p.program?.name, p.cohort?.name, `${p.images.length} ${p.images.length === 1 ? "image" : "images"}`].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {p.student ? (
                      <>
                        Submitted by{" "}
                        <Link href={`/dashboard/students/${p.student.id}`} className="text-secondary hover:underline">{p.student.fullName}</Link>{" "}
                        {formatDate(p.createdAt)}
                      </>
                    ) : p.consentedAt ? (
                      `Submitted ${formatDate(p.createdAt)}`
                    ) : (
                      `Added by staff ${formatDate(p.createdAt)}`
                    )}
                    {p.contactEmail && <> · <a href={`mailto:${p.contactEmail}`} className="text-secondary hover:underline">{p.contactEmail}</a></>}
                    {p.certificate && (
                      <>
                        {" · "}
                        <Link href={`/dashboard/certificates/${p.certificate.id}`} className="font-mono text-secondary hover:underline">
                          {p.certificate.number}
                        </Link>
                        {p.certificate.status === "ISSUED" ? " (verified graduate)" : " (certificate no longer valid)"}
                      </>
                    )}
                    {p.reviewedBy && ` · Reviewed by ${p.reviewedBy.name}`}
                  </p>
                  <div className="mt-space-sm flex flex-wrap gap-space-xs">
                    {p.status !== "APPROVED" && (
                      <ActionForm action={reviewProjectAction.bind(null, p.id, "APPROVED")}>
                        <SubmitButton pendingLabel="Publishing…">Approve & publish</SubmitButton>
                      </ActionForm>
                    )}
                    {p.status === "APPROVED" && (
                      <ActionForm action={setProjectFeaturedAction.bind(null, p.id, !p.featured)}>
                        <SubmitButton variant="secondary">
                          <Icon name="star" filled={!p.featured} className="text-base" /> {p.featured ? "Unfeature" : "Feature"}
                        </SubmitButton>
                      </ActionForm>
                    )}
                    {p.status !== "REJECTED" && (
                      <ActionForm action={reviewProjectAction.bind(null, p.id, "REJECTED")}>
                        <SubmitButton variant="secondary">{p.status === "APPROVED" ? "Unpublish" : "Reject"}</SubmitButton>
                      </ActionForm>
                    )}
                    <Link href={`/dashboard/projects/${p.id}`} className={btn.secondary}>
                      <Icon name="edit" className="text-base" /> Edit
                    </Link>
                    {p.status === "APPROVED" && (
                      <Link href={`/projects/${p.slug}`} target="_blank" className={btn.ghost}>
                        <Icon name="open_in_new" className="text-base" /> View live
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <ActionForm action={deleteProjectAction.bind(null, p.id)}>
                        <SubmitButton variant="ghost" confirm={`Permanently delete "${p.title}" and its images?`}>Delete</SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <Pagination
            page={page}
            pageCount={Math.ceil(countOf(status) / PAGE_SIZE)}
            makeHref={(n) => `/dashboard/projects?status=${status}${studentId ? `&student=${studentId}` : ""}&page=${n}`}
          />
        </div>
      )}
    </>
  );
}
