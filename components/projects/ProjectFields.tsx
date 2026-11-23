import { Field, inputClass } from "@/components/dashboard/ui";
import ProjectImagesInput from "./ProjectImagesInput";

export interface ProjectDefaults {
  title?: string;
  summary?: string;
  description?: string;
  builtBy?: string;
  techStack?: string[];
  images?: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  videoUrl?: string | null;
  programId?: string | null;
  cohortId?: string | null;
}

/**
 * Inputs shared by the student portal and the staff editor. Render inside an ActionForm
 * with a two-column grid (`sm:grid-cols-2`) and an <EdgeStoreProvider> above. Students
 * don't pick a program or cohort; theirs come from their student record.
 */
export default function ProjectFields({
  programs = [],
  cohorts = [],
  defaults = {},
  audience,
}: {
  programs?: { id: string; name: string }[];
  cohorts?: { id: string; name: string }[];
  defaults?: ProjectDefaults;
  audience: "student" | "staff";
}) {
  const you = audience === "student";
  return (
    <>
      <Field label="Project title" name="title" className="sm:col-span-2">
        <input id="title" name="title" required maxLength={100} defaultValue={defaults.title} placeholder="e.g. Banjul Market Price Tracker" className={inputClass} />
      </Field>
      <Field label="One-line summary" name="summary" className="sm:col-span-2" hint="Shown on the project card. Up to 160 characters.">
        <input id="summary" name="summary" required maxLength={160} defaultValue={defaults.summary} className={inputClass} />
      </Field>
      <Field
        label="Built by"
        name="builtBy"
        className="sm:col-span-2"
        hint={you ? "Your name, and your teammates' if it was a group project." : "Everyone who worked on it."}
      >
        <input id="builtBy" name="builtBy" required maxLength={200} defaultValue={defaults.builtBy} placeholder="Fatou Ceesay and Lamin Jallow" className={inputClass} />
      </Field>
      {!you && (
        <>
          <Field label="Program" name="programId">
            <select id="programId" name="programId" defaultValue={defaults.programId ?? ""} className={inputClass}>
              <option value="">None</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Cohort" name="cohortId">
            <select id="cohortId" name="cohortId" defaultValue={defaults.cohortId ?? ""} className={inputClass}>
              <option value="">None</option>
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </>
      )}
      <Field
        label="About the project"
        name="description"
        className="sm:col-span-2"
        hint="What problem does it solve, how does it work, and what did you learn?"
      >
        <textarea id="description" name="description" rows={7} required minLength={30} maxLength={4000} defaultValue={defaults.description} className={inputClass} />
      </Field>
      <Field label="Tools and technologies" name="techStack" className="sm:col-span-2" hint="Separate with commas, e.g. Python, SQL, Power BI.">
        <input id="techStack" name="techStack" maxLength={400} defaultValue={defaults.techStack?.join(", ")} className={inputClass} />
      </Field>
      <Field
        label="Screenshots"
        name="images"
        className="sm:col-span-2"
        hint="Up to 4 JPG, PNG or WebP images, 4 MB each. The first one is the cover."
      >
        <ProjectImagesInput initial={defaults.images} />
      </Field>
      <Field label="Live link (optional)" name="liveUrl">
        <input id="liveUrl" name="liveUrl" type="url" inputMode="url" maxLength={500} defaultValue={defaults.liveUrl ?? ""} placeholder="https://" className={inputClass} />
      </Field>
      <Field label="Code link (optional)" name="repoUrl" hint="GitHub, GitLab…">
        <input id="repoUrl" name="repoUrl" type="url" inputMode="url" maxLength={500} defaultValue={defaults.repoUrl ?? ""} placeholder="https://github.com/…" className={inputClass} />
      </Field>
      <Field label="Demo video (optional)" name="videoUrl" className="sm:col-span-2" hint="YouTube, Loom, Google Drive…">
        <input id="videoUrl" name="videoUrl" type="url" inputMode="url" maxLength={500} defaultValue={defaults.videoUrl ?? ""} placeholder="https://" className={inputClass} />
      </Field>
    </>
  );
}
