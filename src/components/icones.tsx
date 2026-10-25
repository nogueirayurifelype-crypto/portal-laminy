import type { ReactNode } from "react";

// Ícones de traço em SVG inline, sem biblioteca. Herdam a cor do texto.

function Icone({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const IconeInicio = (p: P) => (
  <Icone {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v11h14V9" />
    <path d="M10 20v-6h4v6" />
  </Icone>
);

export const IconeLoja = (p: P) => (
  <Icone {...p}>
    <path d="M4 9h16l-1.5-5h-13z" />
    <path d="M5 9v11h14V9" />
    <path d="M9 20v-6h6v6" />
  </Icone>
);

export const IconeFinanceiro = (p: P) => (
  <Icone {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h3" />
  </Icone>
);

export const IconeCampanha = (p: P) => (
  <Icone {...p}>
    <path d="M4 10v4h3l6 4V6l-6 4z" />
    <path d="M17 9a4 4 0 0 1 0 6" />
  </Icone>
);

export const IconeMapa = (p: P) => (
  <Icone {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icone>
);

export const IconeBusca = (p: P) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Icone>
);

export const IconeSeta = (p: P) => (
  <Icone {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icone>
);

export const IconeVoltar = (p: P) => (
  <Icone {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icone>
);

export const IconeSair = (p: P) => (
  <Icone {...p}>
    <path d="M15 4h4v16h-4" />
    <path d="M10 8l-4 4 4 4" />
    <path d="M6 12h10" />
  </Icone>
);

export const IconeMenu = (p: P) => (
  <Icone {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icone>
);

export const IconeFechar = (p: P) => (
  <Icone {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icone>
);

export const IconeMais = (p: P) => (
  <Icone {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icone>
);

export const IconeAlerta = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.3" />
  </Icone>
);
