import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { Card, PageHeader, Status, botao } from "@/components/ui";
import { db } from "@/db";
import { campanhas, leads } from "@/db/schema";
import { formatData } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { aprovarLeadEAbrir, atualizarLead, excluirLead } from "../../actions";
import { LeadFields } from "../../lead-fields";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/campanhas/leads/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const [lead, opcoes] = await Promise.all([
    db.query.leads.findFirst({
      where: eq(leads.id, id.data),
      with: { campanha: { columns: { id: true, nome: true } } },
    }),
    db.select({ id: campanhas.id, nome: campanhas.nome }).from(campanhas).orderBy(desc(campanhas.createdAt)),
  ]);
  if (!lead) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={lead.nome}
        meta={<Status valor={lead.status} />}
        descricao={
          <>
            {lead.empresa ? `${lead.empresa} · ` : ""}
            <span className="font-mono text-xs uppercase">Criado em {formatData(lead.createdAt)}</span>
          </>
        }
        voltar={
          lead.campanha
            ? { href: `/campanhas/${lead.campanha.id}`, label: lead.campanha.nome }
            : { href: "/campanhas", label: "Campanhas" }
        }
      >
        {lead.lojistaId ? (
          <Link href={`/lojistas/${lead.lojistaId}`} className={botao.secundario}>
            Ver lojista →
          </Link>
        ) : (
          lead.status !== "descartado" && (
            <form action={aprovarLeadEAbrir.bind(null, lead.id)}>
              <button type="submit" className={botao.primario}>
                Aprovar e criar lojista
              </button>
            </form>
          )
        )}
      </PageHeader>

      <Card className="p-5 sm:p-6">
        <ActionForm action={atualizarLead.bind(null, lead.id)} submitLabel="Salvar lead" variante="secundario">
          <LeadFields lead={lead} campanhas={opcoes} />
        </ActionForm>
      </Card>

      <div>
        <Confirmar
          action={excluirLead.bind(null, lead.id)}
          rotulo="Excluir lead"
          pergunta="Excluir este lead?"
          confirmar="Excluir"
        />
      </div>
    </div>
  );
}
