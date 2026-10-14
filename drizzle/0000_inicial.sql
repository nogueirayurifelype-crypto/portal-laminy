CREATE TYPE "public"."campanha_status" AS ENUM('rascunho', 'ativa', 'pausada', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."conta_status" AS ENUM('ativa', 'pausada', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('novo', 'contatado', 'qualificado', 'aprovado', 'descartado');--> statement-breakpoint
CREATE TYPE "public"."lojista_status" AS ENUM('ativo', 'em_contrato', 'inativo', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."pagamento_forma" AS ENUM('pix', 'boleto', 'cartao');--> statement-breakpoint
CREATE TYPE "public"."pagamento_status" AS ENUM('pendente', 'pago', 'atrasado');--> statement-breakpoint
CREATE TABLE "campanhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"nicho" text,
	"regiao" text,
	"descricao" text,
	"status" "campanha_status" DEFAULT 'rascunho' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contas_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lojista_id" uuid NOT NULL,
	"conta" text NOT NULL,
	"valor_setup" integer,
	"mensalidade" integer,
	"dia_vencimento" integer,
	"status" "conta_status" DEFAULT 'ativa' NOT NULL,
	"inicio" date,
	"fim" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contas_dia_vencimento_check" CHECK ("contas_financeiras"."dia_vencimento" IS NULL OR "contas_financeiras"."dia_vencimento" BETWEEN 1 AND 31),
	CONSTRAINT "contas_valor_setup_check" CHECK ("contas_financeiras"."valor_setup" IS NULL OR "contas_financeiras"."valor_setup" >= 0),
	CONSTRAINT "contas_mensalidade_check" CHECK ("contas_financeiras"."mensalidade" IS NULL OR "contas_financeiras"."mensalidade" >= 0)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campanha_id" uuid,
	"nome" text NOT NULL,
	"empresa" text,
	"telefone" text,
	"email" text,
	"cidade" text,
	"nicho" text,
	"origem" text,
	"status" "lead_status" DEFAULT 'novo' NOT NULL,
	"lojista_id" uuid,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lojistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"razao_social" text,
	"cnpj" text,
	"email" text,
	"telefone" text,
	"whatsapp" text,
	"cep" text,
	"logradouro" text,
	"numero" text,
	"bairro" text,
	"cidade" text,
	"uf" text,
	"latitude" double precision,
	"longitude" double precision,
	"nicho" text,
	"status" "lojista_status" DEFAULT 'em_contrato' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lojista_id" uuid NOT NULL,
	"conta_id" uuid NOT NULL,
	"competencia" date NOT NULL,
	"valor" integer NOT NULL,
	"status" "pagamento_status" DEFAULT 'pendente' NOT NULL,
	"forma" "pagamento_forma",
	"pago_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pagamentos_valor_check" CHECK ("pagamentos"."valor" >= 0),
	CONSTRAINT "pagamentos_competencia_dia1_check" CHECK (EXTRACT(DAY FROM "pagamentos"."competencia") = 1)
);
--> statement-breakpoint
CREATE TABLE "responsaveis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lojista_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"telefone" text,
	"email" text,
	"principal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_lojista_id_lojistas_id_fk" FOREIGN KEY ("lojista_id") REFERENCES "public"."lojistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_lojista_id_lojistas_id_fk" FOREIGN KEY ("lojista_id") REFERENCES "public"."lojistas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_lojista_id_lojistas_id_fk" FOREIGN KEY ("lojista_id") REFERENCES "public"."lojistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_conta_id_contas_financeiras_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas_financeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_lojista_id_lojistas_id_fk" FOREIGN KEY ("lojista_id") REFERENCES "public"."lojistas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contas_lojista_idx" ON "contas_financeiras" USING btree ("lojista_id");--> statement-breakpoint
CREATE INDEX "leads_campanha_idx" ON "leads" USING btree ("campanha_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_lojista_unique" ON "leads" USING btree ("lojista_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lojistas_cnpj_unique" ON "lojistas" USING btree ("cnpj");--> statement-breakpoint
CREATE INDEX "lojistas_status_idx" ON "lojistas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pagamentos_lojista_idx" ON "pagamentos" USING btree ("lojista_id");--> statement-breakpoint
CREATE INDEX "pagamentos_conta_idx" ON "pagamentos" USING btree ("conta_id");--> statement-breakpoint
CREATE INDEX "pagamentos_competencia_status_idx" ON "pagamentos" USING btree ("competencia","status");--> statement-breakpoint
CREATE INDEX "responsaveis_lojista_idx" ON "responsaveis" USING btree ("lojista_id");--> statement-breakpoint
CREATE UNIQUE INDEX "responsaveis_um_principal" ON "responsaveis" USING btree ("lojista_id") WHERE "responsaveis"."principal";