"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { botao } from "./ui";

const ITEM = "block rounded px-3 py-2 text-sm text-black no-underline hover:bg-mist hover:text-black hover:no-underline";

/**
 * Um só botão para trazer ou levar uma planilha: abre um menu com Importar e Exportar.
 * Exportar é download comum (não navegação), por isso é um <a download>.
 */
export function MenuPlanilha({
  importarHref,
  exportarHref,
  rotulo = "Planilha",
}: {
  importarHref: string;
  exportarHref: string;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        className={botao.secundario}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        {rotulo}
        <svg viewBox="0 0 12 12" className="ml-1.5 size-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {aberto && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1.5 w-44 rounded-lg border border-line bg-white p-1 shadow-[0_8px_24px_rgb(5_8_7/0.10)]"
        >
          <Link role="menuitem" href={importarHref} className={ITEM} onClick={() => setAberto(false)}>
            Importar planilha
          </Link>
          <a role="menuitem" href={exportarHref} download className={ITEM} onClick={() => setAberto(false)}>
            Exportar planilha
          </a>
        </div>
      )}
    </div>
  );
}
