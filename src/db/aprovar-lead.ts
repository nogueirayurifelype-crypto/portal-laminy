import "server-only";

import { eq } from "drizzle-orm";

import type { DB } from "./index";
import { leads, lojistas, responsaveis } from "./schema";

type Executor = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

/**
 * Converte o lead em lojista, numa única transação:
 * 1. cria o lojista copiando os dados do lead;
 * 2. cria o responsável principal com o contato do lead;
 * 3. marca o lead como `aprovado` e grava `lojista_id`.
 * Idempotente: se o lead já foi aprovado, só devolve o lojista existente.
 * Sem checagem de sessão: quem chama (a server action) é responsável por isso.
 */
export async function aprovarLeadNoBanco(executor: Executor, leadId: string) {
  return executor.transaction(async (tx) => {
    // FOR UPDATE: duas aprovações simultâneas do mesmo lead são serializadas,
    // e a segunda já enxerga o lojista_id gravado pela primeira.
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!lead) throw new Error("Lead não encontrado.");

    if (lead.lojistaId) {
      if (lead.status !== "aprovado") {
        await tx.update(leads).set({ status: "aprovado" }).where(eq(leads.id, leadId));
      }
      return { lojistaId: lead.lojistaId, criado: false, campanhaId: lead.campanhaId };
    }

    const [lojista] = await tx
      .insert(lojistas)
      .values({
        nome: lead.empresa || lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        cidade: lead.cidade,
        nicho: lead.nicho,
        status: "em_contrato",
        observacoes: lead.observacoes,
      })
      .returning({ id: lojistas.id });

    await tx.insert(responsaveis).values({
      lojistaId: lojista.id,
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      principal: true,
    });

    await tx
      .update(leads)
      .set({ status: "aprovado", lojistaId: lojista.id })
      .where(eq(leads.id, leadId));

    return { lojistaId: lojista.id, criado: true, campanhaId: lead.campanhaId };
  });
}
