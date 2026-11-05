/** Site/rede: aceita link completo, "@usuario" ou só o usuário (vira link pela `base`). */
export function LinkExterno({ valor, base }: { valor: string | null; base?: string }) {
  if (!valor) return null;
  const v = valor.trim();
  const href = /^https?:\/\//i.test(v)
    ? v
    : base && !v.includes(".")
      ? base + v.replace(/^@/, "")
      : `https://${v}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
    </a>
  );
}
