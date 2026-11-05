import { db } from "@/db";
import { gerarCsv, respostaCsv } from "@/lib/csv";
import { hojeISO } from "@/lib/format";
import { linhasExemplo } from "@/lib/planilha";
import { requireSession } from "@/lib/session";

import { filtrosLeads } from "../../filtros";
import { COLUNAS_LEAD, linhaLead } from "../../planilha";

/** CSV dos leads com os filtros da lista (descartados só se filtrados); `?modelo=1` baixa o modelo (cabeçalhos + 2 linhas de exemplo). */
export async function GET(request: Request) {
  await requireSession();
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const cabecalhos = COLUNAS_LEAD.map((c) => c.cabecalho);

  if (sp.modelo) return respostaCsv("modelo_leads.csv", gerarCsv(cabecalhos, linhasExemplo(COLUNAS_LEAD)));

  const { where, orderBy } = filtrosLeads(sp);
  const lista = await db.query.leads.findMany({
    where,
    orderBy: [orderBy],
    with: { campanha: { columns: { nome: true } } },
  });
  return respostaCsv(`leads_${hojeISO().replaceAll("-", "_")}.csv`, gerarCsv(cabecalhos, lista.map(linhaLead)));
}
