import { Field, Grid, Select, TextArea } from "@/components/fields";
import { EnderecoFields } from "@/components/endereco-fields";
import { Grupo } from "@/components/ui";
import { LOJISTA_STATUS, type Lojista } from "@/db/schema";
import { SIM_NAO, valorSimNao } from "@/lib/format";

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
      <Grupo titulo="Site e redes sociais">
        <Grid>
          <Select
            name="temSite"
            label="Tem site?"
            options={SIM_NAO}
            vazio="Não informado"
            defaultValue={valorSimNao(l?.temSite)}
          />
          <Field name="site" label="Site" inputMode="text" placeholder="https://" defaultValue={l?.site} />
          <Field name="instagram" label="Instagram" placeholder="@usuario ou link" defaultValue={l?.instagram} />
          <Field name="facebook" label="Facebook" placeholder="link da página" defaultValue={l?.facebook} />
          <Field name="tiktok" label="TikTok" placeholder="@usuario ou link" defaultValue={l?.tiktok} />
        </Grid>
      </Grupo>
      <Grupo titulo="Endereço">
        <EnderecoFields valor={l} />
      </Grupo>
      <Grupo titulo="Observações">
        <TextArea name="observacoes" label="Observações internas" defaultValue={l?.observacoes} />
      </Grupo>
    </>
  );
}
