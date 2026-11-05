import { label } from "@/lib/format";

import { Chips } from "./ui";

/**
 * Pílulas de status com contagem, iguais em leads e lojistas. O status `oculto`
 * (descartado/cancelado) fica fora de "Todos" e tem a própria pílula, no fim.
 */
export function FiltroStatus({
  rotulo,
  status,
  opcoes,
  oculto,
  contagens,
  href,
}: {
  rotulo: string;
  status: string | undefined;
  opcoes: readonly string[];
  oculto: string;
  contagens: { status: string; total: number }[];
  /** Link da lista com esse status (undefined = "Todos"), mantendo os outros filtros. */
  href: (status?: string) => string;
}) {
  const contagem = (s: string) => contagens.find((c) => c.status === s)?.total ?? 0;
  const visiveis = opcoes.filter((s) => s !== oculto);

  return (
    <Chips
      rotulo={rotulo}
      itens={[
        { href: href(), label: "Todos", ativo: !status, contagem: visiveis.reduce((t, s) => t + contagem(s), 0) },
        ...visiveis.map((s) => ({ href: href(s), label: label(s), ativo: status === s, contagem: contagem(s) })),
        { href: href(oculto), label: `${label(oculto)}s`, ativo: status === oculto, contagem: contagem(oculto) },
      ]}
    />
  );
}

