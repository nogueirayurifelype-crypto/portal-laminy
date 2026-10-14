"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { aprovarLeadNoBanco } from "@/db/aprovar-lead";
import { CAMPANHA_STATUS, campanhas, leads } from "@/db/schema";
import { requireSession } from "@/lib/session";
import {
  type ActionState,
  emailOpcional,
  enumDe,
  erroDeValidacao,
  fromFormData,
  textoObrigatorio,
  textoOpcional,
  uuid,
} from "@/lib/validation";

import { LEAD_STATUS_EDITAVEIS } from "./constants";

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
  telefone: textoOpcional,
  email: emailOpcional,
  cidade: textoOpcional,
  nicho: textoOpcional,
  origem: textoOpcional,
  status: enumDe(LEAD_STATUS_EDITAVEIS, "Status"),
  observacoes: textoOpcional,
});

function revalidarLeads(campanhaId?: string | null) {
  revalidatePath("/campanhas");
  if (campanhaId) revalidatePath(`/campanhas/${campanhaId}`);
}

export async function criarLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const parsed = leadSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await db.insert(leads).values(parsed.data);
  revalidarLeads(parsed.data.campanhaId);
  if (parsed.data.campanhaId) redirect(`/campanhas/${parsed.data.campanhaId}`);
  redirect("/campanhas");
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
  redirect(removido?.campanhaId ? `/campanhas/${removido.campanhaId}` : "/campanhas");
}

// ---------- Regra central: aprovar lead ----------

export type AprovarLeadResultado = { lojistaId: string; criado: boolean };

/** Regra central (ver `aprovarLeadNoBanco`): cria lojista + responsável e aprova o lead. */
export async function aprovarLead(leadId: string): Promise<AprovarLeadResultado> {
  await requireSession();
  const id = uuid.parse(leadId);

  const resultado = await aprovarLeadNoBanco(db, id);

  revalidarLeads(resultado.campanhaId);
  revalidatePath(`/campanhas/leads/${id}`);
  revalidatePath("/lojistas");
  revalidatePath("/");
  return { lojistaId: resultado.lojistaId, criado: resultado.criado };
}

/** Versão para <form action>: aprova e abre a ficha do lojista. */
export async function aprovarLeadEAbrir(leadId: string) {
  const { lojistaId } = await aprovarLead(leadId);
  redirect(`/lojistas/${lojistaId}`);
}
