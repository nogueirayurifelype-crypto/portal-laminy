import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { FiltroStatus } from "@/components/filtro-status";
import { Abas, Card, PageHeader, Secao, Vazio, ZonaPerigo, botao } from "@/components/ui";
import { MenuPlanilha } from "@/components/menu-planilha";
import { db } from "@/db";
import { LEAD_STATUS, campanhas, leads } from "@/db/schema";
import { label } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";
import { uuid } from "@/lib/validation";

import { atualizarCampanha, excluirCampanha } from "../actions";
import { CampanhaFields } from "../campanha-fields";
import { LEAD_OCULTO } from "../filtros";
import { LeadsTable } from "../leads-table";
import { StatusCampanhaSelect } from "../status-campanha-select";

export const metadata: Metadata = { title: "Campanha" };

export default async function CampanhaPage({ params, searchParams }: PageProps<"/campanhas/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const sp = await searchParams;
  const configuracoes = param(sp.aba) === "configuracoes";
  const status = LEAD_STATUS.find((s) => s === param(sp.status));

  const campanha = await db.query.campanhas.findFirst({
    where: eq(campanhas.id, id.data),
    with: { leads: { orderBy: [desc(leads.createdAt)] } },
  });
  if (!campanha) notFound();

  const base = `/campanhas/${campanha.id}`;
  const detalhes = [campanha.nicho, campanha.regiao].filter(Boolean).join(" · ");
  // Mesmo padrão da aba de leads: descartados ficam ocultos até filtrar por eles.
  const visiveis = campanha.leads.filter((l) => (status ? l.status === status : l.status !== LEAD_OCULTO));
  const contagens = LEAD_STATUS.map((s) => ({ status: s, total: campanha.leads.filter((l) => l.status === s).length }));

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
          exportarHref={hrefCom("/campanhas/leads/exportar", { campanha: campanha.id, status })}
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
        <div className="flex flex-col gap-3">
          {campanha.leads.length > 0 && (
            <FiltroStatus
              rotulo="Filtrar leads por status"
              status={status}
              opcoes={LEAD_STATUS}
              oculto={LEAD_OCULTO}
              contagens={contagens}
              href={(s) => hrefCom(base, { status: s })}
            />
          )}
          <Card className="overflow-hidden">
            {campanha.leads.length > 0 && visiveis.length === 0 ? (
              <Vazio>{status ? `Nenhum lead com status “${label(status)}”.` : "Todos os leads desta campanha estão descartados."}</Vazio>
            ) : (
              <LeadsTable leads={visiveis} novoHref={`/campanhas/leads/novo?campanha=${campanha.id}`} />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
