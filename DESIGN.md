# Design do Portal Laminy

Ferramenta de trabalho com a identidade da Laminy: sóbria, densa e legível. A marca aparece na paleta, na tipografia e no ponto verde, nunca em enfeite.

Implementação: tokens em `src/app/globals.css` (`@theme`), fontes em `src/app/layout.tsx`, componentes em `src/components/ui.tsx`, `fields.tsx` e `nav.tsx`.

## Tokens

| Token      | Valor     | Uso                                         |
| ---------- | --------- | ------------------------------------------- |
| `black`    | `#050807` | Sidebar, texto principal, texto do primário |
| `forest`   | `#0C1F1A` | Sidebar (base), neutros derivados           |
| `emerald`  | `#0F7B5A` | Sucesso, links, cor de gráfico              |
| `signal`   | `#19C27A` | Botão primário, ponto da marca, foco        |
| `mint`     | `#A7F0CD` | Destaque discreto sobre fundo escuro        |
| `mist`     | `#F2F4F3` | Fundo da área de conteúdo                   |
| `white`    | `#FFFFFF` | Cartões                                     |

Status (sempre com texto, nunca só cor; contraste AA):
- sucesso: `emerald` · atenção: âmbar discreto (`#8A5A00` sobre `#FBF3E0`) · erro: vermelho discreto (`#B42318` sobre `#FDECEA`) · neutro: cinza esverdeado (`#4A5A55` sobre `#E6EBE9`).

## Tipografia

- **Poppins** 400 texto · 500 interface · 600 títulos (tracking `-0.03em`).
- **DM Mono**: rótulos de coluna, status, IDs, datas e valores numéricos em tabelas e cards (`tabular-nums`). Rótulos sempre em caixa alta. Nunca em parágrafos.
- Nenhuma outra família. Escala: página 28px · seção 18px · texto 14–15px · rótulo mono 12px.

## Marca

Wordmark "laminy" em traço arredondado (SVG inline, componente `Wordmark`): letras em branco (ou `currentColor`), ponto ao lado do "l" e perna do "y" em `signal`. Não recriar com fonte.

## Layout

- Sidebar fixa à esquerda (~240px) em `black`/`forest`: wordmark Laminy branco com o ponto do "l" em `signal`; navegação Poppins 500; item ativo marcado por ponto verde de 6px. Em telas pequenas vira menu recolhível.
- Conteúdo em `mist`, cartões `white` com borda 1px sutil, radius 12px, sem sombra pesada. Largura máxima confortável; espaço generoso entre seções, compacto dentro de tabelas.
- Topo da página: título, descrição curta e ação primária à direita.

## Componentes

- **Botões**: primário = pílula `signal`, texto `black`, Poppins 600, um por tela. Secundário = contorno. Perigoso = contorno vermelho, com confirmação em duas etapas.
- **Tabelas**: cabeçalho DM Mono caixa alta 12px; hover discreto; ações no fim da linha; estado vazio com texto útil e a ação de criar; rolagem horizontal contida no mobile.
- **Formulários**: rótulo acima, erro abaixo em texto, foco com anel 2px `signal`, campos agrupados em seções.
- **Status**: pílula pequena com ponto de 8px + rótulo DM Mono (`● ATIVO`).
- **Cards do dashboard**: rótulo mono, número grande Poppins 600 (R$ em pt-BR), variação vs. mês anterior quando houver. Só 3 cards.
- **Ícones**: nenhuma biblioteca (Lucide, Heroicons etc.). Use o ponto verde, glifos mono (`01`, `→`, `+`) ou SVG inline simples quando indispensável.
- **Mapa**: tiles padrão do OpenStreetMap; marcador = ponto `signal` com halo (`divIcon`); popup com nome, cidade, status e link para a ficha.
- **Gráficos** (se houver): uma cor (`emerald`), eixos discretos, sem 3D nem degradê.

## Proibido

Brilho/glow, degradê em áreas grandes, grade técnica de fundo, animação de entrada em blocos, sombras fortes, emojis, texto de marketing, dados inventados (use estados vazios reais).

**Única exceção: login.** Tela dividida: painel de marca à esquerda (fundo `black`, anéis concêntricos a partir do ponto `signal`, luz radial `emerald` discreta, ondas lentas que somem com `prefers-reduced-motion`) e formulário à direita sobre `mist`. Em telas pequenas o painel some e fica só uma faixa com o wordmark. Nada disso entra nas telas internas.

## Acessibilidade

Navegação completa por teclado, foco visível, `prefers-reduced-motion` respeitado, alvos de toque ≥ 40px, somente português do Brasil.
