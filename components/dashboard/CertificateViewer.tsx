"use client";

import { useRef } from "react";
import CertificatePreview, { type CertificatePreviewHandle } from "@/components/CertificatePreview";
import Icon from "@/components/Icon";
import { useCertificateDownload } from "@/components/useCertificateDownload";
import type { CertificateView } from "@/lib/certificate-view";
import { btn } from "./ui";

export default function CertificateViewer({ certificate, siteUrl }: { certificate: CertificateView; siteUrl?: string }) {
  const previewRef = useRef<CertificatePreviewHandle>(null);
  const { download, downloading, error } = useCertificateDownload(certificate);
  const downloadable = certificate.status === "ISSUED";

  return (
    <div className="space-y-space-sm">
      <CertificatePreview ref={previewRef} certificate={certificate} siteUrl={siteUrl} />
      <div className="flex flex-wrap gap-space-xs">
        {downloadable && (
          <>
            <button type="button" onClick={() => download("pdf")} disabled={downloading !== null} className={btn.dark}>
              <Icon name={downloading === "pdf" ? "progress_activity" : "download"} className={`text-base ${downloading === "pdf" ? "animate-spin" : ""}`} />
              PDF
            </button>
            <button type="button" onClick={() => download("png")} disabled={downloading !== null} className={btn.secondary}>
              <Icon name={downloading === "png" ? "progress_activity" : "image"} className={`text-base ${downloading === "png" ? "animate-spin" : ""}`} />
              PNG
            </button>
            <button type="button" onClick={() => download("html")} disabled={downloading !== null} className={btn.secondary}>
              <Icon name="description" className="text-base" /> HTML
            </button>
          </>
        )}
        <button type="button" onClick={() => previewRef.current?.print()} className={btn.secondary}>
          <Icon name="print" className="text-base" /> Print
        </button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">{error}</p>}
    </div>
  );
}
