import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import ProgramForm from "../ProgramForm";

export const metadata: Metadata = { title: "New Program" };

export default function NewProgramPage() {
  return (
    <>
      <PageHeader title="New program" back={{ href: "/dashboard/programs", label: "Programs" }} />
      <ProgramForm />
    </>
  );
}
