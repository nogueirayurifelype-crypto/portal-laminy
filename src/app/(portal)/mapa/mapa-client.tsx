"use client";

import dynamic from "next/dynamic";

import type { PontoLojista } from "./types";

// Leaflet acessa `window` ao ser importado: carrega só no navegador.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <p role="status" className="flex h-[70vh] min-h-80 items-center justify-center font-mono text-xs text-muted uppercase">
      Carregando mapa…
    </p>
  ),
});

export function MapaClient({ pontos }: { pontos: PontoLojista[] }) {
  return <LeafletMap pontos={pontos} />;
}
