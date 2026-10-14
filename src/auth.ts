import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function emailPermitido(email: string | null | undefined): boolean {
  const permitido = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  return !!permitido && !!email && email.trim().toLowerCase() === permitido;
}

// AUTH_SECRET, AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET são lidos automaticamente.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Recusa qualquer conta Google que não seja a ALLOWED_EMAIL (e exige e-mail verificado).
    signIn({ account, profile }) {
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
