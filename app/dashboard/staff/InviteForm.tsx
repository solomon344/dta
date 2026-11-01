"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { FormMessage } from "@/components/dashboard/ActionForm";
import { btn, inputClass } from "@/components/dashboard/ui";
import { inviteStaffAction } from "./actions";

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteStaffAction, null);
  const [copied, setCopied] = useState(false);
  const link = state?.data?.inviteUrl;
  const err = (name: string) => state?.fieldErrors?.[name]?.[0];

  // onSubmit (not `action`) so React doesn't clear the fields when validation fails.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-space-md">
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-label-md uppercase tracking-wider text-on-surface-variant">Email</span>
          <input name="email" type="email" required className={inputClass} />
          {err("email") && <span className="block text-body-sm text-error">{err("email")}</span>}
        </label>
        <label className="space-y-1">
          <span className="block text-label-md uppercase tracking-wider text-on-surface-variant">Name (optional)</span>
          <input name="name" className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="block text-label-md uppercase tracking-wider text-on-surface-variant">Job title (optional)</span>
          <input name="jobTitle" placeholder="Instructor" className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="block text-label-md uppercase tracking-wider text-on-surface-variant">Role</span>
          <select name="role" defaultValue="staff" className={inputClass}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={pending} className={btn.primary}>
        <Icon name={pending ? "progress_activity" : "mail"} className={`text-base ${pending ? "animate-spin" : ""}`} />
        {pending ? "Creating…" : "Create invite link"}
      </button>
      <FormMessage state={state} />
      {link && (
        <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-sm sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all font-mono text-body-sm text-primary-container">{link}</code>
          <button
            type="button"
            className={btn.secondary}
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Icon name={copied ? "check_circle" : "content_copy"} className="text-base" /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </form>
  );
}
