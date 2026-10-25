"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { IconeBusca, IconeCampanha, IconeFinanceiro, IconeInicio, IconeLoja, IconeMapa, IconeMenu } from "./icones";
import { Wordmark } from "./ui";

const GRUPOS = [
  { titulo: null, links: [{ href: "/", label: "Dashboard", Icone: IconeInicio }] },
  {
    titulo: "Clientes",
    links: [
      { href: "/lojistas", label: "Lojistas", Icone: IconeLoja },
      { href: "/financeiro", label: "Financeiro", Icone: IconeFinanceiro },
      { href: "/mapa", label: "Mapa", Icone: IconeMapa },
    ],
  },
  { titulo: "Prospecção", links: [{ href: "/campanhas", label: "Campanhas e leads", Icone: IconeCampanha }] },
] as const;

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Links({ pathname }: { pathname: string | null }) {
  return GRUPOS.map((g) => (
    <div key={g.titulo ?? "inicio"} className="flex flex-col gap-0.5">
      {g.titulo && <span className="px-3 pt-4 pb-1.5 text-xs font-medium text-muted">{g.titulo}</span>}
      {g.links.map(({ href, label, Icone }) => {
        const atual = pathname !== null && ativo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={`flex min-h-9 items-center gap-3 rounded-md px-3 text-sm no-underline transition-colors ${
              atual ? "bg-mist font-medium text-black" : "text-black/80 hover:bg-mist/70 hover:text-black"
            }`}
          >
            <Icone className={`size-4 ${atual ? "text-emerald" : "text-muted"}`} />
            {label}
          </Link>
        );
      })}
    </div>
  ));
}

// A rota só existe em tempo de execução: fica atrás de Suspense para não bloquear o prerender.
function LinksDaRota() {
  return <Links pathname={usePathname()} />;
}

/** Sidebar clara fixa no desktop; menu recolhível em telas pequenas. */
export function Sidebar({ rodape }: { rodape: ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <aside className="border-b border-line bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-16 lg:px-5">
        <Link href="/" className="flex items-center gap-2.5 rounded no-underline" aria-label="Laminy, ir para o dashboard">
          <Wordmark className="h-5 text-black" />
          <span className="rounded-md border border-line bg-white px-1.5 py-px text-[11px] font-medium text-muted">
            Admin
          </span>
        </Link>
        <button
          type="button"
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-line bg-white lg:hidden"
          aria-expanded={aberto}
          aria-controls="menu-principal"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setAberto((v) => !v)}
        >
          <IconeMenu />
        </button>
      </div>

      <div
        id="menu-principal"
        className={`${aberto ? "flex" : "hidden"} min-h-0 flex-col border-t border-line lg:flex lg:flex-1 lg:border-t-0`}
      >
        <form action="/lojistas" role="search" className="px-3 pt-3 lg:pt-1">
          <label htmlFor="busca-rapida" className="sr-only">
            Buscar lojista
          </label>
          <div className="relative">
            <IconeBusca className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              id="busca-rapida"
              name="q"
              type="search"
              placeholder="Buscar lojista…"
              className="min-h-9 pl-9 shadow-[0_1px_2px_rgb(5_8_7/0.04)]"
            />
          </div>
        </form>
        <nav
          aria-label="Principal"
          className="flex flex-col overflow-y-auto px-3 py-3"
          // Fecha o menu móvel ao escolher um destino.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setAberto(false);
          }}
        >
          <Suspense fallback={<Links pathname={null} />}>
            <LinksDaRota />
          </Suspense>
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-3">{rodape}</div>
      </div>
    </aside>
  );
}
