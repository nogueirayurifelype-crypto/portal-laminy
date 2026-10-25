import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { IconeAlerta } from "@/components/icones";
import { Chips, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { LOJISTA_STATUS, lojistas } from "@/db/schema";
import { label } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { hrefCom, param } from "@/lib/url";

import { MapaClient } from "./mapa-client";
import type { PontoLojista } from "./types";

export const metadata: Metadata = { title: "Mapa" };

export default async function MapaPage({ searchParams }: PageProps<"/mapa">) {
  await requireSession();
  const filtro = param((await searchParams).status);
  const status = LOJISTA_STATUS.find((s) => s === filtro);

  const todos = await db
    .select({
      id: lojistas.id,
      nome: lojistas.nome,
      cidade: lojistas.cidade,
      status: lojistas.status,
      latitude: lojistas.latitude,
      longitude: lojistas.longitude,
    })
    .from(lojistas)
    .orderBy(asc(lojistas.nome));

  const comCoordenadas: PontoLojista[] = todos.flatMap(({ latitude, longitude, ...l }) =>
    latitude != null && longitude != null ? [{ ...l, latitude, longitude }] : [],
  );
  const semCoordenadas = todos.length - comCoordenadas.length;
  const pontos = status ? comCoordenadas.filter((p) => p.status === status) : comCoordenadas;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Mapa"
        descricao={`${pontos.length} ${pontos.length === 1 ? "lojista" : "lojistas"} no mapa${status ? ` com status “${label(status)}”` : ""}.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chips
          rotulo="Filtrar por status"
          itens={[
            { href: "/mapa", label: "Todos", ativo: !status, contagem: comCoordenadas.length },
            ...LOJISTA_STATUS.map((s) => ({
              href: hrefCom("/mapa", { status: s }),
              label: label(s),
              ativo: status === s,
              contagem: comCoordenadas.filter((p) => p.status === s).length,
            })),
          ]}
        />
        {semCoordenadas > 0 && (
          <Link
            href="/lojistas?coordenadas=sem"
            className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-bg px-3 py-1 text-[13px] text-warn no-underline hover:border-warn/60"
          >
            <IconeAlerta className="size-3.5" />
            {semCoordenadas === 1 ? "1 lojista sem coordenadas" : `${semCoordenadas} lojistas sem coordenadas`}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      <div className="h-[calc(100dvh-15rem)] min-h-96 overflow-hidden rounded-card border border-line">
        {/* Remonta ao trocar o filtro para reenquadrar os pontos. */}
        <MapaClient key={status ?? "todos"} pontos={pontos} />
      </div>
    </div>
  );
}
