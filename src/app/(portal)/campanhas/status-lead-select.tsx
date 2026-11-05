"use client";

import { useState, useTransition } from "react";

import { label } from "@/lib/format";

import { alterarStatusLead } from "./actions";
import { LEAD_STATUS_EDITAVEIS } from "./constants";

/** Troca o status do lead direto na linha da tabela, sem abrir a ficha. */
export function StatusLeadSelect({ id, nome, status }: { id: string; nome: string; status: string }) {
  const [valor, setValor] = useState(status);
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();

  return (
    <select
      aria-label={`Status de ${nome}`}
      value={valor}
      disabled={pendente}
      aria-invalid={erro || undefined}
      className="h-8 w-auto min-w-32 py-0 text-sm"
      onChange={(e) => {
        const anterior = valor;
        const novo = e.target.value;
        setValor(novo);
        setErro(false);
        iniciar(async () => {
          try {
            await alterarStatusLead(id, novo);
          } catch {
            setValor(anterior);
            setErro(true);
          }
        });
      }}
    >
      {LEAD_STATUS_EDITAVEIS.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}
