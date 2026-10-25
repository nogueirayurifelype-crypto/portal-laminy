"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  /** Para onde ir após sucesso (ex.: fechar o painel lateral). */
  aoConcluir?: string;
  /** Mostra "Cancelar" ao lado do envio. */
  cancelarHref?: string;
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
  aoConcluir,
  cancelarHref,
  className,
  children,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    if (aoConcluir) router.replace(aoConcluir, { scroll: false });
  }, [state, resetOnSuccess, aoConcluir, router]);

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
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={botao[variante]}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        {cancelarHref && (
          <Link href={cancelarHref} scroll={false} replace className={botao.secundario}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
