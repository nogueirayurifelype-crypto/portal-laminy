import type { Metadata } from "next";

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
      <Colunas />
    </div>
  );
}

function Colunas() {
  return (
    <section className="flex flex-col gap-2 text-[13px] text-muted">
      <h2 className="text-sm text-black">Como preencher</h2>
      <p>
        Colunas aceitas: {COLUNAS_LOJISTA.map((c) => c.cabecalho).join(", ")}. Só “nome_fantasia” é obrigatória; a ordem
        das colunas não importa e colunas desconhecidas são ignoradas.
      </p>
      <p>
        status: ativo, em_contrato, inativo ou cancelado (vazio = em_contrato). cnpj com 14 dígitos e cep com 8, com ou
        sem pontuação; no Excel, deixe essas colunas como texto para não perder zeros. Lojista com CNPJ já cadastrado é
        ignorado.
      </p>
    </section>
  );
}
