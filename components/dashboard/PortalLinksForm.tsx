"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import type { ActionState } from "@/lib/action-state";
import { FormMessage } from "./ActionForm";
import { btn } from "./ui";

interface Link {
  studentId: string;
  fullName: string;
  url: string;
  whatsappUrl: string | null;
  reset: boolean;
}

/** Button that creates student portal links, then lists them with Copy and WhatsApp buttons. */
export default function PortalLinksForm({
  action,
  label,
  confirm,
  variant = "secondary",
}: {
  action: (state: ActionState) => Promise<ActionState>;
  label: string;
  confirm?: string;
  variant?: keyof typeof btn;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [copied, setCopied] = useState<string | null>(null);
  const links: Link[] = state?.data?.links ? JSON.parse(state.data.links) : [];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    startTransition(() => formAction());
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-space-sm">
      <button type="submit" disabled={pending} className={btn[variant]}>
        <Icon name={pending ? "progress_activity" : "link"} className={`text-base ${pending ? "animate-spin" : ""}`} />
        {pending ? "Creating…" : label}
      </button>
      <FormMessage state={state} />
      {links.length > 1 && (
        <button
          type="button"
          className={btn.ghost}
          onClick={() => copy(links.map((l) => `${l.fullName}: ${l.url}`).join("\n"), "all")}
        >
          <Icon name={copied === "all" ? "check_circle" : "content_copy"} className="text-base" />
          {copied === "all" ? "Copied" : "Copy all"}
        </button>
      )}
      {links.length > 0 && (
        <ul className="divide-y divide-surface-variant rounded-lg bg-surface-container-low">
          {links.map((l) => (
            <li key={l.studentId} className="space-y-space-xs p-space-sm">
              {links.length > 1 && <div className="text-label-lg text-primary-container">{l.fullName}</div>}
              <code className="block break-all font-mono text-body-sm text-on-surface-variant">{l.url}</code>
              <div className="flex flex-wrap gap-space-xs">
                <button type="button" className={btn.secondary} onClick={() => copy(l.url, l.studentId)}>
                  <Icon name={copied === l.studentId ? "check_circle" : "content_copy"} className="text-base" />
                  {copied === l.studentId ? "Copied" : "Copy"}
                </button>
                {l.whatsappUrl && (
                  <a href={l.whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
                    <Icon name="chat" className="text-base" /> Send on WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
