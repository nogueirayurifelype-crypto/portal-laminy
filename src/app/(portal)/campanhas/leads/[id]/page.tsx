import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Dados } from "@/components/fields";
import { LinkExterno } from "@/components/link-externo";
import { Num, PageHeader, Secao, Status, botao } from "@/components/ui";
import { db } from "@/db";
import { leads, lojistas } from "@/db/schema";
import { formatData } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { Confirmar } from "@/components/confirmar";

import { desfazerAprovacao } from "../../actions";
import { AprovarLeadBotao } from "../../aprovar-lead-botao";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params, searchParams }: PageProps<"/campanhas/leads/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id.data),
    with: { campanha: { columns: { id: true, nome: true } } },
  });
  if (!lead) notFound();

  const sp = await searchParams;
  const erro = sp.erro;
  const lojistaDoCnpj =
    erro === "cnpj" && typeof sp.lojista === "string" && uuid.safeParse(sp.lojista).success
      ? await db.query.lojistas.findFirst({ where: eq(lojistas.id, sp.lojista), columns: { id: true, nome: true } })
      : undefined;

  const endereco = [
    [lead.logradouro, lead.numero].filter(Boolean).join(", "),
    lead.bairro,
    [lead.cidade, lead.uf].filter(Boolean).join("/"),
    lead.cep,
  ]
    .filter(Boolean)
    .join(" · ");

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
            : { href: "/campanhas?aba=leads", label: "Leads" }
        }
      >
        <Link href={`/campanhas/leads/${lead.id}/editar`} className={botao.secundario}>
          Editar
        </Link>
        {lead.lojistaId ? (
          <>
            <Confirmar
              action={desfazerAprovacao.bind(null, lead.id)}
              rotulo="Desfazer aprovação"
              pergunta="Excluir o lojista criado e voltar o lead para qualificado?"
              confirmar="Desfazer"
            />
            <Link href={`/lojistas/${lead.lojistaId}`} className={botao.primario}>
              Ver lojista →
            </Link>
          </>
        ) : (
          podeAprovar && (
            <AprovarLeadBotao leadId={lead.id} rotulo="Aprovar e criar lojista" variante="primario" />
          )
        )}
      </PageHeader>

      {lojistaDoCnpj && (
        <p role="alert" className="rounded-card border border-warn/30 bg-warn-bg px-4 py-3 text-sm text-warn">
          Não aprovei: já existe um lojista com o CNPJ deste lead ({lojistaDoCnpj.nome}).{" "}
          <Link href={`/lojistas/${lojistaDoCnpj.id}`} className="font-medium underline">
            Abrir lojista →
          </Link>
        </p>
      )}

      {erro === "financeiro" && (
        <p role="alert" className="rounded-card border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          Não dá para desfazer: o lojista já tem conta ou pagamento no financeiro. Remova isso na ficha do lojista primeiro.
        </p>
      )}

      {podeAprovar && lead.status === "qualificado" && (
        <p className="rounded-card border border-ok/30 bg-ok-bg px-4 py-3 text-sm text-ok">
          Lead qualificado. Ao aprovar, o lojista é criado com o contato como responsável principal.
        </p>
      )}

      <Secao titulo="Dados do lead">
        <div className="flex flex-col gap-5">
          <Dados
            itens={[
              ["Nome fantasia", lead.empresa],
              ["Razão social", lead.razaoSocial],
              ["CNPJ", lead.cnpj ? <Num>{lead.cnpj}</Num> : null],
              ["Nicho", lead.nicho],
              ["E-mail", lead.email],
              ["Telefone", lead.telefone ? <Num>{lead.telefone}</Num> : null],
              ["WhatsApp", lead.whatsapp ? <Num>{lead.whatsapp}</Num> : null],
              ["Tem site", lead.temSite == null ? null : lead.temSite ? "Sim" : "Não"],
              ["Site", <LinkExterno key="site" valor={lead.site} />],
              ["Instagram", <LinkExterno key="ig" valor={lead.instagram} base="https://instagram.com/" />],
              ["Facebook", <LinkExterno key="fb" valor={lead.facebook} base="https://facebook.com/" />],
              ["TikTok", <LinkExterno key="tt" valor={lead.tiktok} base="https://tiktok.com/@" />],
              ["Endereço", endereco || null],
              [
                "Coordenadas",
                lead.latitude != null && lead.longitude != null ? (
                  <Num>
                    {lead.latitude}, {lead.longitude}
                  </Num>
                ) : null,
              ],
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
