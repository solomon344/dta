import { redirect } from "next/navigation";

// Projects are now submitted from the student portal. Kept so shared links still work.
export default function SubmitProjectPage() {
  redirect("/student/projects/new");
}
