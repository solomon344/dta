import "server-only";
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { errorMessage } from "./action-state";
import { prisma } from "./db";
import { edgeStoreBackend, isEdgeStoreUrl } from "./edgestore-server";
import { PUBLIC_REGISTRY_TAG } from "./public-cache";

export const MAX_PROJECT_IMAGES = 4;
const MAX_TECH = 12;

const optionalUrl = z
  .url({ protocol: /^https?$/, error: "Enter a full link starting with https://" })
  .max(500, "Keep this link under 500 characters.")
  .optional();

/** Fields shared by the public submission form and the staff editor. */
export const projectFieldsSchema = z.object({
  title: z.string({ error: "Give your project a title." }).min(3, "Give your project a title.").max(100, "Keep the title under 100 characters."),
  summary: z
    .string({ error: "Add a one-line summary." })
    .min(10, "Write at least 10 characters.")
    .max(160, "Keep the summary under 160 characters."),
  description: z
    .string({ error: "Describe your project." })
    .min(30, "Please write at least 30 characters.")
    .max(4000, "Please keep it under 4000 characters."),
  builtBy: z.string({ error: "Who built it?" }).min(2, "Who built it?").max(200, "Keep this under 200 characters."),
  techStack: z
    .string()
    .max(400, "Keep this under 400 characters.")
    .optional()
    .transform((v) => splitTech(v ?? ""))
    .refine((list) => list.length <= MAX_TECH, `List up to ${MAX_TECH} tools.`),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  videoUrl: optionalUrl,
  programId: z.string().max(40).optional(),
  cohortId: z.string().max(40).optional(),
});

/** "Python, SQL; power bi" → ["Python", "SQL", "power bi"], de-duplicated case-insensitively. */
export function splitTech(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(/[,;\n]/)) {
    const item = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    if (item && !seen.has(item.toLowerCase())) {
      seen.add(item.toLowerCase());
      out.push(item);
    }
  }
  return out;
}

/**
 * Reads the `images` inputs posted by <ProjectImagesInput>. Returns an error message
 * when uploads are still running or the list is invalid.
 */
export function imagesFrom(formData: FormData): { images: string[] } | { error: string } {
  if (formData.get("imagesUploading")) return { error: "Please wait for your images to finish uploading." };
  const images = [...new Set(formData.getAll("images").map(String).filter(Boolean))];
  if (images.length > MAX_PROJECT_IMAGES) return { error: `Add up to ${MAX_PROJECT_IMAGES} images.` };
  if (!images.every(isEdgeStoreUrl)) return { error: "One of the images is invalid. Please upload it again." };
  return { images };
}

/**
 * Confirms newly uploaded temporary images so EdgeStore keeps them. Fails for any URL
 * that wasn't uploaded to the projectImages bucket.
 */
export async function confirmProjectImages(urls: string[], alreadySaved: string[] = []): Promise<string | null> {
  try {
    for (const url of urls) {
      if (!alreadySaved.includes(url)) await edgeStoreBackend().projectImages.confirm({ url });
    }
    return null;
  } catch (error) {
    return errorMessage(error, "Could not save the uploaded images. Please upload them again.");
  }
}

export async function deleteProjectImages(urls: string[]) {
  await Promise.all(urls.map((url) => edgeStoreBackend().projectImages.delete({ url }).catch(() => undefined)));
}

/** Checks that the chosen program and cohort exist; returns ids safe to store. */
export async function resolveProgramAndCohort(programId?: string, cohortId?: string) {
  const [program, cohort] = await Promise.all([
    programId ? prisma.program.findUnique({ where: { id: programId }, select: { id: true } }) : null,
    cohortId ? prisma.cohort.findUnique({ where: { id: cohortId }, select: { id: true } }) : null,
  ]);
  return { programId: program?.id ?? null, cohortId: cohort?.id ?? null };
}

function slugify(title: string) {
  return (
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "project"
  );
}

/** A slug for a new project: the title, plus a short random suffix if that's taken. */
export async function uniqueProjectSlug(title: string): Promise<string> {
  const base = slugify(title);
  if (!(await prisma.project.findUnique({ where: { slug: base }, select: { id: true } }))) return base;
  for (;;) {
    const slug = `${base}-${randomBytes(3).toString("hex")}`;
    if (!(await prisma.project.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

// ─── Public queries ─────────────────────────────────────────────────────────

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  builtBy: string;
  techStack: string[];
  images: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  videoUrl: string | null;
  program: { code: string; name: string } | null;
  cohortName: string | null;
  featured: boolean;
  /** True while the submitter's certificate is valid. */
  verified: boolean;
  publishedAt: Date | null;
}

const publicInclude = {
  program: { select: { code: true, name: true } },
  cohort: { select: { name: true } },
  certificate: { select: { status: true } },
} satisfies Prisma.ProjectInclude;

function toPublic(p: Prisma.ProjectGetPayload<{ include: typeof publicInclude }>): PublicProject {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    builtBy: p.builtBy,
    techStack: p.techStack,
    images: p.images,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
    videoUrl: p.videoUrl,
    program: p.program,
    cohortName: p.cohort?.name ?? null,
    featured: p.featured,
    verified: p.certificate?.status === "ISSUED",
    publishedAt: p.reviewedAt,
  };
}

/**
 * Published projects, featured first, then newest. Like getPublicStats, callers must
 * await `connection()` first so this never runs at build time.
 */
export async function getPublicProjects(options: { programCode?: string; limit?: number } = {}): Promise<PublicProject[]> {
  "use cache";
  cacheTag(PUBLIC_REGISTRY_TAG);
  cacheLife("minutes");

  const rows = await prisma.project.findMany({
    where: { status: "APPROVED", ...(options.programCode && { program: { code: options.programCode } }) },
    orderBy: [{ featured: "desc" }, { reviewedAt: "desc" }],
    take: options.limit,
    include: publicInclude,
  });
  return rows.map(toPublic);
}

export async function getPublicProject(slug: string): Promise<PublicProject | null> {
  "use cache";
  cacheTag(PUBLIC_REGISTRY_TAG);
  cacheLife("minutes");

  const row = await prisma.project.findFirst({ where: { slug, status: "APPROVED" }, include: publicInclude });
  return row ? toPublic(row) : null;
}

/** Programs that have at least one published project, for the gallery filter. */
export async function getProjectPrograms(): Promise<{ code: string; name: string }[]> {
  "use cache";
  cacheTag(PUBLIC_REGISTRY_TAG);
  cacheLife("minutes");

  return prisma.program.findMany({
    where: { projects: { some: { status: "APPROVED" } } },
    orderBy: { name: "asc" },
    select: { code: true, name: true },
  });
}
