"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { removeStaffImageAction, saveStaffImageAction } from "@/app/dashboard/profile/actions";
import { useEdgeStore } from "@/lib/edgestore";
import { btn } from "./ui";

const copy = {
  photo: {
    title: "Profile photo",
    hint: "Square JPG, PNG or WebP, up to 5 MB.",
    empty: "No photo",
  },
  signature: {
    title: "Digital signature",
    hint: "PNG with a transparent background works best. Printed on certificates for cohorts where you are a signatory.",
    empty: "No signature",
  },
};

export default function StaffImageUploader({
  ownerId,
  kind,
  currentUrl,
}: {
  ownerId: string;
  kind: "photo" | "signature";
  currentUrl: string | null;
}) {
  const { edgestore } = useEdgeStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = progress !== null || pending;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      // Uploaded as temporary; the server action confirms it once it's saved to the profile.
      const res = await edgestore.staffImages.upload({
        file,
        input: { ownerId, kind },
        options: { temporary: true },
        onProgressChange: setProgress,
      });
      const result = await saveStaffImageAction(ownerId, kind, res.url);
      if (result?.error) setError(result.error);
      else startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (!window.confirm(`Remove this ${kind}?`)) return;
    startTransition(async () => {
      const result = await removeStaffImageAction(ownerId, kind);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-space-sm">
      <div className="text-label-md uppercase tracking-wider text-on-surface-variant">{copy[kind].title}</div>
      <div
        className={`flex items-center justify-center overflow-hidden bg-surface-container-low ring-1 ring-surface-variant ${
          kind === "photo" ? "h-32 w-32 rounded-full" : "h-28 w-full rounded-lg bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.02)_8px,rgba(0,0,0,0.02)_16px)]"
        }`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={copy[kind].title} className={kind === "photo" ? "h-full w-full object-cover" : "max-h-24 max-w-[90%] object-contain"} />
        ) : (
          <span className="text-body-sm text-outline">{copy[kind].empty}</span>
        )}
      </div>
      <p className="text-body-sm text-outline">{copy[kind].hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-space-xs">
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={btn.secondary}>
          <Icon name={busy ? "progress_activity" : "upload"} className={`text-base ${busy ? "animate-spin" : ""}`} />
          {progress !== null ? `Uploading ${Math.round(progress)}%` : currentUrl ? "Replace" : "Upload"}
        </button>
        {currentUrl && (
          <button type="button" disabled={busy} onClick={remove} className={btn.ghost}>
            Remove
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
