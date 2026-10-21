# Design & Experiência do Auê!

Este diretório contém a documentação visual, protótipos interativos e tokens canônicos do Auê!.

---

## 1. Protótipos Interativos Canônicos

Todos os protótipos vivos do Auê! residem em [`docs/design/prototipo/`](./prototipo/):

- [`Design System.dc.html`](./prototipo/Design%20System.dc.html) — Mostruário completo de cores, tipografia, espaçamentos, raios e componentes vivos nos temas escuro e claro.
- [`Tropa do Arroto.dc.html`](./prototipo/Bonde%20do%20Arroto.dc.html) — Camada social no estilo Twitter/X: pessoas seguidas, causos com texto e áudio, notas anexadas, desafios X1 e perfil de jogador.
- [`Arena.dc.html`](./prototipo/Arena.dc.html) — Máquina oficial de captura e pontuação de arroto: estados IDLE, RECORDING, VALIDATING, JUDGING, RESULT, placar de duelo e revanche.
- [`Landing.dc.html`](./prototipo/Landing.dc.html) — Página de chegada estilo Twitter ("Tá rolando agora"), com login social e rota rápida para arrotar sem conta.
- [`Login.dc.html`](./prototipo/Login.dc.html) — Fluxo ágil de autenticação (Google, Apple, E-mail/Senha/Apelido) ou convidado.
- [`Comunidades.dc.html`](./prototipo/Comunidades.dc.html) — Hub de comunidades com a praça central Bonde do Arroto, categorias temáticas, moderação e rankings.
- [`Jornada.dc.html`](./prototipo/Jornada.dc.html) — Mapa completo da jornada em 6 fases de decisão, jogo e resiliência.
- [`Versões Webapp.dc.html`](./prototipo/Vers%C3%B5es%20Webapp.dc.html) — Matriz de validação responsiva em 3 tamanhos (Desktop 1280px, Tablet 820px e Mobile 390px).

---

## 2. Design System & Tokens

A especificação detalhada está em:
- [`docs/design/design-system/system/DESIGN.md`](./design-system/system/DESIGN.md)
- Tokens CSS em [`docs/design/design-system/tokens/`](./design-system/tokens/)
  - `colors.css` — Paleta tema escuro e claro
  - `typography.css` — Anton, Archivo e escala de texto
  - `spacing.css` — Grid base 8px e raios de borda
  - `glow.css` — Energia visual proporcional a eventos
  - `motion.css` — Durações e curvas cúbicas de animação
  - `feedback.css` — Hápticos e efeitos de áudio do jogo
  - `safe-area.css` — Insets para navegação web e mobile
