import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { Card, PageHeader, Secao, Status, botao } from "@/components/ui";
import { db } from "@/db";
import { campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { atualizarCampanha, excluirCampanha } from "../actions";
import { CampanhaFields } from "../campanha-fields";
import { LeadsTable } from "../leads-table";

export const metadata: Metadata = { title: "Campanha" };

export default async function CampanhaPage({ params }: PageProps<"/campanhas/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const campanha = await db.query.campanhas.findFirst({
    where: eq(campanhas.id, id.data),
    with: { leads: { orderBy: [desc(leads.createdAt)] } },
  });
  if (!campanha) notFound();

  const detalhes = [campanha.nicho, campanha.regiao].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={campanha.nome}
        meta={<Status valor={campanha.status} />}
        descricao={campanha.descricao ?? (detalhes || undefined)}
        voltar={{ href: "/campanhas", label: "Campanhas" }}
      >
        <Link href={`/campanhas/leads/novo?campanha=${campanha.id}`} className={botao.primario}>
          + Novo lead
        </Link>
      </PageHeader>

      <Secao titulo="Leads" semPadding>
        <LeadsTable leads={campanha.leads} novoHref={`/campanhas/leads/novo?campanha=${campanha.id}`} />
      </Secao>

      <Card>
        <details>
          <summary className="flex min-h-12 items-center px-5 text-sm font-medium">Editar campanha</summary>
          <div className="flex flex-col gap-6 border-t border-line p-5">
            <ActionForm
              action={atualizarCampanha.bind(null, campanha.id)}
              submitLabel="Salvar campanha"
              variante="secundario"
            >
              <CampanhaFields campanha={campanha} />
            </ActionForm>
            <div className="flex flex-col gap-2 border-t border-line pt-5">
              <p className="text-sm text-muted">Excluir a campanha mantém os leads, que ficam sem campanha.</p>
              <div>
                <Confirmar
                  action={excluirCampanha.bind(null, campanha.id)}
                  rotulo="Excluir campanha"
                  pergunta="Excluir esta campanha?"
                  confirmar="Excluir"
                />
              </div>
            </div>
          </div>
        </details>
      </Card>
    </div>
  );
}
