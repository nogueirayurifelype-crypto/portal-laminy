import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { Card, PageHeader, ZonaPerigo } from "@/components/ui";
import { db } from "@/db";
import { campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { atualizarLead, excluirLead } from "../../../actions";
import { LeadFields } from "../../../lead-fields";

export const metadata: Metadata = { title: "Editar lead" };

export default async function EditarLeadPage({ params }: PageProps<"/campanhas/leads/[id]/editar">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const [lead, opcoes] = await Promise.all([
    db.query.leads.findFirst({ where: eq(leads.id, id.data) }),
    db.select({ id: campanhas.id, nome: campanhas.nome }).from(campanhas).orderBy(desc(campanhas.createdAt)),
  ]);
  if (!lead) notFound();

  const voltar = `/campanhas/leads/${lead.id}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Editar lead" voltar={{ href: voltar, label: lead.nome }} />
      <Card className="p-5 sm:p-6">
        <ActionForm
          action={atualizarLead.bind(null, lead.id)}
          submitLabel="Salvar lead"
          aoConcluir={voltar}
          cancelarHref={voltar}
        >
          <LeadFields lead={lead} campanhas={opcoes} />
        </ActionForm>
      </Card>
      <ZonaPerigo titulo="Excluir lead" descricao="Remove o lead definitivamente. Um lojista já criado a partir dele continua.">
        <Confirmar
          action={excluirLead.bind(null, lead.id)}
          rotulo="Excluir lead"
          pergunta="Excluir este lead?"
          confirmar="Excluir"
        />
      </ZonaPerigo>
    </div>
  );
}
