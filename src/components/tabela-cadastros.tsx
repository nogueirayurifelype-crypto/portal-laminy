import Link from "next/link";
import type { ReactNode } from "react";

import { Num, Tabela } from "./ui";

/**
 * Linha comum a leads e lojistas: os dados são os mesmos (o lead vira lojista ao ser aprovado),
 * então as duas listas mostram as mesmas colunas, na mesma ordem.
 */
export type LinhaCadastro = {
  id: string;
  href: string;
  nome: string;
  /** Pessoa de contato: o nome do lead ou o responsável principal do lojista. */
  contato: string | null;
  cnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  nicho: string | null;
  status: ReactNode;
  acoes: ReactNode;
};

export function TabelaCadastros({ linhas }: { linhas: LinhaCadastro[] }) {
  return (
    <Tabela>
      <thead>
        <tr>
          <th>Nome</th>
          <th>CNPJ</th>
          <th>Telefone</th>
          <th>Cidade</th>
          <th>Nicho</th>
          <th>Status</th>
          <th>
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l.id}>
            <td>
              <Link href={l.href} className="font-medium">
                {l.nome}
              </Link>
              {l.contato && l.contato !== l.nome && <p className="text-[13px] text-muted">{l.contato}</p>}
            </td>
            <td>{l.cnpj ? <Num>{l.cnpj}</Num> : "—"}</td>
            <td>{l.telefone ? <Num>{l.telefone}</Num> : "—"}</td>
            <td>{l.cidade ? `${l.cidade}${l.uf ? `/${l.uf}` : ""}` : "—"}</td>
            <td>{l.nicho ?? "—"}</td>
            <td>{l.status}</td>
            <td>
              <div className="flex justify-end">{l.acoes}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}
