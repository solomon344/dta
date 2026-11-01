// Shared between server and client: everything needed to display or render a certificate.

export interface CertificateSignatoryView {
  name: string;
  title: string;
  signatureUrl: string | null;
}

export interface CertificateView {
  number: string;
  status: "ISSUED" | "REVOKED" | "VOIDED";
  revokeReason: string | null;
  studentName: string;
  programName: string;
  programCode: string;
  title: string;
  detail: string;
  competencies: string[];
  cohortName: string;
  /** yyyy-mm-dd */
  issueDate: string;
  /** e.g. "October 20, 2026" */
  issueDateLabel: string;
  signatories: CertificateSignatoryView[];
}
