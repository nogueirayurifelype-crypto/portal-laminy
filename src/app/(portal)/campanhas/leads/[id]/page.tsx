import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Dados } from "@/components/fields";
import { Num, PageHeader, Secao, Status, botao } from "@/components/ui";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { formatData } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { aprovarLeadEAbrir } from "../../actions";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/campanhas/leads/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id.data),
    with: { campanha: { columns: { id: true, nome: true } } },
  });
  if (!lead) notFound();

  const podeAprovar = !lead.lojistaId && lead.status !== "descartado";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={lead.nome}
        meta={<Status valor={lead.status} />}
        descricao={lead.empresa ?? undefined}
        voltar={
          lead.campanha
            ? { href: `/campanhas/${lead.campanha.id}`, label: lead.campanha.nome }
            : { href: "/campanhas", label: "Leads" }
        }
      >
        <Link href={`/campanhas/leads/${lead.id}/editar`} className={botao.secundario}>
          Editar
        </Link>
        {lead.lojistaId ? (
          <Link href={`/lojistas/${lead.lojistaId}`} className={botao.primario}>
            Ver lojista →
          </Link>
        ) : (
          podeAprovar && (
            <form action={aprovarLeadEAbrir.bind(null, lead.id)}>
              <button type="submit" className={botao.primario}>
                Aprovar e criar lojista
              </button>
            </form>
          )
        )}
      </PageHeader>

      {podeAprovar && lead.status === "qualificado" && (
        <p className="rounded-card border border-ok/30 bg-ok-bg px-4 py-3 text-sm text-ok">
          Lead qualificado. Ao aprovar, o lojista é criado com o contato como responsável principal.
        </p>
      )}

      <Secao titulo="Dados do lead">
        <div className="flex flex-col gap-5">
          <Dados
            itens={[
              ["Empresa", lead.empresa],
              ["Telefone", lead.telefone ? <Num>{lead.telefone}</Num> : null],
              ["E-mail", lead.email],
              ["Cidade", lead.cidade],
              ["Nicho", lead.nicho],
              ["Origem", lead.origem],
              [
                "Campanha",
                lead.campanha ? <Link href={`/campanhas/${lead.campanha.id}`}>{lead.campanha.nome}</Link> : null,
              ],
              ["Criado em", <Num key="criado">{formatData(lead.createdAt)}</Num>],
            ]}
          />
          {lead.observacoes && (
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <span className="text-xs font-medium text-muted">Observações</span>
              <p className="text-sm whitespace-pre-wrap">{lead.observacoes}</p>
            </div>
          )}
        </div>
      </Secao>
    </div>
  );
}
