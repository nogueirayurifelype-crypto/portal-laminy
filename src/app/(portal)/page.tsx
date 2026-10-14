import { and, count, eq, sum } from "drizzle-orm";

import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { contasFinanceiras, lojistas, pagamentos } from "@/db/schema";
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

  const [[ativos], [faturamento], [faturamentoAnterior], [mrr]] = await Promise.all([
    db.select({ total: count() }).from(lojistas).where(eq(lojistas.status, "ativo")),
    faturamentoDe(competencia),
    faturamentoDe(anterior),
    db
      .select({ total: sum(contasFinanceiras.mensalidade).mapWith(Number) })
      .from(contasFinanceiras)
      .where(eq(contasFinanceiras.status, "ativa")),
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
            <div className="font-mono text-xs tracking-wide text-muted uppercase">{c.rotulo}</div>
            <div className="text-[28px] leading-tight font-semibold tracking-[-0.03em] tabular-nums">
              {c.valor}
            </div>
            {c.detalhe && <div className="font-mono text-xs text-muted tabular-nums">{c.detalhe}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
