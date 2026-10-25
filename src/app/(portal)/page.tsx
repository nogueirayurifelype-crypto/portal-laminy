import { and, asc, count, desc, eq, isNull, sum } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconeSeta } from "@/components/icones";
import { Card, Num, PageHeader, Secao, Status } from "@/components/ui";
import { db } from "@/db";
import { contasFinanceiras, leads, lojistas, pagamentos } from "@/db/schema";
import {
  competenciaAnterior,
  competenciaAtual,
  formatCentavos,
  formatCompetencia,
} from "@/lib/format";
import { requireSession } from "@/lib/session";

function faturamentoDe(competencia: string) {
  return db
    .select({ total: sum(pagamentos.valor).mapWith(Number) })
    .from(pagamentos)
    .where(and(eq(pagamentos.status, "pago"), eq(pagamentos.competencia, competencia)));
}

const pct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export default async function DashboardPage() {
  await requireSession();
  const competencia = competenciaAtual();
  const anterior = competenciaAnterior(competencia);

  const [[ativos], [faturamento], [faturamentoAnterior], [mrr], atrasados, pendentes, qualificados] = await Promise.all([
    db.select({ total: count() }).from(lojistas).where(eq(lojistas.status, "ativo")),
    faturamentoDe(competencia),
    faturamentoDe(anterior),
    db
      .select({ total: sum(contasFinanceiras.mensalidade).mapWith(Number) })
      .from(contasFinanceiras)
      .where(eq(contasFinanceiras.status, "ativa")),
    db.query.pagamentos.findMany({
      where: eq(pagamentos.status, "atrasado"),
      orderBy: [asc(pagamentos.competencia)],
      limit: 8,
      with: { lojista: { columns: { id: true, nome: true } } },
    }),
    db.query.pagamentos.findMany({
      where: and(eq(pagamentos.status, "pendente"), eq(pagamentos.competencia, competencia)),
      limit: 8,
      with: { lojista: { columns: { id: true, nome: true } } },
    }),
    db.query.leads.findMany({
      where: and(eq(leads.status, "qualificado"), isNull(leads.lojistaId)),
      orderBy: [desc(leads.createdAt)],
      limit: 8,
    }),
  ]);

  const atual = faturamento.total ?? 0;
  const base = faturamentoAnterior.total ?? 0;
  // Só mostra variação quando há mês anterior para comparar.
  const variacao = base > 0 ? `${pct.format((atual - base) / base)} vs. ${formatCompetencia(anterior)}` : null;

  const cards = [
    { rotulo: "Lojistas ativos", valor: String(ativos.total), detalhe: null },
    {
      rotulo: `Faturamento ${formatCompetencia(competencia)}`,
      valor: formatCentavos(atual),
      detalhe: variacao,
    },
    { rotulo: "MRR", valor: formatCentavos(mrr.total ?? 0), detalhe: "Contas ativas" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Dashboard" descricao="Visão geral dos lojistas e do faturamento." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.rotulo} className="flex flex-col gap-2 p-5">
            <div className="text-[13px] font-medium text-muted">{c.rotulo}</div>
            <div className="text-[28px] leading-tight font-semibold tracking-[-0.02em] tabular-nums">
              {c.valor}
            </div>
            {c.detalhe && <div className="text-xs text-muted tabular-nums">{c.detalhe}</div>}
          </Card>
        ))}
      </div>

      <Secao titulo="Precisa de atenção" semPadding>
        {atrasados.length + pendentes.length + qualificados.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Nada pendente: nenhum pagamento atrasado, nenhuma cobrança em aberto no mês e nenhum lead esperando aprovação.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {atrasados.length > 0 && (
              <Grupo titulo="Pagamentos atrasados" verTodos="/financeiro?aba=contas">
                {atrasados.map((p) => (
                  <Linha
                    key={p.id}
                    href={`/lojistas/${p.lojista.id}?aba=financeiro`}
                    titulo={p.lojista.nome}
                    detalhe={
                      <>
                        <Num>{formatCompetencia(p.competencia)}</Num>
                        <Num>{formatCentavos(p.valor)}</Num>
                        <Status valor="atrasado" />
                      </>
                    }
                  />
                ))}
              </Grupo>
            )}
            {pendentes.length > 0 && (
              <Grupo titulo={`A receber em ${formatCompetencia(competencia)}`} verTodos="/financeiro?status=pendente">
                {pendentes.map((p) => (
                  <Linha
                    key={p.id}
                    href={`/lojistas/${p.lojista.id}?aba=financeiro`}
                    titulo={p.lojista.nome}
                    detalhe={
                      <>
                        <Num>{formatCentavos(p.valor)}</Num>
                        <Status valor="pendente" />
                      </>
                    }
                  />
                ))}
              </Grupo>
            )}
            {qualificados.length > 0 && (
              <Grupo titulo="Leads esperando aprovação" verTodos="/campanhas?status=qualificado">
                {qualificados.map((l) => (
                  <Linha
                    key={l.id}
                    href={`/campanhas/leads/${l.id}`}
                    titulo={l.nome}
                    detalhe={
                      <>
                        {l.empresa && <span>{l.empresa}</span>}
                        {l.cidade && <span>{l.cidade}</span>}
                      </>
                    }
                  />
                ))}
              </Grupo>
            )}
          </div>
        )}
      </Secao>
    </div>
  );
}

function Grupo({ titulo, verTodos, children }: { titulo: string; verTodos: string; children: ReactNode }) {
  return (
    <div className="flex flex-col py-2">
      <div className="flex items-center justify-between gap-3 px-5 py-2">
        <h3 className="text-[13px] font-medium text-muted">{titulo}</h3>
        <Link href={verTodos} className="text-[13px]">
          Ver todos
        </Link>
      </div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

function Linha({ href, titulo, detalhe }: { href: string; titulo: string; detalhe: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 items-center gap-4 px-5 py-2 text-sm text-black no-underline transition-colors hover:bg-hover"
      >
        <span className="min-w-0 flex-1 truncate font-medium">{titulo}</span>
        <span className="flex shrink-0 items-center gap-4 text-[13px] text-muted">{detalhe}</span>
        <IconeSeta className="size-4 shrink-0 text-muted" />
      </Link>
    </li>
  );
}
