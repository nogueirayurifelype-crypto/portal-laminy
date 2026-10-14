export { auth as proxy } from "@/auth";

export const config = {
  // Rotas do Auth.js, assets e robots.txt ficam de fora; todo o resto passa pelo `authorized`.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
