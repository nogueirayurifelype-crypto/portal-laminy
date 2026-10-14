import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Field, Grid, Select } from "@/components/fields";
import { Card, Num, PageHeader, Secao, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import {
  PAGAMENTO_FORMA,
  PAGAMENTO_STATUS,
  contasFinanceiras,
  lojistas,
  pagamentos,
} from "@/db/schema";
import {
  competenciaAtual,
  formatCentavos,
  formatCompetencia,
  formatData,
  label,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { atualizarConta, criarConta, marcarComoAtrasado, marcarComoPago, registrarPagamento } from "../actions";
import { ContaFields } from "../conta-fields";

export const metadata: Metadata = { title: "Financeiro do lojista" };

export default async function FinanceiroLojistaPage({
  params,
}: PageProps<"/financeiro/[lojistaId]">) {
  await requireSession();
  const id = uuid.safeParse((await params).lojistaId);
  if (!id.success) notFound();

  const lojista = await db.query.lojistas.findFirst({
    where: eq(lojistas.id, id.data),
    columns: { id: true, nome: true, status: true },
    with: {
      contas: { orderBy: [desc(contasFinanceiras.createdAt)] },
      pagamentos: {
        orderBy: [desc(pagamentos.competencia), desc(pagamentos.createdAt)],
        with: { conta: { columns: { conta: true } } },
      },
    },
  });
  if (!lojista) notFound();

  const contaOptions = lojista.contas.map((c) => ({ value: c.id, label: c.conta }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={lojista.nome}
        meta={<Status valor={lojista.status} />}
        descricao="Contas e pagamentos deste lojista."
        voltar={{ href: "/financeiro", label: "Financeiro" }}
      >
        <Link href={`/lojistas/${lojista.id}`} className={botao.secundario}>
          Ver ficha →
        </Link>
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2>Contas</h2>
        {lojista.contas.length === 0 && (
          <Card>
            <Vazio>Nenhuma conta cadastrada. Crie a primeira abaixo para registrar pagamentos.</Vazio>
          </Card>
        )}
        {lojista.contas.map((c) => (
          <Card key={c.id}>
            <details>
              <summary className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="font-medium">{c.conta}</span>
                <Num>{formatCentavos(c.mensalidade)}/MÊS</Num>
                {c.diaVencimento ? <Num>VENCE DIA {String(c.diaVencimento).padStart(2, "0")}</Num> : null}
                <Status valor={c.status} />
                <span className="ml-auto text-sm text-muted">Editar</span>
              </summary>
              <div className="border-t border-line p-5">
                <ActionForm
                  action={atualizarConta.bind(null, lojista.id, c.id)}
                  submitLabel="Salvar conta"
                  variante="secundario"
                >
                  <ContaFields conta={c} />
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
        <Card>
          <details open={lojista.contas.length === 0}>
            <summary className="flex min-h-12 items-center px-5 text-sm font-medium">+ Nova conta</summary>
            <div className="border-t border-line p-5">
              <ActionForm
                action={criarConta.bind(null, lojista.id)}
                submitLabel="Criar conta"
                variante="secundario"
                resetOnSuccess
              >
                <ContaFields />
              </ActionForm>
            </div>
          </details>
        </Card>
      </section>

      <Secao titulo="Pagamentos" semPadding>
        {lojista.pagamentos.length === 0 ? (
          <Vazio>
            {contaOptions.length > 0
              ? "Nenhum pagamento registrado. Use o formulário abaixo para lançar o primeiro."
              : "Nenhum pagamento registrado. Cadastre uma conta acima para registrar pagamentos."}
          </Vazio>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <th>Competência</th>
                <th>Conta</th>
                <th className="text-right">Valor</th>
                <th>Status</th>
                <th>Forma</th>
                <th>Pago em</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lojista.pagamentos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Num>{formatCompetencia(p.competencia)}</Num>
                  </td>
                  <td>{p.conta.conta}</td>
                  <td className="text-right">
                    <Num>{formatCentavos(p.valor)}</Num>
                  </td>
                  <td>
                    <Status valor={p.status} />
                  </td>
                  <td>{label(p.forma)}</td>
                  <td>
                    <Num>{formatData(p.pagoEm)}</Num>
                  </td>
                  <td>
                    {p.status !== "pago" && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <form action={marcarComoPago.bind(null, lojista.id, p.id)} className="flex gap-2">
                          <select
                            name="forma"
                            defaultValue={p.forma ?? ""}
                            aria-label="Forma de pagamento"
                            className="w-auto!"
                          >
                            <option value="">Forma…</option>
                            {PAGAMENTO_FORMA.map((f) => (
                              <option key={f} value={f}>
                                {label(f)}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={botao.secundario}>
                            Marcar como pago
                          </button>
                        </form>
                        {p.status === "pendente" && (
                          <form action={marcarComoAtrasado.bind(null, lojista.id, p.id)}>
                            <button type="submit" className={botao.secundario}>
                              Atrasado
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}

        {contaOptions.length > 0 && (
          <div className="border-t border-line p-5">
            <h3 className="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Registrar pagamento</h3>
            <ActionForm action={registrarPagamento.bind(null, lojista.id)} submitLabel="Registrar pagamento" resetOnSuccess>
              <Grid>
                <Select name="contaId" label="Conta" options={contaOptions} required />
                <Field
                  name="competencia"
                  label="Competência"
                  type="month"
                  required
                  defaultValue={competenciaAtual().slice(0, 7)}
                />
                <Field name="valor" label="Valor (R$)" inputMode="decimal" required placeholder="0,00" />
                <Select name="status" label="Status" options={PAGAMENTO_STATUS} defaultValue="pendente" />
                <Select name="forma" label="Forma" options={PAGAMENTO_FORMA} vazio="—" />
                <Field name="pagoEm" label="Pago em (se pago)" type="date" />
              </Grid>
            </ActionForm>
          </div>
        )}
      </Secao>
    </div>
  );
}
