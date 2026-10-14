"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { Wordmark } from "./ui";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/lojistas", label: "Lojistas" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/campanhas", label: "Campanhas" },
  { href: "/mapa", label: "Mapa" },
] as const;

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Links({ pathname }: { pathname: string | null }) {
  return LINKS.map((l) => {
    const atual = pathname !== null && ativo(pathname, l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={atual ? "page" : undefined}
        className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[15px] font-medium no-underline transition-colors hover:bg-white/5 ${
          atual ? "text-white" : "text-white/65 hover:text-white"
        }`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${atual ? "bg-signal" : "bg-transparent"}`} aria-hidden />
        {l.label}
      </Link>
    );
  });
}

// A rota só existe em tempo de execução: fica atrás de Suspense para não bloquear o prerender.
function LinksDaRota() {
  return <Links pathname={usePathname()} />;
}

/** Sidebar fixa no desktop; menu recolhível em telas pequenas. */
export function Sidebar({ rodape }: { rodape: ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <aside className="bg-black text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:bg-forest">
      <div className="flex h-14 items-center justify-between px-4 lg:h-20 lg:px-6">
        <Link href="/" className="rounded no-underline" aria-label="Laminy, ir para o dashboard">
          <Wordmark />
        </Link>
        <button
          type="button"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-white/25 px-4 font-mono text-xs tracking-wide uppercase lg:hidden"
          aria-expanded={aberto}
          aria-controls="menu-principal"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>

      <div
        id="menu-principal"
        className={`${aberto ? "flex" : "hidden"} flex-col border-t border-white/10 lg:flex lg:flex-1 lg:border-t-0`}
      >
        <nav
          aria-label="Principal"
          className="flex flex-col gap-0.5 p-3 lg:px-3 lg:py-2"
          // Fecha o menu móvel ao escolher um destino.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setAberto(false);
          }}
        >
          <Suspense fallback={<Links pathname={null} />}>
            <LinksDaRota />
          </Suspense>
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 p-4 lg:px-6 lg:py-5">{rodape}</div>
      </div>
    </aside>
  );
}
