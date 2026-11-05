import { desc } from "drizzle-orm";
import type { Metadata } from "next";

import { Select } from "@/components/fields";
import { ImportarPlanilha } from "@/components/importar-planilha";
import { PageHeader } from "@/components/ui";
import { db } from "@/db";
import { campanhas } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { param } from "@/lib/url";

import { importarLeads } from "../../actions";
import { COLUNAS_LEAD } from "../../planilha";

export const metadata: Metadata = { title: "Importar leads" };

export default async function ImportarLeadsPage({ searchParams }: PageProps<"/campanhas/leads/importar">) {
  await requireSession();
  const campanhaId = param((await searchParams).campanha);
  const opcoes = await db
    .select({ id: campanhas.id, nome: campanhas.nome })
    .from(campanhas)
    .orderBy(desc(campanhas.createdAt));
  const atual = opcoes.find((c) => c.id === campanhaId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Importar leads"
        descricao="Traz uma lista de prospecção de uma planilha. Nada é gravado antes da prévia."
        voltar={atual ? { href: `/campanhas/${atual.id}`, label: atual.nome } : { href: "/campanhas?aba=leads", label: "Leads" }}
      />
      <ImportarPlanilha
        action={importarLeads}
        modeloHref="/campanhas/leads/exportar?modelo=1"
        listaHref={atual ? `/campanhas/${atual.id}` : "/campanhas?aba=leads"}
        singular="lead"
        plural="leads"
        campos={
          <div className="max-w-md">
            <Select
              name="campanhaId"
              label="Campanha (para linhas sem a coluna “campanha”)"
              options={opcoes.map((c) => ({ value: c.id, label: c.nome }))}
              vazio="Sem campanha"
              defaultValue={atual?.id}
            />
          </div>
        }
      />
      <section className="flex flex-col gap-2 text-[13px] text-muted">
        <h2 className="text-sm text-black">Como preencher</h2>
        <p>
          Colunas aceitas: {COLUNAS_LEAD.map((c) => c.cabecalho).join(", ")}. Só “nome_contato” é obrigatória; a ordem
          das colunas não importa e colunas desconhecidas são ignoradas.
        </p>
        <p>
          status: novo, contatado, qualificado ou descartado (vazio = novo); “aprovado” só pelo botão de aprovar, que cria
          o lojista. “campanha” precisa ter o nome de uma campanha já criada. Leads com e-mail ou telefone já cadastrado
          (em outro lead ou num lojista) são ignorados.
        </p>
      </section>
    </div>
  );
}
