import type { Metadata } from "next";
import { connection } from "next/server";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Field, inputClass } from "@/components/dashboard/ui";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TestimonialCard from "@/components/TestimonialCard";
import { OPEN_GRAPH_BASE } from "@/lib/site";
import { getPublicTestimonials } from "@/lib/testimonials";
import { submitTestimonialAction } from "./actions";

const DESCRIPTION = "Read what people say about Data Technology Academy, and share your own experience.";

export const metadata: Metadata = {
  title: "Testimonials",
  description: DESCRIPTION,
  alternates: { canonical: "/testimonials" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "DTA Testimonials", description: DESCRIPTION, url: "/testimonials" },
  twitter: { title: "DTA Testimonials", description: DESCRIPTION },
};

export const instant = false;

export default async function TestimonialsPage() {
  await connection();
  const testimonials = await getPublicTestimonials();

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 pt-20">
        <section className="w-full bg-primary-container py-space-xl">
          <div className="mx-auto max-w-7xl space-y-space-sm px-4 sm:px-6 lg:px-12">
            <h1 className="font-display text-headline-xl-mobile text-surface-container-lowest md:text-headline-xl">Testimonials</h1>
            <p className="max-w-2xl text-body-xl text-surface-container-high">{DESCRIPTION}</p>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="mx-auto w-full max-w-7xl px-4 pt-space-2xl sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          </section>
        )}

        <section id="share" className="mx-auto w-full max-w-3xl px-4 py-space-2xl sm:px-6">
          <div className="rounded-2xl border-t-4 border-secondary bg-surface-container-lowest p-space-lg shadow-lg sm:p-space-xl">
            <h2 className="font-display text-headline-lg text-primary-container">Share your experience</h2>
            <p className="mb-space-lg mt-1 text-body-md text-on-surface-variant">
              How did DTA help you? Our team reviews every testimonial before it appears on the site.
            </p>
            <ActionForm action={submitTestimonialAction} resetOnSuccess className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field label="Full name" name="name">
                <input id="name" name="name" autoComplete="name" required className={inputClass} />
              </Field>
              <Field label="Email (optional)" name="email" hint="Private. Only used if we need to contact you.">
                <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Current role (optional)" name="role">
                <input id="role" name="role" placeholder="Data Analyst at Acme" className={inputClass} />
              </Field>
              <Field label="Rating (optional)" name="rating">
                <select id="rating" name="rating" defaultValue="" className={inputClass}>
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{"★".repeat(n)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Your testimonial" name="quote" className="sm:col-span-2">
                <textarea id="quote" name="quote" rows={5} required minLength={20} maxLength={1000} className={inputClass} />
              </Field>
              <Field
                label="Certificate ID (optional)"
                name="certificateNumber"
                className="sm:col-span-2"
                hint="DTA graduates: add your ID (e.g. DTA2000) to get a verified graduate badge. Enter your name exactly as on your certificate."
              >
                <input id="certificateNumber" name="certificateNumber" autoComplete="off" className={`${inputClass} font-mono`} />
              </Field>
              {/* Honeypot: hidden from people, so only bots fill it in. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Field label="Permission" name="consent" className="sm:col-span-2">
                <label className="flex items-start gap-space-xs text-body-md text-on-surface">
                  <input id="consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-secondary" />
                  I agree that Data Technology Academy may publish my name, role and testimonial on its website.
                </label>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Sending…">Submit testimonial</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
