import { count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, Num, PageHeader, Secao, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";

import { LeadsTable } from "./leads-table";

export const metadata: Metadata = { title: "Campanhas" };

export default async function CampanhasPage() {
  await requireSession();

  const [lista, ultimosLeads] = await Promise.all([
    db
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
      .orderBy(desc(campanhas.createdAt)),
    db.query.leads.findMany({
      orderBy: [desc(leads.createdAt)],
      limit: 100,
      with: { campanha: { columns: { nome: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Campanhas"
        descricao="Prospecção: campanha gera lead, lead qualificado é aprovado e vira lojista."
      >
        <Link href="/campanhas/leads/novo" className={botao.secundario}>
          + Novo lead
        </Link>
        <Link href="/campanhas/nova" className={botao.primario}>
          + Nova campanha
        </Link>
      </PageHeader>

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

      <Secao titulo="Leads recentes" semPadding>
        <LeadsTable leads={ultimosLeads} mostrarCampanha novoHref="/campanhas/leads/novo" />
      </Secao>
    </div>
  );
}
