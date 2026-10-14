"use client";

import { useActionState, useEffect, useRef, startTransition, type ReactNode } from "react";

import type { ActionState } from "@/lib/validation";

import { botao, type VarianteBotao } from "./ui";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  /** Um único primário por tela; os demais formulários usam "secundario". */
  variante?: VarianteBotao;
  /** Limpa os campos após sucesso (ex.: formulários de "adicionar"). */
  resetOnSuccess?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Formulário ligado a uma server action que devolve ActionState.
 * Mostra o erro de validação e NÃO apaga o que foi digitado quando falha.
 */
export function ActionForm({
  action,
  submitLabel,
  variante = "primario",
  resetOnSuccess,
  className,
  children,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className ?? "flex flex-col gap-5"}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {children}
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className={botao[variante]}>
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
