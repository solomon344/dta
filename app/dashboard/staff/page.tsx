import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Avatar, Badge, Card, PageHeader, Table, btn, td, th } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/certificates";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { revokeInvitationAction } from "./actions";
import InviteForm from "./InviteForm";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireAdmin();
  const now = new Date();
  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { staffProfile: { select: { jobTitle: true, photoUrl: true, signatureUrl: true } } },
    }),
    prisma.invitation.findMany({
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Staff"
        description="Invite staff by link, or create accounts directly. Admins can manage everything; staff manage cohorts, students and certificates."
        actions={
          <Link href="/dashboard/staff/new" className={btn.secondary}>
            <Icon name="person_add" className="text-base" /> Create account
          </Link>
        }
      />

      <div className="space-y-space-lg">
        <Table
          head={
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Role</th>
              <th className={th}>Signature</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          }
        >
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-surface-container-low">
              <td className={td}>
                <div className="flex items-center gap-space-sm">
                  <Avatar name={u.name} src={u.staffProfile?.photoUrl} size="h-9 w-9" />
                  <div>
                    <div className="text-label-lg text-primary-container">
                      {u.name} {u.id === me.id && <span className="text-body-sm text-outline">(you)</span>}
                    </div>
                    <div className="text-body-sm text-on-surface-variant">
                      {u.email}{u.staffProfile?.jobTitle ? ` · ${u.staffProfile.jobTitle}` : ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className={td}><Badge tone={u.role === "admin" ? "blue" : "gray"}>{u.role ?? "staff"}</Badge></td>
              <td className={td}>
                {u.staffProfile?.signatureUrl ? <Icon name="check_circle" className="text-lg text-secondary" /> : <span className="text-outline">—</span>}
              </td>
              <td className={td}>{u.banned ? <Badge tone="red">Deactivated</Badge> : <Badge tone="green">Active</Badge>}</td>
              <td className={`${td} text-right`}>
                <Link href={u.id === me.id ? "/dashboard/profile" : `/dashboard/staff/${u.id}`} className={btn.ghost}>Manage</Link>
              </td>
            </tr>
          ))}
        </Table>

        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <Card title="Invite a staff member">
            <p className="mb-space-md text-body-sm text-on-surface-variant">
              Creates a one-time sign-up link. Send it to them by email or message; they choose their own password.
            </p>
            <InviteForm />
          </Card>

          <Card title="Pending invitations">
            {invitations.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No pending invitations.</p>
            ) : (
              <ul className="divide-y divide-surface-variant">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-space-sm py-space-sm">
                    <div className="min-w-0">
                      <div className="truncate text-label-lg text-primary-container">{inv.email}</div>
                      <div className="text-body-sm text-on-surface-variant">
                        {inv.role} · expires {formatDate(inv.expiresAt)} · by {inv.invitedBy.name}
                      </div>
                    </div>
                    <ActionForm action={revokeInvitationAction.bind(null, inv.id)}>
                      <SubmitButton variant="ghost" confirm={`Revoke the invitation for ${inv.email}?`}>Revoke</SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-space-sm text-body-sm text-outline">Invite links are only shown once, when created. Revoke and re-invite if one is lost.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
