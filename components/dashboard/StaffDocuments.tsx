"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { addStaffDocumentAction, deleteStaffDocumentAction } from "@/app/dashboard/profile/actions";
import { useEdgeStore } from "@/lib/edgestore";
import { btn } from "./ui";

type Doc = { id: string; name: string; url: string; size: number; uploadedAt: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Private staff files (protected EdgeStore bucket: only the owner and admins can open them). */
export default function StaffDocuments({ ownerId, documents }: { ownerId: string; documents: Doc[] }) {
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
      const res = await edgestore.staffDocuments.upload({
        file,
        input: { ownerId },
        options: { temporary: true },
        onProgressChange: setProgress,
      });
      const result = await addStaffDocumentAction(ownerId, {
        url: res.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      if (result?.error) setError(result.error);
      else startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(doc: Doc) {
    if (!window.confirm(`Delete ${doc.name}?`)) return;
    startTransition(async () => {
      const result = await deleteStaffDocumentAction(doc.id);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-space-sm">
      {documents.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No files yet.</p>
      ) : (
        <ul className="divide-y divide-surface-variant rounded-lg ring-1 ring-surface-variant">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-space-sm px-space-sm py-space-xs">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-space-xs text-label-lg text-primary-container hover:text-secondary">
                <Icon name="description" className="text-lg text-secondary" />
                <span className="truncate">{doc.name}</span>
              </a>
              <div className="flex shrink-0 items-center gap-space-sm text-body-sm text-outline">
                <span>{formatSize(doc.size)}</span>
                <button type="button" onClick={() => remove(doc)} disabled={busy} aria-label={`Delete ${doc.name}`} className="text-error hover:opacity-70">
                  <Icon name="delete" className="text-base" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={btn.secondary}>
        <Icon name={busy ? "progress_activity" : "upload_file"} className={`text-base ${busy ? "animate-spin" : ""}`} />
        {progress !== null ? `Uploading ${Math.round(progress)}%` : "Upload file"}
      </button>
      <p className="text-body-sm text-outline">Up to 20 MB. Only you and admins can open these files.</p>
      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
