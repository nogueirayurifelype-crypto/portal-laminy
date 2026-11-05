import type { Lead } from "@/db/schema";
import { type Coluna, formatTelefone } from "@/lib/planilha";

import { decimal, formatCep, formatCnpj } from "../lojistas/planilha";

// Colunas da planilha de leads: as mesmas no modelo, na exportação e na importação.
// Cabeçalhos em minúsculas, sem acento e com "_" no lugar de espaço.
export const COLUNAS_LEAD = [
  {
    campo: "nome", cabecalho: "nome_contato", aceita: ["nome do contato", "nome", "contato", "responsavel"], obrigatoria: true,
    descricao: "Pessoa de contato (se não souber, use o nome da empresa).",
    exemplos: ["Maria Souza (EXEMPLO - apague)", "João Lima (EXEMPLO - apague)"],
  },
  { campo: "empresa", cabecalho: "empresa", aceita: ["loja", "negocio", "nomefantasia"], descricao: "Nome fantasia. Vira o nome do lojista na aprovação.", exemplos: ["Padaria Pão Quente", "Studio Bela Flor"] },
  { campo: "razaoSocial", cabecalho: "razao_social", aceita: ["razao"], descricao: "Nome registrado na Receita.", exemplos: ["", ""] },
  { campo: "cnpj", cabecalho: "cnpj", descricao: "14 dígitos, com ou sem pontuação.", exemplos: ["", ""] },
  { campo: "telefone", cabecalho: "telefone", aceita: ["fone", "tel"], descricao: "Com DDD. Telefone já cadastrado é ignorado.", exemplos: ["(11) 3333-4444", ""] },
  { campo: "whatsapp", cabecalho: "whatsapp", aceita: ["whats", "zap", "celular"], descricao: "Com DDD.", exemplos: ["(11) 99999-8888", "(21) 98888-7777"] },
  { campo: "email", cabecalho: "email", aceita: ["e-mail", "mail"], descricao: "E-mail já cadastrado é ignorado.", exemplos: ["contato@paoquente.com.br", ""] },
  {
    campo: "temSite", cabecalho: "tem_site", aceita: ["possui_site", "tem site", "tem_website", "site_proprio"],
    descricao: "sim ou não. Vazio: vira “sim” se a coluna site estiver preenchida; senão fica como não informado.",
    exemplos: ["sim", "nao"],
  },
  { campo: "site", cabecalho: "site", aceita: ["website", "pagina", "url"], descricao: "Endereço do site. Não pode ser preenchido se tem_site = não.", exemplos: ["https://paoquente.com.br", ""] },
  { campo: "instagram", cabecalho: "instagram", aceita: ["insta", "ig"], descricao: "@usuario ou link do perfil.", exemplos: ["@paoquente", "@studiobelaflor"] },
  { campo: "facebook", cabecalho: "facebook", aceita: ["fb"], descricao: "Link da página.", exemplos: ["", ""] },
  { campo: "tiktok", cabecalho: "tiktok", aceita: ["tik tok"], descricao: "@usuario ou link do perfil.", exemplos: ["", ""] },
  { campo: "cep", cabecalho: "cep", descricao: "8 dígitos, com ou sem hífen.", exemplos: ["01310-100", ""] },
  { campo: "logradouro", cabecalho: "logradouro", aceita: ["endereco", "rua", "avenida"], descricao: "Rua ou avenida.", exemplos: ["Avenida Paulista", ""] },
  { campo: "numero", cabecalho: "numero", aceita: ["número", "num", "no", "nro"], descricao: "Número do imóvel.", exemplos: ["1000", ""] },
  { campo: "bairro", cabecalho: "bairro", descricao: "Bairro.", exemplos: ["Bela Vista", ""] },
  { campo: "cidade", cabecalho: "cidade", aceita: ["municipio"], descricao: "Cidade.", exemplos: ["São Paulo", "Rio de Janeiro"] },
  { campo: "uf", cabecalho: "uf", aceita: ["estado"], descricao: "Sigla com 2 letras.", exemplos: ["SP", "RJ"] },
  { campo: "latitude", cabecalho: "latitude", aceita: ["lat"], descricao: "Para o mapa. Aceita vírgula decimal.", exemplos: ["", ""] },
  { campo: "longitude", cabecalho: "longitude", aceita: ["lng", "lon", "long"], descricao: "Para o mapa. Aceita vírgula decimal.", exemplos: ["", ""] },
  { campo: "nicho", cabecalho: "nicho", aceita: ["segmento", "ramo", "categoria"], descricao: "Ramo de atuação.", exemplos: ["Padaria", "Salão de beleza"] },
  { campo: "origem", cabecalho: "origem", aceita: ["fonte", "canal"], descricao: "De onde veio o lead (ex.: Google Maps, indicação).", exemplos: ["Google Maps", "Indicação"] },
  { campo: "campanha", cabecalho: "campanha", descricao: "Nome de uma campanha já criada.", exemplos: ["", ""] },
  { campo: "status", cabecalho: "status", aceita: ["situacao", "etapa"], descricao: "novo, contatado, qualificado ou descartado. Vazio = novo.", exemplos: ["novo", "contatado"] },
  { campo: "observacoes", cabecalho: "observacoes", aceita: ["observações", "obs", "observacao", "notas"], descricao: "Anotações internas.", exemplos: ["", "Sem site: oferecer pacote institucional"] },
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
    nicho: l.nicho ?? "",
    origem: l.origem ?? "",
    campanha: l.campanha?.nome ?? "",
    status: l.status,
    observacoes: l.observacoes ?? "",
  };
  return COLUNAS_LEAD.map((c) => valores[c.campo]);
}
