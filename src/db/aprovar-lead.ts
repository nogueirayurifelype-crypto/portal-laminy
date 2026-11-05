import "server-only";

import { asc, desc, eq } from "drizzle-orm";

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
        temSite: lead.temSite,
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

/**
 * Devolve o lojista à condição de lead, numa transação. Se o lojista veio de um lead, esse lead
 * volta a `qualificado`; se foi cadastrado à mão, cria-se um lead novo (qualificado) com os mesmos
 * dados. Em ambos os casos o lojista é excluído (responsáveis em cascata). Recusa se há conta ou
 * pagamento: dado financeiro não deve sumir sem querer.
 * Sem checagem de sessão: quem chama (a server action) é responsável por isso.
 */
export async function reverterLojistaParaLeadNoBanco(executor: Executor, lojistaId: string) {
  return executor.transaction(async (tx) => {
    const [lojista] = await tx.select().from(lojistas).where(eq(lojistas.id, lojistaId)).for("update");
    if (!lojista) throw new Error("Lojista não encontrado.");

    const [conta] = await tx.select({ id: contasFinanceiras.id }).from(contasFinanceiras).where(eq(contasFinanceiras.lojistaId, lojistaId)).limit(1);
    const [pagamento] = await tx.select({ id: pagamentos.id }).from(pagamentos).where(eq(pagamentos.lojistaId, lojistaId)).limit(1);
    if (conta || pagamento) return { desfeito: false as const, motivo: "financeiro" as const };

    const [origem] = await tx.select({ id: leads.id, campanhaId: leads.campanhaId }).from(leads).where(eq(leads.lojistaId, lojistaId)).for("update");
    if (origem) {
      await tx.update(leads).set({ status: "qualificado", lojistaId: null }).where(eq(leads.id, origem.id));
      await tx.delete(lojistas).where(eq(lojistas.id, lojistaId));
      return { desfeito: true as const, leadId: origem.id, campanhaId: origem.campanhaId };
    }

    const [principal] = await tx
      .select({ nome: responsaveis.nome })
      .from(responsaveis)
      .where(eq(responsaveis.lojistaId, lojistaId))
      .orderBy(desc(responsaveis.principal), asc(responsaveis.createdAt))
      .limit(1);

    const [lead] = await tx
      .insert(leads)
      .values({
        nome: principal?.nome ?? lojista.nome,
        empresa: lojista.nome,
        razaoSocial: lojista.razaoSocial,
        cnpj: lojista.cnpj,
        email: lojista.email,
        telefone: lojista.telefone,
        whatsapp: lojista.whatsapp,
        temSite: lojista.temSite,
        site: lojista.site,
        instagram: lojista.instagram,
        facebook: lojista.facebook,
        tiktok: lojista.tiktok,
        cep: lojista.cep,
        logradouro: lojista.logradouro,
        numero: lojista.numero,
        bairro: lojista.bairro,
        cidade: lojista.cidade,
        uf: lojista.uf,
        latitude: lojista.latitude,
        longitude: lojista.longitude,
        nicho: lojista.nicho,
        status: "qualificado",
        observacoes: lojista.observacoes,
      })
      .returning({ id: leads.id });
    await tx.delete(lojistas).where(eq(lojistas.id, lojistaId));
    return { desfeito: true as const, leadId: lead.id, campanhaId: null };
  });
}
