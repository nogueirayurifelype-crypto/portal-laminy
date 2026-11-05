import Link from "next/link";

import { StatusSelect } from "@/components/status-select";
import { TabelaCadastros } from "@/components/tabela-cadastros";
import { Status, Vazio, botao } from "@/components/ui";

import { alterarStatusLead } from "./actions";
import { LEAD_STATUS_EDITAVEIS } from "./constants";
import { MenuLead } from "./menu-lead";

export type LeadLinha = {
  id: string;
  nome: string;
  empresa: string | null;
  cnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  nicho: string | null;
  status: string;
  lojistaId: string | null;
};

/** Leads com as mesmas colunas da lista de lojistas. */
export function LeadsTable({
  leads,
  novoHref,
}: {
  leads: LeadLinha[];
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
    <TabelaCadastros
      linhas={leads.map((l) => {
        const nome = l.empresa || l.nome;
        return {
          id: l.id,
          href: `/campanhas/leads/${l.id}`,
          nome,
          contato: l.empresa ? l.nome : null,
          cnpj: l.cnpj,
          telefone: l.telefone,
          cidade: l.cidade,
          uf: l.uf,
          nicho: l.nicho,
          // Aprovado já virou lojista: fica só o rótulo (desfazer é no menu "⋯").
          status:
            l.lojistaId || l.status === "aprovado" ? (
              <Status valor={l.status} />
            ) : (
              <StatusSelect
                nome={nome}
                status={l.status}
                opcoes={LEAD_STATUS_EDITAVEIS}
                alterar={alterarStatusLead.bind(null, l.id)}
              />
            ),
          acoes: <MenuLead id={l.id} nome={nome} status={l.status} lojistaId={l.lojistaId} />,
        };
      })}
    />
  );
}
