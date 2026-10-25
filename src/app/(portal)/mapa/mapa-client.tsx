"use client";

import dynamic from "next/dynamic";

import type { PontoLojista } from "./types";

// Leaflet acessa `window` ao ser importado: carrega só no navegador.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <p role="status" className="flex h-full min-h-80 items-center justify-center text-sm text-muted">
      Carregando mapa…
    </p>
  ),
});

export function MapaClient({ pontos }: { pontos: PontoLojista[] }) {
  return <LeafletMap pontos={pontos} />;
}
