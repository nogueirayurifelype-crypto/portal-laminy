const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCentavos(centavos: number | null | undefined): string {
  if (centavos == null) return "—";
  return brl.format(centavos / 100);
}

/** Valor em centavos -> texto para input ("1234,56"). */
export function centavosParaInput(centavos: number | null | undefined): string {
  if (centavos == null) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

export function formatData(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  // `date` do Postgres chega como "YYYY-MM-DD": formata sem passar por fuso.
  if (typeof valor === "string") {
    const [a, m, d] = valor.split("-");
    return `${d}/${m}/${a}`;
  }
  return valor.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** "2026-10-01" -> "10/2026" */
export function formatCompetencia(competencia: string): string {
  const [a, m] = competencia.split("-");
  return `${m}/${a}`;
}

/** Competência atual (dia 1 do mês) no fuso de São Paulo, ex.: "2026-10-01". */
export function competenciaAtual(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")!.value;
  const mes = partes.find((p) => p.type === "month")!.value;
  return `${ano}-${mes}-01`;
}

export const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  em_contrato: "Em contrato",
  inativo: "Inativo",
  cancelado: "Cancelado",
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  pix: "Pix",
  boleto: "Boleto",
  cartao: "Cartão",
  rascunho: "Rascunho",
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  aprovado: "Aprovado",
  descartado: "Descartado",
  principal: "Principal",
};

export function label(valor: string | null | undefined): string {
  if (!valor) return "—";
  return STATUS_LABEL[valor] ?? valor;
}

/** "2026-01-01" -> "2025-12-01" */
export function competenciaAnterior(competencia: string): string {
  const [a, m] = competencia.split("-").map(Number);
  return m === 1 ? `${a - 1}-12-01` : `${a}-${String(m - 1).padStart(2, "0")}-01`;
}
