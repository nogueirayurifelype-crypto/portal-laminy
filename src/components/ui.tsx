import Link from "next/link";
import type { ReactNode } from "react";

import { label } from "@/lib/format";

// Peças visuais do portal. Decisões em DESIGN.md.

const BOTAO_BASE =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm whitespace-nowrap no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const botao = {
  primario: `${BOTAO_BASE} bg-signal font-semibold text-black hover:bg-[#15ad6c]`,
  secundario: `${BOTAO_BASE} border border-line-strong bg-white font-medium text-black hover:border-forest hover:bg-hover`,
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
    <header className="flex flex-col gap-3">
      {voltar && (
        <Link
          href={voltar.href}
          className="self-start font-mono text-xs tracking-wide text-muted uppercase no-underline hover:text-black"
        >
          ← {voltar.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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

/** Célula/valor em DM Mono com algarismos tabulares. */
export function Num({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] whitespace-nowrap tabular-nums">{children}</span>;
}

export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-5 py-8 text-sm text-muted">
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

/** Pílula de status: ponto + rótulo mono. A cor nunca vem sozinha. */
export function Status({ valor }: { valor: string | null | undefined }) {
  if (!valor) return <span className="text-muted">—</span>;
  const tom = TOM_CLASSE[TOM[valor] ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs whitespace-nowrap uppercase ${tom}`}
    >
      <span className="size-2 shrink-0 rounded-full bg-current" aria-hidden />
      {label(valor)}
    </span>
  );
}

/** Grupo de campos de formulário com título. */
export function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 font-mono text-xs tracking-wide text-muted uppercase">{titulo}</legend>
        {children}
      </fieldset>
    </div>
  );
}
