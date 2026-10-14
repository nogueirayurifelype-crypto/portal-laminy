import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";

import { criarCampanha } from "../actions";
import { CampanhaFields } from "../campanha-fields";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage() {
  await requireSession();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Nova campanha" voltar={{ href: "/campanhas", label: "Campanhas" }} />
      <Card className="p-5 sm:p-6">
        <ActionForm action={criarCampanha} submitLabel="Criar campanha">
          <CampanhaFields />
        </ActionForm>
      </Card>
    </div>
  );
}
