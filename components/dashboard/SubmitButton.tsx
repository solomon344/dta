"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/Icon";
import { useActionFormPending } from "./ActionForm";
import { btn } from "./ui";

export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  confirm,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof btn;
  className?: string;
  /** Asks for confirmation before submitting. */
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const formStatus = useFormStatus();
  const pending = useActionFormPending() ?? formStatus.pending;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={`${btn[variant]} ${className}`}
    >
      {pending && <Icon name="progress_activity" className="animate-spin text-base" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
