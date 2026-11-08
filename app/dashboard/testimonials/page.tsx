import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, EmptyState, PageHeader, Pagination, btn } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { testimonialTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site";
import { deleteTestimonialAction, reviewTestimonialAction } from "./actions";

export const metadata: Metadata = { title: "Testimonials" };

const PAGE_SIZE = 20;
const TABS = [
  { status: "PENDING", label: "Awaiting review" },
  { status: "APPROVED", label: "Published" },
  { status: "REJECTED", label: "Rejected" },
] as const;

export default async function TestimonialsAdminPage({ searchParams }: PageProps<"/dashboard/testimonials">) {
  const sp = await searchParams;
  const user = await requireUser();
  const status = TABS.find((t) => t.status === sp.status)?.status ?? "PENDING";
  const page = Math.max(1, Number(sp.page) || 1);

  const [testimonials, counts] = await Promise.all([
    prisma.testimonial.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        certificate: { select: { id: true, number: true, status: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    prisma.testimonial.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Testimonials"
        description={
          <>
            Nothing appears on the site until it&apos;s approved. Share this link to collect testimonials:{" "}
            <Link href="/testimonials#share" target="_blank" className="text-secondary hover:underline">
              {SITE_URL}/testimonials#share
            </Link>
          </>
        }
      />

      <div className="mb-space-md flex flex-wrap gap-space-xs">
        {TABS.map((t) => (
          <Link key={t.status} href={`/dashboard/testimonials?status=${t.status}`} className={t.status === status ? btn.dark : btn.secondary}>
            {t.label} ({countOf(t.status)})
          </Link>
        ))}
      </div>

      {testimonials.length === 0 ? (
        <Card>
          <EmptyState icon="format_quote" title="Nothing here yet" />
        </Card>
      ) : (
        <div className="space-y-space-md">
          {testimonials.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-space-xs">
                <div>
                  <span className="text-label-lg text-primary-container">{t.name}</span>
                  {t.role && <span className="text-body-sm text-on-surface-variant"> · {t.role}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-space-xs">
                  {t.rating && <span className="text-on-tertiary-container">{"★".repeat(t.rating)}</span>}
                  <Badge tone={testimonialTone[t.status]}>{t.status.toLowerCase()}</Badge>
                </div>
              </div>
              <blockquote className="mt-space-sm whitespace-pre-line text-body-md text-on-surface">“{t.quote}”</blockquote>
              {t.improvement && (
                <div className="mt-space-sm rounded-lg bg-surface-container-low p-space-sm">
                  <div className="text-label-tag uppercase tracking-wider text-on-surface-variant">What we can improve (private)</div>
                  <p className="mt-1 whitespace-pre-line text-body-md text-on-surface">{t.improvement}</p>
                </div>
              )}
              <p className="mt-space-sm text-body-sm text-on-surface-variant">
                Submitted {formatDate(t.createdAt)}
                {t.email && <> · <a href={`mailto:${t.email}`} className="text-secondary hover:underline">{t.email}</a></>}
                {t.certificate ? (
                  <>
                    {" · "}
                    <Link href={`/dashboard/certificates/${t.certificate.id}`} className="font-mono text-secondary hover:underline">
                      {t.certificate.number}
                    </Link>
                    {t.certificate.status === "ISSUED" ? " (verified graduate)" : " (certificate no longer valid)"}
                  </>
                ) : (
                  " · Not verified as a graduate"
                )}
                {t.reviewedBy && ` · Reviewed by ${t.reviewedBy.name}`}
              </p>
              <div className="mt-space-sm flex flex-wrap gap-space-xs">
                {t.status !== "APPROVED" && (
                  <ActionForm action={reviewTestimonialAction.bind(null, t.id, "APPROVED")}>
                    <SubmitButton pendingLabel="Publishing…">Approve & publish</SubmitButton>
                  </ActionForm>
                )}
                {t.status !== "REJECTED" && (
                  <ActionForm action={reviewTestimonialAction.bind(null, t.id, "REJECTED")}>
                    <SubmitButton variant="secondary">{t.status === "APPROVED" ? "Unpublish" : "Reject"}</SubmitButton>
                  </ActionForm>
                )}
                {user.role === "admin" && (
                  <ActionForm action={deleteTestimonialAction.bind(null, t.id)}>
                    <SubmitButton variant="ghost" confirm={`Permanently delete the testimonial from ${t.name}?`}>Delete</SubmitButton>
                  </ActionForm>
                )}
              </div>
            </Card>
          ))}
          <Pagination
            page={page}
            pageCount={Math.ceil(countOf(status) / PAGE_SIZE)}
            makeHref={(p) => `/dashboard/testimonials?status=${status}&page=${p}`}
          />
        </div>
      )}
    </>
  );
}
