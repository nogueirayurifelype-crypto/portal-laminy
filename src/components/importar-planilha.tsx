"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type ReactNode } from "react";

import type { ImportState, LinhaPrevia } from "@/lib/planilha";

import { Card, Status, Tabela, botao } from "./ui";

const ORDEM: Record<LinhaPrevia["situacao"], number> = { erro: 0, duplicado: 1, ok: 2 };
const MAX_LINHAS_VISIVEIS = 300;

/**
 * Importação em duas etapas: "Pré-visualizar" valida o arquivo sem gravar;
 * "Importar" grava só as linhas prontas. A action recebe `arquivo` e `etapa`.
 */
export function ImportarPlanilha({
  action,
  modeloHref,
  listaHref,
  singular,
  plural,
  campos,
}: {
  action: (prev: ImportState, formData: FormData) => Promise<ImportState>;
  modeloHref: string;
  listaHref: string;
  /** "lojista importado" / "lojistas importados" */
  singular: string;
  plural: string;
  /** Campos extras do formulário (ex.: campanha dos leads). */
  campos?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [etapa, setEtapa] = useState<"previa" | "importar">("previa");
  // Trocar o arquivo invalida a prévia mostrada.
  const [previaValida, setPreviaValida] = useState(false);

  if (state.importados !== undefined) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h2>
            {state.importados === 1 ? `1 ${singular} importado` : `${state.importados} ${plural} importados`}
          </h2>
          <p className="text-sm text-muted">As linhas com erro ou duplicadas ficaram de fora.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={listaHref} className={botao.primario}>
            Ver {plural}
          </Link>
          {/* Recarrega a página para limpar o formulário. */}
          <a href="" className={botao.secundario}>
            Importar outra planilha
          </a>
        </div>
      </Card>
    );
  }

  const previa = previaValida ? state.previa : undefined;
  const prontas = previa?.linhas.filter((l) => l.situacao === "ok").length ?? 0;
  const duplicadas = previa?.linhas.filter((l) => l.situacao === "duplicado").length ?? 0;
  const comErro = previa?.linhas.filter((l) => l.situacao === "erro").length ?? 0;
  const ordenadas = previa ? [...previa.linhas].sort((a, b) => ORDEM[a.situacao] - ORDEM[b.situacao] || a.linha - b.linha) : [];

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        const formData = new FormData(e.currentTarget, submitter);
        setEtapa(formData.get("etapa") === "importar" ? "importar" : "previa");
        setPreviaValida(true);
        startTransition(() => formAction(formData));
      }}
    >
      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2>Arquivo</h2>
            <p className="text-[13px] text-muted">
              CSV salvo do Excel ou do Google Sheets, com a primeira linha de cabeçalhos. Até 2.000 linhas.
            </p>
          </div>
          <a href={modeloHref} download className={botao.secundario}>
            Baixar modelo
          </a>
        </div>
        <label>
          Planilha (.csv)
          <input
            name="arquivo"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={() => setPreviaValida(false)}
            className="file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-1 file:text-sm file:font-medium file:text-black"
          />
        </label>
        {campos}
        {state.error && (
          <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <div>
          <button
            type="submit"
            name="etapa"
            value="previa"
            disabled={pending}
            className={previa ? botao.secundario : botao.primario}
          >
            {pending && etapa === "previa" ? "Lendo planilha…" : previa ? "Ler de novo" : "Pré-visualizar"}
          </button>
        </div>
      </Card>

      {previa && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2>Prévia</h2>
              <p className="text-[13px] text-muted">
                {prontas} {prontas === 1 ? "pronta" : "prontas"} · {duplicadas}{" "}
                {duplicadas === 1 ? "duplicada" : "duplicadas"} · {comErro} com erro. Só as prontas serão importadas.
              </p>
            </div>
            <button
              type="submit"
              name="etapa"
              value="importar"
              disabled={pending || prontas === 0}
              className={botao.primario}
            >
              {pending && etapa === "importar" ? "Importando…" : `Importar ${prontas} ${plural}`}
            </button>
          </div>

          <p className="text-[13px] text-muted">
            Colunas reconhecidas: {previa.reconhecidas.join(", ")}.
            {previa.ignoradas.length > 0 && ` Ignoradas: ${previa.ignoradas.join(", ")}.`}
          </p>

          <Card className="overflow-hidden">
            <Tabela>
              <thead>
                <tr>
                  <th className="text-right">Linha</th>
                  <th>Nome</th>
                  <th>Detalhe</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.slice(0, MAX_LINHAS_VISIVEIS).map((l) => (
                  <tr key={l.linha}>
                    <td className="text-right text-muted tabular-nums">{l.linha}</td>
                    <td className="font-medium">{l.nome}</td>
                    <td className="text-muted">{l.detalhe || "—"}</td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <Status valor={l.situacao === "ok" ? "pronta" : l.situacao} />
                        {l.motivo && <span className="text-[13px] text-muted">{l.motivo}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
            {ordenadas.length > MAX_LINHAS_VISIVEIS && (
              <p className="border-t border-line px-4 py-3 text-[13px] text-muted">
                Mostrando {MAX_LINHAS_VISIVEIS} de {ordenadas.length} linhas (problemas primeiro).
              </p>
            )}
          </Card>
        </section>
      )}
    </form>
  );
}
