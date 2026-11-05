import type { Lojista } from "@/db/schema";
import { type Coluna, formatTelefone } from "@/lib/planilha";

// Colunas da planilha de lojistas: as mesmas no modelo, na exportação e na importação.
// Cabeçalhos em minúsculas, sem acento e com "_" no lugar de espaço.
export const COLUNAS_LOJISTA = [
  { campo: "nome", cabecalho: "nome_fantasia", aceita: ["nome", "loja", "empresa"] },
  { campo: "razaoSocial", cabecalho: "razao_social", aceita: ["razao"] },
  { campo: "cnpj", cabecalho: "cnpj" },
  { campo: "nicho", cabecalho: "nicho", aceita: ["segmento", "ramo", "categoria"] },
  { campo: "status", cabecalho: "status", aceita: ["situacao"] },
  { campo: "email", cabecalho: "email", aceita: ["e-mail", "mail"] },
  { campo: "telefone", cabecalho: "telefone", aceita: ["fone", "tel"] },
  { campo: "whatsapp", cabecalho: "whatsapp", aceita: ["whats", "zap", "celular"] },
  { campo: "site", cabecalho: "site", aceita: ["website", "pagina", "url"] },
  { campo: "instagram", cabecalho: "instagram", aceita: ["insta", "ig"] },
  { campo: "facebook", cabecalho: "facebook", aceita: ["fb"] },
  { campo: "tiktok", cabecalho: "tiktok", aceita: ["tik tok"] },
  { campo: "cep", cabecalho: "cep" },
  { campo: "logradouro", cabecalho: "logradouro", aceita: ["endereco", "rua", "avenida"] },
  { campo: "numero", cabecalho: "numero", aceita: ["número", "num", "no", "nro"] },
  { campo: "bairro", cabecalho: "bairro" },
  { campo: "cidade", cabecalho: "cidade", aceita: ["municipio"] },
  { campo: "uf", cabecalho: "uf", aceita: ["estado"] },
  { campo: "latitude", cabecalho: "latitude", aceita: ["lat"] },
  { campo: "longitude", cabecalho: "longitude", aceita: ["lng", "lon", "long"] },
  { campo: "observacoes", cabecalho: "observacoes", aceita: ["observações", "obs", "observacao", "notas"] },
] as const satisfies Coluna<keyof Lojista & string>[];

export type CampoLojista = (typeof COLUNAS_LOJISTA)[number]["campo"];

/** "12345678000190" -> "12.345.678/0001-90" (o Excel não estraga com pontuação). */
export function formatCnpj(cnpj: string | null): string {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? "";
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatCep(cep: string | null): string {
  return cep && cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : (cep ?? "");
}

// Vírgula decimal: é o que o Excel em pt-BR entende como número.
export const decimal = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

export function linhaLojista(l: Lojista): string[] {
  const valores: Record<CampoLojista, string> = {
    nome: l.nome,
    razaoSocial: l.razaoSocial ?? "",
    cnpj: formatCnpj(l.cnpj),
    nicho: l.nicho ?? "",
    status: l.status,
    email: l.email ?? "",
    telefone: formatTelefone(l.telefone),
    whatsapp: formatTelefone(l.whatsapp),
    site: l.site ?? "",
    instagram: l.instagram ?? "",
    facebook: l.facebook ?? "",
    tiktok: l.tiktok ?? "",
    cep: formatCep(l.cep),
    logradouro: l.logradouro ?? "",
    numero: l.numero ?? "",
    bairro: l.bairro ?? "",
    cidade: l.cidade ?? "",
    uf: l.uf ?? "",
    latitude: decimal(l.latitude),
    longitude: decimal(l.longitude),
    observacoes: l.observacoes ?? "",
  };
  return COLUNAS_LOJISTA.map((c) => valores[c.campo]);
}
