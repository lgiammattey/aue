---
name: design-ui
description: Procedimento do Rian para especificar a UI do Auê!, Bonde do Arroto e Arena com fidelidade 1:1 ao Design System v5.
---

# Skill: design-ui

Procedimento do **Rian** para transformar os fluxos do Bonde do Arroto e da Arena em **especificação visual 1:1** com o Design System v5 para o **Kayky** construir em React 19.

---

## 1. Princípios Visuais Inegociáveis

1. **Fundo Chapado:** `--bg` puro (`#0a0a08` no dark, `#f5f3ea` no light). Sem cards flutuantes genéricos com bordas gradientes ou blur exagerado. A interface respira na solidez dos tons.
2. **Orçamento do Verde Ácido (`--accent: #c6ff00`):** No máximo **2 aparições simultâneas por estado**. Prioridade: (1) Bolha em gravação/pico; (2) Auê Score em revelação/resultado; (3) CTA primário ativo. Proibido pintar badges secundárias ou textos corridos de verde.
3. **Temas Escuro e Claro:** Suporte nativo oficial com persistência via `localStorage ('bda-theme')`.
   - Dark: `--bg: #0a0a08`, `--surface: #171712`, `--surface-2: #1f1f18`, `--fg: #f5f3ea`, `--muted: #93917f`, `--border: #2b2a22`, `--border-strong: #74725f`, `--ind: #c6ff00`.
   - Light: `--bg: #f5f3ea`, `--surface: #ebe9de`, `--surface-2: #dedcd0`, `--fg: #0a0a08`, `--muted: #57554a`, `--border: #d6d4c6`, `--border-strong: #85836f`, `--ind: #0a0a08`.
4. **Tipografia Canônica:**
   - **Anton:** Display puro, uppercase condensado para Auê Score (número gigante), Wordmark `AUÊ!`, títulos da Arena e falas do juiz (*"Caralho. Veio forte."*, *"Tá maluco."*, *"Foi isso?"*).
   - **Archivo:** Interface completa, corpo de posts, títulos de seção, botões e navegação.
   - **ui-monospace:** Eyebrows técnicos, timestamps (`2min`, `1h`), duração (`0:07`), links curtos (`aue.gg/x1/9f2a`).

---

## 2. Componentes Oficiais do Design System v5

Referência viva: [`docs/design/prototipo/Design System.dc.html`](../../docs/design/prototipo/Design%20System.dc.html)

### 2.1 Botões (`Botao`)
- **Primário:** Fundo `--accent`, texto `--accent-on`, border-radius 18px (`--radius-md`) ou 999px (`--radius-full`), peso 700. Para ação principal de cada estado.
- **Contorno:** Fundo transparente, borda de 1px `--border-strong`, texto `--fg`. Para revanche, parar gravação ou editar perfil.
- **Fantasma:** Fundo transparente, sem borda, texto `--fg` ou `--muted`. Para ações complementares ("Mandar outro", "Sair", "Compartilhar").

### 2.2 Bolha Auê (`BolhaAue`)
- Modos: `idle` (repouso calmo, tamanho ~220px), `recording` (expansão áudio-reativa, ~260px), `checking` / `validating` (~200px), `judging` (suspense, ~180px), `holding` (~176px), `waiting` (~176px).
- Sem boca, sem olhos, sem dente e sem gradiente.

### 2.3 Post / Causo de Arroto no Feed
- Avatar circular (44px) com iniciais em peso 700 ou foto real.
- Nome e handle (`@usuario`) + timestamp em mono.
- Texto do causo (até 280 caracteres).
- Comunidade vinculada: *"Postado em [Nome da Comunidade]"*.
- Player de áudio integrado: botão play circular (40px), waveform com barras verticais reativas, duração em mono e badge de nota em Anton com pill `--accent`.
- Barra de ações: Responder (threads), Repostar, Curtir (coração com transição pop), Desafiar autor e Compartilhar.

### 2.4 Métricas Acústicas (`Metrica` / `ListaDeMetricas`)
- Três barras horizontais com pill full radius: **Força** (dB RMS), **Fôlego** (duração em segundos) e **Grave** (corpo acústico).

### 2.5 Duelo X1 & Placar Versus (`BlocoVersus`, `LinhaDoPlacar`)
- Comparativo lado a lado dos dois oponentes.
- **Vitória:** Destacada com `--gold` / `--accent`.
- **Empate (`DRAW`):** Frase em Anton *"Ninguém ganhou."*.
- **Derrota:** **Nunca usa vermelho** na pontuação do perdedor (preserva em tom neutro `--muted`). Vermelho é estritamente erro técnico.

### 2.6 Cartão de Compartilhamento (Card 9:12)
- Formato vertical padronizado `9:12` para exportar imagem PNG com nota, fala do juiz e link `aue.app/x1/[código]`.

---

## 3. Layout Responsivo em 3 Larguras

- **Desktop (>= 1060px):**
  - Coluna Esquerda (275px): navegação vertical e botão de postar/arrotar.
  - Coluna Central (600px): timeline do Bonde do Arroto ou Arena centralizada, com bordas laterais 1px `--border`.
  - Coluna Direita (320px): busca, ranking de hoje, quem seguir e X1 abertos.
- **Tablet (700px a 1059px):**
  - Coluna esquerda compacta com ícones (76px).
- **Webapp Mobile (< 700px):**
  - Header superior (53px) com logo e toggle de tema.
  - Barra de navegação inferior fixa (56px) com 4 a 5 guias e alvos mínimos de 44px (`--hit-target-min`).
  - FAB circular verde para criar post / soltar arroto.
