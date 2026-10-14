import type { ReactNode } from "react";

import { label as rotulo } from "@/lib/format";

type Base = { name: string; label: string; required?: boolean };

export function Field({
  name,
  label,
  required,
  type = "text",
  defaultValue,
  ...rest
}: Base & {
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  inputMode?: "numeric" | "decimal" | "tel" | "email" | "text";
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        {...rest}
      />
    </label>
  );
}

export function TextArea({ name, label, defaultValue }: Base & { defaultValue?: string | null }) {
  return (
    <label>
      {label}
      <textarea name={name} rows={4} defaultValue={defaultValue ?? undefined} />
    </label>
  );
}

export function Select({
  name,
  label,
  options,
  defaultValue,
  required,
  vazio,
}: Base & {
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  /** Texto da opção vazia; se omitido, não há opção vazia. */
  vazio?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: rotulo(o) } : o));
  return (
    <label>
      {label}
      <select name={name} required={required} defaultValue={defaultValue ?? ""}>
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function Dados({ itens }: { itens: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {itens.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-1">
          <dt className="font-mono text-xs tracking-wide text-muted uppercase">{k}</dt>
          <dd className="break-words">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
