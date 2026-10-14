import { Field, Grid, Select } from "@/components/fields";
import { CONTA_STATUS, type ContaFinanceira } from "@/db/schema";
import { centavosParaInput } from "@/lib/format";

export function ContaFields({ conta }: { conta?: ContaFinanceira }) {
  return (
    <Grid>
      <Field name="conta" label="Conta / plano" required defaultValue={conta?.conta} />
      <Field
        name="valorSetup"
        label="Setup (R$)"
        inputMode="decimal"
        placeholder="0,00"
        defaultValue={centavosParaInput(conta?.valorSetup)}
      />
      <Field
        name="mensalidade"
        label="Mensalidade (R$)"
        inputMode="decimal"
        placeholder="vazio = sem mensalidade"
        defaultValue={centavosParaInput(conta?.mensalidade)}
      />
      <Field
        name="diaVencimento"
        label="Dia de vencimento"
        type="number"
        min={1}
        max={31}
        defaultValue={conta?.diaVencimento}
      />
      <Select name="status" label="Status" options={CONTA_STATUS} defaultValue={conta?.status ?? "ativa"} />
      <Field name="inicio" label="Início" type="date" defaultValue={conta?.inicio} />
      <Field name="fim" label="Fim" type="date" defaultValue={conta?.fim} />
    </Grid>
  );
}
