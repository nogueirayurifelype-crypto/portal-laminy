import { Field, Grid, Select, TextArea } from "@/components/fields";
import { Grupo } from "@/components/ui";
import { CAMPANHA_STATUS, type Campanha } from "@/db/schema";

export function CampanhaFields({ campanha }: { campanha?: Campanha }) {
  return (
    <Grupo titulo="Campanha">
      <Grid>
        <Field name="nome" label="Nome" required defaultValue={campanha?.nome} />
        <Field name="nicho" label="Nicho" defaultValue={campanha?.nicho} />
        <Field name="regiao" label="Região" defaultValue={campanha?.regiao} />
        <Select
          name="status"
          label="Status"
          options={CAMPANHA_STATUS}
          defaultValue={campanha?.status ?? "rascunho"}
        />
      </Grid>
      <TextArea name="descricao" label="Descrição" defaultValue={campanha?.descricao} />
    </Grupo>
  );
}
