import "server-only";

import { eq } from "drizzle-orm";

import type { DB } from "./index";
import { contasFinanceiras, leads, lojistas, pagamentos, responsaveis } from "./schema";

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

    // CNPJ é único entre lojistas: se já existe, não cria (nem estoura erro de banco).
    if (lead.cnpj) {
      const [igual] = await tx.select({ id: lojistas.id }).from(lojistas).where(eq(lojistas.cnpj, lead.cnpj)).limit(1);
      if (igual) return { lojistaId: igual.id, criado: false, campanhaId: lead.campanhaId, conflitoCnpj: true as const };
    }

    const [lojista] = await tx
      .insert(lojistas)
      .values({
        nome: lead.empresa || lead.nome,
        razaoSocial: lead.razaoSocial,
        cnpj: lead.cnpj,
        email: lead.email,
        telefone: lead.telefone,
        whatsapp: lead.whatsapp,
        site: lead.site,
        instagram: lead.instagram,
        facebook: lead.facebook,
        tiktok: lead.tiktok,
        cep: lead.cep,
        logradouro: lead.logradouro,
        numero: lead.numero,
        bairro: lead.bairro,
        cidade: lead.cidade,
        uf: lead.uf,
        latitude: lead.latitude,
        longitude: lead.longitude,
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

/**
 * Desfaz a aprovação, numa transação: exclui o lojista criado (os responsáveis saem em
 * cascata) e devolve o lead a `qualificado`, sem vínculo. Recusa se o lojista já tem
 * conta ou pagamento: aí há dado financeiro que não deve sumir sem querer.
 * Sem checagem de sessão: quem chama (a server action) é responsável por isso.
 */
export async function desfazerAprovacaoNoBanco(executor: Executor, leadId: string) {
  return executor.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!lead) throw new Error("Lead não encontrado.");
    if (!lead.lojistaId) return { desfeito: false as const, motivo: "sem_lojista" as const, campanhaId: lead.campanhaId };

    const [conta] = await tx.select({ id: contasFinanceiras.id }).from(contasFinanceiras).where(eq(contasFinanceiras.lojistaId, lead.lojistaId)).limit(1);
    const [pagamento] = await tx.select({ id: pagamentos.id }).from(pagamentos).where(eq(pagamentos.lojistaId, lead.lojistaId)).limit(1);
    if (conta || pagamento) return { desfeito: false as const, motivo: "financeiro" as const, campanhaId: lead.campanhaId };

    // O lead referencia o lojista (on delete set null); zera o vínculo antes, por clareza.
    await tx.update(leads).set({ status: "qualificado", lojistaId: null }).where(eq(leads.id, leadId));
    await tx.delete(lojistas).where(eq(lojistas.id, lead.lojistaId));
    return { desfeito: true as const, campanhaId: lead.campanhaId };
  });
}
