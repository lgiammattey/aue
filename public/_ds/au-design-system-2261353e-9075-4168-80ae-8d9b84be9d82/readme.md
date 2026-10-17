# Auê! — Design System

**Arrote. Receba a nota. Humilhe seus amigos.**

Auê! (*Campeonato de Arroto*) é um jogo mobile casual brasileiro. A experiência
principal é **uma única Arena com estados de jogo** — não um conjunto de telas,
não um app social. A pessoa abre, arrota, recebe uma nota de 0–100 ("Auê
Score"), e pode chamar alguém pro **X1** (duelo 1x1 por link) ou disputar
presencialmente com quem está do lado. Perdeu? Revanche. Ganhou? Revanche
também — o produto nunca termina em "pronto".

Dois produtos vivem no mesmo código: a **Arena** (o jogo, mobile-first,
440px, tema escuro canônico) e a **landing de desktop** (não tenta ser o
jogo — explica, aparece no buscador, manda a pessoa pro celular).

## Fontes

Este sistema foi construído a partir do codebase real do produto, montado
localmente (não um link remoto). Caminhos abaixo são relativos à raiz do
repositório `aue/`, para referência futura caso o repositório seja
reconectado:

- `docs/design/design-system/system/DESIGN.md` — o documento canônico de UX/UI
  (v4), fonte de quase todo token e regra deste sistema.
- `docs/design/prototipo-arena/arena.html` — o protótipo canônico de
  comportamento e geometria da Arena.
- `src/index.css`, `src/arena/arena.css` — a implementação real dos tokens e
  da grade no app em produção.
- `src/arena/bolha/*`, `src/arena/faixas/*` — os componentes reais da Bolha e
  das faixas da Arena.
- `docs/jogo/VOZ.md`, `docs/jogo/ARENA.md` — voz, tom e máquina de estados.
- `docs/design/design-system/system/BRAND-SYSTEM.md` + `variables.css` —
  **não usados como fonte de token**: são a saída de uma ferramenta genérica
  de geração de marca (paleta antd, `--brand-*`), com um verde diferente
  (`#b7da24`) do accent real do produto (`#c6ff00`). O próprio
  `docs/design/README.md` do repositório trata esse pacote como resíduo de
  exportação superado por `DESIGN.md`. Ignorado de propósito.

## Estrutura

```
styles.css              — importa todos os tokens (nunca editar regras aqui direto)
tokens/                  — colors, typography, spacing, motion, fonts
base.css                 — reset mínimo
assets/logo/             — a marca (Bolha) — SVG, gerada por script, nunca desenhada
assets/favicon/          — ícones de aplicação completos (web, iOS, Android, favicon.ico)
components/<grupo>/      — primitivas React reais do jogo (ver lista abaixo)
guidelines/              — specimens de cor, tipo, espaçamento, motion, marca, ícones
marketing/               — banners de anúncio, posts/capas de rede social, avatares
templates/               — pontos de partida prontos (Arena, landing de desktop)
ui_kits/arena/           — a Arena completa, clicável, todos os estados-chave
ui_kits/desktop/         — a landing de desktop (bridge pro celular)
SKILL.md                 — versão portável para Claude Code / Agent Skills
```

## Componentes

Todo componente é uma primitiva **real** do jogo (não inventada) — a
inteligência veio de `src/arena/`, `src/features/audio/`,
`src/features/battle/`. Nenhum "Toast/Tabs/Select" genérico foi adicionado:
o produto não tem essas superfícies.

- **Bolha** (`components/bolha`) — `BolhaAue`, o elemento vivo central, treze modos
- **Botão** (`components/botao`) — `Botao` (primário / contorno / fantasma)
- **Gatilho** (`components/gatilho`) — `GatilhoDeMicrofone`, a ação de entrada
- **Nota** (`components/nota`) — `NotaNaBolha`, o Auê Score dentro da Bolha
- **HUD** (`components/hud`) — `Hud`, wordmark + X1 + menu (nunca navegação)
- **Pílulas** (`components/pilulas`) — `PilulaDeLink`, `Player`
- **Métricas** (`components/metrica`) — `Metrica`, `ListaDeMetricas` (Força/Fôlego/Grave)
- **Origem** (`components/origem`) — `EscolhaDeOrigem` (Cerveja/Refri/Comida/Ar)
- **Placar** (`components/placar`) — `LinhaDoPlacar`, `BlocoVersus`
- **Pódio** (`components/podio`) — `Podio` (disputa presencial → PNG compartilhável)
- **Cronômetro** (`components/cronometro`) — `Cronometro`, `ContagemDaRevanche`
- **Overlay** (`components/overlay`) — `Overlay` (menu, assinatura, compartilhar)

### Intentional additions

Nenhuma. Todo componente listado tem contraparte direta no código do produto.

## UI Kits

- **`ui_kits/arena/`** — a Arena clicável: IDLE → RECORDING → VALIDATING →
  JUDGING → RESULT_REVEAL → RESULT → CHALLENGE_CREATED → WAITING_OPPONENT →
  SCOREBOARD/DRAW → REMATCH (loop), mais MIC_ERROR e NO_SOUND. Botões no
  canto inferior esquerdo pulam para estados de resiliência para inspeção.
- **`ui_kits/desktop/`** — a landing de desktop, estática (a real não toca
  `navigator`/`window`; é puramente informativa).

## CONTENT FUNDAMENTALS

**Voz em uma frase:** um jovem-adulto carioca no estacionamento do shopping,
alguém solta um arroto absurdo, a reação é "CARALHO, QUAL FOI ISSO?". Amigo
falando com amigo — nunca marca tentando parecer jovem, nunca startup.

- **Pessoa:** direta, sem "nós" corporativo. Fala como quem está do lado.
- **Palavrão:** permitido como pontuação emocional ("Caralho. Veio forte."),
  nunca recheio ("Parabéns, caralho! Seu arroto, porra, foi analisado!" é
  errado).
- **Carioca sem cosplay:** *coé, maneiro, sinistro, deu ruim, mó* — usados
  quando saem naturais, nunca três na mesma frase só para provar origem.
- **Vocabulário gamer, não e-sport corporativo:** x1, apelão, round, GG,
  revanche, placar — lan house e PS2, não Twitch profissional.
- **Rótulo de botão é contrato:** `Arrotar` é sempre `Arrotar`. Toda variação
  vive na fala, nunca na ação.
- **Fala varia por pool, nunca repete a última.** 42 falas de resultado
  pareadas por faixa de nota (0–19 … 95–100), mais pools por momento
  (gravando, julgando, X1, erro…).
- **A piada é com o arroto, nunca com a pessoa.** Zero ataque a corpo, gênero,
  aparência, raça, origem, sexualidade.
- **Erro fala a verdade primeiro:** "Deu ruim no envio. A batalha não foi
  criada. Tenta de novo." — nunca "Ops! Instabilidade temporária."
- **Emoji: não.** Nenhuma fala do jogo usa emoji — nem no resultado, nem no
  erro. As únicas exceções visuais são os 4 emojis de origem (🍺🥤🍽️💨), que
  são rótulo de escolha, não voz.
- **Teste rápido:** dá pra falar isso com metade das palavras? Parece jogo ou
  parece rede social? Se tirar a logo, ainda parece Auê?

## VISUAL FOUNDATIONS

- **Tema:** escuro canônico — não é "modo escuro", é o único tema.
  `--bg` #0a0a08, quase preto puro.
- **Cor:** o accent (`--accent` #c6ff00, verde ácido elétrico) tem orçamento
  rígido de **no máximo 2 aparições simultâneas** por estado, em ordem de
  prioridade: Bolha viva (gravando) → Auê Score → CTA primário. Nunca no
  wordmark, na barra de métrica, na pílula de link ou no player. Derrota,
  empate e nota baixa **nunca** usam `--danger` — isso é reservado a erro
  técnico real (mic bloqueado, upload falhou). Toda derivação de cor é
  `color-mix(in oklch, …)` sobre os seis tokens base — nunca um hex novo.
- **Tipografia:** Display = Anton (mono-peso, só peso 400) para Score, fala do
  juiz, wordmark. Interface = Archivo (400–700) para tudo mais. Mono =
  `ui-monospace` do sistema, só para eyebrow/timestamp/link — nunca corpo.
  Inter só existe como fallback tardio, nunca escolha primária.
- **Espaçamento:** grid de 8px (`--space-1..8`). Densidade baixa por padrão.
- **Fundos:** `--bg` sólido e chapado. **Sem imagem, sem foto, sem textura,
  sem padrão repetido, sem gradiente em lugar nenhum do produto.** A única
  coisa viva no palco é a Bolha.
- **Bolha:** blob orgânico de N pontos de controle, deformado por ruído
  determinístico (nunca aleatório de verdade — reproduzível), treze modos com
  cor/amplitude/N próprios. Nunca é decoração; se ela aparece, está dizendo
  algo. Nunca waveform tradicional, nunca gradiente, nunca glow.
- **Animação:** só comunica estado, nunca decorativa. Easings próprios —
  `standard` (a maioria), `decelerate` (barras, anel de disparo),
  `emphasize` (bounce de vitória/pop de nota — overshoot controlado, nunca
  elástico exagerado). `--duration-reveal` (900ms) é a única espera longa do
  produto — ali a espera é a piada. `prefers-reduced-motion` sempre
  respeitado, informação nunca depende só de movimento.
- **Hover:** desloca luminosidade OKLCH ±0.06–0.12 (superfícies escuras
  clareiam; accent/gold/danger escurecem para a variante `-strong`). Nunca
  troca de família de cor.
- **Press/active:** botão cede — `translateY(2px) scale(.985)`, começa no
  toque (`:active`), nunca depois da lógica assíncrona. Bola do gatilho
  encolhe para `scale(.94)`.
- **Bordas:** 1px `--border`, discretas, nunca decorativas — só onde precisa
  separar, nunca como enfeite.
- **Sombra:** só funcional (sheet, modal, shell no desktop). Nenhuma sombra
  decorativa em card ou botão.
- **Cards:** **não existem no gameplay.** O palco é `--bg` puro; separação é
  hierarquia tipográfica ou um filete de 1px. Card, tab, breadcrumb pertencem
  só a superfícies fora da Arena (nenhuma existe hoje).
- **Raio:** `sm` 12 (chip/badge), `md` 18 (botão primário — saiu do full
  propositalmente, pílula é forma de formulário, CTA é peça de jogo), `lg` 24
  (overlay/sheet), `full` (pílula, player, avatar).
- **Transparência/blur:** só no scrim de overlay (`--overlay-scrim` + blur
  2px). Nunca em superfície de conteúdo.
- **Imagens:** o produto não tem fotografia nem ilustração de personagem — é
  tipografia + a Bolha + cor sólida. Não inventar imagens que não existem.
- **Layout:** grade fixa de 4 faixas (HUD 56px · Palco · Reação 1fr · Ação
  auto), idêntica em todo estado — a faixa de ação nunca sai do lugar entre
  estados, o polegar aprende um alvo só.

## ENERGIA VISUAL / GLOW & MOTION *(proposta — aguardando validação)*

Camada aditiva de **game feel** sobre o visual dark/flat — não um redesign.
Princípio central: **quanto mais relevante o acontecimento no jogo, mais a
interface ganha vida.** Só a Bolha usa glow; nunca botão, HUD, card ou pílula.

Tokens em `tokens/glow.css`, demonstração completa em
`guidelines/glow.card.html` (aba Design System → Foundations → "Energia
Visual — Glow & Motion"). Ainda **não aplicado** a `components/bolha` nem a
nenhuma tela de `ui_kits/` — esta seção documenta a proposta para validação
antes da implementação, conforme pedido.

Oito estados, cada um com intensidade 0–1 fixa ou dirigida por áudio/nota:
repouso (0, flat) → preparação (halo sutil) → gravando (dirigida pelo nível
de áudio, piso 0.15) → pico de potência (pulso único, intensidade 1) →
resultado comum (proporcional à nota, 0.2–0.75) → resultado alto/recorde
(0.92, cor `--gold`) → nota 100/excepcional (1, destaque temporário de
1400ms antes de estabilizar) → erro/sem arroto (0, energia removida de
propósito, nunca `--danger`).

Regras de motion: ataque rápido/soltura lenta (`--glow-duration-rise` /
`-fall`, nunca corte seco), nunca pulsa sem um evento real por trás,
sempre reage a `nivel`/`nota` — nunca um valor fixo por estética,
`prefers-reduced-motion` assume a intensidade final sem transição (mesmo
contrato da deformação da Bolha), composição só com `filter`/`box-shadow`
simples (nunca blur acima de `--glow-blur-max`, nunca camadas empilhadas).

Isto muda a única regra da Bolha que dizia "nunca gradiente, nunca glow" —
o glow passa a ser permitido, mas só através destes tokens e só nos oito
estados acima, nunca como brilho fixo ou decorativo.

## ICONOGRAPHY

O jogo **não usa biblioteca de ícones**. Cada ícone é um SVG desenhado à mão,
inline no componente que o usa: `viewBox="0 0 24 24"`, `stroke="currentColor"`,
`stroke-width="1.8"` (raramente 1.6 ou 2), `stroke-linecap/linejoin="round"`,
sempre `aria-hidden="true"` (o texto ao lado já carrega a informação). Ver
`guidelines/iconography.card.html` para a amostra completa (mic, mic
bloqueado, menu, play, pause, troféu).

Não há ícone de fonte (icon font), não há sprite sheet real em uso pela
Arena (o `public/icons.svg` do repositório é resíduo de um template de
landing genérico — símbolos de rede social não usados pelo produto atual — e
não foi copiado aqui). **Emoji aparece em um único lugar:** os quatro chips de
origem do arroto (🍺🥤🍽️💨) — nunca em voz, nunca em botão, nunca em erro.
Nenhum caractere Unicode decorativo é usado como ícone (o `!` da marca é
tipografia, não ícone).

## Ícones & favicons

`assets/favicon/` cobre web (favicon.svg, favicon.ico, og-image), iOS
(apple-touch-icon, ios-appstore-icon-1024 sem alpha) e Android
(android-chrome-192/512, maskable-192/512 para PWA, e o par adaptive
android-adaptive-fg/bg-512 + playstore-icon-512 sem alpha para publicação nas
lojas). Ver `guidelines/app-icons.card.html`.

## Templates

`templates/arena/` e `templates/desktop-landing/` são pontos de partida
prontos (Design Components) para quem consome este sistema — a grade de 4
faixas da Arena no estado IDLE, e a landing de desktop com o hero da bridge
pro celular.

## Design System tab

Toda foundation e componente acima tem uma card em `guidelines/` ou dentro do
diretório do componente — veja a aba **Design System** deste projeto.

## Como reusar

1. Linke `styles.css` do lugar onde seu arquivo está.
2. Carregue as fontes reais via `<link>` do Google Fonts no `<head>` (ver
   `tokens/fonts.css` para o snippet exato) — o produto real faz isso, não
   `@import` de CSS.
3. Carregue `_ds_bundle.js` e monte componentes via
   `window.AuDesignSystem_226135.<Componente>` (o nome do namespace pode
   mudar — confirme com a aba Design System).
