"use client";

import { useState } from "react";
import type { CertificateView } from "@/lib/certificate-view";

export type DownloadFormat = "pdf" | "png" | "html";

/** Downloads a rendered certificate from the API, surfacing server errors instead of saving them as files. */
export function useCertificateDownload(certificate: CertificateView) {
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(format: DownloadFormat) {
    setDownloading(format);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/download?id=${encodeURIComponent(certificate.number)}&format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Could not generate the ${format.toUpperCase()} file.`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certificate.number}_${certificate.studentName.replace(/[^A-Za-z0-9]+/g, "_")}_certificate.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return { download, downloading, error, setError };
}
