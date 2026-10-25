import { asc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { IconeSeta, IconeVoltar } from "@/components/icones";
import { Abas, Card, Chips, Num, PageHeader, Resumo, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { PAGAMENTO_STATUS, contasFinanceiras, lojistas, pagamentos } from "@/db/schema";
import {
  competenciaAnterior,
  competenciaAtual,
  competenciaSeguinte,
  formatCentavos,
  formatMesExtenso,
  label,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";

import { PagamentosTabela, PainelPagar, PainelRegistrar } from "./pagamentos";

export const metadata: Metadata = { title: "Financeiro" };

// Atrasados primeiro: é o que pede ação.
const ORDEM_STATUS: Record<string, number> = { atrasado: 0, pendente: 1, pago: 2 };

export default async function FinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  await requireSession();
  const sp = await searchParams;
  const aba = param(sp.aba) === "contas" ? "contas" : "pagamentos";
  const mesParam = param(sp.mes);
  const competencia = mesParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? `${mesParam}-01` : competenciaAtual();
  const status = PAGAMENTO_STATUS.find((s) => s === param(sp.status));
  const painel = param(sp.painel);

  const mes = competencia === competenciaAtual() ? null : competencia.slice(0, 7);
  const aqui = hrefCom("/financeiro", { aba: aba === "contas" ? "contas" : null, mes, status });
  const contas = await db
    .select({ id: contasFinanceiras.id, conta: contasFinanceiras.conta, lojista: lojistas.nome })
    .from(contasFinanceiras)
    .innerJoin(lojistas, eq(lojistas.id, contasFinanceiras.lojistaId))
    .where(eq(contasFinanceiras.status, "ativa"))
    .orderBy(asc(lojistas.nome), asc(contasFinanceiras.conta));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Financeiro"
        descricao="Mensalidades e pagamentos. Cobrança manual: Pix, boleto ou cartão."
      >
        {contas.length > 0 && (
          <Link
            href={hrefCom("/financeiro", { mes, status, painel: "registrar" })}
            scroll={false}
            className={botao.primario}
          >
            + Registrar pagamento
          </Link>
        )}
      </PageHeader>

      <Abas
        itens={[
          { href: hrefCom("/financeiro", { mes }), label: "Pagamentos do mês", ativo: aba === "pagamentos" },
          { href: "/financeiro?aba=contas", label: "Contas por lojista", ativo: aba === "contas" },
        ]}
      />

      {aba === "pagamentos" ? (
        <PagamentosDoMes competencia={competencia} mes={mes} status={status} painel={painel} alvo={param(sp.id)} aqui={aqui} />
      ) : (
        <ContasPorLojista />
      )}

      {painel === "registrar" && contas.length > 0 && (
        <PainelRegistrar
          contas={contas.map((c) => ({ value: c.id, label: `${c.lojista} · ${c.conta}` }))}
          lojistaId={null}
          competencia={competencia}
          fecharHref={aqui}
        />
      )}
    </div>
  );
}

async function PagamentosDoMes({
  competencia,
  mes,
  status,
  painel,
  alvo,
  aqui,
}: {
  competencia: string;
  mes: string | null;
  status: string | undefined;
  painel: string | undefined;
  alvo: string | undefined;
  aqui: string;
}) {
  const doMes = (
    await db.query.pagamentos.findMany({
      where: eq(pagamentos.competencia, competencia),
      with: {
        lojista: { columns: { id: true, nome: true } },
        conta: { columns: { conta: true, diaVencimento: true } },
      },
    })
  ).sort(
    (a, b) =>
      ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || a.lojista.nome.localeCompare(b.lojista.nome, "pt-BR"),
  );

  const soma = (filtro: (s: string) => boolean) =>
    doMes.filter((p) => filtro(p.status)).reduce((t, p) => t + p.valor, 0);
  const lista = status ? doMes.filter((p) => p.status === status) : doMes;
  const pagar = painel === "pagar" ? doMes.find((p) => p.id === alvo && p.status !== "pago") : undefined;

  const anterior = competenciaAnterior(competencia).slice(0, 7);
  const seguinte = competenciaSeguinte(competencia).slice(0, 7);
  const navegar = "inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-black no-underline hover:bg-hover";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={hrefCom("/financeiro", { mes: anterior, status })} aria-label="Mês anterior" className={navegar}>
            <IconeVoltar />
          </Link>
          <span className="min-w-40 text-center text-base font-semibold">{formatMesExtenso(competencia)}</span>
          <Link href={hrefCom("/financeiro", { mes: seguinte, status })} aria-label="Próximo mês" className={navegar}>
            <IconeSeta />
          </Link>
          {mes && (
            <Link href={hrefCom("/financeiro", { status })} className="ml-1 text-[13px]">
              Mês atual
            </Link>
          )}
        </div>
        <Chips
          rotulo="Filtrar por status"
          itens={[
            { href: hrefCom("/financeiro", { mes }), label: "Todos", ativo: !status, contagem: doMes.length },
            ...PAGAMENTO_STATUS.map((s) => ({
              href: hrefCom("/financeiro", { mes, status: s }),
              label: label(s),
              ativo: status === s,
              contagem: doMes.filter((p) => p.status === s).length,
            })),
          ]}
        />
      </div>

      <Resumo
        itens={[
          { rotulo: "A receber", valor: formatCentavos(soma((s) => s !== "pago")) },
          { rotulo: "Atrasado", valor: formatCentavos(soma((s) => s === "atrasado")), tom: "danger" },
          { rotulo: "Recebido", valor: formatCentavos(soma((s) => s === "pago")), tom: "ok" },
        ]}
      />

      <Card className="overflow-hidden">
        {lista.length === 0 ? (
          <Vazio>
            {doMes.length === 0
              ? `Nenhum pagamento lançado para ${formatMesExtenso(competencia).toLowerCase()}. Use “Registrar pagamento”.`
              : "Nenhum pagamento com este status no mês."}
          </Vazio>
        ) : (
          <PagamentosTabela
            pagamentos={lista}
            pagarHref={(id) => hrefCom("/financeiro", { mes, status, painel: "pagar", id })}
          />
        )}
      </Card>

      {pagar && <PainelPagar pagamento={pagar} fecharHref={aqui} />}
    </>
  );
}

async function ContasPorLojista() {
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
    <Card className="overflow-hidden">
      {linhas.length === 0 ? (
        <Vazio
          acao={
            <Link href="/lojistas/novo" className={botao.secundario}>
              + Novo lojista
            </Link>
          }
        >
          Nenhum lojista cadastrado. As contas financeiras são criadas na ficha de cada lojista.
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
                  <Link href={`/lojistas/${l.lojistaId}?aba=financeiro`}>{l.lojista}</Link>
                </td>
                <td>{l.conta ?? <span className="text-muted">Sem conta</span>}</td>
                <td className="text-right">
                  <Num>{formatCentavos(l.mensalidade)}</Num>
                </td>
                <td>{l.diaVencimento ? <Num>Dia {String(l.diaVencimento).padStart(2, "0")}</Num> : "—"}</td>
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
  );
}
