# Portal Laminy

@AGENTS.md

## O que é

Portal administrativo interno da Laminy (admin.laminy.com.br). A Laminy faz sites institucionais e marketing digital básico para pequenos negócios brasileiros. Uso exclusivo do dono (Felype), com um único usuário.

## Para que serve

- **Dashboard**: lojistas ativos, faturamento mensal e MRR.
- **Lojistas**: CRUD, com responsáveis adicionais.
- **Financeiro**: conta, mensalidade e pagamentos por lojista.
- **Campanhas e leads**: prospecção (será automatizada depois).
- **Mapa** dos lojistas.

## Fluxo central

Campanha gera lead → lead qualificado → Felype aprova → vira lojista automaticamente (ação `aprovarLead`, em transação, em `src/db/aprovar-lead.ts`) → contrato e assinatura seguem fora do portal.

## Stack

- Next.js (App Router, TypeScript) + Tailwind.
- Neon Postgres + Drizzle. Schema em `src/db/schema.ts`; migrations em `drizzle/`.
- Auth.js com Google, restrito a `ALLOWED_EMAIL` (`src/auth.ts`).
- react-leaflet + OpenStreetMap.
- Hospedagem na Vercel, subdomínio `admin` de laminy.com.br.

## Regras do projeto

- Dinheiro em centavos (integer); formate só na interface.
- Nunca ler, imprimir ou commitar `.env*` ou credenciais.
- Mudou o schema: gere a migration com drizzle-kit e diga o comando ao Felype; não aplique sozinho.
- NUNCA fazer `git commit` ou `git push` por conta própria: peça para o Felype fazer.
- Não generalizar antes da necessidade real: sem painel multiusuário, sem permissões por papel, sem biblioteca de UI própria.
- Todo o portal é noindex e exige sessão.
- Textos da interface em português do Brasil.

## Design

Siga `DESIGN.md`.

## Fora do escopo por enquanto

- Automação de prospecção (só as tabelas existem).
- Cobrança automática/gateway: o financeiro é manual (Pix, boleto, cartão).
- Multiusuário.
- Área do cliente.

## Comandos (pnpm)

- `pnpm dev`: servidor de desenvolvimento.
- `pnpm build`: build de produção.
- `pnpm typecheck`: `next typegen` + `tsc --noEmit`.
- `pnpm db:generate`: gera migration a partir do schema (drizzle-kit generate).
- `pnpm db:migrate`: aplica migrations (drizzle-kit migrate). Só o Felype roda.
- `pnpm db:studio`: abre o Drizzle Studio.
