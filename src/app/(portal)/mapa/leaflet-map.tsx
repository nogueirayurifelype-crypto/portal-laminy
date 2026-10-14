"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { Status } from "@/components/ui";

import type { PontoLojista } from "./types";

// Ponto signal com halo (estilo em .marcador, globals.css).
const marcador = L.divIcon({
  className: "",
  html: '<span class="marcador"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// Centro aproximado do Brasil, usado quando não há pontos.
const CENTRO_BRASIL: [number, number] = [-14.235, -51.925];

export default function LeafletMap({ pontos }: { pontos: PontoLojista[] }) {
  const bounds =
    pontos.length > 0 ? L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude])) : undefined;

  return (
    <MapContainer
      {...(bounds ? { bounds, boundsOptions: { padding: [40, 40], maxZoom: 14 } } : { center: CENTRO_BRASIL, zoom: 4 })}
      scrollWheelZoom
      className="h-[70vh] min-h-80 w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pontos.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={marcador} title={p.nome}>
          <Popup>
            <div className="flex flex-col items-start gap-1.5">
              <strong className="text-[15px] font-semibold">{p.nome}</strong>
              {p.cidade && <span className="text-muted">{p.cidade}</span>}
              <Status valor={p.status} />
              <Link href={`/lojistas/${p.id}`} className="mt-1">
                Abrir ficha →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
