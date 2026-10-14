import { Field, Grid, Select, TextArea } from "@/components/fields";
import { Grupo, Status } from "@/components/ui";
import type { Lead } from "@/db/schema";

import { LEAD_STATUS_EDITAVEIS } from "./constants";

export function LeadFields({
  lead,
  campanhas,
  campanhaId,
}: {
  lead?: Lead;
  campanhas: { id: string; nome: string }[];
  campanhaId?: string | null;
}) {
  const aprovado = lead?.status === "aprovado";
  return (
    <>
      <Grupo titulo="Contato">
        <Grid>
          <Field name="nome" label="Nome do contato" required defaultValue={lead?.nome} />
          <Field name="empresa" label="Empresa" defaultValue={lead?.empresa} />
          <Field name="telefone" label="Telefone" type="tel" defaultValue={lead?.telefone} />
          <Field name="email" label="E-mail" type="email" defaultValue={lead?.email} />
          <Field name="cidade" label="Cidade" defaultValue={lead?.cidade} />
          <Field name="nicho" label="Nicho" defaultValue={lead?.nicho} />
        </Grid>
      </Grupo>
      <Grupo titulo="Prospecção">
        <Grid>
          <Field name="origem" label="Origem" placeholder="indicação, Instagram…" defaultValue={lead?.origem} />
          <Select
            name="campanhaId"
            label="Campanha"
            options={campanhas.map((c) => ({ value: c.id, label: c.nome }))}
            vazio="Sem campanha"
            defaultValue={lead?.campanhaId ?? campanhaId}
          />
          {aprovado ? (
            <>
              <input type="hidden" name="status" value="novo" />
              <div className="flex flex-col gap-1.5 text-sm font-medium">
                Status
                <span className="flex min-h-10 items-center">
                  <Status valor="aprovado" />
                </span>
              </div>
            </>
          ) : (
            <Select name="status" label="Status" options={LEAD_STATUS_EDITAVEIS} defaultValue={lead?.status ?? "novo"} />
          )}
        </Grid>
        <TextArea name="observacoes" label="Observações" defaultValue={lead?.observacoes} />
      </Grupo>
    </>
  );
}
