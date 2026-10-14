import { and, asc, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";

import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { lojistas } from "@/db/schema";
import { requireSession } from "@/lib/session";

import { MapaClient } from "./mapa-client";
import type { PontoLojista } from "./types";

export const metadata: Metadata = { title: "Mapa" };

export default async function MapaPage() {
  await requireSession();

  const pontos = (await db
    .select({
      id: lojistas.id,
      nome: lojistas.nome,
      cidade: lojistas.cidade,
      status: lojistas.status,
      latitude: lojistas.latitude,
      longitude: lojistas.longitude,
    })
    .from(lojistas)
    .where(and(isNotNull(lojistas.latitude), isNotNull(lojistas.longitude)))
    .orderBy(asc(lojistas.nome))) as PontoLojista[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Mapa"
        descricao={
          pontos.length === 0
            ? "Nenhum lojista com coordenadas. Preencha latitude e longitude na ficha do lojista para ele aparecer aqui."
            : `${pontos.length} ${pontos.length === 1 ? "lojista" : "lojistas"} com coordenadas. Os demais aparecem ao preencher latitude e longitude na ficha.`
        }
      />
      <Card className="overflow-hidden">
        <MapaClient pontos={pontos} />
      </Card>
    </div>
  );
}
