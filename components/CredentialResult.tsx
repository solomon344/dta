"use client";

import { useRef, useState } from "react";
import type { CertificateView } from "@/lib/certificate-view";
import CertificatePreview, { type CertificatePreviewHandle } from "./CertificatePreview";
import Icon from "./Icon";
import { useCertificateDownload } from "./useCertificateDownload";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function verificationURL(cert: CertificateView) {
  return `${window.location.origin}/verify?q=${encodeURIComponent(cert.number)}`;
}

function linkedInURL(cert: CertificateView) {
  const [year, month] = cert.issueDate.split("-");
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.title,
    organizationName: "Data Technology Academy",
    certId: cert.number,
    certUrl: verificationURL(cert),
    issueYear: year,
    issueMonth: String(Number(month)),
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export default function CredentialResult({ certificate }: { certificate: CertificateView }) {
  const previewRef = useRef<CertificatePreviewHandle>(null);
  const { download, downloading, error: downloadError, setError: setDownloadError } = useCertificateDownload(certificate);
  const [copied, setCopied] = useState(false);

  const trackLabel = `${certificate.programName} Track`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verificationURL(certificate));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setDownloadError("Could not copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <div className="animate-fade-in space-y-space-xl">
      {/* Credential card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
        <div className="h-2 w-full bg-gradient-to-r from-secondary-container via-secondary to-primary-container" />
        <div className="relative p-space-lg lg:p-space-2xl">
          <div className="pointer-events-none absolute right-8 top-12 hidden select-none opacity-[0.03] sm:block" aria-hidden="true">
            <svg className="h-96 w-96 text-primary-container" fill="currentColor" viewBox="0 0 200 200">
              <path d="M100 0 L195 50 L195 150 L100 200 L5 150 L5 50 Z" />
            </svg>
          </div>

          {/* Banner */}
          <div className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-low/70 p-space-md md:flex-row md:items-center">
            <div className="flex items-center gap-space-md">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary shadow-md shadow-secondary/10">
                <Icon name="workspace_premium" filled className="text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-space-2xs">
                  <Icon name="verified" className="text-base text-secondary" />
                  <span className="text-label-tag uppercase tracking-widest text-secondary">Officially Verified &amp; Valid</span>
                </div>
                <h3 className="text-headline-md text-primary-container">Data Technology Academy Certificate</h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="rounded-lg bg-surface-container-lowest px-space-sm py-space-xs shadow-sm md:text-right">
                <div className="text-label-tag uppercase text-on-surface-variant">Certificate ID</div>
                <div className="font-mono text-label-md font-bold text-secondary">{certificate.number}</div>
              </div>
              <div className="rounded-lg bg-surface-container-lowest px-space-sm py-space-xs shadow-sm md:text-right">
                <div className="text-label-tag uppercase text-on-surface-variant">Issued</div>
                <div className="text-label-md text-primary-container">{certificate.issueDateLabel}</div>
              </div>
            </div>
          </div>

          <div className="mt-space-lg grid grid-cols-1 gap-space-xl lg:grid-cols-12">
            {/* Recipient */}
            <div className="space-y-space-lg lg:col-span-8">
              <div className="flex flex-col gap-space-lg sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-headline-xl text-secondary-fixed shadow-lg ring-4 ring-surface-container">
                  {initials(certificate.studentName)}
                </div>
                <div className="space-y-space-2xs">
                  <span className="rounded bg-surface-container-high px-space-xs py-space-2xs text-label-tag uppercase tracking-wider text-on-tertiary-container">
                    Certified Graduate
                  </span>
                  <h4 className="font-display text-headline-xl-mobile text-primary-container md:text-headline-xl">{certificate.studentName}</h4>
                  <p className="text-body-md text-on-surface-variant">
                    Awarded the <span className="font-bold text-on-surface">Certificate of Completion</span> for{" "}
                    <span className="text-on-surface">{certificate.title}</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-low p-space-md sm:grid-cols-2">
                <div className="space-y-space-2xs">
                  <div className="text-label-tag uppercase tracking-wider text-outline">Academic Cohort</div>
                  <div className="text-headline-sm text-primary-container">{certificate.cohortName}</div>
                  <p className="text-body-sm text-on-surface-variant">Completed a three-month, hands-on program.</p>
                </div>
                <div className="space-y-space-2xs">
                  <div className="text-label-tag uppercase tracking-wider text-outline">Specialized Concentration</div>
                  <div className="text-headline-sm text-secondary">{trackLabel}</div>
                  <p className="text-body-sm text-on-surface-variant">{certificate.detail}</p>
                </div>
              </div>

              <div className="space-y-space-xs">
                <span className="text-label-tag uppercase tracking-widest text-on-surface-variant">Competencies Covered</span>
                <div className="flex flex-wrap gap-space-xs">
                  {certificate.competencies.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-space-2xs rounded-full bg-surface-container-low px-space-sm py-space-2xs text-label-md text-primary-container shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Seal & actions */}
            <div className="flex flex-col justify-between space-y-space-lg rounded-xl bg-surface-container-low p-space-lg lg:col-span-4">
              <div className="flex flex-col items-center space-y-space-xs rounded-xl bg-surface-container-lowest p-space-md text-center shadow-sm">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary-container via-secondary to-secondary-container p-1 shadow-md">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface-container-lowest p-2 text-primary-container">
                    <Icon name="verified_user" className="text-2xl text-secondary" />
                    <span className="text-[9px] font-bold uppercase leading-none tracking-tight text-secondary">DTA Verified</span>
                    <span className="font-mono text-[8px] text-outline">{certificate.cohortName.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-label-tag uppercase tracking-wider text-secondary">Matched in DTA Registry</div>
                <p className="text-body-sm text-on-surface-variant">
                  This certificate ID belongs to {certificate.studentName} and is valid.
                </p>
              </div>

              <div className="no-print space-y-space-xs">
                <button
                  type="button"
                  onClick={() => download("pdf")}
                  disabled={downloading !== null}
                  className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-md py-2.5 text-label-lg text-surface-container-lowest shadow-sm transition-all hover:bg-secondary disabled:opacity-60"
                >
                  <Icon name={downloading === "pdf" ? "progress_activity" : "download"} className={`text-base ${downloading === "pdf" ? "animate-spin" : ""}`} />
                  {downloading === "pdf" ? "Preparing PDF…" : "Download Official PDF"}
                </button>
                <div className="grid grid-cols-2 gap-space-xs">
                  <SmallButton icon={downloading === "png" ? "progress_activity" : "image"} spin={downloading === "png"} onClick={() => download("png")} disabled={downloading !== null}>
                    PNG Image
                  </SmallButton>
                  <SmallButton icon="print" onClick={() => previewRef.current?.print()}>
                    Print
                  </SmallButton>
                  <SmallButton icon={copied ? "check_circle" : "content_copy"} onClick={copyLink}>
                    {copied ? "Copied!" : "Copy Link"}
                  </SmallButton>
                  <a
                    href={linkedInURL(certificate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-space-2xs rounded-lg bg-surface-container-highest px-space-xs py-2 text-label-md text-on-surface transition-all hover:bg-surface-container"
                  >
                    <Icon name="share" className="text-base" />
                    Add to LinkedIn
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => download("html")}
                  disabled={downloading !== null}
                  className="flex w-full items-center justify-center gap-space-2xs py-1 text-label-md text-secondary hover:underline disabled:opacity-60"
                >
                  <Icon name="description" className="text-base" />
                  Download as HTML
                </button>
                {downloadError && (
                  <p role="alert" className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">
                    {downloadError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="space-y-space-md">
        <div className="flex flex-col justify-between gap-space-xs sm:flex-row sm:items-end">
          <div>
            <div className="text-label-tag uppercase tracking-widest text-on-tertiary-container">Official Document</div>
            <h3 className="font-display text-headline-lg text-primary-container">Certificate of Completion</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant">Exactly as issued to the graduate.</p>
        </div>
        <CertificatePreview ref={previewRef} certificate={certificate} />
      </div>
    </div>
  );
}

function SmallButton({
  icon,
  spin = false,
  onClick,
  disabled,
  children,
}: {
  icon: string;
  spin?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-space-2xs rounded-lg bg-surface-container-highest px-space-xs py-2 text-label-md text-on-surface transition-all hover:bg-surface-container disabled:opacity-60"
    >
      <Icon name={icon} className={`text-base ${spin ? "animate-spin" : ""}`} />
      {children}
    </button>
  );
}
