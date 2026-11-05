import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { LEAD_STATUS, leads } from "@/db/schema";
import { gerarCsv, respostaCsv } from "@/lib/csv";
import { hojeISO } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { COLUNAS_LEAD, linhaLead } from "../../planilha";

/** CSV dos leads (filtros `status` e `campanha`); `?modelo=1` baixa só os cabeçalhos. */
export async function GET(request: Request) {
  await requireSession();
  const sp = new URL(request.url).searchParams;
  const cabecalhos = COLUNAS_LEAD.map((c) => c.cabecalho);

  if (sp.get("modelo")) return respostaCsv("modelo_leads.csv", gerarCsv(cabecalhos, []));

  const status = LEAD_STATUS.find((s) => s === sp.get("status"));
  const campanha = uuid.safeParse(sp.get("campanha"));
  const lista = await db.query.leads.findMany({
    where: and(
      status ? eq(leads.status, status) : undefined,
      campanha.success ? eq(leads.campanhaId, campanha.data) : undefined,
    ),
    orderBy: [desc(leads.createdAt)],
    with: { campanha: { columns: { nome: true } } },
  });
  return respostaCsv(`leads_${hojeISO().replaceAll("-", "_")}.csv`, gerarCsv(cabecalhos, lista.map(linhaLead)));
}
