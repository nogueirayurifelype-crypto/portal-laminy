import { Field, Grid, Select, TextArea } from "@/components/fields";
import { EnderecoFields } from "@/components/endereco-fields";
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
          <Field name="empresa" label="Nome fantasia" defaultValue={lead?.empresa} />
          <Field name="razaoSocial" label="Razão social" defaultValue={lead?.razaoSocial} />
          <Field name="cnpj" label="CNPJ" inputMode="numeric" defaultValue={lead?.cnpj} />
          <Field name="nicho" label="Nicho" defaultValue={lead?.nicho} />
          <Field name="telefone" label="Telefone" type="tel" defaultValue={lead?.telefone} />
          <Field name="whatsapp" label="WhatsApp" type="tel" defaultValue={lead?.whatsapp} />
          <Field name="email" label="E-mail" type="email" defaultValue={lead?.email} />
        </Grid>
      </Grupo>
      <Grupo titulo="Site e redes sociais">
        <Grid>
          <Field name="site" label="Site" placeholder="https://" defaultValue={lead?.site} />
          <Field name="instagram" label="Instagram" placeholder="@usuario ou link" defaultValue={lead?.instagram} />
          <Field name="facebook" label="Facebook" placeholder="link da página" defaultValue={lead?.facebook} />
          <Field name="tiktok" label="TikTok" placeholder="@usuario ou link" defaultValue={lead?.tiktok} />
        </Grid>
      </Grupo>
      <Grupo titulo="Endereço">
        <EnderecoFields valor={lead} />
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
