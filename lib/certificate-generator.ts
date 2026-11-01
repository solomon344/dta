import type { CertificateSignatoryView, CertificateView } from "./certificate-view";
import { qrCodeSvg } from "./qr";

// A4 landscape at 96dpi. The certificate is always laid out at this exact size
// and scaled as a whole, so text and decorations never reflow or overflow.
export const CERTIFICATE_WIDTH = 1123;
export const CERTIFICATE_HEIGHT = 794;

// Shown when a cohort has no signatories configured yet.
const DEFAULT_SIGNATORIES: CertificateSignatoryView[] = [
  { name: "", title: "Director, DTA", signatureUrl: null },
  { name: "", title: "CEO, DTA", signatureUrl: null },
  { name: "", title: "CTO, DTA", signatureUrl: null },
];

export interface CertificateHTMLOptions {
  /** URL or data URI of the DTA logo. */
  logoSrc: string;
  /** Public site origin, e.g. "https://verify.dta.gm". The QR code links to its /verify page. */
  siteUrl: string;
  /**
   * "standalone": a page meant to be opened directly (HTML download) — centred on a soft background.
   * "render": the bare certificate at exactly 1123×794 with no margins (PDF/PNG rendering and on-page preview).
   */
  mode?: "standalone" | "render";
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function signatoryHTML(sig: CertificateSignatoryView): string {
  const signature = sig.signatureUrl
    ? `<img class="signature" src="${escapeHTML(sig.signatureUrl)}" alt="">`
    : `<div class="signature"></div>`;
  const name = sig.name ? `<div class="signer">${escapeHTML(sig.name)}</div>` : "";
  return `<div class="sig">${signature}<div class="line"></div>${name}<div class="role">${escapeHTML(sig.title)}</div></div>`;
}

/** Public verification page for a certificate (encoded in the certificate's QR code). */
export function certificateVerifyUrl(siteUrl: string, number: string): string {
  return `${siteUrl.replace(/\/$/, "")}/verify?q=${encodeURIComponent(number)}`;
}

export function generateCertificateHTML(cert: CertificateView, options: CertificateHTMLOptions): string {
  const mode = options.mode ?? "standalone";
  const qr = qrCodeSvg(certificateVerifyUrl(options.siteUrl, cert.number));
  const name = escapeHTML(cert.studentName);
  const signatories = (cert.signatories.length ? cert.signatories : DEFAULT_SIGNATORIES).slice(0, 4);

  const pageStyles =
    mode === "render"
      ? `html, body { width: ${CERTIFICATE_WIDTH}px; height: ${CERTIFICATE_HEIGHT}px; overflow: hidden; background: #ffffff; }`
      : `body { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px; background: #eceef0; }
    .certificate { box-shadow: 0 20px 60px rgba(13, 28, 50, 0.18); }
    @media print {
      body { padding: 0; background: #ffffff; min-height: 0; display: block; }
      .certificate { box-shadow: none; }
    }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - DTA Certificate ${escapeHTML(cert.number)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;1,400&display=block">
  <style>
    @page { size: ${CERTIFICATE_WIDTH}px ${CERTIFICATE_HEIGHT}px; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; color: #191c1e; }
    ${pageStyles}
    .certificate {
      position: relative;
      flex: none;
      width: ${CERTIFICATE_WIDTH}px;
      height: ${CERTIFICATE_HEIGHT}px;
      background: #ffffff;
      overflow: hidden;
    }
    .frame {
      position: absolute;
      inset: 18px;
      border: 1.5px solid #0d1c32;
    }
    .frame-inner {
      position: absolute;
      inset: 26px;
      border: 1px solid rgba(0, 81, 213, 0.35);
    }
    .ribbon {
      position: absolute;
      left: 0;
      right: 0;
      height: 6px;
    }
    .ribbon.top { top: 0; background: linear-gradient(90deg, #0d1c32 0%, #0051d5 60%, #316bf3 100%); }
    .ribbon.bottom { bottom: 0; background: linear-gradient(90deg, #316bf3 0%, #0051d5 40%, #0d1c32 100%); }
    .dots {
      position: absolute;
      width: 360px;
      height: 280px;
      background-image: radial-gradient(#0051d5 1.3px, transparent 1.3px);
      background-size: 16px 16px;
      opacity: 0.18;
    }
    .dots.tr { top: 0; right: 0; -webkit-mask-image: radial-gradient(ellipse at top right, #000 10%, transparent 70%); mask-image: radial-gradient(ellipse at top right, #000 10%, transparent 70%); }
    .dots.bl { bottom: 0; left: 0; -webkit-mask-image: radial-gradient(ellipse at bottom left, #000 10%, transparent 70%); mask-image: radial-gradient(ellipse at bottom left, #000 10%, transparent 70%); }
    .corner { position: absolute; width: 34px; height: 34px; border: 3px solid #0051d5; }
    .corner.tl { top: 34px; left: 34px; border-right: none; border-bottom: none; }
    .corner.tr { top: 34px; right: 34px; border-left: none; border-bottom: none; }
    .corner.bl { bottom: 34px; left: 34px; border-right: none; border-top: none; }
    .corner.br { bottom: 34px; right: 34px; border-left: none; border-top: none; }
    .content {
      position: absolute;
      inset: 0;
      padding: 52px 110px 56px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .logo { height: 150px; width: auto; display: block; mix-blend-mode: multiply; }
    .heading {
      margin-top: 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 14px;
      font-weight: 700;
      color: #0d1c32;
      letter-spacing: 0.42em;
      text-transform: uppercase;
    }
    .heading .rule { width: 70px; height: 1px; background: #0051d5; }
    .intro { margin-top: 18px; font-size: 14px; color: #44474d; letter-spacing: 0.04em; }
    .name {
      margin-top: 8px;
      max-width: 100%;
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 56px;
      font-weight: 700;
      line-height: 1.12;
      color: #0d1c32;
      letter-spacing: 0.01em;
    }
    .name-rule { margin-top: 10px; width: 440px; height: 2px; background: linear-gradient(90deg, transparent, #0051d5 25%, #0051d5 75%, transparent); }
    .course-intro { margin-top: 18px; font-size: 16px; color: #191c1e; }
    .course-title {
      margin-top: 6px;
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 23px;
      font-weight: 700;
      color: #0051d5;
    }
    .detail { margin-top: 10px; width: 660px; font-size: 14px; line-height: 1.6; color: #191c1e; }
    .achievement { margin-top: 6px; width: 600px; font-size: 13px; line-height: 1.6; color: #44474d; font-style: italic; }
    .spacer { flex: 1; }
    .spacer.top { max-height: 40px; }
    .sigs { width: ${signatories.length * 220}px; max-width: 760px; display: grid; grid-template-columns: repeat(${signatories.length}, 1fr); gap: 40px; }
    .sig { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .sig .signature { height: 52px; max-width: 100%; object-fit: contain; display: block; }
    .sig .line { width: 100%; height: 1px; background: #0d1c32; }
    .sig .signer { margin-top: 2px; font-size: 12.5px; font-weight: 700; color: #0d1c32; }
    .sig .role { font-size: 11.5px; font-weight: 600; color: #44474d; letter-spacing: 0.04em; }
    .revoked {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 20;
    }
    .revoked span {
      transform: rotate(-24deg);
      border: 6px solid rgba(186, 26, 26, 0.75);
      color: rgba(186, 26, 26, 0.75);
      padding: 8px 36px;
      font-size: 96px;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    .qr {
      position: absolute;
      left: 70px;
      bottom: 62px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      z-index: 15;
    }
    .qr .code {
      width: 92px;
      height: 92px;
      padding: 5px;
      background: #ffffff;
      border: 1px solid rgba(13, 28, 50, 0.15);
      border-radius: 6px;
    }
    .qr .code svg { width: 100%; height: 100%; display: block; }
    .qr .caption { font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0051d5; }
    .seal {
      position: absolute;
      right: 78px;
      bottom: 72px;
      width: 104px;
      height: 104px;
      border-radius: 50%;
      padding: 4px;
      background: linear-gradient(135deg, #0d1c32, #0051d5 55%, #316bf3);
    }
    .seal-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #ffffff;
      border: 1px dashed rgba(0, 81, 213, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: #0d1c32;
    }
    .seal-inner .big { font-family: "Playfair Display", Georgia, serif; font-size: 24px; font-weight: 700; line-height: 1; }
    .seal-inner .small { font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0051d5; }
    .meta { margin-top: 18px; display: flex; justify-content: center; gap: 28px; font-size: 12px; color: #44474d; letter-spacing: 0.06em; }
    .meta strong { color: #0d1c32; font-weight: 700; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="ribbon top"></div>
    <div class="ribbon bottom"></div>
    <div class="dots tr"></div>
    <div class="dots bl"></div>
    <div class="frame"></div>
    <div class="frame-inner"></div>
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="qr">
      <div class="code">${qr}</div>
      <div class="caption">Scan to verify</div>
    </div>

    <div class="seal">
      <div class="seal-inner">
        <span class="small">Verified</span>
        <span class="big">DTA</span>
        <span class="small">${escapeHTML(cert.cohortName)}</span>
      </div>
    </div>

    <div class="content">
      <img class="logo" src="${options.logoSrc}" alt="Data Technology Academy">

      <div class="spacer top"></div>

      <div class="heading"><span class="rule"></span>Certificate of Completion<span class="rule"></span></div>

      <div class="intro">This is to certify that</div>
      <div class="name">${name}</div>
      <div class="name-rule"></div>

      <div class="course-intro">has successfully completed a three-month program in</div>
      <div class="course-title">${escapeHTML(cert.title)}</div>
      <div class="detail">${escapeHTML(cert.detail)}</div>
      <div class="achievement">This graduate has demonstrated exceptional technical proficiency and professional excellence.</div>

      <div class="spacer"></div>

      <div class="sigs">
        ${signatories.map(signatoryHTML).join("")}
      </div>

      <div class="meta">
        <span>Certificate ID: <strong>${escapeHTML(cert.number)}</strong></span>
        <span>Issued: <strong>${escapeHTML(cert.issueDateLabel)}</strong></span>
      </div>
    </div>
    ${cert.status === "REVOKED" ? '<div class="revoked"><span>REVOKED</span></div>' : ""}
    ${cert.status === "VOIDED" ? '<div class="revoked"><span>NOT ISSUED</span></div>' : ""}
  </div>
</body>
</html>`;
}
