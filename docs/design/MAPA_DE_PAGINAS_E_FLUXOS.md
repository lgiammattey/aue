# Mapa de Páginas, Rotas e Fluxos do Auê!

> **Documento Canônico de Orientação de Telas e Componentes**  
> Autoridade: [`../../AGENTS.md`](../../AGENTS.md) | Design System: [`design-system/system/DESIGN.md`](design-system/system/DESIGN.md)

Este documento é a bússola oficial para evitar que qualquer desenvolvedor ou agente mexa em **páginas erradas**, **componentes legados** ou **fluxos descontinuados**. Ele descreve o código e suas rotas; o que está efetivamente publicado é registrado, com data e limite de prova, em [`../PRODUCAO_ATUAL.md`](../PRODUCAO_ATUAL.md).

---

## 1. Regra de Ouro Anti-Confusão: O Que Editar vs O Que NÃO Editar

O repositório passou pela evolução para a arquitetura **Auê 3.0 (OpenDesign)**. Para proteger a base de regressões, certos arquivos antigos foram preservados para compatibilidade de rotas e testes legados, mas **NÃO devem ser alterados para novas features**.

| Frente de Trabalho | ONDE EDITAR (Canônico Ativo) | ONDE NÃO EDITAR (Legado / Confinado) | Protótipo de Referência |
|---|---|---|---|
| **Feed do Bonde & Cards de Post** | [`src/features/novo-aue/CardDoPost.tsx`](../../src/features/novo-aue/CardDoPost.tsx)<br>[`src/features/novo-aue/InicioOpenDesign.tsx`](../../src/features/novo-aue/InicioOpenDesign.tsx)<br>[`src/features/novo-aue/VersaoMobileOpenDesign.tsx`](../../src/features/novo-aue/VersaoMobileOpenDesign.tsx) | `src/features/comunidade/components/CardDeCauso.tsx`<br>`src/features/comunidade/components/HeaderSocial.tsx` | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Comentários & Thread de Conversa** | [`src/features/novo-aue/ThreadDeComentarios.tsx`](../../src/features/novo-aue/ThreadDeComentarios.tsx)<br>[`src/features/novo-aue/ModalComentarios.tsx`](../../src/features/novo-aue/ModalComentarios.tsx) | Não embutir árvore de comentários dentro de `CardDoPost` | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Compositor de Post / Gravação Rápida** | [`src/features/novo-aue/ModalCompositor.tsx`](../../src/features/novo-aue/ModalCompositor.tsx)<br>[`src/features/novo-aue/ModalGravarArroto.tsx`](../../src/features/novo-aue/ModalGravarArroto.tsx) | `src/features/comunidade/components/ComposerCauso.tsx`<br>`src/features/comunidade/ModalNovoCauso.tsx` | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Hub de Comunidades** | [`src/features/novo-aue/TelaComunidadeOpenDesign.tsx`](../../src/features/novo-aue/TelaComunidadeOpenDesign.tsx)<br>[`src/features/novo-aue/TelaDiretorioOpenDesign.tsx`](../../src/features/novo-aue/TelaDiretorioOpenDesign.tsx) | `src/features/comunidade/components/AbaComunidades.tsx`<br>`src/features/comunidade/TelaComunidade.tsx` | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) |
| **Perfil de Jogador** | [`src/features/novo-aue/TelaPerfilOpenDesign.tsx`](../../src/features/novo-aue/TelaPerfilOpenDesign.tsx)<br>[`src/features/novo-aue/PerfilConectado.tsx`](../../src/features/novo-aue/PerfilConectado.tsx) | Não criar telas desconexas em `/perfil` | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Arena de Arroto (10 Estados)** | [`src/arena/Arena.tsx`](../../src/arena/Arena.tsx)<br>Faixas em [`src/arena/faixas/`](../../src/arena/faixas/)<br>Bolha em [`src/arena/bolha/`](../../src/arena/bolha/) | Telas avulsas de fluxo antigo em `src/features/audio/fluxo/` | [`Arena.dc.html`](prototipo/Arena.dc.html) |
| **Páginas Públicas Institucionais & SEO** | [`src/features/publico/ComoJogar.tsx`](../../src/features/publico/ComoJogar.tsx)<br>[`src/features/publico/ComoArrotar.tsx`](../../src/features/publico/ComoArrotar.tsx)<br>[`src/features/publico/TiposDeArroto.tsx`](../../src/features/publico/TiposDeArroto.tsx)<br>[`src/features/publico/RankingDeArrotos.tsx`](../../src/features/publico/RankingDeArrotos.tsx)<br>[`src/features/grupos/TelaGrupos.tsx`](../../src/features/grupos/TelaGrupos.tsx) | Nunca aplicar tema escuro nas públicas (seguem tema claro fixo) | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) |
| **Páginas Legais (Termos & Privacidade)** | [`src/features/legal/TermosDeUso.tsx`](../../src/features/legal/TermosDeUso.tsx)<br>[`src/features/legal/PoliticaDePrivacidade.tsx`](../../src/features/legal/PoliticaDePrivacidade.tsx) | - | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) |
| **Painel Administrativo** | [`src/features/administracao/TelaAdministracao.tsx`](../../src/features/administracao/TelaAdministracao.tsx) | Não expor na navegação lateral pública | - |

---

## 2. Tabela Mestra de Rotas da Aplicação (`src/App.tsx`)

| Rota URL | Componente Renderizado | Status / Papel | Protótipo Canônico | Descrição e Comportamento |
|---|---|---|---|---|
| `/` | `InicioOpenDesign` | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Entrada da rede social (3 colunas desktop, webapp mobile). Mostra feed "Para Você", "Em Alta", "Seguindo", busca e tendências. |
| `/feed` | `EntradaPrincipal` (`TelaComunidade`) | **COMPATIBILIDADE** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Rota mantida para testes e acessos diretos. Para nova experiência de feed, consulte `/`. |
| `/em-alta` | `InicioOpenDesign` (`view="emAlta"`) | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Feed ordenado pelos causos e arrotos com maior repercussão. |
| `/seguindo` | `InicioOpenDesign` (`view="seguindo"`) | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Feed exclusivo das pessoas seguidas por quem está conectado. |
| `/arena` | `EntradaArena` (`Arena`) | **CANÔNICO ATIVO** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Máquina de 10 estados da Arena (gravação, julgamento de áudio, nota e duelo). |
| `/comunidades` | `TelaDiretorioOpenDesign` | **CANÔNICO ATIVO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Diretório completo de comunidades temáticas do Auê. |
| `/c/:slug` | `TelaComunidadeOpenDesign` | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Comunidade específica. Não declarar a tela de tópicos como publicada sem evidência própria. |
| `/c/:slug/novo` | `TelaComunidadeOpenDesign` | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Entrada de criação associada à comunidade; depende do corte de tópicos do ADR 0010. |
| `/c/:slug/t/:id` | `rotasDoForum` (`TelaTopico`) | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Rota da conversa por tópico prevista no ADR 0010; não é prova de publicação. |
| `/explorar` | `rotasDoForum` (`TelaExplorar`) | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Descoberta de comunidades e tópicos prevista no ADR 0010; requer prova de produção antes de virar canônica. |
| `/desafios` | `EntradaDesafios` | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Central de desafios e duelos de quem está jogando. |
| `/x1/:code` | `EntradaPorLink` (`Arena`) | **CANÔNICO ATIVO** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Desafio X1 direto por código curto. Abre a Arena pronta para ouvir e responder. |
| `/b/:code` | `EntradaPorLink` (`Arena`) | **ALIAS** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Atalho alternativo para desafio X1. |
| `/d/:id` | `ChallengeView` | **CANÔNICO ATIVO** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Visualização legada/direta de desafio por UUID longo. |
| `/perfil` | `TelaPerfilOpenDesign` | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Perfil próprio da pessoa conectada (arrotos postados, nota média, vitórias no X1). |
| `/u/:handle` | `TelaPerfilOpenDesign` | **CANÔNICO ATIVO** | [`Bonde do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Perfil público de qualquer participante pelo `@handle`. |
| `/login` | `InicioOpenDesign` (`view="auth"`) | **CANÔNICO ATIVO** | [`Login.dc.html`](prototipo/Login.dc.html) | Tela ágil de autenticação / criação de apelido social. |
| `/como-jogar` | `ComoJogar` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Tutorial público indexável explicando a mecânica do jogo e nota. |
| `/como-arrotar` | `ComoArrotar` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Guia bem-humorado com dicas de postura, respiração e gaseificação. |
| `/tipos-de-arroto` | `TiposDeArroto` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Enciclopédia dos arrotos julgados pelo motor (trovão, silencioso, falso, etc.). |
| `/ranking-de-arrotos` | `RankingDeArrotos` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Tabela histórica dos maiores scores auditados. |
| `/grupos` | `TelaGrupos` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Diretório de grupos externos no WhatsApp, Telegram e TikTok. |
| `/privacidade` | `PoliticaDePrivacidade` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Política formal de tratamento de dados e áudio. |
| `/termos` | `TermosDeUso` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Regras de conduta, opt-in e responsabilidade na rede. |
| `/admin` | `TelaAdministracao` | **CANÔNICO RESTRITO** | - | Painel interno seguro para aprovações e moderação (RPC autorizada). |
| `/landing` | `TelaLanding` | **CANÔNICO APOIO** | [`Landing.dc.html`](prototipo/Landing.dc.html) | Mostruário da landing page canônica. |
| `/versoes` | `TelaVersoesWebapp` | **CANÔNICO APOIO** | [`Versões Webapp.dc.html`](prototipo/Vers%C3%B5es%20Webapp.dc.html) | Painel de visualização responsiva de breakpoints do webapp. |

---

## 3. Os 6 Fluxos da Jornada do Jogador

A jornada do Auê se organiza em 6 fases contínuas (ver [`docs/jogo/LOOP.md`](../jogo/LOOP.md) e [`docs/jogo/JORNADA.md`](../jogo/JORNADA.md)):

```text
DESCOBERTA → BONDE (FEED) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO)
    ▲                                                                   │
    └────────────────────── REVANCHE (LOOP INFINITO) ───────────────────┘
```

### Fase 1: Descoberta & Entrada
- **Páginas:** `/`, `/como-jogar`, `/landing`, `/grupos`
- **Comportamento:** O visitante pode navegar pelo feed e ouvir arrotos sem conta obrigatória. Ao tentar postar, desafiar ou curtir, abre-se o fluxo de identificação ágil.
- **Visual:** No desktop, 3 colunas (menu, feed central e painel direito). No mobile, cabeçalho limpo com wordmark `AUÊ!` e navegação inferior.

### Fase 2: Bonde do Arroto (Feed & Comunidades publicados)
- **Componentes:** `InicioOpenDesign.tsx`, `CardDoPost.tsx`, `ThreadDeComentarios.tsx`, `ModalCompositor.tsx`
- **Comportamento:**
  - A produção mostra resenhas por comunidade, autor, comentários, reações, salvar e compartilhar; pode haver áudio ou mídia externa conforme o post.
  - Visitante lê o feed; as ações de participação pedem entrada.
  - A direção de conversa por tópico está aceita no ADR 0010, mas continua marcada como migração até ganhar evidência de publicação.

### Fase 3: Arena de Arroto
- **Componentes:** `src/arena/Arena.tsx`, faixas em `src/arena/faixas/`
- **Comportamento:**
  - Máquina de 10 estados contínua: `IDLE` → `RECORDING` → `ORIGIN` → `JUDGING` → `RESULT` → `CHALLENGE` → `VERSUS` → `SCOREBOARD` → `REMATCH` → `ERROR`.
  - Microfone pedido apenas sob ação voluntária do usuário.
  - Classificação acústica real via modelo YAMNet local (`src/features/audio/juiz/yamnet.ts`). Não-arrotos são rejeitados de verdade.

### Fase 4: Resiliência e Erros Transparentes
- **Componentes:** `src/arena/faixas/` e avisos em `src/shared/components/`
- **Comportamento:**
  - Erro real é comunicado com clareza: microfone bloqueado (`MIC_ERROR`), silêncio detectado (`NO_SOUND`), falha de rede ou desafio expirado.
  - Nunca simular sucesso ou mascarar timeout de API.

### Fase 5: Depois da Nota & Postagem
- **Componentes:** `ResultadoScreen.tsx`, `ModalGravarArroto.tsx`, `ModalCardCompartilhamento.tsx`
- **Comportamento:**
  - Auê Score revelado de 0 a 100 com teatralidade controlada.
  - Card de compartilhamento em formato 9:12.
  - **Consentimento explícito:** O arroto gravado para duelo ou teste NUNCA vai para o feed público sem que a pessoa clique deliberadamente em "Postar no Bonde" ou selecione uma comunidade.

### Fase 6: X1 (Duelo) e Revanche
- **Componentes:** `src/arena/faixas/LinkDoDesafio.tsx`, `src/arena/faixas/PlacarDoX1.tsx`, `/x1/:code`
- **Comportamento:**
  - Link de desafio com validade real de 7 dias lida do backend.
  - O desafiado ouve o arroto do oponente antes de gravar o seu.
  - Placar mostra os dois scores confrontados e permite engatar revanches em rounds sucessivos.

---

## 4. Diretrizes Visuais Inegociáveis

1. **Tipografia:**
   - **Anton:** reservada estritamente para wordmarks (`AUÊ!`), scores numéricos da Arena, badges de nota e destaques hero.
   - **Archivo:** para todo o corpo de texto, botões, cabeçalhos de posts, legendas e navegação.
   - **Exceção das Páginas Públicas:** títulos e wordmark seguem Archivo 800/900 em tema claro fixo (conforme [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html)).
2. **Cores & Acentos:**
   - O verde elétrico (`--accent: #c6ff00`) é de alto contraste e deve ter no máximo **2 aparições por tela/estado** para não poluir a visão.
   - Sem gradientes falsos: fundos são sólidos e contrastantes.
3. **Ergonomia Mobile Webapp:**
   - Alvos de toque (touch targets) de no mínimo `44px × 44px`.
   - Respeito obrigatório a `env(safe-area-inset-bottom)` e `env(safe-area-inset-top)`.
4. **Verdade de Dados:**
   - Proibido injetar números fictícios de seguidores, membros de grupo ou arrotos inventados.
