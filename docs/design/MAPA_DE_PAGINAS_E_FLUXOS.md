# Mapa de Páginas, Rotas e Fluxos do Auê!

## Mapa operacional do corte, 23/11/2026

Base: commit `dc83657589294fb45e28f7b5753712044e709b08`, deploy do Firebase e código. Conferência em 23/11/2026; detalhes e limites em [Produção atual](../PRODUCAO_ATUAL.md).

| Rota | Código ativo com as flags do build de produção |
|---|---|
| `/` | `EntradaRaiz` → `EntradaDaArena` → `EntradaDueloIntegrado` + `ConteudoDaHome` e ranking |
| `/arena` | `EntradaDaArena`; `/arena/em-breve` tem tela própria |
| `/feed` | `EntradaInicial` → `InicioOpenDesign`, com Arena embutida quando ligada |
| `/seguindo` | `InicioOpenDesign` na visão seguindo |
| `/duelo` | `EntradaDueloIntegrado`, modo resposta |
| `/perfil`, `/u/:handle`, `/perfil/:handle` | `TelaPerfilOpenDesign` |
| `/grupos` | `TelaGrupos`; `/g/:slug` no React redireciona para `/grupos`, sujeito a páginas estáticas do Hosting |
| `/comunidades`, `/c/:slug`, `/c/:slug/t/:id`, `/topico/:id` | Redirecionam para `/` no React; Hosting pode responder antes do React |
| `/x1/:code`, `/b/:code`, `/d/:id` | Fluxos de compatibilidade distintos do duelo v2 |

Para confirmar uma alteração, confira `src/App.tsx`, `firebase.json` e o navegador.

> **Documento Canônico de Orientação de Telas e Componentes**  
> Autoridade: [`../../AGENTS.md`](../../AGENTS.md) | Design System: [`design-system/system/DESIGN.md`](design-system/system/DESIGN.md)

Este documento é a bússola oficial para evitar que qualquer desenvolvedor ou agente mexa em **páginas erradas**, **componentes legados** ou **fluxos descontinuados**. Ele descreve o código e suas rotas; o que está efetivamente publicado é registrado, com data e limite de prova, em [`../PRODUCAO_ATUAL.md`](../PRODUCAO_ATUAL.md).

---

## 1. Regra de Ouro Anti-Confusão: O Que Editar vs O Que NÃO Editar

O repositório passou pela evolução para a arquitetura **Auê 3.0 (OpenDesign)**. Para proteger a base de regressões, certos arquivos antigos foram preservados para compatibilidade de rotas e testes legados, mas **NÃO devem ser alterados para novas features**.

| Frente de Trabalho | ONDE EDITAR (Canônico Ativo) | ONDE NÃO EDITAR (Legado / Confinado) |
|---|---|---|
| **Tropa & Cards de Post** | [`src/features/novo-aue/CardDoPost.tsx`](../../src/features/novo-aue/CardDoPost.tsx) (com `CardDoPost.css` e `TokensDoCard.css`; variante `feed` ou `perfil`)<br>[`src/features/novo-aue/PlayerDoArroto.tsx`](../../src/features/novo-aue/PlayerDoArroto.tsx) (com `PlayerDoArroto.css`)<br>[`src/features/novo-aue/MenuDoPost.tsx`](../../src/features/novo-aue/MenuDoPost.tsx)<br>[`src/features/novo-aue/InicioOpenDesign.tsx`](../../src/features/novo-aue/InicioOpenDesign.tsx) | `src/features/comunidade/components/CardDeCauso.tsx`<br>`src/features/comunidade/components/HeaderSocial.tsx` |
| **Comentários & Thread de Conversa** | [`src/features/novo-aue/ThreadDeComentarios.tsx`](../../src/features/novo-aue/ThreadDeComentarios.tsx)<br>[`src/features/novo-aue/ModalComentarios.tsx`](../../src/features/novo-aue/ModalComentarios.tsx) | Não embutir árvore de comentários dentro de `CardDoPost` |
| **Compositor de Post / Gravação Rápida** | [`src/features/novo-aue/ModalCompositor.tsx`](../../src/features/novo-aue/ModalCompositor.tsx)<br>[`src/features/novo-aue/ModalGravarArroto.tsx`](../../src/features/novo-aue/ModalGravarArroto.tsx) | `src/features/comunidade/components/ComposerCauso.tsx`<br>`src/features/comunidade/ModalNovoCauso.tsx` |
| **Perfil de Jogador** | A tela é a view `perfil` de [`src/features/novo-aue/InicioOpenDesign.tsx`](../../src/features/novo-aue/InicioOpenDesign.tsx), com o cabeçalho e as abas definidos dentro de `InicioOpenDesign` e `casca.css`, [`FolhaDaFoto.tsx`](../../src/features/novo-aue/FolhaDaFoto.tsx) (troca de foto pelo avatar, `FolhaDaFoto.css`), [`BarraSuperior.tsx`](../../src/features/novo-aue/BarraSuperior.tsx) (`BarraSuperior.css`), `CardDoPost` (variante `perfil`) e `PlayerDoArroto`. [`TelaPerfilOpenDesign.tsx`](../../src/features/novo-aue/TelaPerfilOpenDesign.tsx) é só um invólucro de 32 linhas | `src/features/novo-aue/PerfilConectado.tsx` e `PerfilDoUsuario.tsx` com seus CSS (código morto: ninguém os importa nas rotas, conferido por `grep` em 23/11/2026). Não criar telas desconexas em `/perfil` |
| **Arena de Arroto (10 Estados)** | [`src/arena/Arena.tsx`](../../src/arena/Arena.tsx)<br>Faixas em [`src/arena/faixas/`](../../src/arena/faixas/)<br>Bolha em [`src/arena/bolha/`](../../src/arena/bolha/) | Telas avulsas de fluxo antigo em `src/features/audio/fluxo/` |
| **Páginas Públicas Institucionais & SEO** | [`src/features/publico/ComoJogar.tsx`](../../src/features/publico/ComoJogar.tsx)<br>[`src/features/publico/ComoArrotar.tsx`](../../src/features/publico/ComoArrotar.tsx)<br>[`src/features/publico/TiposDeArroto.tsx`](../../src/features/publico/TiposDeArroto.tsx)<br>[`src/features/publico/RankingDeArrotos.tsx`](../../src/features/publico/RankingDeArrotos.tsx)<br>[`src/features/grupos/TelaGrupos.tsx`](../../src/features/grupos/TelaGrupos.tsx) | Não substituir `MolduraPublica` → `CascaInformativaOpenDesign` por outra moldura ou impor tema claro fixo sem pedido explícito do Luiz |
| **Páginas Legais (Termos & Privacidade)** | [`src/features/legal/TermosDeUso.tsx`](../../src/features/legal/TermosDeUso.tsx)<br>[`src/features/legal/PoliticaDePrivacidade.tsx`](../../src/features/legal/PoliticaDePrivacidade.tsx) | - |
| **Painel Administrativo** | [`src/features/administracao/TelaAdministracao.tsx`](../../src/features/administracao/TelaAdministracao.tsx) | Não expor na navegação lateral pública |

---

## 2. Tabela Mestra de Rotas da Aplicação (`src/App.tsx`)

| Rota URL | Componente Renderizado | Status / Papel | Descrição e Comportamento |
|---|---|---|---|
| `/` | `InicioOpenDesign` | **CANÔNICO ATIVO** | Entrada da rede social (3 colunas desktop, webapp mobile). Mostra conversas em comunidades, busca e Rodas para explorar. |
| `/feed` | `EntradaInicial` → `InicioOpenDesign` | **ALIAS ATIVO** | Link antigo que usa a mesma entrada social canônica da raiz. |
| `/em-alta` | redireciona para `/` | **ALIAS** | Atalho antigo; cai na home. |
| `/seguindo` | `InicioOpenDesign` (`view="seguindo"`) | **CANÔNICO ATIVO** | Sua Tropa: feed exclusivo das pessoas seguidas por quem está conectado. |
| `/arena` e `/arena/em-breve` | `TelaArenaEmBreveOpenDesign` | **CANÔNICO ATIVO — EM BREVE** | A entrada mostra a indisponibilidade da Arena; não promete gravação, nota ou duelo ativos. |
| `/comunidades` | redireciona para `/` | **ALIAS (comunidades descontinuadas como rota)** | As views `comunidades` e `comunidade` existem dentro de `InicioOpenDesign` e só abrem por navegação interna; a URL não abre mais. Conferido em `App.tsx` em 23/11/2026. |
| `/c/:slug` | redireciona para `/` | **ALIAS** | Ver `/comunidades`. Não declarar a tela de tópicos como publicada sem evidência própria. |
| `/c/:slug/novo` | redireciona para `/` | **ALIAS** | Ver `/comunidades`. |
| `/c/:slug/t/:id` | redireciona para `/` | **ALIAS** | Ver `/comunidades`. |
| `/explorar` | redireciona para `/` | **ALIAS** | Ver `/comunidades`. `TelaExplorarOpenDesign` só abre por navegação interna. |
| `/desafios` | `EntradaDesafios` | **LEGADO ATIVO** | Renderiza telas da pasta `features/comunidade` (legadas). Não editar visual sem Cartão de Missão próprio; fora da missão 0057. |
| `/x1/:code` | `EntradaPorLink` (`Arena`) | **CANÔNICO ATIVO** | Desafio X1 direto por código curto. Abre a Arena pronta para ouvir e responder. |
| `/b/:code` | `EntradaPorLink` (`Arena`) | **ALIAS** | Atalho alternativo para desafio X1. |
| `/d/:id` | `ChallengeView` | **CANÔNICO ATIVO** | Visualização legada/direta de desafio por UUID longo. |
| `/perfil` | `EntradaPerfil` → `InicioOpenDesign` (view `perfil`) | **CANÔNICO ATIVO** | Perfil próprio da pessoa conectada (arrotos postados, nota média, vitórias no X1). |
| `/u/:handle` | `EntradaPerfilHandle` → `InicioOpenDesign` (view `perfil`) | **CANÔNICO ATIVO** | Perfil público de qualquer participante pelo `@handle`. |
| `/perfil/:handle` | `EntradaPerfilHandle` | **ALIAS ATIVO** | Compatibilidade para o perfil público por handle. |
| `/login` | `InicioOpenDesign` (`view="auth"`) | **CANÔNICO ATIVO** | Tela ágil de autenticação / criação de apelido social. |
| `/entrar` | redireciona para `/login` | **ALIAS** | Atalho de entrada. |
| `/redefinir-senha` | `TelaRedefinirSenha` | **ATIVO** | Recuperação de senha fora da tela de autenticação principal. |
| `/como-jogar` | `ComoJogar` | **CANÔNICO ATIVO** | Guia público indexável sobre comunidade e o que a Arena vai oferecer quando abrir. |
| `/en` | `HomeEn` | **CANÔNICO ATIVO** | Home em inglês, indexável, com `hreflang` recíproco com `/`. Copy adaptada ao público de língua inglesa, não traduzida; a Arena que ela linka continua em PT-BR. Mesma moldura e tokens de `/como-arrotar`. Entrada HTML: `paginas/en.html`. Missão 0056. |
| `/como-arrotar` | `ComoArrotar` | **CANÔNICO ATIVO** | Guia completo e indexável: oito técnicas passo a passo, seção que separa verdade de lenda dos truques de clickbait, aviso de saúde, quando procurar médico e fontes. Missão 0058. |
| `/tipos-de-arroto` | `TiposDeArroto` | **CANÔNICO ATIVO** | Guia dos estilos que a Arena pretende avaliar quando estiver disponível. |
| `/ranking-de-arrotos` | `RankingDeArrotos` | **CANÔNICO ATIVO** | Explica as faixas de nota previstas para a Arena; não declara recordes ativos. |
| `/ranking` | redireciona para `/ranking-de-arrotos` | **ALIAS** | Atalho para o ranking público. |
| `/videos-de-arroto` e `/videos` | redirecionam para `/` | **ALIAS** | Não renderizam `VideosDeArroto` nem levam à comunidade de vídeos (a rota `/c/arrotos-youtube` também cai na home). |
| `/grupos` | `TelaGrupos` | **CANÔNICO ATIVO** | Diretório de grupos externos no WhatsApp, Telegram e TikTok. |
| `/g/:slug` | redireciona para `/grupos` | **ALIAS** | Grupo externo que não tem página individual ativa. |
| `/privacidade` | `PoliticaDePrivacidade` | **CANÔNICO ATIVO** | Política formal de tratamento de dados e áudio. |
| `/termos` | `TermosDeUso` | **CANÔNICO ATIVO** | Regras de conduta, opt-in e responsabilidade na rede. |
| `/resenha/:id`, `/historia/:id` e `/conto/:id` | `EntradaHistoria` | **LEGADO ATIVO** | Renderiza `TelaHistoria` (pasta `features/comunidade`, legada). Fora da missão 0057. |
| `/comunidade`, `/bondes`, `/comm`, `/comunidade/:slug`, `/comunidades/:slug`, `/topico/:id` e `/t/:id` | redirecionam para `/` | **ALIAS** | Rotas de comunidade descontinuadas. |
| `/mobile` e `/versao-mobile` | redirecionam para `/` | **ALIAS** | Atalhos antigos. `/versoes` renderiza `TelaVersoesWebapp` (apoio). |
| `/admin` | `TelaAdministracao` | **CANÔNICO RESTRITO** | Painel interno seguro para aprovações e moderação (RPC autorizada). |
| `/landing` | `TelaLanding` | **CANÔNICO APOIO** | Mostruário da landing page. Hoje é **escura** (`contrato-visual.spec.ts` exige fundo `rgb(10, 11, 14)` e `color-scheme: dark`). |
| `/versoes` | `TelaVersoesWebapp` | **CANÔNICO APOIO** | Painel de visualização responsiva de breakpoints do webapp. |

---

## 4. Diretrizes Visuais Inegociáveis

### Família visual aprovada por rota

Decisão do Luiz em 22/10/2026: restaurar o visual anterior do login e das páginas informativas. Esta decisão substitui a orientação anterior que impunha tema claro fixo a toda rota pública. O protótipo `Páginas Públicas.dc.html` não autoriza converter a casca OpenDesign em uma landing independente.

| Rotas | Família e componentes ativos | O que preservar |
|---|---|---|
| `/`, `/feed`, `/seguindo`, perfis e comunidades | Casca social OpenDesign e componentes ativos da tabela de rotas | Tema da aplicação, navegação e tokens sociais; não transformar a raiz em landing. |
| `/login` | `InicioOpenDesign`, view `auth`, com `.app--auth` | Padrão anterior do app, wordmark e título em Anton, cores herdadas dos tokens sociais. Não editar `TelaLogin` legado nem forçar outra paleta no formulário. |
| `/como-jogar`, `/como-arrotar`, `/tipos-de-arroto`, `/ranking-de-arrotos`, `/grupos`, `/privacidade`, `/termos` | `MolduraPublica` → `CascaInformativaOpenDesign` | Navegação e moldura OpenDesign; tema herdado da aplicação; títulos em Anton e interface em Archivo. Uma rota pública não implica tema claro fixo. |
| `/landing` | `TelaLanding`, apoio | Visual escuro próprio da rota (fundo `rgb(10, 11, 14)`, `color-scheme: dark`), com suas próprias fontes e tokens, protegido por `contrato-visual.spec.ts`. Não aplicar essa exceção à raiz ou ao login. |
| `/videos-de-arroto`, `/videos` | Alias para `/` | Hoje caem na home; não reconstruir a página antiga de vídeos para satisfazer um protótipo ou teste. |

Pedidos de copy, testes ou toque não abrem mudança de tema, tipografia ou moldura. Qualquer mudança futura de família precisa de pedido explícito e comparação da mesma rota antes/depois no navegador. O contrato E2E protege essa separação; sua expectativa não deve ser alterada para aprovar um redesign não solicitado.

### Regras comuns

1. **Tipografia:**
   - **Anton:** reservada estritamente para wordmarks (`AUÊ!`), scores numéricos da Arena, badges de nota e destaques hero.
   - **Archivo:** para todo o corpo de texto, botões, cabeçalhos de posts, legendas e navegação.
   - **Família por rota:** login e páginas informativas mantêm o visual OpenDesign aprovado, sem exceção automática de tema claro. `/landing` mantém sua família própria de apoio (hoje escura). A tabela de famílias acima decide onde cada uma se aplica.
2. **Cores & Acentos:**
   - O verde elétrico (`--accent: #c6ff00`) é de alto contraste e deve ter no máximo **2 aparições por tela/estado** para não poluir a visão.
   - Sem gradientes falsos: fundos são sólidos e contrastantes.
3. **Ergonomia Mobile Webapp:**
   - Página travada na largura da tela: só rola na vertical. Listas horizontais rolam dentro do próprio container (`min-width: 0` na cadeia). Ver `DESIGN.md` §6.1.
   - Alvos de toque (touch targets) de no mínimo `44px × 44px`.
   - Respeito obrigatório a `env(safe-area-inset-bottom)` e `env(safe-area-inset-top)`.
4. **Sem cardificação:** card só para item repetível (post, X1, comunidade em grade) e moldura funcional (modal, sheet). Seção, ranking, filtro, métrica e formulário ficam chapados na superfície, separados por espaço e filete. Nada de card dentro de card. Ver `DESIGN.md` §4.1.
5. **Verdade de Dados:**
   - Proibido injetar números fictícios de seguidores, membros de grupo ou arrotos inventados.
6. **Imagens, Ilustrações e Ativos Estáticos (`public/`):**
   - **Ilustrações editoriais (`public/ilustracoes/`):** usadas em guias como `/como-arrotar` (`como-arrotar-comando-codex.png`, `como-arrotar-gas-codex.png`, `como-arrotar-postura-codex.png`). Devem seguir o mesmo estilo visual entre si (ilustração cartoon editorial flat, traço limpo, integrada ao fundo escuro `#0d0f14`), sem cara de foto genérica de IA, sem rostos reconhecíveis de pessoas reais e sem misturar estilos diferentes na mesma página.
   - **Comunidades (`public/comunidades/`):** ícones e capas das comunidades (`eu-arroto-e-dai`, `arrotos-do-youtube`, `grupos-whatsapp`) seguem identidade própria de cada hub.
   - **Ecossistema (`public/ecossistema/`):** selos dos projetos parceiros (`lagcheck`, `linka`, `signallq`) usados no rodapé/seção de ecossistema.
   - **Compartilhamento (`public/og-image.png`):** imagem padrão de Open Graph quando a rota não gera card dinâmico próprio.
   - Todo ativo visual publicado fica versionado em `public/`, sem depender de URL externa frágil.
