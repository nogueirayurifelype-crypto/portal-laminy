import { decodificar, lerCsv, limparCelula, normalizarCabecalho } from "./csv";
import { STATUS_LABEL } from "./format";

// Importação de planilhas: do arquivo CSV a registros por campo, com o número
// da linha (como o Excel mostra) para apontar erros.

export const LIMITE_LINHAS = 2000;
const LIMITE_BYTES = 3 * 1024 * 1024;

export type Coluna<K extends string> = {
  campo: K;
  /** Cabeçalho usado no modelo e na exportação. */
  cabecalho: string;
  /** Outros nomes aceitos na importação. */
  aceita?: string[];
};

export type Registro<K extends string> = { linha: number; dados: Record<K, string> };

/** Uma linha da prévia: ok, ignorada (duplicada) ou com erro. */
export type LinhaPrevia = {
  linha: number;
  nome: string;
  detalhe: string;
  situacao: "ok" | "duplicado" | "erro";
  motivo?: string;
};

export type ImportState = {
  error?: string;
  previa?: {
    linhas: LinhaPrevia[];
    reconhecidas: string[];
    ignoradas: string[];
  };
  importados?: number;
};

/** Lê o arquivo `arquivo` do formulário e devolve os registros por campo. */
export async function lerPlanilha<K extends string>(
  formData: FormData,
  colunas: Coluna<K>[],
): Promise<
  | { error: string }
  | { registros: Registro<K>[]; reconhecidas: string[]; ignoradas: string[] }
> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { error: "Escolha um arquivo CSV." };
  if (arquivo.size > LIMITE_BYTES) return { error: "Arquivo grande demais (máximo 3 MB)." };
  if (/\.(xlsx?|ods|numbers)$/i.test(arquivo.name)) {
    return { error: "Salve a planilha como CSV antes (Arquivo → Salvar como / Fazer download → .csv)." };
  }

  const [cabecalhos, ...linhas] = lerCsv(decodificar(await arquivo.arrayBuffer()));
  if (!cabecalhos) return { error: "O arquivo está vazio." };
  if (linhas.length === 0) return { error: "A planilha só tem o cabeçalho: nenhuma linha para importar." };
  if (linhas.length > LIMITE_LINHAS) {
    return { error: `A planilha tem ${linhas.length} linhas; o máximo por importação é ${LIMITE_LINHAS}.` };
  }

  const porNome = new Map<string, K>();
  for (const c of colunas) {
    for (const nome of [c.cabecalho, c.campo, ...(c.aceita ?? [])]) porNome.set(normalizarCabecalho(nome), c.campo);
  }
  const indices = new Map<K, number>();
  const ignoradas: string[] = [];
  cabecalhos.forEach((cab, i) => {
    const campo = porNome.get(normalizarCabecalho(cab));
    if (campo && !indices.has(campo)) indices.set(campo, i);
    else if (cab.trim()) ignoradas.push(cab.trim());
  });
  if (indices.size === 0) {
    return { error: "Nenhuma coluna reconhecida. Baixe o modelo e use os mesmos cabeçalhos." };
  }

  const registros = linhas.map((celulas, i) => {
    const dados = {} as Record<K, string>;
    for (const c of colunas) {
      const idx = indices.get(c.campo);
      dados[c.campo] = idx === undefined ? "" : limparCelula(celulas[idx]);
    }
    // +2: o cabeçalho é a linha 1 e o Excel numera a partir de 1.
    return { linha: i + 2, dados };
  });

  return {
    registros,
    reconhecidas: colunas.filter((c) => indices.has(c.campo)).map((c) => c.cabecalho),
    ignoradas,
  };
}

/** Aceita o valor interno ("em_contrato") ou o rótulo ("Em contrato"); vazio usa o padrão. */
export function statusDaPlanilha<T extends string>(texto: string, validos: readonly T[], padrao: T): string {
  if (!texto) return padrao;
  const alvo = normalizarCabecalho(texto);
  return validos.find((v) => normalizarCabecalho(v) === alvo || normalizarCabecalho(STATUS_LABEL[v] ?? "") === alvo) ?? texto;
}

/** Só dígitos, para comparar telefones e documentos escritos de jeitos diferentes. */
export function digitos(texto: string | null | undefined): string {
  return (texto ?? "").replace(/\D/g, "");
}

/** "11999998888" -> "(11) 99999-8888"; o que não for telefone BR volta como veio. */
export function formatTelefone(texto: string | null | undefined): string {
  const d = digitos(texto).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return texto ?? "";
}
