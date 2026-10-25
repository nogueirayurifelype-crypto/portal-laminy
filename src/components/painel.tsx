"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { IconeFechar } from "./icones";

/**
 * Painel lateral à direita, aberto pela URL (ex.: `?painel=nova-conta`).
 * Fechar = navegar para `fecharHref`; o "voltar" do navegador também fecha.
 */
export function Painel({
  titulo,
  descricao,
  fecharHref,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  fecharHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Foco no primeiro campo; se não houver, no próprio painel.
    const campo = ref.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea");
    (campo ?? ref.current)?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") router.replace(fecharHref, { scroll: false });
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [fecharHref, router]);

  return (
    // z acima dos controles do Leaflet (1000).
    <div className="fixed inset-0 z-[1100] flex justify-end">
      <Link
        href={fecharHref}
        scroll={false}
        replace
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 bg-black/30"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-line bg-white shadow-[-8px_0_24px_rgb(5_8_7/0.08)] outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={tituloId}>{titulo}</h2>
            {descricao && <p className="text-[13px] text-muted">{descricao}</p>}
          </div>
          <Link
            href={fecharHref}
            scroll={false}
            replace
            aria-label="Fechar"
            className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted no-underline hover:bg-mist hover:text-black"
          >
            <IconeFechar />
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
