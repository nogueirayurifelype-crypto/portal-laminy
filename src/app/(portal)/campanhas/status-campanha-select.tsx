"use client";

import { useState, useTransition } from "react";

import { CAMPANHA_STATUS } from "@/db/schema";
import { label } from "@/lib/format";

import { alterarStatusCampanha } from "./actions";

/** Troca o status da campanha na hora, sem abrir o formulário de edição. */
export function StatusCampanhaSelect({ id, nome, status }: { id: string; nome: string; status: string }) {
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
            await alterarStatusCampanha(id, novo);
          } catch {
            setValor(anterior);
            setErro(true);
          }
        });
      }}
    >
      {CAMPANHA_STATUS.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}
