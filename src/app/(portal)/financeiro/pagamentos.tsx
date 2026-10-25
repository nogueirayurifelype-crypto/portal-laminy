import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { Field, Grid, Select } from "@/components/fields";
import { Menu, itemMenu } from "@/components/menu";
import { Painel } from "@/components/painel";
import { Num, Status, Tabela, botao } from "@/components/ui";
import { PAGAMENTO_FORMA, PAGAMENTO_STATUS } from "@/db/schema";
import { formatCentavos, formatCompetencia, formatDia, hojeISO, label } from "@/lib/format";

import { marcarComoAtrasado, marcarComoPago, registrarPagamento } from "./actions";

// Peças do financeiro usadas na visão geral (/financeiro) e na ficha do lojista.

export type PagamentoLinha = {
  id: string;
  competencia: string;
  valor: number;
  status: string;
  forma: string | null;
  pagoEm: Date | null;
  conta: { conta: string; diaVencimento: number | null };
  lojista?: { id: string; nome: string };
};

export function PagamentosTabela({
  pagamentos,
  pagarHref,
}: {
  pagamentos: PagamentoLinha[];
  /** Link que abre o painel "marcar como pago" deste pagamento. */
  pagarHref: (id: string) => string;
}) {
  const comLojista = pagamentos.some((p) => p.lojista);
  return (
    <Tabela>
      <thead>
        <tr>
          {comLojista && <th>Lojista</th>}
          <th>Competência</th>
          <th>Conta</th>
          <th className="text-right">Valor</th>
          <th>Vencimento</th>
          <th>Status</th>
          <th>Forma</th>
          <th>Pago em</th>
          <th>
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {pagamentos.map((p) => (
          <tr key={p.id}>
            {comLojista && (
              <td className="font-medium">
                {p.lojista && <Link href={`/lojistas/${p.lojista.id}?aba=financeiro`}>{p.lojista.nome}</Link>}
              </td>
            )}
            <td>
              <Num>{formatCompetencia(p.competencia)}</Num>
            </td>
            <td>{p.conta.conta}</td>
            <td className="text-right">
              <Num>{formatCentavos(p.valor)}</Num>
            </td>
            <td>
              {p.conta.diaVencimento ? <Num>Dia {String(p.conta.diaVencimento).padStart(2, "0")}</Num> : "—"}
            </td>
            <td>
              <Status valor={p.status} />
            </td>
            <td>{p.forma ? label(p.forma) : "—"}</td>
            <td>
              <Num>{formatDia(p.pagoEm)}</Num>
            </td>
            <td>
              <div className="flex items-center justify-end gap-1">
                {p.status !== "pago" && (
                  <Link href={pagarHref(p.id)} scroll={false} className={botao.secundario}>
                    Marcar como pago
                  </Link>
                )}
                {(p.status === "pendente" || p.lojista) && (
                  <Menu rotulo="Mais ações">
                    {p.status === "pendente" && (
                      <form action={marcarComoAtrasado.bind(null, p.id)}>
                        <button type="submit" className={itemMenu}>
                          Marcar como atrasado
                        </button>
                      </form>
                    )}
                    {p.lojista && (
                      <Link href={`/lojistas/${p.lojista.id}?aba=financeiro`} className={itemMenu}>
                        Abrir ficha do lojista
                      </Link>
                    )}
                  </Menu>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

/** Painel "marcar como pago": forma e data. */
export function PainelPagar({ pagamento, fecharHref }: { pagamento: PagamentoLinha; fecharHref: string }) {
  return (
    <Painel
      titulo="Marcar como pago"
      fecharHref={fecharHref}
      descricao={[
        pagamento.lojista?.nome,
        pagamento.conta.conta,
        formatCompetencia(pagamento.competencia),
        formatCentavos(pagamento.valor),
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      <ActionForm
        action={marcarComoPago.bind(null, pagamento.id)}
        submitLabel="Confirmar pagamento"
        aoConcluir={fecharHref}
        cancelarHref={fecharHref}
      >
        <Grid>
          <Select
            name="forma"
            label="Forma"
            options={PAGAMENTO_FORMA}
            defaultValue={pagamento.forma}
            vazio="Escolha…"
            required
          />
          <Field name="pagoEm" label="Pago em" type="date" defaultValue={hojeISO()} required />
        </Grid>
      </ActionForm>
    </Painel>
  );
}

/** Painel "registrar pagamento". Sem `lojistaId`, a conta escolhida define o lojista. */
export function PainelRegistrar({
  contas,
  lojistaId,
  competencia,
  fecharHref,
}: {
  contas: { value: string; label: string }[];
  lojistaId: string | null;
  /** Competência sugerida, "YYYY-MM-01". */
  competencia: string;
  fecharHref: string;
}) {
  return (
    <Painel titulo="Registrar pagamento" fecharHref={fecharHref} descricao="Lançamento manual: Pix, boleto ou cartão.">
      <ActionForm
        action={registrarPagamento.bind(null, lojistaId)}
        submitLabel="Registrar pagamento"
        aoConcluir={fecharHref}
        cancelarHref={fecharHref}
      >
        <Grid>
          <Select name="contaId" label="Conta" options={contas} vazio="Escolha…" required />
          <Field name="competencia" label="Competência" type="month" required defaultValue={competencia.slice(0, 7)} />
          <Field name="valor" label="Valor (R$)" inputMode="decimal" required placeholder="0,00" />
          <Select name="status" label="Status" options={PAGAMENTO_STATUS} defaultValue="pendente" />
          <Select name="forma" label="Forma" options={PAGAMENTO_FORMA} vazio="—" />
          <Field name="pagoEm" label="Pago em (se pago)" type="date" />
        </Grid>
      </ActionForm>
    </Painel>
  );
}
