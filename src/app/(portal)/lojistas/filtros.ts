import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { LOJISTA_STATUS, lojistas } from "@/db/schema";
import { param } from "@/lib/url";

// Filtros da lista de lojistas, lidos da URL. Usados pela página e pela exportação.

export const ORDENS = {
  recentes: { label: "Mais recentes", por: desc(lojistas.createdAt) },
  atualizados: { label: "Atualizados recentemente", por: desc(lojistas.updatedAt) },
  nome: { label: "Nome (A–Z)", por: asc(lojistas.nome) },
} as const;

type Busca = Record<string, string | string[] | undefined>;

export function filtrosLojistas(sp: Busca) {
  const busca = param(sp.q)?.trim() ?? "";
  const status = LOJISTA_STATUS.find((s) => s === param(sp.status));
  const ordemParam = param(sp.ordem) ?? "";
  const ordem: keyof typeof ORDENS = Object.hasOwn(ORDENS, ordemParam) ? (ordemParam as keyof typeof ORDENS) : "recentes";
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

  return {
    busca,
    status,
    ordem,
    semCoordenadas,
    filtrando: Boolean(busca || status || semCoordenadas),
    where: and(
      filtroBusca,
      status ? eq(lojistas.status, status) : undefined,
      semCoordenadas ? or(isNull(lojistas.latitude), isNull(lojistas.longitude)) : undefined,
    ),
    orderBy: ORDENS[ordem].por,
  };
}
