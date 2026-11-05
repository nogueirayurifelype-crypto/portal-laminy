/** Fallback de carregamento das páginas: aparece na hora enquanto a sessão e os dados chegam. */
export function Carregando() {
  return (
    <p role="status" className="text-sm text-muted">
      Carregando…
    </p>
  );
}
