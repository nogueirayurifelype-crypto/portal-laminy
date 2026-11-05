"use server";

import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { reverterLojistaParaLeadNoBanco } from "@/db/aprovar-lead";
import { LOJISTA_STATUS, lojistas, responsaveis } from "@/db/schema";
import { type ImportState, type LinhaPrevia, lerPlanilha, statusDaPlanilha } from "@/lib/planilha";
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

import { COLUNAS_LOJISTA } from "./planilha";

const lojistaSchema = z.object({
  nome: textoObrigatorio("Nome"),
  razaoSocial: textoOpcional,
  cnpj: digitosOpcional("CNPJ", 14),
  email: emailOpcional,
  telefone: textoOpcional,
  whatsapp: textoOpcional,
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
  status: enumDe(LOJISTA_STATUS, "Status"),
  observacoes: textoOpcional,
})
  .refine(siteCoerente.fn, siteCoerente.params)
  .transform(inferirTemSite);

function erroDeBanco(e: unknown): ActionState {
  // 23505 = unique_violation (ex.: CNPJ repetido)
  const code = (e as { code?: string; cause?: { code?: string } })?.cause?.code ?? (e as { code?: string })?.code;
  if (code === "23505") return { error: "Já existe um lojista com este CNPJ." };
  throw e;
}

/** CNPJ é único entre lojistas: avisa qual já o usa (com link) em vez de só falhar. */
async function avisoCnpjLojista(cnpj: string | null, ignorarId?: string): Promise<ActionState | null> {
  if (!cnpj) return null;
  const [outro] = await db
    .select({ id: lojistas.id, nome: lojistas.nome })
    .from(lojistas)
    .where(ignorarId ? and(eq(lojistas.cnpj, cnpj), ne(lojistas.id, ignorarId)) : eq(lojistas.cnpj, cnpj))
    .limit(1);
  if (!outro) return null;
  return {
    aviso: {
      texto: `Já existe um lojista com este CNPJ: ${outro.nome}. Cada CNPJ só pode ter um lojista; confira se não é o mesmo cadastro.`,
      link: { href: `/lojistas/${outro.id}`, rotulo: "Abrir lojista →" },
    },
  };
}

export async function criarLojista(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const parsed = lojistaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const existente = await avisoCnpjLojista(parsed.data.cnpj);
  if (existente) return existente;

  let id: string;
  try {
    [{ id }] = await db.insert(lojistas).values(parsed.data).returning({ id: lojistas.id });
  } catch (e) {
    return erroDeBanco(e);
  }
  revalidatePath("/lojistas");
  redirect(`/lojistas/${id}`);
}

export async function atualizarLojista(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lojistaId = uuid.parse(id);
  const parsed = lojistaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const existente = await avisoCnpjLojista(parsed.data.cnpj, lojistaId);
  if (existente) return existente;

  try {
    await db.update(lojistas).set(parsed.data).where(eq(lojistas.id, lojistaId));
  } catch (e) {
    return erroDeBanco(e);
  }
  revalidatePath("/lojistas");
  redirect(`/lojistas/${lojistaId}`);
}

/** Troca o status do lojista direto da lista. */
export async function alterarStatusLojista(id: string, status: string) {
  await requireSession();
  const lojistaId = uuid.parse(id);
  const novo = enumDe(LOJISTA_STATUS, "Status").parse(status);
  await db.update(lojistas).set({ status: novo }).where(eq(lojistas.id, lojistaId));
  revalidatePath("/lojistas");
  revalidatePath(`/lojistas/${lojistaId}`);
  revalidatePath("/");
}

/** Desfaz um lojista criado por engano: ele volta a ser lead (ver `reverterLojistaParaLeadNoBanco`). */
export async function voltarLojistaParaLead(id: string) {
  await requireSession();
  const lojistaId = uuid.parse(id);
  const r = await reverterLojistaParaLeadNoBanco(db, lojistaId);
  if (!r.desfeito) redirect(`/lojistas?erro=${r.motivo}`);
  revalidatePath("/lojistas");
  revalidatePath("/campanhas");
  if (r.campanhaId) revalidatePath(`/campanhas/${r.campanhaId}`);
  revalidatePath("/mapa");
  revalidatePath("/");
  redirect(`/campanhas/leads/${r.leadId}`);
}

const responsavelSchema = z.object({
  nome: textoObrigatorio("Nome"),
  cargo: textoOpcional,
  telefone: textoOpcional,
  email: emailOpcional,
});

export async function adicionarResponsavel(
  lojistaId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const id = uuid.parse(lojistaId);
  const parsed = responsavelSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await db.transaction(async (tx) => {
    // Trava o lojista para dois cadastros simultâneos não virarem ambos "principal".
    await tx.select({ id: lojistas.id }).from(lojistas).where(eq(lojistas.id, id)).for("update");
    const existente = await tx
      .select({ id: responsaveis.id })
      .from(responsaveis)
      .where(eq(responsaveis.lojistaId, id))
      .limit(1);
    await tx
      .insert(responsaveis)
      .values({ ...parsed.data, lojistaId: id, principal: existente.length === 0 });
  });

  revalidatePath(`/lojistas/${id}`);
  return { ok: true };
}

export async function atualizarResponsavel(
  lojistaId: string,
  responsavelId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lid = uuid.parse(lojistaId);
  const rid = uuid.parse(responsavelId);
  const parsed = responsavelSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await db
    .update(responsaveis)
    .set(parsed.data)
    .where(and(eq(responsaveis.id, rid), eq(responsaveis.lojistaId, lid)));
  revalidatePath(`/lojistas/${lid}`);
  return { ok: true };
}

export async function removerResponsavel(lojistaId: string, responsavelId: string) {
  await requireSession();
  const lid = uuid.parse(lojistaId);
  const rid = uuid.parse(responsavelId);

  await db.transaction(async (tx) => {
    const [removido] = await tx
      .delete(responsaveis)
      .where(and(eq(responsaveis.id, rid), eq(responsaveis.lojistaId, lid)))
      .returning({ principal: responsaveis.principal });

    // Se saiu o principal, o mais antigo que sobrou assume.
    if (removido?.principal) {
      const [proximo] = await tx
        .select({ id: responsaveis.id })
        .from(responsaveis)
        .where(eq(responsaveis.lojistaId, lid))
        .orderBy(asc(responsaveis.createdAt))
        .limit(1);
      if (proximo) {
        await tx.update(responsaveis).set({ principal: true }).where(eq(responsaveis.id, proximo.id));
      }
    }
  });

  revalidatePath(`/lojistas/${lid}`);
}

export async function tornarPrincipal(lojistaId: string, responsavelId: string) {
  await requireSession();
  const lid = uuid.parse(lojistaId);
  const rid = uuid.parse(responsavelId);

  await db.transaction(async (tx) => {
    await tx
      .update(responsaveis)
      .set({ principal: false })
      .where(and(eq(responsaveis.lojistaId, lid), eq(responsaveis.principal, true)));
    await tx
      .update(responsaveis)
      .set({ principal: true })
      .where(and(eq(responsaveis.id, rid), eq(responsaveis.lojistaId, lid)));
  });

  revalidatePath(`/lojistas/${lid}`);
}

/**
 * Importa lojistas de um CSV. `etapa=previa` só valida e devolve a prévia;
 * `etapa=importar` grava as linhas válidas. CNPJ já cadastrado ou repetido é ignorado.
 */
export async function importarLojistas(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireSession();
  const lida = await lerPlanilha(formData, COLUNAS_LOJISTA);
  if ("error" in lida) return { error: lida.error };

  const cadastrados = new Set(
    (await db.select({ cnpj: lojistas.cnpj }).from(lojistas).where(isNotNull(lojistas.cnpj))).map((r) => r.cnpj),
  );
  const naPlanilha = new Set<string>();
  const linhas: LinhaPrevia[] = [];
  const novos: z.infer<typeof lojistaSchema>[] = [];

  for (const { linha, dados } of lida.registros) {
    const base = {
      linha,
      nome: dados.nome || "(sem nome)",
      detalhe: [dados.cnpj, [dados.cidade, dados.uf].filter(Boolean).join("/")].filter(Boolean).join(" · "),
    };
    const parsed = lojistaSchema.safeParse({
      ...dados,
      status: statusDaPlanilha(dados.status, LOJISTA_STATUS, "em_contrato"),
    });
    if (!parsed.success) {
      linhas.push({ ...base, situacao: "erro", motivo: erroDeValidacao(parsed.error).error });
      continue;
    }
    const { cnpj } = parsed.data;
    if (cnpj && (cadastrados.has(cnpj) || naPlanilha.has(cnpj))) {
      const motivo = cadastrados.has(cnpj) ? "Já existe lojista com este CNPJ" : "CNPJ repetido na planilha";
      linhas.push({ ...base, situacao: "duplicado", motivo });
      continue;
    }
    if (cnpj) naPlanilha.add(cnpj);
    novos.push(parsed.data);
    linhas.push({ ...base, situacao: "ok" });
  }

  const previa = { linhas, reconhecidas: lida.reconhecidas, ignoradas: lida.ignoradas };
  if (formData.get("etapa") !== "importar") return { previa };
  if (novos.length === 0) return { previa, error: "Nenhuma linha válida para importar." };

  const importados = await db.transaction(async (tx) => {
    let total = 0;
    for (let i = 0; i < novos.length; i += 500) {
      // Outro cadastro com o mesmo CNPJ pode ter entrado desde a prévia: ignora em vez de falhar.
      const inseridos = await tx
        .insert(lojistas)
        .values(novos.slice(i, i + 500))
        .onConflictDoNothing()
        .returning({ id: lojistas.id });
      total += inseridos.length;
    }
    return total;
  });

  revalidatePath("/lojistas");
  revalidatePath("/mapa");
  revalidatePath("/");
  return { importados };
}
