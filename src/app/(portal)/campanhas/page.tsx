import { count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Abas, Card, Chips, Num, PageHeader, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { LEAD_STATUS, campanhas, leads } from "@/db/schema";
import { label } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";

import { LeadsTable } from "./leads-table";

export const metadata: Metadata = { title: "Campanhas e leads" };

export default async function CampanhasPage({ searchParams }: PageProps<"/campanhas">) {
  await requireSession();
  const sp = await searchParams;
  const aba = param(sp.aba) === "campanhas" ? "campanhas" : "leads";
  const status = LEAD_STATUS.find((s) => s === param(sp.status));

  const [totalCampanhas] = await db.select({ total: count() }).from(campanhas);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Campanhas e leads"
        descricao="Prospecção: campanha gera lead, lead qualificado é aprovado e vira lojista."
      >
        {aba === "leads" ? (
          <>
            <Link href="/campanhas/nova" className={botao.secundario}>
              + Nova campanha
            </Link>
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
          { href: "/campanhas", label: "Leads", ativo: aba === "leads" },
          {
            href: "/campanhas?aba=campanhas",
            label: "Campanhas",
            ativo: aba === "campanhas",
            contagem: totalCampanhas.total,
          },
        ]}
      />

      {aba === "leads" ? <Leads status={status} /> : <Campanhas />}
    </div>
  );
}

async function Leads({ status }: { status: (typeof LEAD_STATUS)[number] | undefined }) {
  const [porStatus, lista] = await Promise.all([
    db.select({ status: leads.status, total: count() }).from(leads).groupBy(leads.status),
    db.query.leads.findMany({
      where: status ? eq(leads.status, status) : undefined,
      orderBy: [desc(leads.createdAt)],
      limit: 200,
      with: { campanha: { columns: { nome: true } } },
    }),
  ]);
  const contagem = (s: string) => porStatus.find((p) => p.status === s)?.total ?? 0;
  const total = porStatus.reduce((t, p) => t + p.total, 0);

  return (
    <div className="flex flex-col gap-3">
      <Chips
        rotulo="Filtrar leads por status"
        itens={[
          { href: "/campanhas", label: "Todos", ativo: !status, contagem: total },
          ...LEAD_STATUS.map((s) => ({
            href: hrefCom("/campanhas", { status: s }),
            label: label(s),
            ativo: status === s,
            contagem: contagem(s),
          })),
        ]}
      />
      <Card className="overflow-hidden">
        {status && lista.length === 0 ? (
          <Vazio>Nenhum lead com status “{label(status)}”.</Vazio>
        ) : (
          <LeadsTable leads={lista} mostrarCampanha novoHref="/campanhas/leads/novo" />
        )}
      </Card>
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
                  <Status valor={c.status} />
                </td>
                <td className="text-right">
                  <Num>{c.leads}</Num>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Card>
  );
}
