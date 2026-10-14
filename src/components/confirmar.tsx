"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { botao } from "./ui";

/**
 * Ação perigosa em duas etapas, sem diálogo do navegador:
 * o primeiro clique pede confirmação, o segundo envia.
 */
export function Confirmar({
  action,
  rotulo,
  pergunta,
  confirmar = "Confirmar",
}: {
  action: () => Promise<void>;
  rotulo: string;
  pergunta: string;
  confirmar?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    (aberto ? confirmarRef : abrirRef).current?.focus();
  }, [aberto]);

  if (!aberto) {
    return (
      <button ref={abrirRef} type="button" className={botao.perigoso} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2" role="group" aria-label={pergunta}>
      <span className="text-sm text-danger">{pergunta}</span>
      <Enviar ref={confirmarRef}>{confirmar}</Enviar>
      <button type="button" className={botao.secundario} onClick={() => setAberto(false)}>
        Cancelar
      </button>
    </form>
  );
}

function Enviar({ ref, children }: { ref: React.Ref<HTMLButtonElement>; children: string }) {
  const { pending } = useFormStatus();
  return (
    <button ref={ref} type="submit" className={botao.perigoso} disabled={pending}>
      {pending ? "Aguarde…" : children}
    </button>
  );
}
