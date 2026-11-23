"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { useEdgeStore } from "@/lib/edgestore";

/**
 * Screenshot picker for project forms. Files go straight to EdgeStore as temporary
 * uploads; the form posts their URLs as `images` inputs (first one is the cover) and the
 * server action confirms them. Needs an <EdgeStoreProvider> above it.
 */
const NONE: string[] = [];

export default function ProjectImagesInput({ initial = NONE, max = 4 }: { initial?: string[]; max?: number }) {
  const { edgestore } = useEdgeStore();
  const [images, setImages] = useState<string[]>(initial);
  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const busy = Object.keys(uploads).length > 0;
  const slotsLeft = max - images.length - Object.keys(uploads).length;

  // Clear the picker when the surrounding form is reset after a successful submission.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onReset = () => {
      setImages(initial);
      setError(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initial]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const picked = [...files].slice(0, Math.max(0, slotsLeft));
    if (files.length > picked.length) setError(`You can add up to ${max} images.`);

    await Promise.all(
      picked.map(async (file, i) => {
        const key = `${Date.now()}-${i}-${file.name}`;
        if (file.size > 4 * 1024 * 1024) {
          setError(`${file.name} is larger than 4 MB.`);
          return;
        }
        setUploads((u) => ({ ...u, [key]: 0 }));
        try {
          const res = await edgestore.projectImages.upload({
            file,
            options: { temporary: true },
            onProgressChange: (p) => setUploads((u) => ({ ...u, [key]: p })),
          });
          setImages((list) => [...list, res.url].slice(0, max));
        } catch (err) {
          setError(err instanceof Error ? `${file.name}: ${err.message}` : `Could not upload ${file.name}.`);
        } finally {
          setUploads(({ [key]: _, ...rest }) => rest);
        }
      })
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  const remove = (url: string) => setImages((list) => list.filter((u) => u !== url));
  const makeCover = (url: string) => setImages((list) => [url, ...list.filter((u) => u !== url)]);

  return (
    <div ref={rootRef} className="space-y-space-xs">
      {images.map((url) => <input key={url} type="hidden" name="images" value={url} />)}
      {busy && <input type="hidden" name="imagesUploading" value="1" />}

      <div className="grid grid-cols-2 gap-space-xs sm:grid-cols-4">
        {images.map((url, i) => (
          <figure key={url} className="group relative overflow-hidden rounded-lg bg-surface-container-low ring-1 ring-surface-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={i === 0 ? "Cover image" : `Screenshot ${i + 1}`} className="aspect-video w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary-container/90 px-1.5 py-0.5 text-label-tag uppercase tracking-wider text-surface-container-lowest">
                Cover
              </span>
            )}
            <figcaption className="flex justify-between gap-1 p-1">
              {i > 0 ? (
                <button type="button" onClick={() => makeCover(url)} className="text-label-md text-secondary hover:underline">
                  Make cover
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => remove(url)} aria-label={`Remove image ${i + 1}`} className="text-label-md text-error hover:underline">
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
        {Object.entries(uploads).map(([key, progress]) => (
          <div key={key} className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg bg-surface-container-low text-body-sm text-on-surface-variant ring-1 ring-surface-variant">
            <Icon name="progress_activity" className="animate-spin text-xl" />
            {Math.round(progress)}%
          </div>
        ))}
        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant text-label-md text-secondary transition-all hover:border-secondary hover:bg-surface-container-low"
          >
            <Icon name="image" className="text-2xl" />
            Add image
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id="images"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
