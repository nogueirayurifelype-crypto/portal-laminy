import type { Lojista } from "@/db/schema";
import { type Coluna, formatTelefone } from "@/lib/planilha";

// Colunas da planilha de lojistas: as mesmas no modelo, na exportação e na importação.
// Cabeçalhos em minúsculas, sem acento e com "_" no lugar de espaço.
export const COLUNAS_LOJISTA = [
  {
    campo: "nome", cabecalho: "nome_fantasia", aceita: ["nome", "loja", "empresa"], obrigatoria: true,
    descricao: "Nome pelo qual a loja é conhecida.",
    exemplos: ["Padaria Pão Quente (EXEMPLO - apague)", "Studio Bela Flor (EXEMPLO - apague)"],
  },
  { campo: "razaoSocial", cabecalho: "razao_social", aceita: ["razao"], descricao: "Nome registrado na Receita.", exemplos: ["Pão Quente Alimentos LTDA", ""] },
  { campo: "cnpj", cabecalho: "cnpj", descricao: "14 dígitos, com ou sem pontuação. Único: CNPJ já cadastrado é ignorado.", exemplos: ["12.345.678/0001-90", ""] },
  { campo: "nicho", cabecalho: "nicho", aceita: ["segmento", "ramo", "categoria"], descricao: "Ramo de atuação.", exemplos: ["Padaria", "Salão de beleza"] },
  { campo: "status", cabecalho: "status", aceita: ["situacao"], descricao: "ativo, em_contrato, inativo ou cancelado. Vazio = em_contrato.", exemplos: ["em_contrato", "ativo"] },
  { campo: "email", cabecalho: "email", aceita: ["e-mail", "mail"], descricao: "E-mail de contato.", exemplos: ["contato@paoquente.com.br", ""] },
  { campo: "telefone", cabecalho: "telefone", aceita: ["fone", "tel"], descricao: "Com DDD.", exemplos: ["(11) 3333-4444", ""] },
  { campo: "whatsapp", cabecalho: "whatsapp", aceita: ["whats", "zap", "celular"], descricao: "Com DDD.", exemplos: ["(11) 99999-8888", "(21) 98888-7777"] },
  {
    campo: "temSite", cabecalho: "tem_site", aceita: ["possui_site", "tem site", "tem_website", "site_proprio"],
    descricao: "sim ou não. Vazio: vira “sim” se a coluna site estiver preenchida; senão fica como não informado.",
    exemplos: ["sim", "nao"],
  },
  { campo: "site", cabecalho: "site", aceita: ["website", "pagina", "url"], descricao: "Endereço do site. Não pode ser preenchido se tem_site = não.", exemplos: ["https://paoquente.com.br", ""] },
  { campo: "instagram", cabecalho: "instagram", aceita: ["insta", "ig"], descricao: "@usuario ou link do perfil.", exemplos: ["@paoquente", "@studiobelaflor"] },
  { campo: "facebook", cabecalho: "facebook", aceita: ["fb"], descricao: "Link da página.", exemplos: ["facebook.com/paoquente", ""] },
  { campo: "tiktok", cabecalho: "tiktok", aceita: ["tik tok"], descricao: "@usuario ou link do perfil.", exemplos: ["", ""] },
  { campo: "cep", cabecalho: "cep", descricao: "8 dígitos, com ou sem hífen.", exemplos: ["01310-100", "20040-020"] },
  { campo: "logradouro", cabecalho: "logradouro", aceita: ["endereco", "rua", "avenida"], descricao: "Rua ou avenida.", exemplos: ["Avenida Paulista", "Rua da Assembleia"] },
  { campo: "numero", cabecalho: "numero", aceita: ["número", "num", "no", "nro"], descricao: "Número do imóvel.", exemplos: ["1000", "10"] },
  { campo: "bairro", cabecalho: "bairro", descricao: "Bairro.", exemplos: ["Bela Vista", "Centro"] },
  { campo: "cidade", cabecalho: "cidade", aceita: ["municipio"], descricao: "Cidade.", exemplos: ["São Paulo", "Rio de Janeiro"] },
  { campo: "uf", cabecalho: "uf", aceita: ["estado"], descricao: "Sigla com 2 letras.", exemplos: ["SP", "RJ"] },
  { campo: "latitude", cabecalho: "latitude", aceita: ["lat"], descricao: "Para o mapa. Aceita vírgula decimal.", exemplos: ["", ""] },
  { campo: "longitude", cabecalho: "longitude", aceita: ["lng", "lon", "long"], descricao: "Para o mapa. Aceita vírgula decimal.", exemplos: ["", ""] },
  { campo: "observacoes", cabecalho: "observacoes", aceita: ["observações", "obs", "observacao", "notas"], descricao: "Anotações internas.", exemplos: ["", "Sem site: oferecer pacote institucional"] },
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
    temSite: l.temSite == null ? "" : l.temSite ? "sim" : "nao",
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
