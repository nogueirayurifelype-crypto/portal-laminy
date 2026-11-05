// CSV para planilhas: o Excel em pt-BR abre `;` + UTF-8 com BOM sem configurar nada,
// e o Google Sheets também. Na leitura, aceita `;`, `,` ou tab e arquivos salvos
// pelo Excel em Windows-1252.

const BOM = "﻿";

/** Normaliza um cabeçalho para comparação: "Razão social" -> "razaosocial". */
export function normalizarCabecalho(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Decodifica os bytes: UTF-8 se válido, senão Windows-1252 (CSV do Excel). */
export function decodificar(bytes: ArrayBuffer): string {
  let texto: string;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
  }
  return texto.startsWith(BOM) ? texto.slice(1) : texto;
}

function detectarSeparador(primeiraLinha: string): string {
  const contar = (sep: string) => primeiraLinha.split(sep).length - 1;
  return [";", ",", "\t"].reduce((melhor, sep) => (contar(sep) > contar(melhor) ? sep : melhor), ";");
}

/** Lê o CSV em linhas de células (RFC 4180: aspas, aspas duplicadas, quebras dentro de aspas). */
export function lerCsv(texto: string): string[][] {
  const sep = detectarSeparador(texto.slice(0, texto.search(/\r?\n|$/)));
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let aspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') {
        aspas = false;
      } else {
        celula += c;
      }
    } else if (c === '"') {
      aspas = true;
    } else if (c === sep) {
      linha.push(celula);
      celula = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
    } else {
      celula += c;
    }
  }
  if (celula !== "" || linha.length > 0) {
    linha.push(celula);
    linhas.push(linha);
  }
  // Linhas totalmente vazias (comuns no fim de arquivos do Excel) não contam.
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

// Células que começam com = + - @ viram fórmula no Excel. Números (ex.: -23,55) passam.
function protegerFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) && !/^-?\d+([.,]\d+)?$/.test(valor) ? `'${valor}` : valor;
}

/** Desfaz a proteção acima ao importar um arquivo exportado pelo portal. */
export function limparCelula(valor: string | undefined): string {
  const t = (valor ?? "").trim();
  return /^'[=+\-@]/.test(t) ? t.slice(1) : t;
}

function escapar(valor: string): string {
  const v = protegerFormula(valor);
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Gera o CSV (com BOM) a partir de cabeçalhos e linhas. */
export function gerarCsv(cabecalhos: string[], linhas: (string | number | null | undefined)[][]): string {
  const corpo = [cabecalhos, ...linhas].map((l) => l.map((v) => escapar(v == null ? "" : String(v))).join(";"));
  return BOM + corpo.join("\r\n") + "\r\n";
}

/** Resposta de download de um CSV. */
export function respostaCsv(nomeArquivo: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
