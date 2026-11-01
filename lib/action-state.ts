import type { z } from "zod";

/** Result returned by dashboard server actions to `useActionState`. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Extra values for the form to show, e.g. a generated invite link. */
  data?: Record<string, string>;
} | null;

export function fieldErrorsFrom(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

/** Reads a FormData into a plain object of strings (empty strings become undefined). */
export function formObject(formData: FormData): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    out[key] = trimmed === "" ? undefined : trimmed;
  }
  return out;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error && typeof error === "object" && "body" in error) {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
