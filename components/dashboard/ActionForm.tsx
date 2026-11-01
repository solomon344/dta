"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import type { ActionState } from "@/lib/action-state";
import Icon from "@/components/Icon";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const ActionFormContext = createContext<{ state: ActionState; pending: boolean } | null>(null);

/** Pending state of the enclosing ActionForm (null outside one). */
export function useActionFormPending(): boolean | null {
  return useContext(ActionFormContext)?.pending ?? null;
}

/**
 * A form bound to a server action through `useActionState`. Server-rendered
 * fields inside it show their validation errors through <FieldError>.
 *
 * Submits through onSubmit rather than the `action` prop, because React resets
 * `action` forms after every submission and would wipe the user's input when
 * the server returns a validation error.
 */
export default function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  messagePosition = "bottom",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  messagePosition?: "top" | "bottom";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <ActionFormContext value={{ state, pending }}>
      <form ref={formRef} onSubmit={onSubmit} className={className}>
        {messagePosition === "top" && <FormMessage state={state} />}
        {children}
        {messagePosition === "bottom" && <FormMessage state={state} />}
      </form>
    </ActionFormContext>
  );
}

export function FieldError({ name, hint }: { name: string; hint?: string }) {
  const state = useContext(ActionFormContext)?.state;
  const errors = state?.fieldErrors?.[name];
  if (errors?.length) return <p className="text-body-sm text-error">{errors[0]}</p>;
  if (hint) return <p className="text-body-sm text-outline">{hint}</p>;
  return null;
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="flex items-start gap-space-xs rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">
        <Icon name="error" className="text-base" /> {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="flex items-start gap-space-xs rounded-lg bg-secondary-fixed px-space-sm py-space-xs text-body-sm text-on-secondary-fixed">
        <Icon name="check_circle" className="text-base" /> {state.message}
      </p>
    );
  }
  return null;
}
