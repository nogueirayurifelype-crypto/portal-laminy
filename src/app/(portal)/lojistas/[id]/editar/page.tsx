import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { lojistas } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { uuid } from "@/lib/validation";

import { atualizarLojista } from "../../actions";
import { LojistaFields } from "../../lojista-fields";

export const metadata: Metadata = { title: "Editar lojista" };

export default async function EditarLojistaPage({ params }: PageProps<"/lojistas/[id]/editar">) {
  await requireSession();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();

  const lojista = await db.query.lojistas.findFirst({ where: eq(lojistas.id, id.data) });
  if (!lojista) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Editar lojista" voltar={{ href: `/lojistas/${lojista.id}`, label: lojista.nome }} />
      <Card className="p-5 sm:p-6">
        <ActionForm action={atualizarLojista.bind(null, lojista.id)} submitLabel="Salvar alterações">
          <LojistaFields lojista={lojista} />
        </ActionForm>
      </Card>
    </div>
  );
}
