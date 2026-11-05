import type { Lead } from "@/db/schema";
import { type Coluna, formatTelefone } from "@/lib/planilha";

import { decimal, formatCep, formatCnpj } from "../lojistas/planilha";

// Colunas da planilha de leads: as mesmas no modelo, na exportação e na importação.
// Cabeçalhos em minúsculas, sem acento e com "_" no lugar de espaço.
export const COLUNAS_LEAD = [
  { campo: "nome", cabecalho: "nome_contato", aceita: ["nome do contato", "nome", "contato", "responsavel"] },
  { campo: "empresa", cabecalho: "empresa", aceita: ["loja", "negocio", "nomefantasia"] },
  { campo: "razaoSocial", cabecalho: "razao_social", aceita: ["razao"] },
  { campo: "cnpj", cabecalho: "cnpj" },
  { campo: "telefone", cabecalho: "telefone", aceita: ["fone", "tel"] },
  { campo: "whatsapp", cabecalho: "whatsapp", aceita: ["whats", "zap", "celular"] },
  { campo: "email", cabecalho: "email", aceita: ["e-mail", "mail"] },
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
  { campo: "nicho", cabecalho: "nicho", aceita: ["segmento", "ramo", "categoria"] },
  { campo: "origem", cabecalho: "origem", aceita: ["fonte", "canal"] },
  { campo: "campanha", cabecalho: "campanha" },
  { campo: "status", cabecalho: "status", aceita: ["situacao", "etapa"] },
  { campo: "observacoes", cabecalho: "observacoes", aceita: ["observações", "obs", "observacao", "notas"] },
] as const satisfies Coluna<string>[];

type CampoLead = (typeof COLUNAS_LEAD)[number]["campo"];

export function linhaLead(l: Lead & { campanha: { nome: string } | null }): string[] {
  const valores: Record<CampoLead, string> = {
    nome: l.nome,
    empresa: l.empresa ?? "",
    razaoSocial: l.razaoSocial ?? "",
    cnpj: formatCnpj(l.cnpj),
    telefone: formatTelefone(l.telefone),
    whatsapp: formatTelefone(l.whatsapp),
    email: l.email ?? "",
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
    nicho: l.nicho ?? "",
    origem: l.origem ?? "",
    campanha: l.campanha?.nome ?? "",
    status: l.status,
    observacoes: l.observacoes ?? "",
  };
  return COLUNAS_LEAD.map((c) => valores[c.campo]);
}
