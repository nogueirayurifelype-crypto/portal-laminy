import type { Metadata } from "next";
import { Suspense } from "react";

import { signIn } from "@/auth";
import { Wordmark, botao } from "@/components/ui";

export const metadata: Metadata = { title: "Entrar" };

const MENSAGENS: Record<string, string> = {
  AccessDenied: "Este e-mail não tem acesso ao portal.",
  Configuration: "Erro de configuração do login. Verifique as variáveis de ambiente.",
};

type SearchParams = PageProps<"/login">["searchParams"];

function primeiro(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function entrar(formData: FormData) {
  "use server";
  // O Auth.js só aceita redirecionar para a mesma origem.
  const destino = formData.get("callbackUrl");
  await signIn("google", { redirectTo: typeof destino === "string" && destino ? destino : "/" });
}

async function LoginForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const erro = primeiro(params.error);
  return (
    <>
      {erro && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {MENSAGENS[erro] ?? "Não foi possível entrar. Tente novamente."}
        </p>
      )}
      <form action={entrar}>
        <input type="hidden" name="callbackUrl" value={primeiro(params.callbackUrl) ?? "/"} />
        <button type="submit" className={`${botao.primario} w-full`}>
          Entrar com Google
        </button>
      </form>
    </>
  );
}

// Anéis concêntricos a partir do ponto da marca, como o halo dos marcadores do mapa.
const ANEIS = [90, 170, 250, 330, 410, 490, 570];
// Pontos sobre os anéis (ângulo em graus, índice do anel): lembram lojistas no mapa.
const PONTOS: [number, number][] = [
  [-38, 1],
  [24, 2],
  [-112, 3],
  [62, 4],
  [-14, 5],
  [148, 4],
  [-70, 6],
];

/** Painel de marca: só decoração, escondido de leitores de tela. */
function PainelMarca() {
  const cx = 300;
  const cy = 520;
  return (
    <div className="relative hidden overflow-hidden bg-black lg:flex lg:flex-col lg:justify-between lg:p-12">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="luz" cx={cx} cy={cy} r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0F7B5A" stopOpacity="0.35" />
            <stop offset="1" stopColor="#0C1F1A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="900" fill="#050807" />
        <circle cx={cx} cy={cy} r="420" fill="url(#luz)" />

        {ANEIS.map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={i === 2 ? "#19C27A" : "#FFFFFF"}
            strokeOpacity={i === 2 ? 0.35 : 0.07}
            strokeWidth={i === 2 ? 1.5 : 1}
            strokeDasharray={i % 2 ? "2 8" : undefined}
          />
        ))}

        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="60"
            fill="none"
            stroke="#19C27A"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="login-onda"
            style={{ animationDelay: `${i * 2.4}s` }}
          />
        ))}

        {PONTOS.map(([graus, anel]) => {
          const rad = (graus * Math.PI) / 180;
          const r = ANEIS[anel];
          return (
            <g key={`${graus}-${anel}`}>
              <circle cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r="9" fill="#19C27A" fillOpacity="0.15" />
              <circle cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r="3.5" fill="#A7F0CD" />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="22" fill="#19C27A" fillOpacity="0.2" />
        <circle cx={cx} cy={cy} r="10" fill="#19C27A" />
      </svg>

      <Wordmark className="relative h-10 self-start text-white" />

      <div className="relative flex flex-col gap-3">
        <p className="max-w-sm text-[28px] leading-tight font-semibold tracking-[-0.03em] text-white">
          Lojistas, financeiro e prospecção num só lugar.
        </p>
        <p className="font-mono text-xs tracking-wide text-mint/80 uppercase">Portal administrativo · Laminy</p>
      </div>
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <PainelMarca />

      <div className="flex flex-col bg-mist">
        <div className="bg-black px-4 py-4 lg:hidden">
          <Wordmark className="h-7 text-white" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-line bg-white p-8">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs tracking-wide text-muted uppercase">Acesso restrito</span>
              <h1>Entrar</h1>
              <p className="text-sm text-muted">Use a conta Google autorizada para acessar o portal.</p>
            </div>
            <Suspense>
              <LoginForm searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
        <p className="px-4 pb-6 text-center font-mono text-xs text-muted uppercase">admin.laminy.com.br</p>
      </div>
    </main>
  );
}
