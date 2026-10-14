import "server-only";

import { parseEnv } from "@neon/env";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import neonProject from "../../neon";
import * as schema from "./schema";

// Driver WebSocket (Pool) em vez do HTTP: precisamos de transações interativas
// (ex.: aprovarLead). Node 22+ já expõe WebSocket global.
neonConfig.webSocketConstructor ??= globalThis.WebSocket;

function createDb() {
  // DATABASE_URL é a conexão pooled (PgBouncer), a indicada para o tráfego do app.
  // parseEnv valida contra o neon.ts e falha com mensagem clara se faltar.
  const { postgres } = parseEnv(neonProject, ["DATABASE_URL"]);
  return drizzle({ client: new Pool({ connectionString: postgres.databaseUrl }), schema });
}

export type DB = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db?: DB };

function getDb(): DB {
  if (globalForDb.db) return globalForDb.db;
  const instancia = createDb();
  // Em dev o hot reload reavalia o módulo; guardar no globalThis evita pools duplicados.
  globalForDb.db = instancia;
  return instancia;
}

// Criado só no primeiro uso: o build importa este módulo sem precisar das variáveis.
export const db = new Proxy({} as DB, {
  get(_alvo, prop) {
    const instancia = getDb();
    const valor = Reflect.get(instancia, prop, instancia);
    return typeof valor === "function" ? valor.bind(instancia) : valor;
  },
});
