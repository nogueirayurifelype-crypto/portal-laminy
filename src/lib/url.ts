/** Monta `path?a=1&b=2`, ignorando parâmetros vazios. */
export function hrefCom(path: string, params: Record<string, string | null | undefined>): string {
  const busca = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) busca.set(k, v);
  const qs = busca.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Primeiro valor de um searchParam (que pode vir repetido). */
export function param(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
