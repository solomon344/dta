import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ActionForm from "@/components/dashboard/ActionForm";
import CertificateViewer from "@/components/dashboard/CertificateViewer";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Badge, Card, Field, PageHeader, btn, inputClass } from "@/components/dashboard/ui";
import { certificateInclude, formatDate, toCertificateView } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { certificateLabel, certificateTone } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import {
  reinstateCertificateAction,
  reissueCertificateAction,
  revokeCertificateAction,
  unissueCertificateAction,
  updateIssueDateAction,
} from "../actions";

export const metadata: Metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: PageProps<"/dashboard/certificates/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { ...certificateInclude, issuedBy: { select: { name: true } } },
  });
  if (!cert) notFound();
  const view = toCertificateView(cert);
  const isAdmin = user.role === "admin";

  return (
    <>
      <PageHeader
        title={cert.number}
        back={{ href: "/dashboard/certificates", label: "Certificates" }}
        description={
          <span className="flex items-center gap-space-xs">
            <Badge tone={certificateTone[cert.status]}>{certificateLabel[cert.status]}</Badge>
            <Link href={`/dashboard/students/${cert.studentId}`} className="text-secondary hover:underline">{view.studentName}</Link>
            · {view.programName} · {view.cohortName}
          </span>
        }
        actions={
          <Link href={`/verify?q=${cert.number}`} target="_blank" className={btn.secondary}>
            <Icon name="open_in_new" className="text-base" /> Public page
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CertificateViewer certificate={view} siteUrl={process.env.BETTER_AUTH_URL} />
          {view.signatories.length === 0 && (
            <p className="mt-space-sm rounded-lg bg-tertiary-fixed px-space-sm py-space-xs text-body-sm text-on-tertiary-fixed">
              No signatories are set for {view.cohortName}, so the certificate shows blank signature lines.{" "}
              <Link href={`/dashboard/cohorts/${cert.student.cohortId}`} className="underline">Add signatories</Link>
            </p>
          )}
        </div>

        <div className="space-y-space-lg">
          <Card title="Record">
            <dl className="space-y-space-xs text-body-sm">
              <div className="flex justify-between gap-space-sm"><dt className="text-on-surface-variant">Issued</dt><dd>{formatDate(cert.issueDate)}</dd></div>
              <div className="flex justify-between gap-space-sm"><dt className="text-on-surface-variant">Issued by</dt><dd>{cert.issuedBy?.name ?? "Imported"}</dd></div>
              {cert.voidedAt && cert.status === "VOIDED" && (
                <div className="flex justify-between gap-space-sm"><dt className="text-on-surface-variant">Un-issued</dt><dd>{formatDate(cert.voidedAt)}</dd></div>
              )}
              {cert.revokedAt && (
                <>
                  <div className="flex justify-between gap-space-sm"><dt className="text-on-surface-variant">Revoked</dt><dd>{formatDate(cert.revokedAt)}</dd></div>
                  <div><dt className="text-on-surface-variant">Reason</dt><dd className="mt-1">{cert.revokeReason}</dd></div>
                </>
              )}
            </dl>
          </Card>

          {isAdmin && (
            <Card title="Issue date">
              <ActionForm action={updateIssueDateAction.bind(null, cert.id)} className="flex items-end gap-space-xs">
                <Field label="Date" name="issueDate" className="flex-1">
                  <input id="issueDate" name="issueDate" type="date" defaultValue={view.issueDate} required className={inputClass} />
                </Field>
                <SubmitButton variant="secondary">Save</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {isAdmin && cert.status === "VOIDED" && (
            <Card title="Issue again">
              <ActionForm action={reissueCertificateAction.bind(null, cert.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  This certificate was un-issued and is hidden from the public. Issuing it again keeps the ID {cert.number}.
                </p>
                <Field label="Issue date" name="issueDate">
                  <input id="reissueDate" name="issueDate" type="date" defaultValue={view.issueDate} required className={inputClass} />
                </Field>
                <SubmitButton>Issue again</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {isAdmin && cert.status === "ISSUED" && (
            <Card title="Un-issue certificate">
              <ActionForm action={unissueCertificateAction.bind(null, cert.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  For students who didn&apos;t complete. Hides the certificate from the public without a &ldquo;revoked&rdquo;
                  notice. The ID stays reserved for this student.
                </p>
                <SubmitButton variant="secondary" confirm={`Un-issue ${cert.number}?`}>Un-issue</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {isAdmin && cert.status === "ISSUED" && (
            <Card title="Revoke certificate">
              <ActionForm action={revokeCertificateAction.bind(null, cert.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  For certificates that must be publicly marked invalid. The verification page shows it as revoked, with your reason.
                </p>
                <Field label="Reason" name="reason">
                  <textarea id="reason" name="reason" rows={2} required className={inputClass} />
                </Field>
                <SubmitButton variant="danger" confirm={`Revoke ${cert.number}?`}>
                  <Icon name="block" className="text-base" /> Revoke
                </SubmitButton>
              </ActionForm>
            </Card>
          )}

          {isAdmin && cert.status === "REVOKED" && (
            <Card title="Reinstate certificate">
              <ActionForm action={reinstateCertificateAction.bind(null, cert.id)} className="space-y-space-sm">
                <p className="text-body-sm text-on-surface-variant">Make this certificate valid again.</p>
                <SubmitButton variant="secondary">Reinstate</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
