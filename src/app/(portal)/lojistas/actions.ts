"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { LOJISTA_STATUS, lojistas, responsaveis } from "@/db/schema";
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
  textoOpcional,
  ufOpcional,
  uuid,
} from "@/lib/validation";

const lojistaSchema = z.object({
  nome: textoObrigatorio("Nome"),
  razaoSocial: textoOpcional,
  cnpj: digitosOpcional("CNPJ", 14),
  email: emailOpcional,
  telefone: textoOpcional,
  whatsapp: textoOpcional,
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
});

function erroDeBanco(e: unknown): ActionState {
  // 23505 = unique_violation (ex.: CNPJ repetido)
  const code = (e as { code?: string; cause?: { code?: string } })?.cause?.code ?? (e as { code?: string })?.code;
  if (code === "23505") return { error: "Já existe um lojista com este CNPJ." };
  throw e;
}

export async function criarLojista(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const parsed = lojistaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

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

  try {
    await db.update(lojistas).set(parsed.data).where(eq(lojistas.id, lojistaId));
  } catch (e) {
    return erroDeBanco(e);
  }
  revalidatePath("/lojistas");
  redirect(`/lojistas/${lojistaId}`);
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
