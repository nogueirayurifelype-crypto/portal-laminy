import { Field, Grid, Select, TextArea } from "@/components/fields";
import { Grupo } from "@/components/ui";
import { LOJISTA_STATUS, type Lojista } from "@/db/schema";

export function LojistaFields({ lojista }: { lojista?: Lojista }) {
  const l = lojista;
  return (
    <>
      <Grupo titulo="Dados básicos">
        <Grid>
          <Field name="nome" label="Nome fantasia" required defaultValue={l?.nome} />
          <Field name="razaoSocial" label="Razão social" defaultValue={l?.razaoSocial} />
          <Field name="cnpj" label="CNPJ" inputMode="numeric" defaultValue={l?.cnpj} />
          <Field name="nicho" label="Nicho" defaultValue={l?.nicho} />
          <Select
            name="status"
            label="Status"
            options={LOJISTA_STATUS}
            defaultValue={l?.status ?? "em_contrato"}
          />
        </Grid>
      </Grupo>
      <Grupo titulo="Contato">
        <Grid>
          <Field name="email" label="E-mail" type="email" defaultValue={l?.email} />
          <Field name="telefone" label="Telefone" type="tel" defaultValue={l?.telefone} />
          <Field name="whatsapp" label="WhatsApp" type="tel" defaultValue={l?.whatsapp} />
        </Grid>
      </Grupo>
      <Grupo titulo="Endereço">
        <Grid>
          <Field name="cep" label="CEP" inputMode="numeric" defaultValue={l?.cep} />
          <Field name="logradouro" label="Logradouro" defaultValue={l?.logradouro} />
          <Field name="numero" label="Número" defaultValue={l?.numero} />
          <Field name="bairro" label="Bairro" defaultValue={l?.bairro} />
          <Field name="cidade" label="Cidade" defaultValue={l?.cidade} />
          <Field name="uf" label="UF" defaultValue={l?.uf} />
          <Field name="latitude" label="Latitude" inputMode="decimal" defaultValue={l?.latitude} />
          <Field name="longitude" label="Longitude" inputMode="decimal" defaultValue={l?.longitude} />
        </Grid>
      </Grupo>
      <Grupo titulo="Observações">
        <TextArea name="observacoes" label="Observações internas" defaultValue={l?.observacoes} />
      </Grupo>
    </>
  );
}
