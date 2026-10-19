---
name: "Auê! Design System"
category: Brands
surface: Rede social para arrotadores (Desktop e Webapp Mobile)
status: "Design System canônico — v5 (Bonde do Arroto & Arena)"
canonical_refs:
  - "docs/design/prototipo/Design System.dc.html"
  - "docs/design/prototipo/Bonde do Arroto.dc.html"
  - "docs/design/prototipo/Arena.dc.html"
  - "docs/design/prototipo/Landing.dc.html"
  - "docs/design/prototipo/Login.dc.html"
  - "docs/design/prototipo/Comunidades.dc.html"
  - "docs/design/prototipo/Jornada.dc.html"
  - "docs/design/prototipo/Versões Webapp.dc.html"
  - "docs/design/prototipo/Publicar.dc.html"
colors:
  dark:
    bg: "#0a0a08"
    surface: "#171712"
    surface-2: "#1f1f18"
    fg: "#f5f3ea"
    muted: "#93917f"
    border: "#2b2a22"
    border-strong: "#74725f"
    ind: "#f5f3ea"
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

> **Arrote. Receba a nota. Publique seu causo. Humilhe seus amigos e domine as comunidades.**

O Auê! é uma **rede social para arrotadores**, exclusivamente online via **Desktop e Webapp Mobile**. A experiência conecta a adrenalina imediata da **Arena** (a máquina de captura e pontuação de arrotos) à dinâmica de feed contínuo estilo Twitter/X (**Bonde do Arroto**) e **comunidades temáticas** estilo Orkut / Reddit.

Fundo chapado, sem cards flutuantes genéricos, sem gradiente decorativo. Verde ácido (`--accent: #c6ff00`) elétrico usado com critério: no máximo 2 aparições simultâneas por estado.

---

## 1. Referências Canônicas

Os arquivos em `docs/design/prototipo/` e este Design System são as referências canônicas de UX/UI do Auê!:

| Artefato | Arquivo | Responsabilidade |
|---|---|---|
| **Design System** | [`docs/design/prototipo/Design System.dc.html`](../prototipo/Design%20System.dc.html) | Demonstração viva de cores, tipos, raios, botões e componentes |
| **Bonde do Arroto** | [`docs/design/prototipo/Bonde do Arroto.dc.html`](../prototipo/Bonde%20do%20Arroto.dc.html) | Feed de causos, posts com áudio, abas, composer, desafios X1 e perfil |
| **Arena** | [`docs/design/prototipo/Arena.dc.html`](../prototipo/Arena.dc.html) | Máquina de estados do arroto (IDLE, RECORDING, VALIDATING, JUDGING, RESULT, X1) |
| **Comunidades** | [`docs/design/prototipo/Comunidades.dc.html`](../prototipo/Comunidades.dc.html) | Praça central, descoberta de categorias, rankings e moderação |
| **Landing** | [`docs/design/prototipo/Landing.dc.html`](../prototipo/Landing.dc.html) | Recepção estilo Twitter ("Tá rolando agora"), login social e atalho para arrotar |
| **Login** | [`docs/design/prototipo/Login.dc.html`](../prototipo/Login.dc.html) | Autenticação simples (Google, Apple, E-mail/Senha/Apelido) ou Convidado |
| **Jornada** | [`docs/design/prototipo/Jornada.dc.html`](../prototipo/Jornada.dc.html) | O fluxo completo em 6 fases de decisão e resiliência |
| **Publicar** | [`docs/design/prototipo/Publicar.dc.html`](../prototipo/Publicar.dc.html) | Formulário depois da nota (Destino, autorização), convite, perfil com "No perfil", tópico publicado |
| **Versões Webapp** | [`docs/design/prototipo/Versões Webapp.dc.html`](../prototipo/Vers%C3%B5es%20Webapp.dc.html) | Responsividade em 3 larguras: Desktop (1280px), Tablet (820px) e Celular (390px) |

---

## 2. Cores e Temas

O sistema tem dois temas. **O padrão é o Tema Claro (creme)**, para todo mundo, mesmo com o sistema operacional no escuro. Sem preferência guardada a página abre clara. A escolha da pessoa só existe depois que ela toca no botão de tema, e é guardada em `localStorage` (`bda-theme`) com o marcador `bda-theme-v = 2`; um `dark` guardado sem o marcador é o padrão antigo e vale como claro. Cada token é definido **uma vez** por tema; nenhum hex solto em componente. Desenho completo, medições e inventário em [`docs/design/tema-e-publicar.md`](../../tema-e-publicar.md).

> **Arena:** fica **escura fixa** por enquanto (decisão pendente do Luiz sobre seguir o tema). A fixação é da rota inteira e não grava preferência; o botão de tema não aparece nela. O claro da Arena está provado no protótipo com as regras da seção 2.3.

### 2.1 Tema Escuro (`dark`, opcional)
- `--bg`: `#0a0a08` — Fundo único e contínuo
- `--surface`: `#171712` — Primeira camada de elevação (aside, cards, inputs)
- `--surface-2`: `#1f1f18` — Segunda camada (avatares, capas, badges)
- `--fg`: `#f5f3ea` — Texto principal e ícones de alto contraste
- `--muted`: `#93917f` — Metadados, timestamps, handles e bordas secundárias
- `--border`: `#2b2a22` — Divisores finos de 1px
- `--border-strong`: `#74725f` — Contornos de inputs e botões secundários
- `--ind`: igual a `--fg` — Indicador ativo de abas e toggles (sem verde)
- `--accent`: `#c6ff00` — Verde ácido elétrico: CTA primário, Auê Score, Bolha ativa (máx. 2 por tela)
- `--accent-strong`: `#a8d900` — Hover e estado pressionado do accent
- `--accent-on`: `#0a0a08` — Texto escuro obrigatório sobre accent
- `--gold`: `#f4c430` — Recordes, vitórias e 1º lugar do pódio
- `--silver`: `#c7cad1` — 2º lugar
- `--bronze`: `#c98a4b` — 3º lugar
- `--danger`: `#ff3d3f` — Mensagens de erro técnico crítico

### 2.2 Tema Claro (`light`, padrão)
- `--bg`: `#f5f3ea` — Fundo claro único
- `--surface`: `#ebe9de` — Superfície clara
- `--surface-2`: `#dedcd0` — Superfície contrastante
- `--fg`: `#0a0a08` — Texto preto profundo
- `--muted`: `#57554a` — Texto secundário de leitura confortável
- `--border`: `#d6d4c6` — Divisores de 1px
- `--border-strong`: `#85836f` — Contornos de botão e campos
- `--ind`: `#0a0a08` — Indicador preto de abas ativas
- `--accent`: `#c6ff00` — Mantido, mas só como **placa** (ver 2.3)
- `--accent-on`: `#0a0a08` — Texto escuro sobre accent
- `--accent-contorno`: `--fg` a 50% — contorno interno de 1px de toda placa verde (3,86:1 sobre o creme). No escuro não existe
- `--danger`: `#c4161a` — Vermelho de erro técnico adaptado para contraste (nunca sobre `--surface-2`: 4,4:1)

### 2.3 Regra de Uso do Accent
> **Orçamento:** no máximo 2 aparições simultâneas de `--accent` por estado.
> - Prioridade 1: Bolha em gravação / pico
> - Prioridade 2: Auê Score em destaque
> - Prioridade 3: CTA primário ("Arrotar", "Criar conta", "Criar tópico", "Enviar"). "Postar" não existe mais.
>
> Proibido pintar tudo de verde.

**O verde é placa, nunca texto, borda nem foco.** Sobre o creme ele dá 1,07:1 e some; por isso, nos dois temas:
- botão primário e selo de nota são placas `--accent` com texto `--accent-on`; no claro levam o contorno interno `--accent-contorno`;
- foco visível é `outline: 2px solid var(--fg)`;
- no claro a Bolha ganha contorno `--fg` de 2px em todos os modos, o Auê Score vira selo (Anton `--accent-on` sobre placa), o aviso do cronômetro e o vencedor viram placa `--gold` com texto `--fg`.

---

## 3. Tipografia

A hierarquia tipográfica une brutalismo esportivo e legibilidade social:

1. **Display:** `Anton` (`sans-serif`, peso único, condensada e pesada).
   - Uso: Wordmark `AUÊ!`, Auê Score (número de 0 a 100), títulos da Arena, falas secas do juiz ("Caralho. Veio forte.", "Tá maluco.", "Foi isso?"), contagem da revanche e kickers.
2. **Interface e Leitura:** `Archivo` (com fallbacks `Google Sans Flex`, `Inter`, `system-ui`).
   - Uso: Textos do feed, causos, botões, navegação, descrições e formulários.
3. **Monospaçada:** `ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace`.
   - Uso restrito: Eyebrows técnicos, timestamps (`2min`, `1h`), duração de áudio (`0:07`), links curtos (`aue.gg/x1/9f2a`), posições numéricas de ranking.

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

### 5.3 Player de Causo com Áudio
- Botão circular play/pause (`36px` a `40px`).
- Waveform com barras verticais indicando dinâmica do arroto.
- Duração em mono (`0:07`).
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
   - **Coluna Central (600px):** Feed de causos ou Arena de jogo centralizada com bordas laterais de 1px `--border`.
   - **Coluna Direita (320px):** Sticky lateral com campo de busca, tendências "Em alta no Bonde", "Ranking de hoje" e "X1 abertos".
2. **Tablet (700px a 1059px):**
   - Coluna esquerda compacta em ícones (76px de largura).
   - Feed/Arena central ocupa o espaço útil.
3. **Celular / Webapp Mobile (< 700px):**
   - Header superior compacto (53px) com logo e botão de tema.
   - Área central sem padding lateral excessivo.
   - **Barra de navegação inferior fixa (56px):** 4 a 5 ícones com alvos de toque >= 44px (`--hit-target-min`).
   - Botão flutuante de ação (FAB) circular verde `--accent` para novo post/arroto.
   - Respeito a safe areas: `--safe-top`, `--safe-bottom`, pintadas com `--bg` (sem faixa de outra cor sob a barra inferior nem acima do cabeçalho).

### Barra do navegador
- `<meta name="theme-color">` único, `#f5f3ea` por padrão e `#0a0a08` no escuro (e na Arena fixa); páginas públicas usam `#f7f8f5`. Manifest `theme_color` e `background_color` em `#f5f3ea`.
- iPhone com o app na tela de início: `apple-mobile-web-app-status-bar-style` é estático; proposto `default` (texto escuro). Não acompanha o tema; provar em aparelho.
