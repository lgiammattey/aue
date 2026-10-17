---
name: construir-interface
description: Diretrizes do Kayky para construir componentes e telas do Auê!, Bonde do Arroto e Arena em React 19 com fidelidade 1:1.
---

# Skill: construir-interface

Procedimento do **Kayky** para construir interfaces e componentes do Auê! em React 19 com fidelidade visual 1:1 aos protótipos em `docs/design/prototipo/` e ao Design System v5 (`DESIGN.md`).

---

## 1. Princípios de Construção do Frontend

1. **Tokens CSS e Temas Dark/Light:**
   - Todo componente consome as variáveis CSS canônicas (`var(--bg)`, `var(--surface)`, `var(--surface-2)`, `var(--fg)`, `var(--muted)`, `var(--border)`, `var(--border-strong)`, `var(--accent)`, `var(--accent-on)`, `var(--gold)`, `var(--danger)`).
   - Suporte nativo a tema escuro e claro: alternância via atributo de tema no elemento raiz e persistência em `bda-theme`.
   - Fundo chapado: nunca usar gradientes em cards ou fundos de tela.
   - Orçamento do verde ácido: no máximo 2 usos simultâneos de `--accent` por estado.

2. **Tipografia e Classes:**
   - Display em `Anton`: Auê Score gigante (`92px` em reveal, `64px` em resultado), wordmark `AUÊ!`, títulos da Arena e falas secas do juiz.
   - Textos de interface em `Archivo` (`15px` no feed, `16px` em inputs, `20px` bold em botões principais).
   - Metadados e cronômetros em `ui-monospace`.

3. **Arquitetura de Layout em 3 Larguras:**
   - **Desktop (>= 1060px):**
     - Coluna de navegação esquerda (275px fixa): logo `AUÊ!`, links Início, Auê Arena, Comunidades, Desafios, Perfil, toggle de tema e botão verde "Postar".
     - Coluna central (600px): feed do Bonde do Arroto ou Arena, delimitada por bordas de 1px `--border`.
     - Coluna lateral direita (320px): busca rápida, tendências "Em alta no Bonde", ranking do dia e X1 abertos.
   - **Tablet (700px a 1059px):**
     - Menu lateral encolhido em ícones (76px).
   - **Webapp Mobile (< 700px):**
     - Header fixo compacto (53px) com título e alternador de tema.
     - Barra de navegação inferior (56px) com 4 a 5 guias e alvos mínimos de 44px (`--hit-target-min`).
     - FAB circular verde (56x56px) para abrir composer de post ou disparar gravação.
     - Respeito obrigatório a safe-areas: `padding-bottom: calc(56px + var(--safe-bottom))`.

4. **Componentes Canônicos Oficiais:**
   - `Botao`: variantes `primario` (fundo `--accent`), `contorno` (borda `--border-strong`), `fantasma` (sem fundo/borda).
   - `BolhaAue`: SVG responsivo com animação orgânica nos modos `idle`, `recording`, `checking`, `judging`, `holding`, `waiting`.
   - `Player`: reprodutor de áudio com botão play/pause, waveform visual de barras e badge de score em `Anton`. Regra: apenas um áudio reproduz por vez no feed.
   - `Metrica`: barras horizontais de Força, Fôlego e Grave.
   - `BlocoVersus` & `LinhaDoPlacar`: exibição de duelo X1 sem usar cor vermelha para notas de derrotados.
   - `ContagemDaRevanche`: transição `3, 2, 1` para o loop da revanche.
   - `ShareCard`: renderização do card 9:12 para exportação de imagem.

5. **Acesso à Plataforma:**
   - APIs de navegador (`navigator.mediaDevices`, `MediaRecorder`, `AudioContext`, `localStorage`, `window`) ficam isoladas em `src/plataforma/web/`.
   - UI conversa com o motor de áudio e estado por hooks e contratos tipados.
