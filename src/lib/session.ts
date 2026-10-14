import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth, emailPermitido } from "@/auth";

// O proxy já barra quem não está logado, mas a doc do Auth.js recomenda
// checar de novo perto do acesso a dados. Use em toda página e server action.
export async function requireSession() {
  // O auth() do Auth.js gera um token CSRF aleatório; com Cache Components isso
  // não pode rodar em prerender, então esperamos a requisição real.
  await connection();
  const session = await auth();
  if (!session?.user || !emailPermitido(session.user.email)) redirect("/login");
  return session;
}
