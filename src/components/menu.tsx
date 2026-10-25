"use client";

import { Fragment, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { IconeMais } from "./icones";

export const itemMenu =
  "flex min-h-9 w-full cursor-pointer items-center rounded-md px-3 text-left text-sm whitespace-nowrap text-black no-underline hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Menu "⋯" de ações de uma linha. Usa a Popover API: fecha ao clicar fora e
 * com Esc, e fica acima da rolagem da tabela. Itens usam a classe `itemMenu`.
 */
export function Menu({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const id = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Remonta os itens a cada abertura (desarma confirmações pendentes).
  const [abertura, setAbertura] = useState(0);

  function posicionar(e: React.ToggleEvent<HTMLDivElement>) {
    if (e.newState !== "open" || !botaoRef.current) return;
    setAbertura((n) => n + 1);
    const r = botaoRef.current.getBoundingClientRect();
    const s = e.currentTarget.style;
    s.right = `${window.innerWidth - r.right}px`;
    // Perto do fim da tela, abre para cima.
    if (r.bottom + 220 > window.innerHeight) {
      s.top = "auto";
      s.bottom = `${window.innerHeight - r.top + 4}px`;
    } else {
      s.bottom = "auto";
      s.top = `${r.bottom + 4}px`;
    }
  }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        popoverTarget={id}
        aria-label={rotulo}
        title={rotulo}
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-mist hover:text-black"
      >
        <IconeMais />
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        onBeforeToggle={posicionar}
        // Fecha depois de escolher (o envio do formulário segue normalmente).
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-manter-aberto]")) return;
          if ((e.target as HTMLElement).closest("button, a")) setTimeout(() => menuRef.current?.hidePopover());
        }}
        className="fixed m-0 min-w-48 flex-col gap-0.5 rounded-lg border border-line bg-white p-1 shadow-[0_8px_24px_rgb(5_8_7/0.12)] [inset:auto] open:flex"
      >
        <Fragment key={abertura}>{children}</Fragment>
      </div>
    </>
  );
}

/** Item perigoso do menu: o primeiro clique pede confirmação, o segundo envia. */
export function ItemConfirmar({
  action,
  rotulo,
  confirmar,
}: {
  action: () => Promise<void>;
  rotulo: string;
  /** Texto do segundo clique (ex.: "Confirmar remoção"). */
  confirmar: string;
}) {
  const [armado, setArmado] = useState(false);
  if (!armado)
    return (
      <button type="button" data-manter-aberto className={`${itemMenu} text-danger`} onClick={() => setArmado(true)}>
        {rotulo}…
      </button>
    );
  return (
    <form action={action}>
      <Enviar>{confirmar}</Enviar>
    </form>
  );
}

function Enviar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      autoFocus
      disabled={pending}
      className={`${itemMenu} bg-danger-bg font-medium text-danger hover:bg-danger-bg`}
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}
