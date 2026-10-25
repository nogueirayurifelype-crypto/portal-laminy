import Link from "next/link";
import type { ReactNode } from "react";

import { label } from "@/lib/format";

import { IconeBusca, IconeVoltar } from "./icones";

// Peças visuais do portal. Decisões em DESIGN.md.

const BOTAO_BASE =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm whitespace-nowrap no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const botao = {
  primario: `${BOTAO_BASE} bg-signal font-semibold text-black shadow-[0_1px_2px_rgb(5_8_7/0.12)] hover:bg-[#15ad6c]`,
  secundario: `${BOTAO_BASE} border border-line-strong bg-white font-medium text-black shadow-[0_1px_2px_rgb(5_8_7/0.04)] hover:bg-hover`,
  perigoso: `${BOTAO_BASE} border border-danger/50 bg-white font-medium text-danger hover:border-danger hover:bg-danger-bg`,
} as const;

export type VarianteBotao = keyof typeof botao;

/**
 * Wordmark "laminy" em traço arredondado: ponto do l e perna do y em signal.
 * O resto usa currentColor; `className` define altura e cor (ex.: "h-6 text-white").
 */
export function Wordmark({ className = "h-6 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -2 212 86"
      role="img"
      aria-label="Laminy"
      className={`w-auto shrink-0 ${className}`}
      fill="none"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g stroke="currentColor">
        <path d="M8 3v42q0 12 12 12" />
        <circle cx="52" cy="40" r="17" />
        <path d="M69 23v34" />
        <path d="M83 57V36a13 13 0 0 1 26 0v21M109 36a13 13 0 0 1 26 0v21" />
        <path d="M149 26v31" />
        <path d="M163 57V36a13 13 0 0 1 26 0v4" />
      </g>
      <circle cx="149" cy="9" r="4.5" fill="currentColor" />
      <circle cx="26" cy="27" r="4.5" className="fill-signal" />
      <path d="M203 23v44q0 11-11 11" className="stroke-signal" />
    </svg>
  );
}

export function PageHeader({
  titulo,
  descricao,
  voltar,
  meta,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  voltar?: { href: string; label: string };
  /** Ao lado do título (ex.: status). */
  meta?: ReactNode;
  /** Ações à direita; no máximo um botão primário. */
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-2">
      {voltar && (
        <Link
          href={voltar.href}
          className="-ml-1 inline-flex items-center gap-1 self-start text-[13px] text-muted no-underline hover:text-black"
        >
          <IconeVoltar className="size-3.5" />
          {voltar.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="break-words">{titulo}</h1>
            {meta}
          </div>
          {descricao && <p className="text-sm text-muted">{descricao}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-white ${className}`}>{children}</div>;
}

/** Seção da página: título, ações opcionais e conteúdo num cartão. */
export function Secao({
  titulo,
  acoes,
  children,
  semPadding,
}: {
  titulo: string;
  acoes?: ReactNode;
  children: ReactNode;
  /** Para tabelas que encostam nas bordas do cartão. */
  semPadding?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <h2>{titulo}</h2>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      <Card className={semPadding ? "overflow-hidden" : "p-5"}>{children}</Card>
    </section>
  );
}

/** Tabela com rolagem horizontal contida. */
export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabela">{children}</table>
    </div>
  );
}

/** Valor numérico com algarismos tabulares. */
export function Num({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap tabular-nums">{children}</span>;
}

export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-sm text-muted">
      <p>{children}</p>
      {acao}
    </div>
  );
}

const TOM: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  ativo: "ok",
  ativa: "ok",
  pago: "ok",
  aprovado: "ok",
  qualificado: "ok",
  em_contrato: "warn",
  pendente: "warn",
  pausada: "warn",
  contatado: "warn",
  atrasado: "danger",
  cancelado: "danger",
};

const TOM_CLASSE = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-neutral-bg text-neutral",
} as const;

/** Pílula de status: ponto + rótulo. A cor nunca vem sozinha. */
export function Status({ valor }: { valor: string | null | undefined }) {
  if (!valor) return <span className="text-muted">—</span>;
  const tom = TOM_CLASSE[TOM[valor] ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tom}`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {label(valor)}
    </span>
  );
}

/** Grupo de campos de formulário com título. */
export function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 text-sm font-semibold">{titulo}</legend>
        {children}
      </fieldset>
    </div>
  );
}

/**
 * Barra de busca no estilo de lista: campo com lupa numa faixa clara.
 * Envia `q` por GET para `action`.
 */
export function BarraBusca({
  action,
  busca,
  placeholder,
  rotulo,
  filtros,
}: {
  action: string;
  busca: string;
  placeholder: string;
  /** Texto para leitores de tela. */
  rotulo: string;
  /** Selects à direita do campo (ex.: `FiltroSelect`); vão no mesmo GET. */
  filtros?: ReactNode;
}) {
  return (
    <form
      action={action}
      role="search"
      className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-1.5 sm:flex-row"
    >
      <div className="flex min-w-0 flex-1 gap-1.5">
        <label className="sr-only" htmlFor="busca-lista">
          {rotulo}
        </label>
        <div className="relative min-w-0 flex-1">
          <IconeBusca className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input id="busca-lista" name="q" type="search" placeholder={placeholder} defaultValue={busca} className="pl-9" />
        </div>
        <button type="submit" className={botao.secundario}>
          Buscar
        </button>
      </div>
      {filtros && <div className="flex gap-1.5">{filtros}</div>}
    </form>
  );
}

/** Abas de página no estilo Cloudflare: links com sublinhado no ativo. */
export function Abas({
  itens,
}: {
  itens: { href: string; label: string; ativo: boolean; contagem?: number }[];
}) {
  return (
    <nav aria-label="Seções" className="-mt-2 overflow-x-auto border-b border-line">
      <div className="flex gap-1">
        {itens.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            scroll={false}
            aria-current={a.ativo ? "page" : undefined}
            className={`-mb-px inline-flex min-h-10 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap no-underline transition-colors ${
              a.ativo ? "border-signal font-medium text-black" : "border-transparent text-muted hover:text-black"
            }`}
          >
            {a.label}
            {a.contagem !== undefined && (
              <span className="rounded-full bg-mist px-1.5 text-xs text-muted tabular-nums">{a.contagem}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Filtros rápidos em pílulas, com contagem (ex.: status dos leads). */
export function Chips({
  itens,
  rotulo,
}: {
  itens: { href: string; label: string; ativo: boolean; contagem?: number }[];
  rotulo: string;
}) {
  return (
    <nav aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {itens.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          scroll={false}
          aria-current={c.ativo ? "true" : undefined}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] no-underline transition-colors ${
            c.ativo
              ? "border-forest bg-forest font-medium text-white"
              : "border-line bg-white text-black hover:border-line-strong"
          }`}
        >
          {c.label}
          {c.contagem !== undefined && (
            <span className={`tabular-nums ${c.ativo ? "text-mint" : "text-muted"}`}>{c.contagem}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Faixa de números-resumo (ex.: a receber, atrasado, recebido). */
export function Resumo({ itens }: { itens: { rotulo: string; valor: ReactNode; tom?: "danger" | "ok" }[] }) {
  return (
    <Card className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {itens.map((i) => (
        <div key={i.rotulo} className="flex flex-col gap-1 px-5 py-4">
          <span className="text-[13px] font-medium text-muted">{i.rotulo}</span>
          <span
            className={`text-xl font-semibold tracking-[-0.02em] tabular-nums ${
              i.tom === "danger" ? "text-danger" : i.tom === "ok" ? "text-emerald" : ""
            }`}
          >
            {i.valor}
          </span>
        </div>
      ))}
    </Card>
  );
}

/** Cartão de ações irreversíveis, no fim das configurações. */
export function ZonaPerigo({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2>Zona de perigo</h2>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-danger/30 bg-white p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{titulo}</span>
          <p className="text-[13px] text-muted">{descricao}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
