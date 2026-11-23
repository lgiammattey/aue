---
name: "Auê! Design System"
category: Brands
surface: Rede social para arrotadores (Desktop e Webapp Mobile)
status: "Design System canônico — v5 (Tropa & Arena)"
canonical_refs:
  - "docs/design/design-system/system/DESIGN.md"
colors:
  dark:
    bg: "#0a0a08"
    surface: "#171712"
    surface-2: "#1f1f18"
    fg: "#f5f3ea"
    muted: "#93917f"
    border: "#2b2a22"
    border-strong: "#74725f"
    ind: "#c6ff00"
    accent: "#c6ff00"
    accent-on: "#0a0a08"
    gold: "#f4c430"
    danger: "#ff3d3f"
  light:
    bg: "#f5f3ea"
    surface: "#ebe9de"
    surface-2: "#dedcd0"
    fg: "#0a0a08"
    muted: "#57554a"
    border: "#d6d4c6"
    border-strong: "#85836f"
    ind: "#0a0a08"
    accent: "#c6ff00"
    accent-on: "#0a0a08"
    gold: "#f4c430"
    danger: "#c4161a"
---

# Auê! Design System

> **Arrote. Receba a nota. Publique sua resenha. Chame os amigos pro X1.**

O Auê! é uma **rede social para arrotadores**, exclusivamente online via **Desktop e Webapp Mobile**. A experiência conecta a adrenalina imediata da **Arena** (a máquina de captura e pontuação de arrotos) à **Tropa** (pessoas que se acompanham) e **comunidades temáticas** estilo Orkut / Reddit.

Fundo chapado, sem cards flutuantes genéricos, sem gradiente decorativo. Verde ácido (`--accent: #c6ff00`) elétrico usado com critério: no máximo 2 aparições simultâneas por estado.

---

## 1. Referências Canônicas

Este Design System é a referência canônica de UX/UI do Auê!. Não há protótipos: a tela em produção e este documento mandam.

---

## 2. Cores e Temas

O sistema suporta oficialmente **Tema Escuro** (padrão) e **Tema Claro**, persistido via `localStorage ('bda-theme')`.

### 2.1 Tema Escuro (`dark`)
- `--bg`: `#0a0a08` — Fundo único e contínuo
- `--surface`: `#171712` — Primeira camada de elevação (aside, cards, inputs)
- `--surface-2`: `#1f1f18` — Segunda camada (avatares, capas, badges)
- `--fg`: `#f5f3ea` — Texto principal e ícones de alto contraste
- `--muted`: `#93917f` — Metadados, timestamps, handles e bordas secundárias
- `--border`: `#2b2a22` — Divisores finos de 1px
- `--border-strong`: `#74725f` — Contornos de inputs e botões secundários
- `--ind`: `#c6ff00` — Indicador ativo de abas e toggles
- `--accent`: `#c6ff00` — Verde ácido elétrico: CTA primário, Auê Score, Bolha ativa (máx. 2 por tela)
- `--accent-strong`: `#a8d900` — Hover e estado pressionado do accent
- `--accent-on`: `#0a0a08` — Texto escuro obrigatório sobre accent
- `--gold`: `#f4c430` — Recordes, vitórias e 1º lugar do pódio
- `--silver`: `#c7cad1` — 2º lugar
- `--bronze`: `#c98a4b` — 3º lugar
- `--danger`: `#ff3d3f` — Mensagens de erro técnico crítico

### 2.2 Tema Claro (`light`)
- `--bg`: `#f5f3ea` — Fundo claro único
- `--surface`: `#ebe9de` — Superfície clara
- `--surface-2`: `#dedcd0` — Superfície contrastante
- `--fg`: `#0a0a08` — Texto preto profundo
- `--muted`: `#57554a` — Texto secundário de leitura confortável
- `--border`: `#d6d4c6` — Divisores de 1px
- `--border-strong`: `#85836f` — Contornos de botão e campos
- `--ind`: `#0a0a08` — Indicador preto de abas ativas
- `--accent`: `#c6ff00` — Mantido como destaque
- `--accent-on`: `#0a0a08` — Texto escuro sobre accent
- `--danger`: `#c4161a` — Vermelho de erro técnico adaptado para contraste

### 2.3 Regra de Uso do Accent
> **Orçamento:** No máximo 2 aparições simultâneas de `--accent` por estado.
> - Prioridade 1: Bolha em gravação / pico
> - Prioridade 2: Auê Score em destaque
> - Prioridade 3: CTA primário ("Arrotar", "Postar", "Criar conta")
> 
> Proibido pintar tudo de verde. O contraste repousa na sobriedade do fundo chapado.

---

## 3. Tipografia

A hierarquia tipográfica une brutalismo esportivo e legibilidade social:

1. **Display:** `Anton` (`sans-serif`, peso único, condensada e pesada).
   - Uso: Wordmark `AUÊ!`, Auê Score (número de 0 a 100), títulos da Arena, falas secas do juiz ("Caralho. Veio forte.", "Tá maluco.", "Foi isso?"), contagem da revanche e kickers.
2. **Interface e Leitura:** `Archivo` (com fallbacks `Google Sans Flex`, `Inter`, `system-ui`).
   - Uso: Textos do feed, resenhas, botões, navegação, descrições e formulários.
3. **Monospaçada:** `ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace`.
   - Uso restrito: Eyebrows técnicos, timestamps (`2min`, `1h`), duração de áudio (`0:07`; no player do card e do perfil é sans, exceção do Luiz de 21/10/2026), links curtos (`aue.gg/x1/9f2a`), posições numéricas de ranking.

### Escala de Tamanhos
- `Display 2xl`: `clamp(60px, 19vw, 92px)` — Score revelado
- `Display xl`: `clamp(48px, 15vw, 64px)` — Score em repouso / Card compartilhado
- `Display lg`: `clamp(36px, 11vw, 48px)` — Score em X1 / Placar Versus
- `Display md`: `clamp(30px, 9vw, 38px)` — Fala do juiz
- `Display sm`: `26px` — Wordmark `AUÊ!`
- `Body lg`: `20px` (peso 700) — Ações em destaque, títulos de seção
- `Body md`: `16px` (peso 400/600) — Corpo de posts e inputs
- `Body sm`: `15px` — Feed text, links de navegação
- `Body xs`: `13px` — Metadados e rótulos de métrica
- `Caption`: `12px` (peso 700, uppercase, tracking +0.08em) — Eyebrows

---

## 4. Espaçamento, Raios e Geometria

Base no grid de 8px:
- Espaçamentos: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (24px), `--space-6` (32px), `--space-7` (40px), `--space-8` (48px).
- Raios de Borda:
  - `--radius-sm`: `12px` — Badges, chips, tags de comunidade e notas compactas.
  - `--radius-md`: `18px` — Botões de ação, inputs e caixas de interação.
  - `--radius-lg`: `24px` — Sheets modais, overlays e caixas de diálogo.
  - `--radius-shell`: `32px` — Moldura no desktop quando aplicável.
  - `--radius-full`: `999px` — Pílulas de link, botões circulares, avatares e barras de métrica.

### 4.1 Card é exceção

Fundo chapado vale para a página inteira, não só para o `body`. A tela é uma superfície contínua; a hierarquia vem de espaço, tamanho, peso e, no máximo, uma linha de 1px (`--border`) entre blocos.

**Pode ser card** (borda + `--surface` + raio):
- item discreto e repetível de uma lista: post/resenha, resultado de X1, comunidade numa grade;
- moldura funcional: modal, sheet, popover, toast;
- o card de compartilhamento 9:12, que é uma imagem de exportação.

**Não pode ser card:**
- seção de página, bloco explicativo, lista de links, ranking, filtros, métricas, formulário, cabeçalho de perfil;
- widget lateral no desktop (usa título + linhas separadas por filete);
- qualquer coisa dentro de um card (nada de card dentro de card);
- "para dar respiro" ou "para destacar". Destaque é tipografia e posição, não caixa.

**Teste rápido antes de criar uma caixa:** se eu tirar a borda e o fundo, a informação continua legível e agrupada? Se sim, tira. Mudar seção existente de card para chapado só com pedido do Luiz; não é gatilho para redesenhar tela que ele já aprovou.

---

## 5. Componentes Oficiais

### 5.1 Botões (`Botao`)
- **Primário:** Fundo `--accent`, texto `--accent-on`, peso 700. Ação mestra ("Arrotar", "Postar", "Chamar pro X1").
- **Contorno (`contorno`):** Fundo transparente, borda de 1px com `--border-strong`, texto `--fg`. Ações secundárias ("Revanche", "Parar", "Editar perfil").
- **Fantasma (`fantasma`):** Sem borda nem fundo, texto `--fg` ou `--muted`. Ações complementares ("Mandar outro", "Sair", "Compartilhar").

### 5.2 Bolha Auê (`BolhaAue`)
O elemento orgânico e sonoro do jogo:
- **Modos:** `idle` (pulso leve de repouso), `recording` (áudio-reativa expandindo com volume), `checking` / `validating` (contração rápida), `judging` (vibração de suspense), `holding` (tensão pré-duelo), `waiting` (halo calmo esperando oponente).
- Sem rosto, sem dentes, sem gradiente.

### 5.3 Player de Resenha com Áudio
- Botão circular play/pause (`36px` a `40px`).
- Waveform com barras verticais indicando dinâmica do arroto.
- Duração em mono (`0:07`).
  - **Exceção (decisão do Luiz, 21/10/2026):** no player do card e do perfil, a duração do áudio e o tempo (`2d`) são em sans (Archivo), com números tabulares, como no print do perfil. O mono do §3 e deste item segue valendo para o resto.
- Badge da nota anexado: retângulo com fundo `--accent` e texto em `Anton` (`24px`).

### 5.4 Métricas (`Metrica` e `ListaDeMetricas`)
Três eixos avaliados pelo algoritmo:
1. **Força** (Potência acústica / dB RMS)
2. **Fôlego** (Duração sustentada em segundos)
3. **Grave** (Presença nas frequências graves / corpo sonoro)
Exibidas com barra de preenchimento `--radius-full` e valor numérico.

### 5.5 Confronto X1 (`BlocoVersus`, `LinhaDoPlacar` e `ContagemDaRevanche`)
- Placar lado a lado com nota dos duelistas e áudio de cada um.
- **Empate (`DRAW`):** Tratado com destaque e humor ("Ninguém ganhou").
- **Derrota:** **Nunca usa vermelho** para nota ou placar do perdedor; o perdedor mantém dignidade estética com `--muted`. Vermelho é exclusivo de erro técnico.
- **Revanche:** Contagem `3, 2, 1` que transiciona direto de volta para o início do jogo com o mesmo oponente.

### 5.6 Cartão de Compartilhamento (Card 9:12)
Proporção vertical `9:12` (ou `9:16` quando exportado como story):
- Fundo escuro `--bg`, borda sutil, marca `AUÊ!` discreta no topo.
- Nota gigante em `Anton` destacada em pill `--accent`.
- Fala provocativa do juiz ("Caralho. Veio forte.", "Tá maluco.").
- Link curto do desafio: `aue.app/x1/[codigo]`.

---

## 6. Layout Responsivo em 3 Larguras

O Auê roda exclusivamente no navegador com excelência em 3 cenários:

1. **Desktop (>= 1060px — recomendado 1280px):**
   - **Coluna Esquerda (275px):** Navegação vertical fixa (Logo `AUÊ!`, Início, Auê Arena, Comunidades, Desafios, Perfil, Trocar Tema e Botão de Postar/Arrotar).
   - **Coluna Central (600px):** Feed de resenhas ou Arena de jogo centralizada com bordas laterais de 1px `--border`.
   - **Coluna Direita (320px):** Sticky lateral com campo de busca, Rodas para explorar, ranking e X1 abertos.
2. **Tablet (700px a 1059px):**
   - Coluna esquerda compacta em ícones (76px de largura).
   - Feed/Arena central ocupa o espaço útil.
3. **Celular / Webapp Mobile (< 700px):**
   - Header superior compacto (53px) com logo e botão de tema.
   - Área central sem padding lateral excessivo.
   - **Barra de navegação inferior fixa (56px):** 4 a 5 ícones com alvos de toque >= 44px (`--hit-target-min`).
   - Botão flutuante de ação (FAB) circular verde `--accent` para novo post/arroto.
   - Respeito a safe areas: `--safe-top`, `--safe-bottom`.

### 6.1 Trava lateral no webapp mobile

No celular a página é uma coluna do tamanho da tela: rola só na vertical, nunca de lado.

- `html` e `body` têm `overflow-x: clip` (não `hidden`, para não quebrar `position: sticky` do topo e da barra inferior). É rede de segurança, não desculpa.
- Lista horizontal de verdade (Liga/ranking, abas, chips) usa `overflow-x: auto` **no próprio container**, com `overscroll-behavior-x: contain`.
- Em flex ou grid, o item com conteúdo `nowrap` precisa de `min-width: 0` (e `max-width: 100%`) em **toda** a cadeia de ancestrais até a coluna. Sem isso o `min-width: auto` do flex empurra o documento para além da tela e a página "corre" como imagem. Foi o bug da Liga na home.
- Aceite: na rota real, em 390px, `document.documentElement.scrollWidth` igual a `window.innerWidth`, com a lista cheia.
