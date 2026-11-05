import { z } from "zod";

// Campos de FormData chegam como string (ou ausentes). Estes helpers
// normalizam "" para null e convertem tipos.

/** Texto opcional: "" / ausente -> null. */
export const textoOpcional = z
  .string()
  .optional()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  });

export const textoObrigatorio = (campo: string) =>
  z.string({ error: `${campo} é obrigatório` }).trim().min(1, `${campo} é obrigatório`);

export const emailOpcional = textoOpcional.pipe(z.email("E-mail inválido").nullable());

/** Sim/não opcional: "sim"/"não"/"s"/"n"/"1"/"0"/"true"/"false"; "" -> null. */
export const simNaoOpcional = textoOpcional
  .transform((v) => {
    if (v === null) return null;
    const t = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (["sim", "s", "1", "true", "tem", "yes", "y"].includes(t)) return true;
    if (["nao", "n", "0", "false", "no"].includes(t)) return false;
    return undefined;
  })
  .refine((v) => v !== undefined, { message: 'Use "sim" ou "não"' })
  .transform((v) => v as boolean | null);

type ComSite = { temSite: boolean | null; site: string | null };

/** "Tem site = não" com um endereço de site preenchido é contradição. */
export const siteCoerente = {
  fn: (d: ComSite) => !(d.temSite === false && d.site),
  params: { message: 'Marcado "não" em tem site, mas há um site preenchido', path: ["temSite"] },
};

/** Sem resposta em "tem site", mas com endereço preenchido: tem site. */
export const inferirTemSite = <T extends ComSite>(d: T): T => ({ ...d, temSite: d.temSite ?? (d.site ? true : null) });

/** Mantém só dígitos; "" -> null; opcionalmente exige um tamanho exato. */
export const digitosOpcional = (campo: string, tamanho?: number) =>
  textoOpcional
    .transform((v) => (v ? v.replace(/\D/g, "") || null : null))
    .refine((v) => v === null || tamanho === undefined || v.length === tamanho, {
      message: `${campo} deve ter ${tamanho} dígitos`,
    });

export const ufOpcional = textoOpcional
  .transform((v) => (v ? v.toUpperCase() : null))
  .refine((v) => v === null || /^[A-Z]{2}$/.test(v), { message: "UF deve ter 2 letras" });

/** Número decimal opcional aceitando vírgula ("-23,55"). */
export const decimalOpcional = (campo: string, min: number, max: number) =>
  textoOpcional
    .transform((v) => (v === null ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), {
      message: `${campo} inválida`,
    });

/** "1.234,56" | "1234.56" | "1234" -> centavos (int). */
export function parseCentavos(texto: string): number | null {
  let t = texto.trim().replace(/[R$\s]/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100);
}

export const centavosOpcional = (campo: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? parseCentavos(v) : null))
    .refine((v) => v === null || Number.isInteger(v), { message: `${campo}: valor inválido` });

export const centavosObrigatorio = (campo: string) =>
  centavosOpcional(campo).refine((v) => v !== null, { message: `${campo} é obrigatório` }).transform((v) => v!);

export const inteiroOpcional = (campo: string, min: number, max: number) =>
  textoOpcional
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), {
      message: `${campo} deve estar entre ${min} e ${max}`,
    });

/** input type="date" -> "YYYY-MM-DD" | null */
export const dataOpcional = textoOpcional.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
  message: "Data inválida",
});

/** input type="month" ("YYYY-MM") -> "YYYY-MM-01" */
export const competencia = z
  .string({ error: "Competência é obrigatória" })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência inválida")
  .transform((v) => `${v}-01`);

export const uuid = z.uuid("Identificador inválido");

export const enumDe = <T extends readonly [string, ...string[]]>(valores: T, campo: string) =>
  z.enum(valores, { error: `${campo} inválido` });

/**
 * `aviso`: algo que o usuário deve saber antes de seguir (ex.: CNPJ já cadastrado).
 * Com `podeProsseguir`, o formulário oferece um segundo botão que reenvia com `confirmarDuplicado=1`.
 */
export type AvisoForm = { texto: string; link?: { href: string; rotulo: string }; podeProsseguir?: boolean };
export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; aviso?: AvisoForm };

export function fromFormData(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  }
  return obj;
}

/** Converte um ZodError em ActionState com a primeira mensagem de cada campo. */
export function erroDeValidacao(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    fieldErrors[campo] ??= issue.message;
  }
  return { error: Object.values(fieldErrors).join(" · "), fieldErrors };
}
