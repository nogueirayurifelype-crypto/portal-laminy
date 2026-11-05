"use client";

import { useState, useTransition } from "react";

import { label } from "@/lib/format";

/** Troca o status direto na linha da tabela (leads e lojistas), sem abrir a ficha. */
export function StatusSelect({
  nome,
  status,
  opcoes,
  alterar,
}: {
  nome: string;
  status: string;
  opcoes: readonly string[];
  /** Server action já ligada ao registro (ex.: `alterarStatusLead.bind(null, id)`). */
  alterar: (status: string) => Promise<void>;
}) {
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
            await alterar(novo);
          } catch {
            setValor(anterior);
            setErro(true);
          }
        });
      }}
    >
      {opcoes.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}
