import Link from "next/link";

import { Num, Status, Tabela, Vazio, botao } from "@/components/ui";

import { aprovarLeadEAbrir } from "./actions";

export type LeadLinha = {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string | null;
  cidade: string | null;
  status: string;
  lojistaId: string | null;
  campanha?: { nome: string } | null;
};

export function LeadsTable({
  leads,
  mostrarCampanha,
  novoHref,
}: {
  leads: LeadLinha[];
  mostrarCampanha?: boolean;
  /** Link de "novo lead" para o estado vazio. */
  novoHref: string;
}) {
  if (leads.length === 0)
    return (
      <Vazio
        acao={
          <Link href={novoHref} className={botao.secundario}>
            + Novo lead
          </Link>
        }
      >
        Nenhum lead ainda. Cadastre manualmente enquanto a prospecção não é automatizada.
      </Vazio>
    );
  return (
    <Tabela>
      <thead>
        <tr>
          <th>Contato</th>
          <th>Empresa</th>
          <th>Telefone</th>
          <th>Cidade</th>
          {mostrarCampanha && <th>Campanha</th>}
          <th>Status</th>
          <th>
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {leads.map((l) => (
          <tr key={l.id}>
            <td className="font-medium">
              <Link href={`/campanhas/leads/${l.id}`}>{l.nome}</Link>
            </td>
            <td>{l.empresa ?? "—"}</td>
            <td>{l.telefone ? <Num>{l.telefone}</Num> : "—"}</td>
            <td>{l.cidade ?? "—"}</td>
            {mostrarCampanha && <td>{l.campanha?.nome ?? "—"}</td>}
            <td>
              <Status valor={l.status} />
            </td>
            <td>
              <div className="flex justify-end">
                {l.lojistaId ? (
                  <Link href={`/lojistas/${l.lojistaId}`} className="text-sm whitespace-nowrap">
                    Ver lojista →
                  </Link>
                ) : (
                  l.status !== "descartado" && (
                    <form action={aprovarLeadEAbrir.bind(null, l.id)}>
                      <button type="submit" className={botao.secundario}>
                        Aprovar
                      </button>
                    </form>
                  )
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}
