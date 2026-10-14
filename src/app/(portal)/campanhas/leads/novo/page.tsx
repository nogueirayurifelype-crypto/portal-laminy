import { desc } from "drizzle-orm";
import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { campanhas } from "@/db/schema";
import { requireSession } from "@/lib/session";

import { criarLead } from "../../actions";
import { LeadFields } from "../../lead-fields";

export const metadata: Metadata = { title: "Novo lead" };

export default async function NovoLeadPage({ searchParams }: PageProps<"/campanhas/leads/novo">) {
  await requireSession();
  const { campanha } = await searchParams;
  const campanhaId = Array.isArray(campanha) ? campanha[0] : campanha;

  const opcoes = await db
    .select({ id: campanhas.id, nome: campanhas.nome })
    .from(campanhas)
    .orderBy(desc(campanhas.createdAt));

  const campanhaAtual = opcoes.find((c) => c.id === campanhaId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Novo lead"
        voltar={
          campanhaAtual
            ? { href: `/campanhas/${campanhaAtual.id}`, label: campanhaAtual.nome }
            : { href: "/campanhas", label: "Campanhas" }
        }
      />
      <Card className="p-5 sm:p-6">
        <ActionForm action={criarLead} submitLabel="Criar lead">
          <LeadFields campanhas={opcoes} campanhaId={campanhaId} />
        </ActionForm>
      </Card>
    </div>
  );
}
