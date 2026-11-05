"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { botao, type VarianteBotao } from "@/components/ui";

import { aprovarLeadEAbrir } from "./actions";

/** Aprovar em duas etapas: o primeiro clique explica o que vai acontecer, o segundo aprova. */
export function AprovarLeadBotao({
  leadId,
  rotulo = "Aprovar",
  variante = "secundario",
}: {
  leadId: string;
  rotulo?: string;
  variante?: VarianteBotao;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto)
    return (
      <button type="button" className={botao[variante]} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
    );

  return (
    <form
      action={aprovarLeadEAbrir.bind(null, leadId)}
      role="group"
      aria-label="Confirmar aprovação"
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <span className="max-w-64 text-left text-sm text-muted">
        Aprovar vai criar um lojista com os dados deste lead. Continuar?
      </span>
      <Confirmar />
      <button type="button" className={botao.secundario} onClick={() => setAberto(false)}>
        Cancelar
      </button>
    </form>
  );
}

function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" autoFocus disabled={pending} className={botao.primario}>
      {pending ? "Aprovando…" : "Sim, aprovar"}
    </button>
  );
}
