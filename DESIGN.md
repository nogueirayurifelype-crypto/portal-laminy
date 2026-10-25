# Design do Portal Laminy

Ferramenta de trabalho com a identidade da Laminy: sóbria, densa e legível. Estrutura e tipografia inspiradas no painel da Cloudflare (sidebar clara com ícones, tudo encaixado em cartões e faixas finas); a marca aparece no wordmark, na paleta e no verde de ação, nunca em enfeite.

Implementação: tokens em `src/app/globals.css` (`@theme`), fontes em `src/app/layout.tsx`, componentes em `src/components/ui.tsx`, `fields.tsx`, `nav.tsx` e `icones.tsx`.

## Tokens

| Token      | Valor     | Uso                                         |
| ---------- | --------- | ------------------------------------------- |
| `black`    | `#050807` | Texto principal, texto do primário, wordmark |
| `forest`   | `#0C1F1A` | Neutros derivados, anel de foco             |
| `emerald`  | `#0F7B5A` | Sucesso, links, cor de gráfico              |
| `signal`   | `#19C27A` | Botão primário, ponto da marca, foco        |
| `mint`     | `#A7F0CD` | Destaque discreto sobre fundo escuro        |
| `mist`     | `#F2F4F3` | Item ativo e hover da sidebar               |
| `surface`  | `#F8FAF9` | Sidebar, cabeçalho de tabela, barra de busca |
| `white`    | `#FFFFFF` | Fundo do conteúdo e cartões                 |

Status (sempre com texto, nunca só cor; contraste AA):
- sucesso: `emerald` · atenção: âmbar discreto (`#8A5A00` sobre `#FBF3E0`) · erro: vermelho discreto (`#B42318` sobre `#FDECEA`) · neutro: cinza esverdeado (`#4A5A55` sobre `#E6EBE9`).

## Tipografia

- **Inter** em toda a interface: 400 texto · 500 rótulos e navegação · 600 títulos (tracking levemente negativo). Números sempre com `tabular-nums`.
- Rótulos em caixa normal (sentence case), cinza `muted`, 12–13px. Sem caixa alta.
- **DM Mono** só no login (linha de apoio). Nenhuma outra família.
- Escala: página 22px · seção 16px · texto 14px · rótulo 12–13px · número de dashboard 28px.

## Marca

Wordmark "laminy" em traço arredondado (SVG inline, componente `Wordmark`): letras em branco (ou `currentColor`), ponto ao lado do "l" e perna do "y" em `signal`. Não recriar com fonte.

## Layout

- Sidebar fixa à esquerda (240px) em `surface` com borda à direita: wordmark em `black` com selo "Admin"; busca rápida de lojistas; navegação agrupada ("Clientes", "Prospecção") com ícone + texto; item ativo com fundo `mist` e ícone `emerald`; e-mail e botão de sair no rodapé. Em telas pequenas vira barra no topo com menu recolhível.
- Conteúdo em `white`, largura máxima ~1120px. Cartões `white` com borda 1px `line`, radius 8px, sem sombra (no máximo 1px nos botões).
- Topo da página: link de voltar pequeno, título + status, descrição curta e ações à direita (primária por último).

## Componentes

- **Botões**: retângulo com radius 6px, altura 40px. Primário = `signal`, texto `black`, 600, um por tela. Secundário = branco com borda. Perigoso = borda vermelha, com confirmação em duas etapas.
- **Busca de lista**: campo com lupa dentro de uma faixa `surface` com borda (`BarraBusca`), contador de resultados abaixo da tabela.
- **Tabelas**: cabeçalho em faixa `surface`, 12px `muted` 500; linhas 14px; nome do registro em `black` 500, vira verde no hover; ações no fim da linha; estado vazio centralizado com texto útil e a ação de criar; rolagem horizontal contida no mobile.
- **Onde fica cada formulário**: entidade grande (lojista, lead, campanha) tem página própria (`/novo`, `/editar`, aba "Configurações"); item pequeno (responsável, conta, pagamento) abre no **painel lateral** (`Painel`). Nada de formulário escondido em `<details>` no meio da página.
- **Painel lateral** (`Painel`): abre pela URL (`?painel=nome&id=…`), à direita, largura até 576px, fundo escurecido; fecha com o X, clique fora, Esc ou "voltar" do navegador. O `ActionForm` fecha sozinho ao salvar (`aoConcluir`) e mostra "Cancelar" (`cancelarHref`).
- **Menu `⋯`** (`Menu`): ações secundárias da linha (editar, tornar principal, marcar como atrasado). A ação principal da linha fica visível como botão ao lado. Remoção dentro do menu usa `ItemConfirmar` (dois cliques).
- **Abas** (`Abas`): sublinhado `signal` no ativo, contagem opcional; também controladas pela URL (`?aba=`). Ficha do lojista: Visão geral · Responsáveis · Financeiro. Financeiro: Pagamentos do mês · Contas por lojista. Campanhas: Leads · Campanhas. Campanha: Leads · Configurações.
- **Filtros**: `Chips` (pílulas com contagem) para status; `FiltroSelect` dentro da `BarraBusca` para status/ordenação de listas longas. Tudo em parâmetros de URL.
- **Resumo** (`Resumo`): faixa de 3 números no topo de uma aba (ex.: a receber · atrasado · recebido).
- **Zona de perigo** (`ZonaPerigo`): cartão com borda vermelha no fim das configurações/edição, com a ação irreversível.
- **Formulários**: rótulo acima, erro abaixo em texto, foco com anel 2px `signal`, campos agrupados em seções.
- **Status**: pílula pequena com ponto de 6px + rótulo 12px 500 (`● Ativo`).
- **Cards do dashboard**: rótulo 13px `muted`, número grande 600 (R$ em pt-BR), variação vs. mês anterior quando houver. Só 3 cards, seguidos de "Precisa de atenção" (atrasados, a receber no mês, leads qualificados), com linhas clicáveis.
- **Ícones**: nenhuma biblioteca (Lucide, Heroicons etc.). Ícones de traço 1.75px em SVG inline, definidos em `icones.tsx`, herdando a cor do texto; usados na navegação, busca, voltar e sair, sempre ao lado de texto ou com `aria-label`.
- **Mapa**: tiles padrão do OpenStreetMap; marcador = ponto `signal` com halo (`divIcon`); popup com nome, cidade, status e link para a ficha.
- **Gráficos** (se houver): uma cor (`emerald`), eixos discretos, sem 3D nem degradê.

## Proibido

Brilho/glow, degradê em áreas grandes, grade técnica de fundo, animação de entrada em blocos, sombras fortes, emojis, texto de marketing, dados inventados (use estados vazios reais).

**Única exceção: login.** Tela dividida: painel de marca à esquerda (fundo `black`, anéis concêntricos a partir do ponto `signal`, luz radial `emerald` discreta, ondas lentas que somem com `prefers-reduced-motion`) e formulário à direita sobre `mist`. Em telas pequenas o painel some e fica só uma faixa com o wordmark. Nada disso entra nas telas internas.

## Acessibilidade

Navegação completa por teclado, foco visível, `prefers-reduced-motion` respeitado, alvos de toque ≥ 40px, somente português do Brasil.
