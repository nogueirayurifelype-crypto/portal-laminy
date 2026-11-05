import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * Acesso de teste, SÓ no `pnpm dev` (NODE_ENV === "development"): entra sem Google.
 * Em build/produção vale false e o provider nem é registrado.
 * Para desligar no dev também, troque por `false`.
 */
export const ACESSO_TESTE = process.env.NODE_ENV === "development";
const EMAIL_TESTE = "teste@localhost";

function emailPermitido(email: string | null | undefined): boolean {
  if (ACESSO_TESTE && email === EMAIL_TESTE) return true;
  const permitido = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  return !!permitido && !!email && email.trim().toLowerCase() === permitido;
}

// AUTH_SECRET, AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET são lidos automaticamente.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    ...(ACESSO_TESTE
      ? [Credentials({ id: "teste", name: "Acesso de teste", credentials: {}, authorize: () => ({ id: "teste", email: EMAIL_TESTE, name: "Teste" }) })]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Recusa qualquer conta Google que não seja a ALLOWED_EMAIL (e exige e-mail verificado).
    signIn({ account, profile }) {
      if (ACESSO_TESTE && account?.provider === "teste") return true;
      if (account?.provider !== "google") return false;
      return profile?.email_verified === true && emailPermitido(profile.email);
    },
    // Usado pelo proxy: tudo exige sessão válida, exceto /login.
    authorized({ auth, request }) {
      const logado = emailPermitido(auth?.user?.email);
      if (request.nextUrl.pathname.startsWith("/login")) {
        return logado ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }
      return logado;
    },
  },
});

export { emailPermitido };
