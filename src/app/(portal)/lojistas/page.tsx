import { desc, ilike, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, Num, PageHeader, Status, Tabela, Vazio, botao } from "@/components/ui";
import { db } from "@/db";
import { lojistas } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Lojistas" };

export default async function LojistasPage({ searchParams }: PageProps<"/lojistas">) {
  await requireSession();
  const { q } = await searchParams;
  const busca = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const termo = `%${busca.replace(/[%_\\]/g, "\\$&")}%`;
  const digitos = busca.replace(/\D/g, "");
  const filtro = busca
    ? or(
        ilike(lojistas.nome, termo),
        ilike(lojistas.razaoSocial, termo),
        ilike(lojistas.email, termo),
        ilike(lojistas.cidade, termo),
        ilike(lojistas.nicho, termo),
        digitos ? ilike(lojistas.cnpj, `%${digitos}%`) : undefined,
      )
    : undefined;

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
    .orderBy(desc(lojistas.createdAt))
    .limit(200);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Lojistas" descricao="Clientes da Laminy, com contato, endereço e status.">
        <Link href="/lojistas/novo" className={botao.primario}>
          + Novo lojista
        </Link>
      </PageHeader>

      <form className="flex max-w-lg gap-2" action="/lojistas" role="search">
        <label className="sr-only" htmlFor="busca-lojistas">
          Buscar lojistas
        </label>
        <input
          id="busca-lojistas"
          name="q"
          type="search"
          placeholder="Buscar por nome, CNPJ, cidade…"
          defaultValue={busca}
        />
        <button type="submit" className={botao.secundario}>
          Buscar
        </button>
      </form>

      <Card className="overflow-hidden">
        {lista.length === 0 ? (
          busca ? (
            <Vazio
              acao={
                <Link href="/lojistas" className={botao.secundario}>
                  Limpar busca
                </Link>
              }
            >
              Nenhum lojista encontrado para “{busca}”.
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
    </div>
  );
}
