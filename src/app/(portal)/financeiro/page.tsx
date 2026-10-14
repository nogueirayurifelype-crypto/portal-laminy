import { asc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, Num, PageHeader, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { contasFinanceiras, lojistas, pagamentos } from "@/db/schema";
import { formatCentavos } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  await requireSession();

  const emAberto = db
    .select({
      contaId: pagamentos.contaId,
      pendentes: sql<number>`count(*) filter (where ${pagamentos.status} = 'pendente')`
        .mapWith(Number)
        .as("pendentes"),
      atrasados: sql<number>`count(*) filter (where ${pagamentos.status} = 'atrasado')`
        .mapWith(Number)
        .as("atrasados"),
    })
    .from(pagamentos)
    .groupBy(pagamentos.contaId)
    .as("em_aberto");

  const linhas = await db
    .select({
      lojistaId: lojistas.id,
      lojista: lojistas.nome,
      contaId: contasFinanceiras.id,
      conta: contasFinanceiras.conta,
      mensalidade: contasFinanceiras.mensalidade,
      diaVencimento: contasFinanceiras.diaVencimento,
      status: contasFinanceiras.status,
      pendentes: emAberto.pendentes,
      atrasados: emAberto.atrasados,
    })
    .from(lojistas)
    .leftJoin(contasFinanceiras, eq(contasFinanceiras.lojistaId, lojistas.id))
    .leftJoin(emAberto, eq(emAberto.contaId, contasFinanceiras.id))
    .orderBy(asc(lojistas.nome), asc(contasFinanceiras.createdAt));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Financeiro"
        descricao="Contas, mensalidades e pagamentos por lojista. Cobrança manual: Pix, boleto ou cartão."
      />
      <Card className="overflow-hidden">
        {linhas.length === 0 ? (
          <Vazio
            acao={
              <Link href="/lojistas/novo" className={botao.secundario}>
                + Novo lojista
              </Link>
            }
          >
            Nenhum lojista cadastrado. As contas financeiras são criadas a partir de um lojista.
          </Vazio>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <th>Lojista</th>
                <th>Conta</th>
                <th className="text-right">Mensalidade</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="text-right">Pendentes</th>
                <th className="text-right">Atrasados</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.contaId ?? l.lojistaId}>
                  <td className="font-medium">
                    <Link href={`/financeiro/${l.lojistaId}`}>{l.lojista}</Link>
                  </td>
                  <td>{l.conta ?? <span className="text-muted">Sem conta</span>}</td>
                  <td className="text-right">
                    <Num>{formatCentavos(l.mensalidade)}</Num>
                  </td>
                  <td>{l.diaVencimento ? <Num>DIA {String(l.diaVencimento).padStart(2, "0")}</Num> : "—"}</td>
                  <td>
                    <Status valor={l.status} />
                  </td>
                  <td className="text-right">
                    <Num>{l.pendentes ?? 0}</Num>
                  </td>
                  <td className={`text-right ${l.atrasados ? "font-semibold text-danger" : ""}`}>
                    <Num>{l.atrasados ?? 0}</Num>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Card>
    </div>
  );
}
