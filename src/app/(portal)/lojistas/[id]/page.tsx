import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Dados, Field, Grid } from "@/components/fields";
import { ItemConfirmar, Menu, itemMenu } from "@/components/menu";
import { Painel } from "@/components/painel";
import { Abas, Num, PageHeader, Resumo, Secao, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { contasFinanceiras, lojistas, pagamentos, responsaveis } from "@/db/schema";
import { competenciaAtual, formatCentavos, formatData } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";
import { uuid } from "@/lib/validation";

import { ContaFields } from "../../financeiro/conta-fields";
import { atualizarConta, criarConta } from "../../financeiro/actions";
import { PagamentosTabela, PainelPagar, PainelRegistrar } from "../../financeiro/pagamentos";
import { adicionarResponsavel, atualizarResponsavel, removerResponsavel, tornarPrincipal } from "../actions";

export const metadata: Metadata = { title: "Lojista" };

const ABAS = ["geral", "responsaveis", "financeiro"] as const;
type Aba = (typeof ABAS)[number];

async function carregar(id: string) {
  return db.query.lojistas.findFirst({
    where: eq(lojistas.id, id),
    with: {
      responsaveis: { orderBy: [desc(responsaveis.principal), asc(responsaveis.createdAt)] },
      contas: { orderBy: [desc(contasFinanceiras.createdAt)] },
      pagamentos: {
        orderBy: [desc(pagamentos.competencia), desc(pagamentos.createdAt)],
        with: { conta: { columns: { conta: true, diaVencimento: true } } },
      },
    },
  });
}
type LojistaCompleto = NonNullable<Awaited<ReturnType<typeof carregar>>>;

export default async function LojistaPage({ params, searchParams }: PageProps<"/lojistas/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const sp = await searchParams;
  const aba: Aba = ABAS.find((a) => a === param(sp.aba)) ?? "geral";
  const painel = param(sp.painel);
  const alvo = param(sp.id);

  const l = await carregar(id.data);
  if (!l) notFound();

  const base = `/lojistas/${l.id}`;
  const abaHref = (a: Aba) => hrefCom(base, { aba: a === "geral" ? null : a });
  const aqui = abaHref(aba);
  const painelHref = (nome: string, alvoId?: string) => hrefCom(base, { aba, painel: nome, id: alvoId });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={l.nome}
        meta={<Status valor={l.status} />}
        descricao={l.razaoSocial ?? undefined}
        voltar={{ href: "/lojistas", label: "Lojistas" }}
      >
        <Link href={`${base}/editar`} className={botao.secundario}>
          Editar dados
        </Link>
      </PageHeader>

      <Abas
        itens={[
          { href: abaHref("geral"), label: "Visão geral", ativo: aba === "geral" },
          {
            href: abaHref("responsaveis"),
            label: "Responsáveis",
            ativo: aba === "responsaveis",
            contagem: l.responsaveis.length,
          },
          { href: abaHref("financeiro"), label: "Financeiro", ativo: aba === "financeiro", contagem: l.contas.length },
        ]}
      />

      {aba === "geral" && <VisaoGeral l={l} />}
      {aba === "responsaveis" && <Responsaveis l={l} painelHref={painelHref} />}
      {aba === "financeiro" && <Financeiro l={l} painelHref={painelHref} />}

      <Paineis l={l} painel={painel} alvo={alvo} fecharHref={aqui} />
    </div>
  );
}

function VisaoGeral({ l }: { l: LojistaCompleto }) {
  const principal = l.responsaveis.find((r) => r.principal);
  const mensalidade = l.contas.filter((c) => c.status === "ativa").reduce((t, c) => t + (c.mensalidade ?? 0), 0);
  const abertos = l.pagamentos.filter((p) => p.status !== "pago");
  const emAberto = abertos.reduce((t, p) => t + p.valor, 0);
  const atrasado = abertos.some((p) => p.status === "atrasado");

  const endereco = [
    [l.logradouro, l.numero].filter(Boolean).join(", "),
    l.bairro,
    [l.cidade, l.uf].filter(Boolean).join("/"),
    l.cep,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Resumo
        itens={[
          { rotulo: "Responsável principal", valor: principal?.nome ?? "—" },
          { rotulo: "Mensalidade ativa", valor: formatCentavos(mensalidade) },
          {
            rotulo: atrasado ? "Em aberto (há atraso)" : "Em aberto",
            valor: formatCentavos(emAberto),
            tom: atrasado ? "danger" : undefined,
          },
        ]}
      />

      <Secao titulo="Dados do lojista">
        <div className="flex flex-col gap-5">
          <Dados
            itens={[
              ["CNPJ", l.cnpj ? <Num>{l.cnpj}</Num> : null],
              ["Nicho", l.nicho],
              ["E-mail", l.email],
              ["Telefone", l.telefone ? <Num>{l.telefone}</Num> : null],
              ["WhatsApp", l.whatsapp ? <Num>{l.whatsapp}</Num> : null],
              ["Endereço", endereco || null],
              [
                "Coordenadas",
                l.latitude != null && l.longitude != null ? (
                  <Num>
                    {l.latitude}, {l.longitude}
                  </Num>
                ) : null,
              ],
              ["Cadastrado em", <Num key="cadastro">{formatData(l.createdAt)}</Num>],
            ]}
          />
          {l.observacoes && (
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <span className="text-xs font-medium text-muted">Observações</span>
              <p className="text-sm whitespace-pre-wrap">{l.observacoes}</p>
            </div>
          )}
        </div>
      </Secao>
    </>
  );
}

type PainelHref = (nome: string, alvoId?: string) => string;

function Responsaveis({ l, painelHref }: { l: LojistaCompleto; painelHref: PainelHref }) {
  return (
    <Secao
      titulo="Responsáveis"
      semPadding
      acoes={
        <Link href={painelHref("novo-responsavel")} scroll={false} className={botao.primario}>
          + Adicionar responsável
        </Link>
      }
    >
      {l.responsaveis.length === 0 ? (
        <Vazio>Nenhum responsável cadastrado. O primeiro adicionado vira o contato principal.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {l.responsaveis.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">
                  <span className="flex flex-wrap items-center gap-2">
                    {r.nome}
                    {r.principal && <Status valor="principal" />}
                  </span>
                </td>
                <td>{r.cargo ?? "—"}</td>
                <td>{r.telefone ? <Num>{r.telefone}</Num> : "—"}</td>
                <td>{r.email ?? "—"}</td>
                <td>
                  <div className="flex justify-end">
                    <Menu rotulo={`Ações de ${r.nome}`}>
                      <Link href={painelHref("editar-responsavel", r.id)} scroll={false} className={itemMenu}>
                        Editar
                      </Link>
                      {!r.principal && (
                        <form action={tornarPrincipal.bind(null, l.id, r.id)}>
                          <button type="submit" className={itemMenu}>
                            Tornar principal
                          </button>
                        </form>
                      )}
                      <ItemConfirmar
                        action={removerResponsavel.bind(null, l.id, r.id)}
                        rotulo="Remover"
                        confirmar={`Confirmar: remover ${r.nome}`}
                      />
                    </Menu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Secao>
  );
}

function Financeiro({ l, painelHref }: { l: LojistaCompleto; painelHref: PainelHref }) {
  return (
    <>
      <Secao
        titulo="Contas"
        semPadding
        acoes={
          <Link href={painelHref("nova-conta")} scroll={false} className={botao.secundario}>
            + Nova conta
          </Link>
        }
      >
        {l.contas.length === 0 ? (
          <Vazio
            acao={
              <Link href={painelHref("nova-conta")} scroll={false} className={botao.secundario}>
                + Criar a primeira conta
              </Link>
            }
          >
            Nenhuma conta cadastrada. A conta define o plano, a mensalidade e o vencimento.
          </Vazio>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <th>Conta</th>
                <th className="text-right">Setup</th>
                <th className="text-right">Mensalidade</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Vigência</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {l.contas.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.conta}</td>
                  <td className="text-right">
                    <Num>{formatCentavos(c.valorSetup)}</Num>
                  </td>
                  <td className="text-right">
                    <Num>{formatCentavos(c.mensalidade)}</Num>
                  </td>
                  <td>{c.diaVencimento ? <Num>Dia {String(c.diaVencimento).padStart(2, "0")}</Num> : "—"}</td>
                  <td>
                    <Status valor={c.status} />
                  </td>
                  <td>
                    <Num>
                      {c.inicio || c.fim ? `${formatData(c.inicio)} – ${c.fim ? formatData(c.fim) : "atual"}` : "—"}
                    </Num>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Link href={painelHref("editar-conta", c.id)} scroll={false} className={botao.secundario}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Secao>

      <Secao
        titulo="Pagamentos"
        semPadding
        acoes={
          l.contas.length > 0 && (
            <Link href={painelHref("registrar-pagamento")} scroll={false} className={botao.primario}>
              + Registrar pagamento
            </Link>
          )
        }
      >
        {l.pagamentos.length === 0 ? (
          <Vazio>
            {l.contas.length > 0
              ? "Nenhum pagamento registrado ainda."
              : "Nenhum pagamento registrado. Crie uma conta acima para lançar pagamentos."}
          </Vazio>
        ) : (
          <PagamentosTabela
            pagamentos={l.pagamentos}
            pagarHref={(pid) => painelHref("pagar", pid)}
          />
        )}
      </Secao>
    </>
  );
}

/** Painel lateral aberto pela URL (`painel` + `id`). */
function Paineis({
  l,
  painel,
  alvo,
  fecharHref,
}: {
  l: LojistaCompleto;
  painel: string | undefined;
  alvo: string | undefined;
  fecharHref: string;
}) {
  switch (painel) {
    case "novo-responsavel":
    case "editar-responsavel": {
      const r = painel === "editar-responsavel" ? l.responsaveis.find((x) => x.id === alvo) : undefined;
      if (painel === "editar-responsavel" && !r) return null;
      return (
        <Painel titulo={r ? `Editar ${r.nome}` : "Adicionar responsável"} fecharHref={fecharHref}>
          <ActionForm
            action={r ? atualizarResponsavel.bind(null, l.id, r.id) : adicionarResponsavel.bind(null, l.id)}
            submitLabel={r ? "Salvar" : "Adicionar"}
            aoConcluir={fecharHref}
            cancelarHref={fecharHref}
          >
            <Grid>
              <Field name="nome" label="Nome" required defaultValue={r?.nome} />
              <Field name="cargo" label="Cargo" defaultValue={r?.cargo} />
              <Field name="telefone" label="Telefone" type="tel" defaultValue={r?.telefone} />
              <Field name="email" label="E-mail" type="email" defaultValue={r?.email} />
            </Grid>
          </ActionForm>
        </Painel>
      );
    }
    case "nova-conta":
    case "editar-conta": {
      const c = painel === "editar-conta" ? l.contas.find((x) => x.id === alvo) : undefined;
      if (painel === "editar-conta" && !c) return null;
      return (
        <Painel titulo={c ? `Editar conta ${c.conta}` : "Nova conta"} fecharHref={fecharHref}>
          <ActionForm
            action={c ? atualizarConta.bind(null, l.id, c.id) : criarConta.bind(null, l.id)}
            submitLabel={c ? "Salvar conta" : "Criar conta"}
            aoConcluir={fecharHref}
            cancelarHref={fecharHref}
          >
            <ContaFields conta={c} />
          </ActionForm>
        </Painel>
      );
    }
    case "registrar-pagamento":
      if (l.contas.length === 0) return null;
      return (
        <PainelRegistrar
          contas={l.contas.map((c) => ({ value: c.id, label: c.conta }))}
          lojistaId={l.id}
          competencia={competenciaAtual()}
          fecharHref={fecharHref}
        />
      );
    case "pagar": {
      const p = l.pagamentos.find((x) => x.id === alvo && x.status !== "pago");
      return p ? <PainelPagar pagamento={p} fecharHref={fecharHref} /> : null;
    }
    default:
      return null;
  }
}
