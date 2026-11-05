import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { FiltroSelect } from "@/components/filtro-select";
import { FiltroStatus } from "@/components/filtro-status";
import { IconeFechar } from "@/components/icones";
import { StatusSelect } from "@/components/status-select";
import { TabelaCadastros } from "@/components/tabela-cadastros";
import { BarraBusca, Card, PageHeader, Vazio, botao } from "@/components/ui";
import { MenuPlanilha } from "@/components/menu-planilha";
import { db } from "@/db";
import { LOJISTA_STATUS, lojistas, responsaveis } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { hrefCom } from "@/lib/url";

import { alterarStatusLojista } from "./actions";
import { LOJISTA_OCULTO, ORDENS, filtrosLojistas } from "./filtros";
import { MenuLojista } from "./menu-lojista";

export const metadata: Metadata = { title: "Lojistas" };

export default async function LojistasPage({ searchParams }: PageProps<"/lojistas">) {
  await requireSession();
  const sp = await searchParams;
  const { busca, status, ordem, semCoordenadas, filtrando, semStatus, where, orderBy } = filtrosLojistas(sp);
  const parametros = (mudar: { status?: string } = {}) => ({
    q: busca,
    status: "status" in mudar ? mudar.status : status,
    ordem: ordem === "recentes" ? null : ordem,
    coordenadas: semCoordenadas ? "sem" : null,
  });

  const [porStatus, lista] = await Promise.all([
    db.select({ status: lojistas.status, total: count() }).from(lojistas).where(semStatus).groupBy(lojistas.status),
    db
      .select({
        id: lojistas.id,
        nome: lojistas.nome,
        // Mesma coluna "contato" do lead: o responsável principal.
        contato: responsaveis.nome,
        cnpj: lojistas.cnpj,
        telefone: lojistas.telefone,
        cidade: lojistas.cidade,
        uf: lojistas.uf,
        nicho: lojistas.nicho,
        status: lojistas.status,
      })
      .from(lojistas)
      .leftJoin(responsaveis, and(eq(responsaveis.lojistaId, lojistas.id), eq(responsaveis.principal, true)))
      .where(where)
      .orderBy(orderBy)
      .limit(200),
  ]);
  const existeAlgum = porStatus.some((p) => p.total > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Lojistas" descricao="Clientes da Laminy, com contato, endereço e status.">
        {/* Exportar respeita os filtros atuais. */}
        <MenuPlanilha importarHref="/lojistas/importar" exportarHref={hrefCom("/lojistas/exportar", parametros())} />
        <Link href="/lojistas/novo" className={botao.primario}>
          + Novo lojista
        </Link>
      </PageHeader>

      {sp.erro === "financeiro" && (
        <p role="alert" className="rounded-card border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          Não dá para voltar para lead: o lojista já tem conta ou pagamento no financeiro. Remova isso na ficha do lojista primeiro.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <BarraBusca
          action="/lojistas"
          busca={busca}
          rotulo="Buscar lojistas"
          placeholder="Buscar por nome, CNPJ, cidade, nicho…"
          filtros={
            <>
              {semCoordenadas && <input type="hidden" name="coordenadas" value="sem" />}
              {status && <input type="hidden" name="status" value={status} />}
              <FiltroSelect
                name="ordem"
                rotulo="Ordenar por"
                valor={ordem}
                opcoes={Object.entries(ORDENS).map(([value, o]) => ({ value, label: o.label }))}
              />
            </>
          }
        />
        <FiltroStatus
          rotulo="Filtrar lojistas por status"
          status={status}
          opcoes={LOJISTA_STATUS}
          oculto={LOJISTA_OCULTO}
          contagens={porStatus}
          href={(s) => hrefCom("/lojistas", parametros({ status: s }))}
        />

        {semCoordenadas && (
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            Mostrando só lojistas sem coordenadas. Abra a ficha e use “Editar dados” para preencher.
            <Link
              href={hrefCom("/lojistas", { ...parametros(), coordenadas: null })}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-black no-underline hover:border-line-strong"
            >
              Remover filtro
              <IconeFechar className="size-3" />
            </Link>
          </p>
        )}

        <Card className="overflow-hidden">
          {lista.length === 0 ? (
            filtrando || existeAlgum ? (
              <Vazio
                acao={
                  <Link href="/lojistas" className={botao.secundario}>
                    Limpar filtros
                  </Link>
                }
              >
                {busca
                  ? `Nenhum lojista encontrado para “${busca}”.`
                  : filtrando
                    ? "Nenhum lojista com esses filtros."
                    : "Nenhum lojista fora dos cancelados. Veja em “Cancelados”."}
              </Vazio>
            ) : (
              <Vazio
                acao={
                  <Link href="/lojistas/novo" className={botao.secundario}>
                    + Cadastrar o primeiro lojista
                  </Link>
                }
              >
                Nenhum lojista cadastrado ainda. Lojistas também surgem ao aprovar um lead em Campanhas.
              </Vazio>
            )
          ) : (
            <TabelaCadastros
              linhas={lista.map((l) => ({
                ...l,
                href: `/lojistas/${l.id}`,
                status: (
                  <StatusSelect
                    nome={l.nome}
                    status={l.status}
                    opcoes={LOJISTA_STATUS}
                    alterar={alterarStatusLojista.bind(null, l.id)}
                  />
                ),
                acoes: <MenuLojista id={l.id} nome={l.nome} />,
              }))}
            />
          )}
        </Card>
        {lista.length > 0 && (
          <p className="text-[13px] text-muted tabular-nums">
            {lista.length === 1 ? "1 lojista" : `${lista.length} lojistas`}
            {busca && ` para “${busca}”`}
            {!status && " · cancelados ocultos"}
          </p>
        )}
      </div>
    </div>
  );
}
