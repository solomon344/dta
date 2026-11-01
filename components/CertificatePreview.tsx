"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CertificateView } from "@/lib/certificate-view";
import {
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
  generateCertificateHTML,
} from "@/lib/certificate-generator";

export interface CertificatePreviewHandle {
  print: () => void;
}

/**
 * Renders the exact same certificate HTML used for downloads, at its native
 * 1123×794 size inside an iframe, and scales it to fit the available width.
 */
const noopSubscribe = () => () => {};

const CertificatePreview = forwardRef<CertificatePreviewHandle, { certificate: CertificateView; siteUrl?: string }>(
  function CertificatePreview({ certificate, siteUrl }, ref) {
    // The QR code links to this site's verification page.
    const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [scale, setScale] = useState(0);

    const html = useMemo(
      () =>
        generateCertificateHTML(certificate, {
          logoSrc: "/assets/dta-logo-full.png",
          siteUrl: siteUrl ?? origin,
          mode: "render",
        }),
      [certificate, siteUrl, origin]
    );

    useImperativeHandle(ref, () => ({
      print: () => iframeRef.current?.contentWindow?.print(),
    }));

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const update = () => setScale(el.clientWidth / CERTIFICATE_WIDTH);
      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-surface-container-lowest shadow-xl ring-1 ring-surface-variant"
        style={{ aspectRatio: `${CERTIFICATE_WIDTH} / ${CERTIFICATE_HEIGHT}` }}
      >
        <iframe
          ref={iframeRef}
          title={`Certificate for ${certificate.studentName}`}
          srcDoc={html}
          sandbox="allow-modals"
          width={CERTIFICATE_WIDTH}
          height={CERTIFICATE_HEIGHT}
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{
            width: CERTIFICATE_WIDTH,
            height: CERTIFICATE_HEIGHT,
            transform: `scale(${scale})`,
            visibility: scale ? "visible" : "hidden",
          }}
        />
      </div>
    );
  }
);

export default CertificatePreview;
