"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  CONTA_STATUS,
  PAGAMENTO_FORMA,
  PAGAMENTO_STATUS,
  contasFinanceiras,
  lojistas,
  pagamentos,
} from "@/db/schema";
import { requireSession } from "@/lib/session";
import {
  type ActionState,
  centavosObrigatorio,
  centavosOpcional,
  competencia,
  dataOpcional,
  enumDe,
  erroDeValidacao,
  fromFormData,
  inteiroOpcional,
  textoObrigatorio,
  uuid,
} from "@/lib/validation";

function revalidar(lojistaId: string) {
  revalidatePath("/financeiro");
  revalidatePath(`/financeiro/${lojistaId}`);
  revalidatePath(`/lojistas/${lojistaId}`);
  revalidatePath("/");
}

const contaSchema = z
  .object({
    conta: textoObrigatorio("Conta"),
    valorSetup: centavosOpcional("Setup"),
    mensalidade: centavosOpcional("Mensalidade"),
    diaVencimento: inteiroOpcional("Dia de vencimento", 1, 31),
    status: enumDe(CONTA_STATUS, "Status"),
    inicio: dataOpcional,
    fim: dataOpcional,
  })
  .refine((c) => !c.inicio || !c.fim || c.fim >= c.inicio, {
    message: "Fim não pode ser antes do início",
    path: ["fim"],
  });

export async function criarConta(
  lojistaId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lid = uuid.parse(lojistaId);
  const parsed = contaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await db.query.lojistas.findFirst({
    where: eq(lojistas.id, lid),
    columns: { id: true },
  });
  if (!existe) return { error: "Lojista não encontrado." };

  await db.insert(contasFinanceiras).values({ ...parsed.data, lojistaId: lid });
  revalidar(lid);
  return { ok: true };
}

export async function atualizarConta(
  lojistaId: string,
  contaId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lid = uuid.parse(lojistaId);
  const cid = uuid.parse(contaId);
  const parsed = contaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await db
    .update(contasFinanceiras)
    .set(parsed.data)
    .where(and(eq(contasFinanceiras.id, cid), eq(contasFinanceiras.lojistaId, lid)));
  revalidar(lid);
  return { ok: true };
}

/** "YYYY-MM-DD" -> meio-dia em São Paulo (evita virar o dia anterior por fuso). */
function dataParaInstante(data: string): Date {
  return new Date(`${data}T12:00:00-03:00`);
}

const pagamentoSchema = z.object({
  contaId: uuid,
  competencia,
  valor: centavosObrigatorio("Valor"),
  status: enumDe(PAGAMENTO_STATUS, "Status"),
  forma: z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(z.enum(PAGAMENTO_FORMA, { error: "Forma inválida" }).nullable()),
  pagoEm: dataOpcional,
});

/**
 * Registra um pagamento. O lojista vem da conta; na ficha do lojista,
 * `lojistaId` garante que a conta é dele.
 */
export async function registrarPagamento(
  lojistaId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const lid = lojistaId === null ? null : uuid.parse(lojistaId);
  const parsed = pagamentoSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const { pagoEm, ...dados } = parsed.data;

  const conta = await db.query.contasFinanceiras.findFirst({
    where: eq(contasFinanceiras.id, dados.contaId),
    columns: { lojistaId: true },
  });
  if (!conta) return { error: "Conta não encontrada." };
  if (lid !== null && conta.lojistaId !== lid) return { error: "Conta não pertence a este lojista." };

  await db.insert(pagamentos).values({
    ...dados,
    lojistaId: conta.lojistaId,
    pagoEm: dados.status === "pago" ? (pagoEm ? dataParaInstante(pagoEm) : new Date()) : null,
  });
  revalidar(conta.lojistaId);
  return { ok: true };
}

const baixaSchema = z.object({
  forma: z.enum(PAGAMENTO_FORMA, { error: "Escolha a forma de pagamento" }),
  pagoEm: dataOpcional,
});

export async function marcarComoPago(
  pagamentoId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const pid = uuid.parse(pagamentoId);
  const parsed = baixaSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const [atualizado] = await db
    .update(pagamentos)
    .set({
      status: "pago",
      forma: parsed.data.forma,
      pagoEm: parsed.data.pagoEm ? dataParaInstante(parsed.data.pagoEm) : new Date(),
    })
    .where(and(eq(pagamentos.id, pid), ne(pagamentos.status, "pago")))
    .returning({ lojistaId: pagamentos.lojistaId });
  if (!atualizado) return { error: "Pagamento não encontrado ou já pago." };
  revalidar(atualizado.lojistaId);
  return { ok: true };
}

export async function marcarComoAtrasado(pagamentoId: string) {
  await requireSession();
  const pid = uuid.parse(pagamentoId);

  const [atualizado] = await db
    .update(pagamentos)
    .set({ status: "atrasado" })
    .where(and(eq(pagamentos.id, pid), eq(pagamentos.status, "pendente")))
    .returning({ lojistaId: pagamentos.lojistaId });
  if (atualizado) revalidar(atualizado.lojistaId);
}
