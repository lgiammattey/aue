# Mapa de Páginas, Rotas e Fluxos do Auê!

> **Documento Canônico de Orientação de Telas e Componentes**  
> Autoridade: [`../../AGENTS.md`](../../AGENTS.md) | Design System: [`design-system/system/DESIGN.md`](design-system/system/DESIGN.md)

Este documento é a bússola oficial para evitar que qualquer desenvolvedor ou agente mexa em **páginas erradas**, **componentes legados** ou **fluxos descontinuados**. Ele descreve o código e suas rotas; o que está efetivamente publicado é registrado, com data e limite de prova, em [`../PRODUCAO_ATUAL.md`](../PRODUCAO_ATUAL.md).

---

## 1. Regra de Ouro Anti-Confusão: O Que Editar vs O Que NÃO Editar

O repositório passou pela evolução para a arquitetura **Auê 3.0 (OpenDesign)**. Para proteger a base de regressões, certos arquivos antigos foram preservados para compatibilidade de rotas e testes legados, mas **NÃO devem ser alterados para novas features**.

| Frente de Trabalho | ONDE EDITAR (Canônico Ativo) | ONDE NÃO EDITAR (Legado / Confinado) | Protótipo de Referência |
|---|---|---|---|
| **Tropa & Cards de Post** | [`src/features/novo-aue/CardDoPost.tsx`](../../src/features/novo-aue/CardDoPost.tsx) (com `CardDoPost.css` e `TokensDoCard.css`; variante `feed` ou `perfil`)<br>[`src/features/novo-aue/PlayerDoArroto.tsx`](../../src/features/novo-aue/PlayerDoArroto.tsx) (com `PlayerDoArroto.css`)<br>[`src/features/novo-aue/MenuDoPost.tsx`](../../src/features/novo-aue/MenuDoPost.tsx)<br>[`src/features/novo-aue/InicioOpenDesign.tsx`](../../src/features/novo-aue/InicioOpenDesign.tsx) | `src/features/comunidade/components/CardDeCauso.tsx`<br>`src/features/comunidade/components/HeaderSocial.tsx` | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Comentários & Thread de Conversa** | [`src/features/novo-aue/ThreadDeComentarios.tsx`](../../src/features/novo-aue/ThreadDeComentarios.tsx)<br>[`src/features/novo-aue/ModalComentarios.tsx`](../../src/features/novo-aue/ModalComentarios.tsx) | Não embutir árvore de comentários dentro de `CardDoPost` | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Compositor de Post / Gravação Rápida** | [`src/features/novo-aue/ModalCompositor.tsx`](../../src/features/novo-aue/ModalCompositor.tsx)<br>[`src/features/novo-aue/ModalGravarArroto.tsx`](../../src/features/novo-aue/ModalGravarArroto.tsx) | `src/features/comunidade/components/ComposerCauso.tsx`<br>`src/features/comunidade/ModalNovoCauso.tsx` | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Hub de Comunidades** | [`src/features/novo-aue/TelaComunidadeOpenDesign.tsx`](../../src/features/novo-aue/TelaComunidadeOpenDesign.tsx)<br>[`src/features/novo-aue/TelaDiretorioOpenDesign.tsx`](../../src/features/novo-aue/TelaDiretorioOpenDesign.tsx) | `src/features/comunidade/components/AbaComunidades.tsx`<br>`src/features/comunidade/TelaComunidade.tsx` | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) |
| **Perfil de Jogador** | A tela é a view `perfil` de [`src/features/novo-aue/InicioOpenDesign.tsx`](../../src/features/novo-aue/InicioOpenDesign.tsx), com [`PerfilDoUsuario.tsx`](../../src/features/novo-aue/PerfilDoUsuario.tsx) (cabeçalho e abas, `PerfilDoUsuario.css`), [`FolhaDaFoto.tsx`](../../src/features/novo-aue/FolhaDaFoto.tsx) (troca de foto pelo avatar, `FolhaDaFoto.css`), [`BarraSuperior.tsx`](../../src/features/novo-aue/BarraSuperior.tsx) (`BarraSuperior.css`), `CardDoPost` (variante `perfil`) e `PlayerDoArroto`. [`TelaPerfilOpenDesign.tsx`](../../src/features/novo-aue/TelaPerfilOpenDesign.tsx) é só um invólucro de 32 linhas | `src/features/novo-aue/PerfilConectado.tsx` (código morto: só o próprio teste o importa, conferido por `grep` em 21/10/2026). Não criar telas desconexas em `/perfil` | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) |
| **Arena de Arroto (10 Estados)** | [`src/arena/Arena.tsx`](../../src/arena/Arena.tsx)<br>Faixas em [`src/arena/faixas/`](../../src/arena/faixas/)<br>Bolha em [`src/arena/bolha/`](../../src/arena/bolha/) | Telas avulsas de fluxo antigo em `src/features/audio/fluxo/` | [`Arena.dc.html`](prototipo/Arena.dc.html) |
| **Páginas Públicas Institucionais & SEO** | [`src/features/publico/ComoJogar.tsx`](../../src/features/publico/ComoJogar.tsx)<br>[`src/features/publico/ComoArrotar.tsx`](../../src/features/publico/ComoArrotar.tsx)<br>[`src/features/publico/TiposDeArroto.tsx`](../../src/features/publico/TiposDeArroto.tsx)<br>[`src/features/publico/RankingDeArrotos.tsx`](../../src/features/publico/RankingDeArrotos.tsx)<br>[`src/features/grupos/TelaGrupos.tsx`](../../src/features/grupos/TelaGrupos.tsx) | Não substituir `MolduraPublica` → `CascaInformativaOpenDesign` por outra moldura ou impor tema claro fixo sem pedido explícito do Luiz | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) |
| **Páginas Legais (Termos & Privacidade)** | [`src/features/legal/TermosDeUso.tsx`](../../src/features/legal/TermosDeUso.tsx)<br>[`src/features/legal/PoliticaDePrivacidade.tsx`](../../src/features/legal/PoliticaDePrivacidade.tsx) | - | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) |
| **Painel Administrativo** | [`src/features/administracao/TelaAdministracao.tsx`](../../src/features/administracao/TelaAdministracao.tsx) | Não expor na navegação lateral pública | - |

---

## 2. Tabela Mestra de Rotas da Aplicação (`src/App.tsx`)

| Rota URL | Componente Renderizado | Status / Papel | Protótipo Canônico | Descrição e Comportamento |
|---|---|---|---|---|
| `/` | `InicioOpenDesign` | **CANÔNICO ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Entrada da rede social (3 colunas desktop, webapp mobile). Mostra conversas em comunidades, busca e Rodas para explorar. |
| `/feed` | `EntradaInicial` → `InicioOpenDesign` | **ALIAS ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Link antigo que usa a mesma entrada social canônica da raiz. |
| `/em-alta` | redireciona para `/explorar` | **ALIAS** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Atalho mantido para descoberta de comunidades e tópicos. |
| `/seguindo` | `InicioOpenDesign` (`view="seguindo"`) | **CANÔNICO ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Sua Tropa: feed exclusivo das pessoas seguidas por quem está conectado. |
| `/arena` e `/arena/em-breve` | `TelaArenaEmBreveOpenDesign` | **CANÔNICO ATIVO — EM BREVE** | [`Arena.dc.html`](prototipo/Arena.dc.html) | A entrada mostra a indisponibilidade da Arena; não promete gravação, nota ou duelo ativos. |
| `/comunidades` | `TelaDiretorioOpenDesign` | **CANÔNICO ATIVO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Diretório completo de comunidades temáticas do Auê. |
| `/c/:slug` | `TelaComunidadeOpenDesign` | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Comunidade específica. Não declarar a tela de tópicos como publicada sem evidência própria. |
| `/c/:slug/novo` | `TelaComunidadeOpenDesign` | **EM MIGRAÇÃO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Entrada de criação associada à comunidade; depende do corte de tópicos do ADR 0010. |
| `/c/:slug/t/:id` | `TelaComunidadeOpenDesign` | **CANÔNICO ATIVO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Abre a comunidade no OpenDesign; a presença da rota não declara publicação nem disponibilidade de cada tópico. |
| `/explorar` | `TelaExplorarOpenDesign` | **CANÔNICO ATIVO** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Superfície OpenDesign de descoberta; a evidência de produção é documentada separadamente. |
| `/desafios` | `EntradaDesafios` | **CANÔNICO ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Central de desafios e duelos de quem está jogando. |
| `/x1/:code` | `EntradaPorLink` (`Arena`) | **CANÔNICO ATIVO** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Desafio X1 direto por código curto. Abre a Arena pronta para ouvir e responder. |
| `/b/:code` | `EntradaPorLink` (`Arena`) | **ALIAS** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Atalho alternativo para desafio X1. |
| `/d/:id` | `ChallengeView` | **CANÔNICO ATIVO** | [`Arena.dc.html`](prototipo/Arena.dc.html) | Visualização legada/direta de desafio por UUID longo. |
| `/perfil` | `TelaPerfilOpenDesign` | **CANÔNICO ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Perfil próprio da pessoa conectada (arrotos postados, nota média, vitórias no X1). |
| `/u/:handle` | `TelaPerfilOpenDesign` | **CANÔNICO ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Perfil público de qualquer participante pelo `@handle`. |
| `/perfil/:handle` | `TelaPerfilOpenDesign` | **ALIAS ATIVO** | [`Tropa do Arroto.dc.html`](prototipo/Bonde%20do%20Arroto.dc.html) | Compatibilidade para o perfil público por handle. |
| `/login` | `InicioOpenDesign` (`view="auth"`) | **CANÔNICO ATIVO** | [`Login.dc.html`](prototipo/Login.dc.html) | Tela ágil de autenticação / criação de apelido social. |
| `/entrar` | redireciona para `/login` | **ALIAS** | [`Login.dc.html`](prototipo/Login.dc.html) | Atalho de entrada. |
| `/redefinir-senha` | `TelaRedefinirSenha` | **ATIVO** | [`Login.dc.html`](prototipo/Login.dc.html) | Recuperação de senha fora da tela de autenticação principal. |
| `/como-jogar` | `ComoJogar` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Guia público indexável sobre comunidade e o que a Arena vai oferecer quando abrir. |
| `/como-arrotar` | `ComoArrotar` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Guia bem-humorado com dicas de postura, respiração e gaseificação. |
| `/tipos-de-arroto` | `TiposDeArroto` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Guia dos estilos que a Arena pretende avaliar quando estiver disponível. |
| `/ranking-de-arrotos` | `RankingDeArrotos` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Explica as faixas de nota previstas para a Arena; não declara recordes ativos. |
| `/ranking` | redireciona para `/ranking-de-arrotos` | **ALIAS** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Atalho para o ranking público. |
| `/videos-de-arroto` e `/videos` | redirecionam para `/c/arrotos-youtube` | **ALIAS** | [`Comunidades.dc.html`](prototipo/Comunidades.dc.html) | Não renderizam `VideosDeArroto`; levam à comunidade de vídeos. |
| `/grupos` | `TelaGrupos` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Diretório de grupos externos no WhatsApp, Telegram e TikTok. |
| `/g/:slug` | redireciona para `/grupos` | **ALIAS** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Grupo externo que não tem página individual ativa. |
| `/privacidade` | `PoliticaDePrivacidade` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Política formal de tratamento de dados e áudio. |
| `/termos` | `TermosDeUso` | **CANÔNICO ATIVO** | [`Páginas Públicas.dc.html`](prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html) | Regras de conduta, opt-in e responsabilidade na rede. |
| `/admin` | `TelaAdministracao` | **CANÔNICO RESTRITO** | - | Painel interno seguro para aprovações e moderação (RPC autorizada). |
| `/landing` | `TelaLanding` | **CANÔNICO APOIO** | [`Landing.dc.html`](prototipo/Landing.dc.html) | Mostruário da landing page canônica. |
| `/versoes` | `TelaVersoesWebapp` | **CANÔNICO APOIO** | [`Versões Webapp.dc.html`](prototipo/Vers%C3%B5es%20Webapp.dc.html) | Painel de visualização responsiva de breakpoints do webapp. |

---

## 3. Os 6 Fluxos da Jornada do Jogador

A jornada do Auê se organiza em 6 fases contínuas (ver [`docs/jogo/LOOP.md`](../jogo/LOOP.md) e [`docs/jogo/JORNADA.md`](../jogo/JORNADA.md)):

```text
DESCOBERTA → TROPA (PESSOAS) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO)
    ▲                                                                   │
    └────────────────────── REVANCHE (LOOP INFINITO) ───────────────────┘
```

### Fase 1: Descoberta & Entrada
- **Páginas:** `/`, `/como-jogar`, `/landing`, `/grupos`
- **Comportamento:** O visitante pode navegar pelo feed e ouvir arrotos sem conta obrigatória. Ao tentar postar, desafiar ou curtir, abre-se o fluxo de identificação ágil.
- **Visual:** No desktop, 3 colunas (menu, feed central e painel direito). No mobile, cabeçalho limpo com wordmark `AUÊ!` e navegação inferior.

### Fase 2: Tropa (Pessoas, Feed & Comunidades publicadas)
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
  - **Consentimento explícito:** O arroto gravado para duelo ou teste NUNCA vai para o feed público sem que a pessoa clique deliberadamente em "Publicar na roda" e selecione uma comunidade.

### Fase 6: X1 (Duelo) e Revanche
- **Componentes:** `src/arena/faixas/LinkDoDesafio.tsx`, `src/arena/faixas/PlacarDoX1.tsx`, `/x1/:code`
- **Comportamento:**
  - Link de desafio com validade real de 7 dias lida do backend.
  - O desafiado ouve o arroto do oponente antes de gravar o seu.
  - Placar mostra os dois scores confrontados e permite engatar revanches em rounds sucessivos.

---

## 4. Diretrizes Visuais Inegociáveis

### Família visual aprovada por rota

Decisão do Luiz em 22/10/2026: restaurar o visual anterior do login e das páginas informativas. Esta decisão substitui a orientação anterior que impunha tema claro fixo a toda rota pública. O protótipo `Páginas Públicas.dc.html` não autoriza converter a casca OpenDesign em uma landing independente.

| Rotas | Família e componentes ativos | O que preservar |
|---|---|---|
| `/`, `/feed`, `/seguindo`, perfis e comunidades | Casca social OpenDesign e componentes ativos da tabela de rotas | Tema da aplicação, navegação e tokens sociais; não transformar a raiz em landing. |
| `/login` | `InicioOpenDesign`, view `auth`, com `.app--auth` | Padrão anterior do app, wordmark e título em Anton, cores herdadas dos tokens sociais. Não editar `TelaLogin` legado nem forçar outra paleta no formulário. |
| `/como-jogar`, `/como-arrotar`, `/tipos-de-arroto`, `/ranking-de-arrotos`, `/grupos`, `/privacidade`, `/termos` | `MolduraPublica` → `CascaInformativaOpenDesign` | Navegação e moldura OpenDesign; tema herdado da aplicação; títulos em Anton e interface em Archivo. Uma rota pública não implica tema claro fixo. |
| `/landing` | `TelaLanding`, apoio | O visual claro que já existia nesta rota, com suas próprias fontes e tokens. Não aplicar essa exceção à raiz ou ao login. |
| `/videos-de-arroto`, `/videos` | Alias para `/c/arrotos-youtube` | Família da comunidade de destino; não reconstruir a página antiga de vídeos para satisfazer um protótipo ou teste. |

Pedidos de copy, testes ou toque não abrem mudança de tema, tipografia ou moldura. Qualquer mudança futura de família precisa de pedido explícito e comparação da mesma rota antes/depois no navegador. O contrato E2E protege essa separação; sua expectativa não deve ser alterada para aprovar um redesign não solicitado.

### Regras comuns

1. **Tipografia:**
   - **Anton:** reservada estritamente para wordmarks (`AUÊ!`), scores numéricos da Arena, badges de nota e destaques hero.
   - **Archivo:** para todo o corpo de texto, botões, cabeçalhos de posts, legendas e navegação.
   - **Família por rota:** login e páginas informativas mantêm o visual OpenDesign aprovado, sem exceção automática de tema claro. `/landing` mantém sua família clara de apoio. A tabela de famílias acima decide onde cada uma se aplica.
2. **Cores & Acentos:**
   - O verde elétrico (`--accent: #c6ff00`) é de alto contraste e deve ter no máximo **2 aparições por tela/estado** para não poluir a visão.
   - Sem gradientes falsos: fundos são sólidos e contrastantes.
3. **Ergonomia Mobile Webapp:**
   - Alvos de toque (touch targets) de no mínimo `44px × 44px`.
   - Respeito obrigatório a `env(safe-area-inset-bottom)` e `env(safe-area-inset-top)`.
4. **Verdade de Dados:**
   - Proibido injetar números fictícios de seguidores, membros de grupo ou arrotos inventados.
