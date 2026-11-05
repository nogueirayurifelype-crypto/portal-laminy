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

const AVISO_SAIR = "Você tem alterações que ainda não foram salvas. Sair mesmo assim?";

/** Valores atuais do formulário numa string, para saber se algo mudou desde que abriu. */
function fotografar(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form).entries()].filter(([, v]) => typeof v === "string"));
}

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
  const inicial = useRef<string | null>(null);

  // Avisa antes de sair com alterações não salvas: fechar/recarregar a aba e clicar em links.
  // Ao voltar ao formulário o componente monta de novo, então ele sempre abre zerado.
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    inicial.current = fotografar(form);
    const alterado = () => inicial.current !== null && fotografar(form) !== inicial.current;

    const aoFechar = (e: BeforeUnloadEvent) => {
      if (!alterado()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const destino = new URL(a.href, location.href);
      if (destino.origin === location.origin && destino.pathname + destino.search === location.pathname + location.search) return;
      if (destino.origin === location.origin && destino.hash && destino.pathname === location.pathname) return;
      if (!alterado()) return;
      if (!window.confirm(AVISO_SAIR)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", aoFechar);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoFechar);
      document.removeEventListener("click", aoClicar, true);
    };
  }, []);

  useEffect(() => {
    if (!state.ok) return;
    // Salvou: o que está na tela passa a ser o novo "ponto de partida" (nada a perder).
    if (ref.current) inicial.current = fotografar(ref.current);
    if (resetOnSuccess) {
      ref.current?.reset();
      if (ref.current) inicial.current = fotografar(ref.current);
    }
    if (aoConcluir) router.replace(aoConcluir, { scroll: false });
  }, [state, resetOnSuccess, aoConcluir, router]);

  return (
    <form
      ref={ref}
      autoComplete="off"
      className={className ?? "flex flex-col gap-5"}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        // O botão "criar mesmo assim" manda seu name/value junto (o FormData não inclui o botão).
        const enviou = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (enviou?.name) formData.set(enviou.name, enviou.value);
        startTransition(() => formAction(formData));
      }}
    >
      {children}
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.aviso && (
        <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
          {state.aviso.texto}{" "}
          {state.aviso.link && (
            <Link href={state.aviso.link.href} className="font-medium underline">
              {state.aviso.link.rotulo}
            </Link>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={botao[variante]}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        {state.aviso?.podeProsseguir && (
          <button type="submit" name="confirmarDuplicado" value="1" disabled={pending} className={botao.secundario}>
            Salvar mesmo assim
          </button>
        )}
        {cancelarHref && (
          <Link href={cancelarHref} scroll={false} replace className={botao.secundario}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
