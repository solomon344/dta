import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ActionForm from "@/components/dashboard/ActionForm";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { deleteProgramAction } from "../actions";
import ProgramForm from "../ProgramForm";

export const metadata: Metadata = { title: "Edit Program" };

export default async function EditProgramPage({ params }: PageProps<"/dashboard/programs/[id]">) {
  const { id } = await params;
  const [user, program] = await Promise.all([requireUser(), prisma.program.findUnique({ where: { id } })]);
  if (!program) notFound();

  return (
    <>
      <PageHeader title={program.name} back={{ href: "/dashboard/programs", label: "Programs" }} />
      <div className="space-y-space-lg">
        <ProgramForm program={program} />
        {user.role === "admin" && (
          <Card title="Delete program">
            <p className="mb-space-sm text-body-sm text-on-surface-variant">Programs with students cannot be deleted.</p>
            <ActionForm action={deleteProgramAction.bind(null, program.id)}>
              <SubmitButton variant="danger" confirm={`Delete ${program.name}?`}>Delete program</SubmitButton>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
