# Auê 🎙️💨

**A rede social para arrotadores, exclusivamente online via desktop e webapp mobile.**

> ## Arrote. Receba a nota. Publique seu causo. Humilhe seus amigos e domine as comunidades.

```text
DESCOBERTA → BONDE (FEED) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO)
    ▲                                                                   │
    └────────────────────── REVANCHE (LOOP INFINITO) ───────────────────┘
```

O Auê conecta a adrenalina imediata da **Arena** (a máquina que captura, julga e pontua cada arroto) à dinâmica de timeline estilo Twitter/X (**Bonde do Arroto**) e **comunidades temáticas** (estilo Orkut / Reddit) para reunir os arrotadores do mundo.

Feito por quem já fazia essa zoeira antes de existir qualquer linha de código.

---

## A Experiência

A plataforma roda 100% na web moderna, adaptada tanto para telas grandes no **desktop** (layout de 3 colunas: navegação, feed/arena e lateral de tendências/ranking) quanto na palma da mão como **webapp mobile** (com barra inferior, safe area e alvos tocáveis >= 44px).

1. **Bonde do Arroto (Feed):** Linha do tempo de causos em texto e áudio com ondas sonoras interativas, notas anexadas e reações.
2. **Arena:** Máquina de estados contínua (`IDLE`, `RECORDING`, `ORIGIN`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD`, `REMATCH`, `ERROR`) onde o áudio é gravado, validado pelo YAMNet e pontuado de 0 a 100 (Auê Score).
3. **Comunidades Temáticas:** Hubs organizados por assunto (Bonde Geral, Clássicos de Boteco, Madrugada, etc.) com rankings dedicados e moderação.
4. **Desafios X1:** Duelos diretos entre amigos via link no zap com comparativo visual e revanche imediata.
5. **Diretório de Grupos:** Diretório aberto de grupos externos no WhatsApp, Telegram e TikTok.
6. **Perfis de Jogador:** Identidade de arrotador com apelido, handle `@`, histórico de causos e troféus.

---

## Os Protótipos Canônicos

**A referência visual viva do produto reside em [`docs/design/prototipo/`](docs/design/prototipo/):**

- [`Bonde do Arroto.dc.html`](docs/design/prototipo/Bonde%20do%20Arroto.dc.html) — O feed social estilo Twitter/X
- [`Arena.dc.html`](docs/design/prototipo/Arena.dc.html) — A máquina da Arena e estados de captura
- [`Comunidades.dc.html`](docs/design/prototipo/Comunidades.dc.html) — Hub de comunidades e rankings
- [`Landing.dc.html`](docs/design/prototipo/Landing.dc.html) — Página de chegada e acesso rápido
- [`Login.dc.html`](docs/design/prototipo/Login.dc.html) — Autenticação e entrada como convidado
- [`Jornada.dc.html`](docs/design/prototipo/Jornada.dc.html) — As 6 fases da jornada do jogador
- [`Versões Webapp.dc.html`](docs/design/prototipo/Vers%C3%B5es%20Webapp.dc.html) — Matriz de visualização desktop, tablet e celular
- [`Design System.dc.html`](docs/design/prototipo/Design%20System.dc.html) — Mostruário de componentes, cores e tokens

Abra direto no navegador — roda de forma autônoma sem build. Ver [`docs/design/README.md`](docs/design/README.md).

---

## Exclusivamente Web (Desktop & Webapp)

O Auê vive **100% na web** (`https://aue.web.app`), hospedado no Firebase Hosting.

- **Sem download de loja:** Abre no navegador, joga em três segundos e compartilha no WhatsApp.
- **PWA instalável:** Pode ser adicionado à tela inicial no Android e no iOS com suporte offline e cache do modelo YAMNet.
- **Zero cascas nativas:** Lojas nativas (Google Play / App Store) estão fora de escopo.

---

## Como a Identidade Funciona

- **Entrada instantânea:** Quem chega sem conta recebe uma sessão anônima do Supabase (`signInAnonymously`). Pode jogar na Arena, ouvir áudios e interagir imediatamente.
- **Conta permanente e perfil:** A qualquer momento a pessoa pode vincular e-mail/senha ou Google, escolhendo seu apelido e handle `@` público.
- Gravação para duelo ou teste não vira causo público sem autorização explícita na hora da postagem.

---

## Stack Técnica

- **Frontend:** React 19 + TypeScript + Vite + React Router
- **PWA:** `vite-plugin-pwa` (Workbox) com cache de runtime para o modelo de IA
- **Áudio & IA:** Web Audio API + MediaRecorder + modelo YAMNet local (TensorFlow.js) para detecção de arrotos reais
- **Backend & Dados:** Supabase (PostgreSQL, Row Level Security, RPCs, Auth, Storage privado e Edge Functions)
- **Hospedagem:** Firebase Hosting com geração estática de páginas para grupos e SEO
- **Qualidade & Testes:** Vitest + Testing Library + Oxlint + validações de arquitetura

---

## Desenvolvimento Local

```bash
npm install
cp .env.example .env
npm run dev
```

Validação obrigatória antes de qualquer entrega:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

As regras de trabalho e papéis da squad estão em [`AGENTS.md`](AGENTS.md) — a **autoridade única** do repositório.

---

## Documentação

Comece por [`docs/README.md`](docs/README.md).

- Visão do produto: [`docs/jogo/VISAO.md`](docs/jogo/VISAO.md)
- Loop do jogador: [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md)
- Jornada em 6 fases: [`docs/jogo/JORNADA.md`](docs/jogo/JORNADA.md)
- Estados da Arena: [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md)
- Regras e pontuação: [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md)
- Design e protótipos: [`docs/design/README.md`](docs/design/README.md)
- Escopo atual: [`docs/escopo/ESCOPO_ATUAL.md`](docs/escopo/ESCOPO_ATUAL.md)
- Arquitetura e ADRs: [`docs/technical/adr/README.md`](docs/technical/adr/README.md)
- Tom de voz: [`docs/jogo/VOZ.md`](docs/jogo/VOZ.md)

---

## Regra de Ouro da Squad

> **Uma entrega fechada por vez. Proteja a mesa limpa. Nada pode fingir que funciona.**
