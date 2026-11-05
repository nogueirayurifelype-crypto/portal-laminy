import { asc, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { FiltroSelect } from "@/components/filtro-select";
import { FiltroStatus } from "@/components/filtro-status";
import { Abas, BarraBusca, Card, Num, PageHeader, Tabela, Vazio, botao } from "@/components/ui";
import { MenuPlanilha } from "@/components/menu-planilha";
import { db } from "@/db";
import { LEAD_STATUS, campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";

import { LEAD_OCULTO, ORDENS_LEADS, filtrosLeads } from "./filtros";
import { LeadsTable } from "./leads-table";
import { StatusCampanhaSelect } from "./status-campanha-select";

export const metadata: Metadata = { title: "Campanhas e leads" };

const LEADS_HREF = "/campanhas?aba=leads";

type Filtros = ReturnType<typeof filtrosLeads>;

export default async function CampanhasPage({ searchParams }: PageProps<"/campanhas">) {
  await requireSession();
  const sp = await searchParams;
  const filtros = filtrosLeads(sp);
  // Campanhas é a aba padrão; os filtros de leads só valem na aba de leads.
  const aba = param(sp.aba) === "leads" || filtros.status ? "leads" : "campanhas";

  const [totalCampanhas] = await db.select({ total: count() }).from(campanhas);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Campanhas e leads"
        descricao="Prospecção: campanha gera lead, lead qualificado é aprovado e vira lojista."
      >
        {aba === "leads" ? (
          <>
            {/* Exportar respeita os filtros atuais. */}
            <MenuPlanilha
              importarHref="/campanhas/leads/importar"
              exportarHref={hrefCom("/campanhas/leads/exportar", parametros(filtros))}
            />
            <Link href="/campanhas/leads/novo" className={botao.primario}>
              + Novo lead
            </Link>
          </>
        ) : (
          <>
            <Link href="/campanhas/leads/novo" className={botao.secundario}>
              + Novo lead
            </Link>
            <Link href="/campanhas/nova" className={botao.primario}>
              + Nova campanha
            </Link>
          </>
        )}
      </PageHeader>

      <Abas
        itens={[
          { href: "/campanhas", label: "Campanhas", ativo: aba === "campanhas", contagem: totalCampanhas.total },
          { href: LEADS_HREF, label: "Leads", ativo: aba === "leads" },
        ]}
      />

      {aba === "leads" ? <Leads filtros={filtros} /> : <Campanhas />}
    </div>
  );
}

/** Filtros atuais como parâmetros de URL (sem os valores padrão). */
function parametros(f: Filtros, mudar: { status?: string } = {}) {
  return {
    q: f.busca,
    status: "status" in mudar ? mudar.status : f.status,
    campanha: f.campanha,
    ordem: f.ordem === "recentes" ? null : f.ordem,
  };
}

async function Leads({ filtros }: { filtros: Filtros }) {
  const { busca, status, campanha, ordem, filtrando, semStatus, where, orderBy } = filtros;
  const [porStatus, lista, listaCampanhas] = await Promise.all([
    db.select({ status: leads.status, total: count() }).from(leads).where(semStatus).groupBy(leads.status),
    db
      .select({
        id: leads.id,
        nome: leads.nome,
        empresa: leads.empresa,
        cnpj: leads.cnpj,
        telefone: leads.telefone,
        cidade: leads.cidade,
        uf: leads.uf,
        nicho: leads.nicho,
        status: leads.status,
        lojistaId: leads.lojistaId,
      })
      .from(leads)
      .where(where)
      .orderBy(orderBy)
      .limit(200),
    db.select({ id: campanhas.id, nome: campanhas.nome }).from(campanhas).orderBy(asc(campanhas.nome)),
  ]);
  const existeAlgum = porStatus.some((p) => p.total > 0);

  return (
    <div className="flex flex-col gap-3">
      <BarraBusca
        action="/campanhas"
        busca={busca}
        rotulo="Buscar leads"
        placeholder="Buscar por nome, empresa, CNPJ, cidade, nicho…"
        filtros={
          <>
            <input type="hidden" name="aba" value="leads" />
            {status && <input type="hidden" name="status" value={status} />}
            {listaCampanhas.length > 0 && (
              <FiltroSelect
                name="campanha"
                rotulo="Filtrar por campanha"
                valor={campanha ?? ""}
                opcoes={[{ value: "", label: "Todas as campanhas" }, ...listaCampanhas.map((c) => ({ value: c.id, label: c.nome }))]}
              />
            )}
            <FiltroSelect
              name="ordem"
              rotulo="Ordenar por"
              valor={ordem}
              opcoes={Object.entries(ORDENS_LEADS).map(([value, o]) => ({ value, label: o.label }))}
            />
          </>
        }
      />
      <FiltroStatus
        rotulo="Filtrar leads por status"
        status={status}
        opcoes={LEAD_STATUS}
        oculto={LEAD_OCULTO}
        contagens={porStatus}
        href={(s) => hrefCom("/campanhas", { aba: "leads", ...parametros(filtros, { status: s }) })}
      />
      <Card className="overflow-hidden">
        {lista.length === 0 && (filtrando || existeAlgum) ? (
          <Vazio
            acao={
              <Link href={LEADS_HREF} className={botao.secundario}>
                Limpar filtros
              </Link>
            }
          >
            {busca
              ? `Nenhum lead encontrado para “${busca}”.`
              : filtrando
                ? "Nenhum lead com esses filtros."
                : "Nenhum lead fora dos descartados. Veja em “Descartados”."}
          </Vazio>
        ) : (
          <LeadsTable leads={lista} novoHref="/campanhas/leads/novo" />
        )}
      </Card>
      {lista.length > 0 && (
        <p className="text-[13px] text-muted tabular-nums">
          {lista.length === 1 ? "1 lead" : `${lista.length} leads`}
          {busca && ` para “${busca}”`}
          {!status && " · descartados ocultos"}
        </p>
      )}
    </div>
  );
}

async function Campanhas() {
  const lista = await db
    .select({
      id: campanhas.id,
      nome: campanhas.nome,
      nicho: campanhas.nicho,
      regiao: campanhas.regiao,
      status: campanhas.status,
      leads: count(leads.id),
    })
    .from(campanhas)
    .leftJoin(leads, eq(leads.campanhaId, campanhas.id))
    .groupBy(campanhas.id)
    .orderBy(desc(campanhas.createdAt));

  return (
    <Card className="overflow-hidden">
      {lista.length === 0 ? (
        <Vazio
          acao={
            <Link href="/campanhas/nova" className={botao.secundario}>
              + Criar a primeira campanha
            </Link>
          }
        >
          Nenhuma campanha. Uma campanha agrupa leads por nicho e região.
        </Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Nicho</th>
              <th>Região</th>
              <th>Status</th>
              <th className="text-right">Leads</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">
                  <Link href={`/campanhas/${c.id}`}>{c.nome}</Link>
                </td>
                <td>{c.nicho ?? "—"}</td>
                <td>{c.regiao ?? "—"}</td>
                <td>
                  <StatusCampanhaSelect id={c.id} nome={c.nome} status={c.status} />
                </td>
                <td className="text-right">
                  <Num>{c.leads}</Num>
                </td>
                <td className="text-right whitespace-nowrap">
                  <Link href={`/campanhas/${c.id}?aba=configuracoes`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Card>
  );
}
