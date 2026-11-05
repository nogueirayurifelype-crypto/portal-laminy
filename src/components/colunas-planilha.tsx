import type { Coluna } from "@/lib/planilha";

import { Tabela } from "./ui";

/**
 * Referência das colunas da planilha em duas tabelas: as obrigatórias e as opcionais.
 * Usa as mesmas definições da importação, então nunca fica desatualizada.
 */
export function ColunasPlanilha({ colunas }: { colunas: readonly Coluna<string>[] }) {
  const obrigatorias = colunas.filter((c) => c.obrigatoria);
  const opcionais = colunas.filter((c) => !c.obrigatoria);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm text-black">Colunas da planilha</h2>
        <p className="text-[13px] text-muted">
          A ordem das colunas não importa e colunas desconhecidas são ignoradas. No Excel, deixe cnpj e cep como texto
          para não perder zeros.
        </p>
      </div>
      <Grupo titulo="Obrigatórias" detalhe="Linha sem esta coluna preenchida é recusada." colunas={obrigatorias} />
      <Grupo titulo="Opcionais" detalhe="Pode deixar em branco ou apagar a coluna." colunas={opcionais} />
    </section>
  );
}

function Grupo({ titulo, detalhe, colunas }: { titulo: string; detalhe: string; colunas: readonly Coluna<string>[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[13px] text-black">
        {titulo} <span className="text-muted">· {detalhe}</span>
      </h3>
      <Tabela>
        <thead>
          <tr>
            <th>Coluna</th>
            <th>Como preencher</th>
            <th>Também aceita</th>
          </tr>
        </thead>
        <tbody>
          {colunas.map((c) => (
            <tr key={c.campo}>
              <td className="whitespace-nowrap font-mono text-[13px]">{c.cabecalho}</td>
              <td>{c.descricao}</td>
              <td className="text-muted">{c.aceita?.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
