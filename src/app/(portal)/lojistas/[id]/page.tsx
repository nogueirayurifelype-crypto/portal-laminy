import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Confirmar } from "@/components/confirmar";
import { Dados, Field, Grid } from "@/components/fields";
import { Num, PageHeader, Secao, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { contasFinanceiras, lojistas, responsaveis } from "@/db/schema";
import { formatCentavos, formatData } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { adicionarResponsavel, removerResponsavel, tornarPrincipal } from "../actions";

export const metadata: Metadata = { title: "Lojista" };

export default async function LojistaPage({ params }: PageProps<"/lojistas/[id]">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const lojista = await db.query.lojistas.findFirst({
    where: eq(lojistas.id, id.data),
    with: {
      responsaveis: { orderBy: [desc(responsaveis.principal), asc(responsaveis.createdAt)] },
      contas: { orderBy: [desc(contasFinanceiras.createdAt)] },
    },
  });
  if (!lojista) notFound();

  const l = lojista;
  const endereco = [
    [l.logradouro, l.numero].filter(Boolean).join(", "),
    l.bairro,
    [l.cidade, l.uf].filter(Boolean).join("/"),
    l.cep,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={l.nome}
        meta={<Status valor={l.status} />}
        descricao={l.razaoSocial ?? undefined}
        voltar={{ href: "/lojistas", label: "Lojistas" }}
      >
        <Link href={`/financeiro/${l.id}`} className={botao.secundario}>
          Financeiro →
        </Link>
        <Link href={`/lojistas/${l.id}/editar`} className={botao.primario}>
          Editar
        </Link>
      </PageHeader>

      <Secao titulo="Dados básicos">
        <div className="flex flex-col gap-5">
          <Dados
            itens={[
              ["CNPJ", l.cnpj ? <Num>{l.cnpj}</Num> : null],
              ["E-mail", l.email],
              ["Telefone", l.telefone ? <Num>{l.telefone}</Num> : null],
              ["WhatsApp", l.whatsapp ? <Num>{l.whatsapp}</Num> : null],
              ["Nicho", l.nicho],
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
              <span className="font-mono text-xs tracking-wide text-muted uppercase">Observações</span>
              <p className="text-sm whitespace-pre-wrap">{l.observacoes}</p>
            </div>
          )}
        </div>
      </Secao>

      <Secao titulo="Responsáveis" semPadding>
        {l.responsaveis.length === 0 ? (
          <Vazio>Nenhum responsável cadastrado. Adicione o contato principal abaixo.</Vazio>
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
                    <div className="flex justify-end gap-2">
                      {!r.principal && (
                        <form action={tornarPrincipal.bind(null, l.id, r.id)}>
                          <button type="submit" className={botao.secundario}>
                            Tornar principal
                          </button>
                        </form>
                      )}
                      <Confirmar
                        action={removerResponsavel.bind(null, l.id, r.id)}
                        rotulo="Remover"
                        pergunta={`Remover ${r.nome}?`}
                        confirmar="Remover"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
        <details className="border-t border-line">
          <summary className="flex min-h-12 items-center px-5 text-sm font-medium">+ Adicionar responsável</summary>
          <div className="px-5 pt-1 pb-5">
            <ActionForm
              action={adicionarResponsavel.bind(null, l.id)}
              submitLabel="Adicionar"
              variante="secundario"
              resetOnSuccess
            >
              <Grid>
                <Field name="nome" label="Nome" required />
                <Field name="cargo" label="Cargo" />
                <Field name="telefone" label="Telefone" type="tel" />
                <Field name="email" label="E-mail" type="email" />
              </Grid>
            </ActionForm>
          </div>
        </details>
      </Secao>

      <Secao
        titulo="Contas financeiras"
        semPadding
        acoes={
          <Link href={`/financeiro/${l.id}`} className="text-sm">
            Gerenciar no financeiro →
          </Link>
        }
      >
        {l.contas.length === 0 ? (
          <Vazio
            acao={
              <Link href={`/financeiro/${l.id}`} className={botao.secundario}>
                + Criar conta no financeiro
              </Link>
            }
          >
            Nenhuma conta cadastrada para este lojista.
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
                <th>Início</th>
                <th>Fim</th>
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
                  <td>{c.diaVencimento ? <Num>DIA {String(c.diaVencimento).padStart(2, "0")}</Num> : "—"}</td>
                  <td>
                    <Status valor={c.status} />
                  </td>
                  <td>
                    <Num>{formatData(c.inicio)}</Num>
                  </td>
                  <td>
                    <Num>{formatData(c.fim)}</Num>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Secao>
    </div>
  );
}
