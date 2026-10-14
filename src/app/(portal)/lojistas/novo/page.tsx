import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";

import { criarLojista } from "../actions";
import { LojistaFields } from "../lojista-fields";

export const metadata: Metadata = { title: "Novo lojista" };

export default async function NovoLojistaPage() {
  await requireSession();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Novo lojista"
        descricao="Só o nome fantasia é obrigatório; o resto pode ser preenchido depois."
        voltar={{ href: "/lojistas", label: "Lojistas" }}
      />
      <Card className="p-5 sm:p-6">
        <ActionForm action={criarLojista} submitLabel="Criar lojista">
          <LojistaFields />
        </ActionForm>
      </Card>
    </div>
  );
}
