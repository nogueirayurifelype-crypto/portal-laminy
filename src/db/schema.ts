import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Convenções:
// - dinheiro sempre em centavos (integer);
// - instantes em timestamptz; datas de calendário (início/fim de contrato,
//   competência) em `date`, para não sofrerem com fuso horário;
// - ids uuid gerados pelo banco.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

// ---------- Enums ----------

export const lojistaStatus = pgEnum("lojista_status", [
  "ativo",
  "em_contrato",
  "inativo",
  "cancelado",
]);

export const contaStatus = pgEnum("conta_status", ["ativa", "pausada", "encerrada"]);

export const pagamentoStatus = pgEnum("pagamento_status", ["pendente", "pago", "atrasado"]);

export const pagamentoForma = pgEnum("pagamento_forma", ["pix", "boleto", "cartao"]);

export const campanhaStatus = pgEnum("campanha_status", [
  "rascunho",
  "ativa",
  "pausada",
  "encerrada",
]);

export const leadStatus = pgEnum("lead_status", [
  "novo",
  "contatado",
  "qualificado",
  "aprovado",
  "descartado",
]);

// ---------- Tabelas ----------

export const lojistas = pgTable(
  "lojistas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    razaoSocial: text("razao_social"),
    cnpj: text("cnpj"),
    email: text("email"),
    telefone: text("telefone"),
    whatsapp: text("whatsapp"),
    cep: text("cep"),
    logradouro: text("logradouro"),
    numero: text("numero"),
    bairro: text("bairro"),
    cidade: text("cidade"),
    uf: text("uf"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    nicho: text("nicho"),
    status: lojistaStatus("status").notNull().default("em_contrato"),
    observacoes: text("observacoes"),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("lojistas_cnpj_unique").on(t.cnpj),
    index("lojistas_status_idx").on(t.status),
  ],
);

export const responsaveis = pgTable(
  "responsaveis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojistaId: uuid("lojista_id")
      .notNull()
      .references(() => lojistas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    cargo: text("cargo"),
    telefone: text("telefone"),
    email: text("email"),
    principal: boolean("principal").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("responsaveis_lojista_idx").on(t.lojistaId),
    // No máximo um responsável principal por lojista.
    uniqueIndex("responsaveis_um_principal").on(t.lojistaId).where(sql`${t.principal}`),
  ],
);

export const contasFinanceiras = pgTable(
  "contas_financeiras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojistaId: uuid("lojista_id")
      .notNull()
      .references(() => lojistas.id),
    conta: text("conta").notNull(),
    valorSetup: integer("valor_setup"),
    mensalidade: integer("mensalidade"),
    diaVencimento: integer("dia_vencimento"),
    status: contaStatus("status").notNull().default("ativa"),
    inicio: date("inicio"),
    fim: date("fim"),
    ...timestamps,
  },
  (t) => [
    index("contas_lojista_idx").on(t.lojistaId),
    check(
      "contas_dia_vencimento_check",
      sql`${t.diaVencimento} IS NULL OR ${t.diaVencimento} BETWEEN 1 AND 31`,
    ),
    check("contas_valor_setup_check", sql`${t.valorSetup} IS NULL OR ${t.valorSetup} >= 0`),
    check("contas_mensalidade_check", sql`${t.mensalidade} IS NULL OR ${t.mensalidade} >= 0`),
  ],
);

export const pagamentos = pgTable(
  "pagamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojistaId: uuid("lojista_id")
      .notNull()
      .references(() => lojistas.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contasFinanceiras.id),
    // Sempre o dia 1 do mês de referência (ex.: 2026-10-01).
    competencia: date("competencia").notNull(),
    valor: integer("valor").notNull(),
    status: pagamentoStatus("status").notNull().default("pendente"),
    forma: pagamentoForma("forma"),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("pagamentos_lojista_idx").on(t.lojistaId),
    index("pagamentos_conta_idx").on(t.contaId),
    index("pagamentos_competencia_status_idx").on(t.competencia, t.status),
    check("pagamentos_valor_check", sql`${t.valor} >= 0`),
    check(
      "pagamentos_competencia_dia1_check",
      sql`EXTRACT(DAY FROM ${t.competencia}) = 1`,
    ),
  ],
);

export const campanhas = pgTable("campanhas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  nicho: text("nicho"),
  regiao: text("regiao"),
  descricao: text("descricao"),
  status: campanhaStatus("status").notNull().default("rascunho"),
  ...timestamps,
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campanhaId: uuid("campanha_id").references(() => campanhas.id, { onDelete: "set null" }),
    nome: text("nome").notNull(),
    empresa: text("empresa"),
    telefone: text("telefone"),
    email: text("email"),
    cidade: text("cidade"),
    nicho: text("nicho"),
    origem: text("origem"),
    status: leadStatus("status").notNull().default("novo"),
    lojistaId: uuid("lojista_id").references(() => lojistas.id, { onDelete: "set null" }),
    observacoes: text("observacoes"),
    ...timestamps,
  },
  (t) => [
    index("leads_campanha_idx").on(t.campanhaId),
    index("leads_status_idx").on(t.status),
    uniqueIndex("leads_lojista_unique").on(t.lojistaId),
  ],
);

// ---------- Relações (para db.query) ----------

export const lojistasRelations = relations(lojistas, ({ many }) => ({
  responsaveis: many(responsaveis),
  contas: many(contasFinanceiras),
  pagamentos: many(pagamentos),
  leads: many(leads),
}));

export const responsaveisRelations = relations(responsaveis, ({ one }) => ({
  lojista: one(lojistas, { fields: [responsaveis.lojistaId], references: [lojistas.id] }),
}));

export const contasFinanceirasRelations = relations(contasFinanceiras, ({ one, many }) => ({
  lojista: one(lojistas, { fields: [contasFinanceiras.lojistaId], references: [lojistas.id] }),
  pagamentos: many(pagamentos),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  lojista: one(lojistas, { fields: [pagamentos.lojistaId], references: [lojistas.id] }),
  conta: one(contasFinanceiras, {
    fields: [pagamentos.contaId],
    references: [contasFinanceiras.id],
  }),
}));

export const campanhasRelations = relations(campanhas, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  campanha: one(campanhas, { fields: [leads.campanhaId], references: [campanhas.id] }),
  lojista: one(lojistas, { fields: [leads.lojistaId], references: [lojistas.id] }),
}));

export type Lojista = typeof lojistas.$inferSelect;
export type Responsavel = typeof responsaveis.$inferSelect;
export type ContaFinanceira = typeof contasFinanceiras.$inferSelect;
export type Pagamento = typeof pagamentos.$inferSelect;
export type Campanha = typeof campanhas.$inferSelect;
export type Lead = typeof leads.$inferSelect;

export const LOJISTA_STATUS = lojistaStatus.enumValues;
export const CONTA_STATUS = contaStatus.enumValues;
export const PAGAMENTO_STATUS = pagamentoStatus.enumValues;
export const PAGAMENTO_FORMA = pagamentoForma.enumValues;
export const CAMPANHA_STATUS = campanhaStatus.enumValues;
export const LEAD_STATUS = leadStatus.enumValues;
