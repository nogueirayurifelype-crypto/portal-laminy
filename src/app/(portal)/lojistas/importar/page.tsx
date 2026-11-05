import type { Metadata } from "next";

import { ColunasPlanilha } from "@/components/colunas-planilha";
import { ImportarPlanilha } from "@/components/importar-planilha";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";

import { importarLojistas } from "../actions";
import { COLUNAS_LOJISTA } from "../planilha";

export const metadata: Metadata = { title: "Importar lojistas" };

export default async function ImportarLojistasPage() {
  await requireSession();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Importar lojistas"
        descricao="Cadastra vários lojistas de uma vez a partir de uma planilha. Nada é gravado antes da prévia."
        voltar={{ href: "/lojistas", label: "Lojistas" }}
      />
      <ImportarPlanilha
        action={importarLojistas}
        modeloHref="/lojistas/exportar?modelo=1"
        listaHref="/lojistas"
        singular="lojista"
        plural="lojistas"
      />
      <ColunasPlanilha colunas={COLUNAS_LOJISTA} />
    </div>
  );
}
