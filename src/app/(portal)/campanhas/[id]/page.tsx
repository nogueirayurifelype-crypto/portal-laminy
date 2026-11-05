import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { Abas, Card, PageHeader, Secao, ZonaPerigo, botao } from "@/components/ui";
import { MenuPlanilha } from "@/components/menu-planilha";
import { db } from "@/db";
import { campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { param } from "@/lib/url";
import { uuid } from "@/lib/validation";

import { atualizarCampanha, excluirCampanha } from "../actions";
import { CampanhaFields } from "../campanha-fields";
import { LeadsTable } from "../leads-table";
import { StatusCampanhaSelect } from "../status-campanha-select";

export const metadata: Metadata = { title: "Campanha" };

export default async function CampanhaPage({ params, searchParams }: PageProps<"/campanhas/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const configuracoes = param((await searchParams).aba) === "configuracoes";

  const campanha = await db.query.campanhas.findFirst({
    where: eq(campanhas.id, id.data),
    with: { leads: { orderBy: [desc(leads.createdAt)] } },
  });
  if (!campanha) notFound();

  const base = `/campanhas/${campanha.id}`;
  const detalhes = [campanha.nicho, campanha.regiao].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={campanha.nome}
        meta={<StatusCampanhaSelect id={campanha.id} nome={campanha.nome} status={campanha.status} />}
        descricao={campanha.descricao ?? (detalhes || undefined)}
        voltar={{ href: "/campanhas", label: "Campanhas" }}
      >
        <MenuPlanilha
          importarHref={`/campanhas/leads/importar?campanha=${campanha.id}`}
          exportarHref={`/campanhas/leads/exportar?campanha=${campanha.id}`}
        />
        <Link href={`${base}?aba=configuracoes`} className={botao.secundario}>
          Editar campanha
        </Link>
        <Link href={`/campanhas/leads/novo?campanha=${campanha.id}`} className={botao.primario}>
          + Novo lead
        </Link>
      </PageHeader>

      <Abas
        itens={[
          { href: base, label: "Leads", ativo: !configuracoes, contagem: campanha.leads.length },
          { href: `${base}?aba=configuracoes`, label: "Configurações", ativo: configuracoes },
        ]}
      />

      {configuracoes ? (
        <>
          <Secao titulo="Dados da campanha">
            <ActionForm action={atualizarCampanha.bind(null, campanha.id)} submitLabel="Salvar campanha" variante="secundario">
              <CampanhaFields campanha={campanha} />
            </ActionForm>
          </Secao>
          <ZonaPerigo
            titulo="Excluir campanha"
            descricao="Os leads continuam cadastrados, mas ficam sem campanha. Não dá para desfazer."
          >
            <Confirmar
              action={excluirCampanha.bind(null, campanha.id)}
              rotulo="Excluir campanha"
              pergunta="Excluir esta campanha?"
              confirmar="Excluir"
            />
          </ZonaPerigo>
        </>
      ) : (
        <Card className="overflow-hidden">
          <LeadsTable leads={campanha.leads} novoHref={`/campanhas/leads/novo?campanha=${campanha.id}`} />
        </Card>
      )}
    </div>
  );
}
