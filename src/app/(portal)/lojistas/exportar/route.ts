import { db } from "@/db";
import { lojistas } from "@/db/schema";
import { gerarCsv, respostaCsv } from "@/lib/csv";
import { hojeISO } from "@/lib/format";
import { linhasExemplo } from "@/lib/planilha";
import { requireSession } from "@/lib/session";

import { filtrosLojistas } from "../filtros";
import { COLUNAS_LOJISTA, linhaLojista } from "../planilha";

/** CSV dos lojistas com os filtros da lista; `?modelo=1` baixa o modelo (cabeçalhos + 2 linhas de exemplo). */
export async function GET(request: Request) {
  await requireSession();
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const cabecalhos = COLUNAS_LOJISTA.map((c) => c.cabecalho);

  if (sp.modelo) return respostaCsv("modelo_lojistas.csv", gerarCsv(cabecalhos, linhasExemplo(COLUNAS_LOJISTA)));

  const { where, orderBy } = filtrosLojistas(sp);
  const lista = await db.select().from(lojistas).where(where).orderBy(orderBy);
  return respostaCsv(`lojistas_${hojeISO().replaceAll("-", "_")}.csv`, gerarCsv(cabecalhos, lista.map(linhaLojista)));
}
