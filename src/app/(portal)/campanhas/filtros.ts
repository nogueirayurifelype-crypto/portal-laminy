import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";

import { LEAD_STATUS, leads } from "@/db/schema";
import { param, termosBusca } from "@/lib/url";
import { uuid } from "@/lib/validation";

// Filtros da lista de leads, lidos da URL. Mesmo formato dos de lojistas; usados pela aba e pela exportação.

/** Fica fora de "Todos"; aparece só ao filtrar por ele. */
export const LEAD_OCULTO = "descartado";

export const ORDENS_LEADS = {
  recentes: { label: "Mais recentes", por: desc(leads.createdAt) },
  nome: { label: "Nome (A–Z)", por: asc(sql`coalesce(${leads.empresa}, ${leads.nome})`) },
} as const;

type Busca = Record<string, string | string[] | undefined>;

export function filtrosLeads(sp: Busca) {
  const busca = param(sp.q)?.trim() ?? "";
  const status = LEAD_STATUS.find((s) => s === param(sp.status));
  const campanhaParam = uuid.safeParse(param(sp.campanha));
  const campanha = campanhaParam.success ? campanhaParam.data : undefined;
  const ordemParam = param(sp.ordem) ?? "";
  const ordem: keyof typeof ORDENS_LEADS = Object.hasOwn(ORDENS_LEADS, ordemParam)
    ? (ordemParam as keyof typeof ORDENS_LEADS)
    : "recentes";

  const { termo, digitos } = termosBusca(busca);
  const filtroBusca = busca
    ? or(
        ilike(leads.nome, termo),
        ilike(leads.empresa, termo),
        ilike(leads.razaoSocial, termo),
        ilike(leads.email, termo),
        ilike(leads.cidade, termo),
        ilike(leads.nicho, termo),
        digitos ? ilike(leads.cnpj, `%${digitos}%`) : undefined,
      )
    : undefined;

  // Tudo menos o status: base das contagens das pílulas.
  const semStatus = and(filtroBusca, campanha ? eq(leads.campanhaId, campanha) : undefined);

  return {
    busca,
    status,
    campanha,
    ordem,
    filtrando: Boolean(busca || status || campanha),
    semStatus,
    where: and(semStatus, status ? eq(leads.status, status) : ne(leads.status, LEAD_OCULTO)),
    orderBy: ORDENS_LEADS[ordem].por,
  };
}
