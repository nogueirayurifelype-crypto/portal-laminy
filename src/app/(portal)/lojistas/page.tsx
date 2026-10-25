import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { FiltroSelect } from "@/components/filtro-select";
import { IconeFechar } from "@/components/icones";
import { BarraBusca, Card, Num, PageHeader, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { LOJISTA_STATUS, lojistas } from "@/db/schema";
import { label } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";

const ORDENS = {
  recentes: { label: "Mais recentes", por: desc(lojistas.createdAt) },
  atualizados: { label: "Atualizados recentemente", por: desc(lojistas.updatedAt) },
  nome: { label: "Nome (A–Z)", por: asc(lojistas.nome) },
} as const;

export const metadata: Metadata = { title: "Lojistas" };

export default async function LojistasPage({ searchParams }: PageProps<"/lojistas">) {
  await requireSession();
  const sp = await searchParams;
  const busca = param(sp.q)?.trim() ?? "";
  const status = LOJISTA_STATUS.find((s) => s === param(sp.status));
  const ordem = Object.hasOwn(ORDENS, param(sp.ordem) ?? "") ? (param(sp.ordem) as keyof typeof ORDENS) : "recentes";
  // Vindo do Mapa: só quem ainda não tem latitude/longitude.
  const semCoordenadas = param(sp.coordenadas) === "sem";

  const termo = `%${busca.replace(/[%_\\]/g, "\\$&")}%`;
  const digitos = busca.replace(/\D/g, "");
  const filtroBusca = busca
    ? or(
        ilike(lojistas.nome, termo),
        ilike(lojistas.razaoSocial, termo),
        ilike(lojistas.email, termo),
        ilike(lojistas.cidade, termo),
        ilike(lojistas.nicho, termo),
        digitos ? ilike(lojistas.cnpj, `%${digitos}%`) : undefined,
      )
    : undefined;
  const filtro = and(
    filtroBusca,
    status ? eq(lojistas.status, status) : undefined,
    semCoordenadas ? or(isNull(lojistas.latitude), isNull(lojistas.longitude)) : undefined,
  );
  const filtrando = Boolean(busca || status || semCoordenadas);

  const lista = await db
    .select({
      id: lojistas.id,
      nome: lojistas.nome,
      cnpj: lojistas.cnpj,
      cidade: lojistas.cidade,
      uf: lojistas.uf,
      nicho: lojistas.nicho,
      status: lojistas.status,
    })
    .from(lojistas)
    .where(filtro)
    .orderBy(ORDENS[ordem].por)
    .limit(200);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Lojistas" descricao="Clientes da Laminy, com contato, endereço e status.">
        <Link href="/lojistas/novo" className={botao.primario}>
          + Novo lojista
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3">
        <BarraBusca
          action="/lojistas"
          busca={busca}
          rotulo="Buscar lojistas"
          placeholder="Buscar por nome, CNPJ, cidade, nicho…"
          filtros={
            <>
              {semCoordenadas && <input type="hidden" name="coordenadas" value="sem" />}
              <FiltroSelect
                name="status"
                rotulo="Filtrar por status"
                valor={status ?? ""}
                opcoes={[
                  { value: "", label: "Todos os status" },
                  ...LOJISTA_STATUS.map((s) => ({ value: s, label: label(s) })),
                ]}
              />
              <FiltroSelect
                name="ordem"
                rotulo="Ordenar por"
                valor={ordem}
                opcoes={Object.entries(ORDENS).map(([value, o]) => ({ value, label: o.label }))}
              />
            </>
          }
        />

        {semCoordenadas && (
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            Mostrando só lojistas sem coordenadas. Abra a ficha e use “Editar dados” para preencher.
            <Link
              href={hrefCom("/lojistas", { q: busca, status, ordem: ordem === "recentes" ? null : ordem })}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-black no-underline hover:border-line-strong"
            >
              Remover filtro
              <IconeFechar className="size-3" />
            </Link>
          </p>
        )}

        <Card className="overflow-hidden">
          {lista.length === 0 ? (
            filtrando ? (
              <Vazio
                acao={
                  <Link href="/lojistas" className={botao.secundario}>
                    Limpar filtros
                  </Link>
                }
              >
                {busca ? `Nenhum lojista encontrado para “${busca}”.` : "Nenhum lojista com esses filtros."}
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
            <Tabela>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Cidade</th>
                  <th>Nicho</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium">
                      <Link href={`/lojistas/${l.id}`}>{l.nome}</Link>
                    </td>
                    <td>{l.cnpj ? <Num>{l.cnpj}</Num> : "—"}</td>
                    <td>{l.cidade ? `${l.cidade}${l.uf ? `/${l.uf}` : ""}` : "—"}</td>
                    <td>{l.nicho ?? "—"}</td>
                    <td>
                      <Status valor={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Card>
        {lista.length > 0 && (
          <p className="text-[13px] text-muted tabular-nums">
            {lista.length === 1 ? "1 lojista" : `${lista.length} lojistas`}
            {busca && ` para “${busca}”`}
          </p>
        )}
      </div>
    </div>
  );
}
