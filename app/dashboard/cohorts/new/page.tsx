import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/dashboard/ui";
import CohortForm from "../CohortForm";

export const metadata: Metadata = { title: "New Cohort" };

export default function NewCohortPage() {
  return (
    <>
      <PageHeader title="New cohort" back={{ href: "/dashboard/cohorts", label: "Cohorts" }} />
      <Card>
        <CohortForm />
      </Card>
    </>
  );
}
