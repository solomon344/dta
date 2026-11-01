import { updateProfileAction } from "@/app/dashboard/profile/actions";
import { prisma } from "@/lib/db";
import ActionForm from "./ActionForm";
import StaffDocuments from "./StaffDocuments";
import StaffImageUploader from "./StaffImageUploader";
import SubmitButton from "./SubmitButton";
import { Card, Field, inputClass } from "./ui";

/** Profile details, photo, signature and private files for one staff member. */
export default async function StaffProfileEditor({ userId }: { userId: string }) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { staffProfile: { include: { documents: { orderBy: { uploadedAt: "desc" } } } } },
  });
  const profile = user.staffProfile;

  return (
    <div className="space-y-space-lg">
      <Card title="Details">
        <ActionForm action={updateProfileAction.bind(null, userId)} className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="Full name" name="name" hint="Printed under your signature on certificates.">
            <input id="name" name="name" defaultValue={user.name} required className={inputClass} />
          </Field>
          <Field label="Email" name="email">
            <input id="email" value={user.email} disabled className={inputClass} />
          </Field>
          <Field label="Job title" name="jobTitle">
            <input id="jobTitle" name="jobTitle" defaultValue={profile?.jobTitle ?? ""} placeholder="Lead Instructor" className={inputClass} />
          </Field>
          <Field label="Phone" name="phone">
            <input id="phone" name="phone" defaultValue={profile?.phone ?? ""} className={inputClass} />
          </Field>
          <Field label="Bio" name="bio" className="md:col-span-2">
            <textarea id="bio" name="bio" defaultValue={profile?.bio ?? ""} rows={3} className={inputClass} />
          </Field>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card title="Photo & signature">
        <div className="grid grid-cols-1 gap-space-xl md:grid-cols-[auto_1fr]">
          <StaffImageUploader ownerId={userId} kind="photo" currentUrl={profile?.photoUrl ?? null} />
          <StaffImageUploader ownerId={userId} kind="signature" currentUrl={profile?.signatureUrl ?? null} />
        </div>
      </Card>

      <Card title="Files">
        <StaffDocuments
          ownerId={userId}
          documents={(profile?.documents ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            url: d.url,
            size: d.size,
            uploadedAt: d.uploadedAt.toISOString(),
          }))}
        />
      </Card>
    </div>
  );
}
