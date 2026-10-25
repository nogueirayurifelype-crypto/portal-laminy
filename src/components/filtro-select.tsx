"use client";

/** Select de filtro que reenvia o formulário GET ao mudar. */
export function FiltroSelect({
  name,
  rotulo,
  valor,
  opcoes,
}: {
  name: string;
  /** Texto para leitores de tela. */
  rotulo: string;
  valor: string;
  opcoes: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      aria-label={rotulo}
      defaultValue={valor}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="w-auto min-w-0 flex-1 sm:flex-none"
    >
      {opcoes.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
