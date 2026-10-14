import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Carrega .env.local / .env igual ao Next (o `neon deploy` grava as URLs no .env.local).
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Migrations usam a conexão direta: o pooler (PgBouncer, modo transação)
    // não mantém estado de sessão e pode quebrar o drizzle-kit.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
