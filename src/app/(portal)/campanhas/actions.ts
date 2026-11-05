"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { aprovarLeadNoBanco, desfazerAprovacaoNoBanco } from "@/db/aprovar-lead";
import { CAMPANHA_STATUS, campanhas, leads, lojistas } from "@/db/schema";
import { normalizarCabecalho } from "@/lib/csv";
import { type ImportState, type LinhaPrevia, digitos, lerPlanilha, statusDaPlanilha } from "@/lib/planilha";
import { requireSession } from "@/lib/session";
import {
  type ActionState,
  decimalOpcional,
  digitosOpcional,
  emailOpcional,
  enumDe,
  erroDeValidacao,
  fromFormData,
  textoObrigatorio,
  inferirTemSite,
  simNaoOpcional,
  siteCoerente,
  textoOpcional,
  ufOpcional,
  uuid,
} from "@/lib/validation";

import { LEAD_STATUS_EDITAVEIS } from "./constants";
import { COLUNAS_LEAD } from "./planilha";

// ---------- Campanhas ----------

const campanhaSchema = z.object({
  nome: textoObrigatorio("Nome"),
  nicho: textoOpcional,
  regiao: textoOpcional,
  descricao: textoOpcional,
  status: enumDe(CAMPANHA_STATUS, "Status"),
});

export async function criarCampanha(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const parsed = campanhaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const [{ id }] = await db.insert(campanhas).values(parsed.data).returning({ id: campanhas.id });
  revalidatePath("/campanhas");
  redirect(`/campanhas/${id}`);
}

export async function atualizarCampanha(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const cid = uuid.parse(id);
  const parsed = campanhaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await db.update(campanhas).set(parsed.data).where(eq(campanhas.id, cid));
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${cid}`);
  return { ok: true };
}

/** Troca o status da campanha direto da lista ou do cabeçalho. */
export async function alterarStatusCampanha(id: string, status: string) {
  await requireSession();
  const cid = uuid.parse(id);
  const novo = enumDe(CAMPANHA_STATUS, "Status").parse(status);
  await db.update(campanhas).set({ status: novo }).where(eq(campanhas.id, cid));
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${cid}`);
}

/** Exclui a campanha; os leads ficam, sem campanha (FK on delete set null). */
export async function excluirCampanha(id: string) {
  await requireSession();
  const cid = uuid.parse(id);
  await db.delete(campanhas).where(eq(campanhas.id, cid));
  revalidatePath("/campanhas");
  redirect("/campanhas");
}

// ---------- Leads ----------

const leadSchema = z.object({
  campanhaId: z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(uuid.nullable()),
  nome: textoObrigatorio("Nome"),
  empresa: textoOpcional,
  razaoSocial: textoOpcional,
  cnpj: digitosOpcional("CNPJ", 14),
  telefone: textoOpcional,
  whatsapp: textoOpcional,
  email: emailOpcional,
  temSite: simNaoOpcional,
  site: textoOpcional,
  instagram: textoOpcional,
  facebook: textoOpcional,
  tiktok: textoOpcional,
  cep: digitosOpcional("CEP", 8),
  logradouro: textoOpcional,
  numero: textoOpcional,
  bairro: textoOpcional,
  cidade: textoOpcional,
  uf: ufOpcional,
  latitude: decimalOpcional("Latitude", -90, 90),
  longitude: decimalOpcional("Longitude", -180, 180),
  nicho: textoOpcional,
  origem: textoOpcional,
  status: enumDe(LEAD_STATUS_EDITAVEIS, "Status"),
  observacoes: textoOpcional,
})
  .refine(siteCoerente.fn, siteCoerente.params)
  .transform(inferirTemSite);

function revalidarLeads(campanhaId?: string | null) {
  revalidatePath("/campanhas");
  if (campanhaId) revalidatePath(`/campanhas/${campanhaId}`);
}

/**
 * CNPJ repetido (em outro lead ou em um lojista) não é erro: avisa qual cadastro já o usa e
 * deixa seguir ("Salvar mesmo assim" reenvia com `confirmarDuplicado=1`).
 */
async function avisoCnpjLead(cnpj: string | null, formData: FormData, ignorarLeadId?: string): Promise<ActionState | null> {
  if (!cnpj || formData.get("confirmarDuplicado") === "1") return null;
  const [lojista] = await db.select({ id: lojistas.id, nome: lojistas.nome }).from(lojistas).where(eq(lojistas.cnpj, cnpj)).limit(1);
  if (lojista) {
    return {
      aviso: {
        texto: `Já existe um lojista com este CNPJ: ${lojista.nome}.`,
        link: { href: `/lojistas/${lojista.id}`, rotulo: "Abrir lojista →" },
        podeProsseguir: true,
      },
    };
  }
  const [lead] = await db
    .select({ id: leads.id, nome: leads.empresa })
    .from(leads)
    .where(ignorarLeadId ? and(eq(leads.cnpj, cnpj), ne(leads.id, ignorarLeadId)) : eq(leads.cnpj, cnpj))
    .limit(1);
  if (!lead) return null;
  return {
    aviso: {
      texto: `Já existe um lead com este CNPJ${lead.nome ? `: ${lead.nome}` : ""}.`,
      link: { href: `/campanhas/leads/${lead.id}`, rotulo: "Abrir lead →" },
      podeProsseguir: true,
    },
  };
}

export async function criarLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const parsed = leadSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const aviso = await avisoCnpjLead(parsed.data.cnpj, formData);
  if (aviso) return aviso;

  await db.insert(leads).values(parsed.data);
  revalidarLeads(parsed.data.campanhaId);
  if (parsed.data.campanhaId) redirect(`/campanhas/${parsed.data.campanhaId}`);
  redirect("/campanhas?aba=leads");
}

export async function atualizarLead(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lid = uuid.parse(id);
  const parsed = leadSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const aviso = await avisoCnpjLead(parsed.data.cnpj, formData, lid);
  if (aviso) return aviso;

  const atual = await db.query.leads.findFirst({ where: eq(leads.id, lid), columns: { status: true } });
  if (!atual) return { error: "Lead não encontrado." };

  // Lead aprovado mantém o status (o vínculo com o lojista já existe).
  const dados = atual.status === "aprovado" ? { ...parsed.data, status: "aprovado" as const } : parsed.data;
  await db.update(leads).set(dados).where(eq(leads.id, lid));
  revalidarLeads(parsed.data.campanhaId);
  revalidatePath(`/campanhas/leads/${lid}`);
  return { ok: true };
}

export async function excluirLead(id: string) {
  await requireSession();
  const lid = uuid.parse(id);
  const [removido] = await db
    .delete(leads)
    .where(eq(leads.id, lid))
    .returning({ campanhaId: leads.campanhaId });
  revalidarLeads(removido?.campanhaId);
  redirect(removido?.campanhaId ? `/campanhas/${removido.campanhaId}` : "/campanhas?aba=leads");
}

/**
 * Importa leads de um CSV. `etapa=previa` só valida; `etapa=importar` grava.
 * A coluna "Campanha" é casada pelo nome; sem ela, vale a campanha escolhida no formulário.
 * E-mail ou telefone já usado por outro lead ou por um lojista conta como duplicado.
 */
export async function importarLeads(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireSession();
  const lida = await lerPlanilha(formData, COLUNAS_LEAD);
  if ("error" in lida) return { error: lida.error };

  const padrao = z.union([z.literal(""), uuid]).catch("").parse(formData.get("campanhaId") ?? "");
  const [listaCampanhas, leadsAtuais, lojistasAtuais] = await Promise.all([
    db.select({ id: campanhas.id, nome: campanhas.nome }).from(campanhas),
    db.select({ email: leads.email, telefone: leads.telefone, whatsapp: leads.whatsapp }).from(leads),
    db.select({ email: lojistas.email, telefone: lojistas.telefone, whatsapp: lojistas.whatsapp }).from(lojistas),
  ]);
  const campanhaPorNome = new Map(listaCampanhas.map((c) => [normalizarCabecalho(c.nome), c.id]));

  // Chaves de contato: e-mail em minúsculas e telefone só com dígitos (8+).
  const chaves = (email: string | null, ...telefones: (string | null)[]) => [
    ...(email ? [email.toLowerCase()] : []),
    ...telefones.map((t) => digitos(t).replace(/^55(?=\d{10,11}$)/, "")).filter((t) => t.length >= 8),
  ];
  const deLeads = new Set(leadsAtuais.flatMap((l) => chaves(l.email, l.telefone, l.whatsapp)));
  const deLojistas = new Set(lojistasAtuais.flatMap((l) => chaves(l.email, l.telefone, l.whatsapp)));
  const naPlanilha = new Set<string>();

  const linhas: LinhaPrevia[] = [];
  const novos: z.infer<typeof leadSchema>[] = [];

  for (const { linha, dados } of lida.registros) {
    const base = {
      linha,
      nome: dados.nome || "(sem nome)",
      detalhe: [dados.empresa, dados.cidade, dados.telefone || dados.email].filter(Boolean).join(" · "),
    };
    const campanhaId = dados.campanha ? campanhaPorNome.get(normalizarCabecalho(dados.campanha)) : padrao;
    if (campanhaId === undefined) {
      linhas.push({ ...base, situacao: "erro", motivo: `Campanha “${dados.campanha}” não existe` });
      continue;
    }
    const parsed = leadSchema.safeParse({
      ...dados,
      campanhaId,
      status: statusDaPlanilha(dados.status, LEAD_STATUS_EDITAVEIS, "novo"),
    });
    if (!parsed.success) {
      linhas.push({ ...base, situacao: "erro", motivo: erroDeValidacao(parsed.error).error });
      continue;
    }

    const minhas = chaves(parsed.data.email, parsed.data.telefone, parsed.data.whatsapp);
    const motivo = minhas.some((k) => deLojistas.has(k))
      ? "Já é lojista (mesmo e-mail ou telefone)"
      : minhas.some((k) => deLeads.has(k))
        ? "Já existe lead com este e-mail ou telefone"
        : minhas.some((k) => naPlanilha.has(k))
          ? "Repetido na planilha"
          : null;
    if (motivo) {
      linhas.push({ ...base, situacao: "duplicado", motivo });
      continue;
    }
    for (const k of minhas) naPlanilha.add(k);
    novos.push(parsed.data);
    linhas.push({ ...base, situacao: "ok" });
  }

  const previa = { linhas, reconhecidas: lida.reconhecidas, ignoradas: lida.ignoradas };
  if (formData.get("etapa") !== "importar") return { previa };
  if (novos.length === 0) return { previa, error: "Nenhuma linha válida para importar." };

  await db.transaction(async (tx) => {
    for (let i = 0; i < novos.length; i += 500) await tx.insert(leads).values(novos.slice(i, i + 500));
  });

  revalidatePath("/campanhas");
  for (const id of new Set(novos.map((n) => n.campanhaId))) if (id) revalidatePath(`/campanhas/${id}`);
  revalidatePath("/");
  return { importados: novos.length };
}

// ---------- Regra central: aprovar lead ----------

export type AprovarLeadResultado = { lojistaId: string; criado: boolean; conflitoCnpj?: boolean };

/** Regra central (ver `aprovarLeadNoBanco`): cria lojista + responsável e aprova o lead. */
export async function aprovarLead(leadId: string): Promise<AprovarLeadResultado> {
  await requireSession();
  const id = uuid.parse(leadId);

  const resultado = await aprovarLeadNoBanco(db, id);

  revalidarLeads(resultado.campanhaId);
  revalidatePath(`/campanhas/leads/${id}`);
  revalidatePath("/lojistas");
  revalidatePath("/");
  return {
    lojistaId: resultado.lojistaId,
    criado: resultado.criado,
    conflitoCnpj: "conflitoCnpj" in resultado ? resultado.conflitoCnpj : undefined,
  };
}

/**
 * Troca o status de um lead direto da lista. Lead aprovado (já virou lojista) não muda por aqui:
 * para voltar atrás existe "Desfazer aprovação" na ficha do lead.
 */
export async function alterarStatusLead(leadId: string, status: string) {
  await requireSession();
  const id = uuid.parse(leadId);
  const novo = enumDe(LEAD_STATUS_EDITAVEIS, "Status").parse(status);

  const [lead] = await db
    .update(leads)
    .set({ status: novo })
    .where(and(eq(leads.id, id), isNull(leads.lojistaId)))
    .returning({ campanhaId: leads.campanhaId });
  if (!lead) return;

  revalidarLeads(lead.campanhaId);
  revalidatePath(`/campanhas/leads/${id}`);
  revalidatePath("/");
}

/** Versão para <form action>: aprova e abre a ficha do lojista. */
export async function aprovarLeadEAbrir(leadId: string) {
  const { lojistaId, conflitoCnpj } = await aprovarLead(leadId);
  // CNPJ já pertence a outro lojista: fica no lead, com aviso e link (nada foi criado).
  if (conflitoCnpj) redirect(`/campanhas/leads/${uuid.parse(leadId)}?erro=cnpj&lojista=${lojistaId}`);
  redirect(`/lojistas/${lojistaId}`);
}

/** Desfaz a aprovação (ver `desfazerAprovacaoNoBanco`) e volta para a ficha do lead. */
export async function desfazerAprovacao(leadId: string) {
  await requireSession();
  const id = uuid.parse(leadId);

  const r = await desfazerAprovacaoNoBanco(db, id);

  revalidarLeads(r.campanhaId);
  revalidatePath(`/campanhas/leads/${id}`);
  revalidatePath("/lojistas");
  revalidatePath("/");
  redirect(r.desfeito ? `/campanhas/leads/${id}` : `/campanhas/leads/${id}?erro=${r.motivo}`);
}
