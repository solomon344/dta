import type { PublicTestimonial } from "@/lib/testimonials";
import { Avatar } from "./dashboard/ui";
import Icon from "./Icon";

export default function TestimonialCard({ testimonial: t }: { testimonial: PublicTestimonial }) {
  return (
    <figure className="flex h-full flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm ring-1 ring-surface-variant">
      <div className="space-y-space-xs">
        {t.rating && (
          <div className="text-on-tertiary-container" role="img" aria-label={`Rated ${t.rating} out of 5`}>
            {"★".repeat(t.rating)}
            <span className="text-outline-variant">{"★".repeat(5 - t.rating)}</span>
          </div>
        )}
        <blockquote className="whitespace-pre-line text-body-md leading-relaxed text-on-surface">“{t.quote}”</blockquote>
      </div>
      <figcaption className="flex items-center gap-space-sm">
        <Avatar name={t.name} />
        <div className="min-w-0">
          <div className="text-label-lg text-primary-container">{t.name}</div>
          {t.role && <div className="text-body-sm text-on-surface-variant">{t.role}</div>}
          {t.verified && (
            <div className="mt-0.5 flex items-center gap-1 text-label-md text-secondary">
              <Icon name="verified" className="text-sm" />
              Verified graduate · {t.verified.programName}, {t.verified.cohortName}
            </div>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
