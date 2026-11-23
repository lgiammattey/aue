# Inventário de caixas (Missão 0057, Fase 1)

Feito pelo Rian em 23/11/2026. Exploração: nenhum código foi alterado. Regra de origem: [`DESIGN.md` §4.1](../design/design-system/system/DESIGN.md#41-card-é-exceção). Missão: [`.agents/missoes/0057-tirar-cards-das-telas.md`](../../.agents/missoes/0057-tirar-cards-das-telas.md).

Caixa = borda + `--surface`/`--aue-surface` + `border-radius` (ou equivalente). Decisão: `fica` (item repetível ou moldura funcional), `sai` (vira chapado: título, conteúdo, filete de 1px), `dúvida` (Luiz decide).

## Como foi medido

- **R** = vista renderizada no navegador (Chromium, 390px e 1440px, medindo estilo computado de cada elemento com borda/fundo/raio).
- **C** = só pelo código. Sem sessão e sem banco não renderizam: feed com posts, perfil preenchido, comentários, compositor, painel admin com dados, resultado e placar de X1.
- Dois ambientes: com as flags de produção do `publicar-firebase.yml` ligadas (`ARENA_EXPERIMENTAL`, `DUELO_PRIVADO`, `ADSTERRA`) e Supabase simulado (respostas vazias), e com as flags desligadas. Capturas só no scratchpad da sessão, nada versionado.
- Não contam como caixa: campo de formulário, botão, chip/pílula de botão, avatar, ícone, imagem. Esses mantêm borda. A mudança é só em contêiner de conteúdo.

## Achados que mudam o plano (ler antes da tabela)

1. **Tema claro não existe na prática hoje.** Com `data-theme="light"` (e `bda-theme`) nenhuma rota muda de cor; o CSS ativo é dark carbono e nenhum CSS ativo trata `data-theme`. O risco 1 da missão (caixa como único contraste no claro) não aparece em nenhuma tela que consegui abrir. Não consegui acionar nenhum toggle de tema pela UI; se existir, está fora do que vi. Luiz confirma se tema claro ainda é requisito.
2. **`/landing` está escura**, não clara. O E2E `e2e/contrato-visual.spec.ts:84-88` exige fundo `rgb(10, 11, 14)` e `color-scheme: dark` nela. O Mapa e a missão falam em "família clara". Avaliei só as caixas, como pedido.
3. **O Mapa não bate com `App.tsx`.** `/comunidades`, `/explorar`, `/c/:slug`, `/c/:slug/novo` e `/c/:slug/t/:id` redirecionam para `/` (App.tsx:200-211). As views `comunidades` e `comunidade` existem dentro de `InicioOpenDesign` e só abrem por navegação interna. `/desafios` e `/resenha/:id` renderizam `TelaComunidade` e `TelaHistoria` (pasta `features/comunidade`), que o Mapa lista como legado. Tratei essas telas como fora de escopo (regra da missão: nada de legado/zumbi).
4. **Código morto, não entra na execução:** `PerfilDoUsuario.tsx`/`.css` (ninguém importa, o Mapa diz que é a tela ativa), `PerfilConectado.css`, `forum.css` (o `features/forum` não está montado em rota), `TelaLogin.css`, `.od-comment`, `.od-comments__original`, `.od-profile__metrics`, `.inicio-open__visitante` (classes sem uso no TSX). Kayky não gasta tempo nelas.
5. **Em produção a home `/` já é chapada** (Liga, manual, tipos, CTAs sem caixa). A cardificação mora na casca social (`/feed`, `/seguindo`, perfil, coluna direita), nas páginas informativas, no login, no admin e na `/landing`.
6. **Conflito de CSS no perfil:** `perfilArena.css:38` achata o `.card-do-post` (borda 0, só filete embaixo) e `perfilArena.css:50` volta a encaixotar `.card-do-post--perfil` (borda, raio, fundo, `:hover` com `--surface-2`). Este último vence por especificidade. O post no perfil é hoje card; o `:38` é meia migração antiga.
7. **Duas camadas de caixa na casca:** `casca.css` (tokens `--aue-*`) e `appShell.css` (tokens `--surface`, camada `shell`) definem a mesma coisa (`.rightbar-bloco`, `.feed-filter`). Tirar a caixa exige mexer nos dois, senão volta pela outra camada.

## Tabela por rota

### A. `/` (home, flags de produção) [R]

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `ConteudoDaHome.tsx` com `conteudoDaHome.css:164` e `casca.css:1107`, classe `.adsterra-native-card` | Anúncio nativo (borda, fundo, raio) | dúvida | Parece item de feed (`card-post`), mas é anúncio. Se sair, perde a separação do anúncio para o conteúdo editorial, que é obrigação de rotular. Vazio sem anúncio no meu teste (104px com texto "PUBLI"). |

Resto da home (Arena, Liga `liga-hero`, manual, tipos, grupos) já é chapado. Nada a fazer. [R] 390 e 1440.

### B. `/feed`, `/seguindo` (Mural, casca social)

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `arenaV2.css:151` `.arena-v2--embutida .arena-v2__palco` (só `/feed` com flag) | Palco "Solta o arroto" com borda esquerda de 3px | sai | Já tem hierarquia por Anton + botão. O CTA "Gravar agora" é botão, fica. [R] |
| `InicioOpenDesign.tsx:2526` `.feed-filters` + `.feed-filter[aria-pressed]` (`appShell.css:309`) | Grupo de filtros Tudo/Arrotos com borda e item ativo com fundo | sai | Virar abas com sublinhado. Alvo de toque hoje 38px de altura (`appShell.css:~298`): subir para 44px na execução. [R] |
| `InicioOpenDesign.tsx:2609` `.hero` (`casca.css:709`) | Cabeçalho "Seguindo" com fundo e sombra | sai | Só aparece em `/seguindo`. [R] |
| `InicioOpenDesign.tsx:2615-2619` `.od-profile__state` (`perfilArena.css:10`) | Estados vazio/erro/pede login do Seguindo | sai | Reaproveita a classe do perfil, então muda junto com D. [R] |
| `CardDoPost.css:5` `.card-do-post` | Post/resenha | fica | Item repetível. `CardDoPost.css:433` `.action-btn__feedback` é balão de feedback, fica. [C] feed vazio no meu teste |
| `AdsterraNativeBanner` `.card-post.adsterra-native-card` (`casca.css:1107`) | Anúncio dentro do feed | dúvida | Mesma dúvida da A. |
| `BarraSuperior.tsx:69` `.topbar-notifications__panel` (`casca.css:551`) | Popover de marcações | fica | Popover. [C] |
| `BarraSuperior.css:93,101` botão de notificação e `.profile-mini` no mobile | Botões com borda | fica | Botão, não contêiner. 44px já tratado. |

### C. Compositor, comentários e modais (sobre `/`, `/feed`, `/perfil`) [C]

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `casca.css:1689` `.dialog` (ModalCompositor, ModalComentarios, etc.) | Modal | fica | Moldura funcional. O login usa a mesma classe (ver H); ao mexer em `.dialog` global, isolar o login. |
| `casca.css:1801` `.gravador-rapido` (`ModalGravarArroto.tsx:184`) | Sheet de gravação | fica | Sheet. |
| `casca.css:1943` `.gravador-direto` (`ModalGravarArroto.tsx:259`) | Faixa de gravação direta | dúvida | Está dentro de modal: se for card dentro de card, sai. Precisa ver aberta (exige microfone). |
| `FolhaDaFoto.css`, `ModalAjustarImagem.css:12` | Sheet e modal de foto | fica | Moldura funcional. `ModalAjustarImagem.css:87` `.od-image-crop__stage` é palco de corte, fica. |
| `InicioOpenDesign.css:1562` `.composer-audio-strip` (`ModalCompositor.tsx:399,420,424`) | Faixa de áudio dentro do modal | sai | Card dentro de card. Vira linha com filete. Manter 52px de altura mínima por causa do player. |
| `InicioOpenDesign.css:1549` `.composer-attachment-pill` (`ModalComentarios.tsx:392-418`) | Pílula de anexo | fica | Chip. |
| `InicioOpenDesign.css:1483` `.composer-image-preview` | Prévia de imagem | fica | Mídia. |
| `InicioOpenDesign.css:1912` `.thread-composer-box` (`ThreadDeComentarios.tsx:319`) | Formulário de resposta | sai | Formulário. Textarea e botão mantêm borda. |
| `InicioOpenDesign.css:1948` `.thread-reply-item` (`ThreadDeComentarios.tsx:548`) | Cada resposta | dúvida | É item repetível, mas dentro de um thread que é só conversa. No X a resposta é linha com filete. Recomendo `sai`. Luiz decide. |
| `PreviaDaConversa.tsx:58` `.conversation-preview` (`InicioOpenDesign.css:2060-2075`) | Respostas em prévia embaixo do post | fica | Só o avatar tem borda; contêiner já é chapado. |
| `InicioOpenDesign.css:1878` `.thread-back-btn` | Botão pílula | fica | Botão. |

### D. `/perfil`, `/u/:handle`, `/perfil/:handle` (view `perfil`)

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `InicioOpenDesign.tsx:2924-2975` `.od-profile__state` (`perfilArena.css:10`) | Estado vazio, erro, onboarding "Passo 1" (ficha) | sai | Onboarding contém formulário: `.od-profile__form` campos mantêm borda (`InicioOpenDesign.css:533`). [R] "Sua ficha ainda não está pronta" e "Esse @ não foi encontrado" em 390 e 1440. |
| `InicioOpenDesign.tsx:3046` `.od-profile__dashboard` (`perfilArena.css:21`, `InicioOpenDesign.css:656`) | Painel "Seu placar" | sai | Métricas. `e2e/perfil-resumo-notas.spec.ts:8` seleciona `.od-profile__dashboard` por classe: manter a classe, mudar só o estilo. [C] |
| `InicioOpenDesign.tsx:3052` `.od-profile__best` ×2 (`InicioOpenDesign.css:635`) | Melhor nota e Média, com fundo `--aue-surface-2` | sai | Card dentro de card hoje. Virar duas colunas separadas por filete vertical. Nota em Anton fica. [C] |
| `InicioOpenDesign.tsx:3092` `.od-profile__tabs-nav` (`InicioOpenDesign.css:678`) | Abas Arrotos/Posts com fundo e raio 16px | sai | Virar abas com sublinhado. Alvo 44px já definido no override (`perfilArena.css`, `tab-btn`). [C] |
| `InicioOpenDesign.tsx:3207` `.od-profile__record-cta` + `.od-profile__record-button` (`InicioOpenDesign.css:735`) | CTA "grave seu arroto" | sai | O botão circular fica. [C] |
| `InicioOpenDesign.tsx:3229` `.od-profile__post` (`InicioOpenDesign.css:743`, `perfilArena.css:35`) | Arrotos gravados da pessoa | fica | Item repetível. O override já deixa só filete embaixo; é o mesmo caso do post. [C] |
| `perfilArena.css:50` `.card-do-post--perfil` | Post no perfil | fica | Ver achado 6: decidir se fica box (`:50`) ou filete (`:38`). Recomendo manter card, é o post. Tem `:hover` com `--surface-2`, tem que cair junto se virar filete. |
| `InicioOpenDesign.css:672` `.od-profile .od-profile__activity` | Contêiner da lista | sai | Já zerado por `perfilArena.css` (border 0). Resíduo de regra morta. |
| `perfilArena.css:16`, `InicioOpenDesign.css:588` `.od-profile__avatar` | Avatar quadrado com borda de 2px | fica | Identidade, não contêiner. |
| `FolhaDaFoto`, `ModalEditarPerfil`, `ModalConexoes` | Modais e sheet | fica | Moldura funcional. |
| `perfilArena.css:28` `.od-profile__actions .join` | Botão Seguir/Desafiar | fica | Botão. |

### E. Comunidades (views `comunidades` e `comunidade` de `InicioOpenDesign`; rotas redirecionam para `/`) [C]

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `InicioOpenDesign.tsx:2871` `.od-groups__card` (`diretorioArena.css:33`, `InicioOpenDesign.css:196`) | Cartão de comunidade em grade | fica | Previsto no §4.1. `diretorioArena.css:33` e `InicioOpenDesign.css:196` divergem (raio 6px vs 22px, sombra): consolidar. |
| `InicioOpenDesign.tsx:2862` `.od-groups__head` (`InicioOpenDesign.css:128`) | Cabeçalho do diretório | sai | O override `diretorioArena.css` já zera (fundo transparente, sem sombra). Só a regra base é resíduo. |
| `InicioOpenDesign.css:180` `.od-groups__total`, `:310` `.od-groups__empty` | Total e estado vazio | sai | Já zerados pelo override. |
| `ListaDeTopicos.tsx:36` `.community-topic-list` (`InicioOpenDesign.css:347`) | Caixa única em volta da lista de tópicos | sai | Itens já separados por filete interno. Tirar só o contêiner. A thread de tópico "pauta" (`PautaDaComunidade.css`) é tipografia, só 11 linhas. |
| `InicioOpenDesign.tsx:2628,2632` `.panel` com `style={{padding:24}}` | Estados do tópico | sai | Inline style, trocar na marcação. |

### F. `/grupos`

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `TelaGrupos.css:17` `.grupos-arena article` | Grupo externo (WhatsApp, Telegram, TikTok) | fica | Item repetível de lista. Hoje vazio ("Nenhum grupo cadastrado ainda"), então o card não aparece. [R vazio] |
| `TelaGrupos.tsx` bloco vazio (div 920x65, raio 20, borda) | Estado vazio | sai | [R] |
| `LayoutArenaPublica.css:26` `.guia-arena__cta` | CTA "Chega de ler" | sai | [R] |

### G. `/ranking-de-arrotos` (e `/ranking`)

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `TopArrotadores.tsx:169` `.top-arrotadores` com `TopArrotadores.css:7` (variante `painel`) | Ranking em painel | sai | É o alvo nomeado da missão. Linhas de pessoa já têm separação interna. Avatar de 32px mantém borda. [R] |
| `TopArrotadores.tsx:85` `.top-arrotadores--faixa` (`TopArrotadores.css:194`) | Faixa mobile da home/mural | sai | Mesmo componente. Não aparece em produção na `/` porque a Liga virou `liga-hero`, já chapada. |
| `LayoutPublico.css:80` `.publico-cta` | CTA final | sai | [R] |
| `RankingDeArrotos` pílulas "Arena →" | Link com borda (`publico-pilula`) | fica | Botão/link, 44px ok. |

### H. `/login`, `/entrar`, `/redefinir-senha`

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `authArena.css:23` `.app--auth .auth-shell .dialog` (`InicioOpenDesign.tsx:3254`, base em `casca.css:1689`) | Formulário Entrar/Criar conta | sai | Formulário. **Teste assertivo:** `e2e/contrato-visual.spec.ts:46` exige `.app--auth .dialog` com fundo igual a `--aue-surface`. Só ajustar a expectativa com a aprovação do Luiz. [R] 390 e 1440 |
| `authArena.css:23` `.auth-arena-reset .auth-arena__form` (`/redefinir-senha`) | Formulário de nova senha | sai | Mesmo caso. [C] |
| `auth-social-soon__button` (X, TikTok "em breve") | Botão desabilitado | fica | Botão. E2E exige desabilitado e sem cortar aviso em 320px (`contrato-visual.spec.ts`, bloco "entradas sociais"). |
| `TelaLogin.css` | Login legado | fora | Código morto. |

### I. Páginas informativas e legais (`MolduraPublica` / `CascaInformativaOpenDesign`)

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `LayoutArenaPublica.css:19` `.guia-arena .publico-secao` ×4 (`/como-jogar`) | Cada seção do guia | sai | Seção de página. [R] 1440 |
| `LayoutArenaPublica.css:26` `.guia-arena__cta` (`/como-jogar`, `/como-arrotar`, `/en`, `/grupos`) | CTA final | sai | Aparece em 4 rotas. [R] |
| `ComoArrotar.css:81` `.como-arrotar-passo` (×3 em `/como-arrotar`, ×5 em `/en`) | Passo a passo | sai | Seção editorial. A home já mostra o mesmo conteúdo chapado (manual prático), então a regra só alinha. [R] |
| `ComoArrotar.css:148` `.como-arrotar-card` ×4 | Grade de dicas | dúvida | Grade de 2 colunas. Item repetível ou bloco editorial? Recomendo `sai` (são parágrafos). Imagens com borda e raio 12px (`img` 300x300): mídia, fica. [R] |
| `LayoutPublico.css:64` `.publico-cartao` (`CartoesPublicos`, `/tipos-de-arroto`) | Tipos de arroto em grade | dúvida | Lista de definições. Recomendo `sai`. [R] |
| `LayoutPublico.css:80` `.publico-cta` (`/tipos-de-arroto`, `/ranking-de-arrotos`) | CTA final | sai | [R] |
| `LayoutPublico.css:48` `.publico-bloco-lateral` | Bloco lateral | sai | Widget lateral. Não apareceu em nenhuma captura, só no CSS. |
| `/privacidade`, `/termos` (`LayoutLegal.css`) | Nenhuma caixa de conteúdo | fica | Já chapadas. Só o botão "Voltar ao Auê" tem borda. [R] |
| `publico-pilula-clara`/`accent` | Pílulas de link | fica | Botões, 44px. |

### J. `/admin` (restrito)

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `TelaAdministracao.css:17` `.admin-metrica` ×4 | Cartões de métrica | sai | Métrica. `e2e/administracao.spec.ts:27-42` mede geometria por classe (`.admin-metrica`, `.admin__bloco`): manter classes e nada de overflow. Sem sessão admin só consegui ver o estado de erro. [C] |
| `TelaAdministracao.css:24` `.admin__bloco` | Blocos do painel (gráfico, tabelas) | sai | [C] |
| `TelaAdministracao.css:~36` `.admin__periodos` | Seletor de período com borda | sai | Filtro. [C] |
| `TelaAdministracao.css:65` `.admin__state` | Estado de erro | sai | [R] 390 e 1440 (480x331). |
| `TelaAdministracao.css:43` `.admin-ranking li > div` | Pílula de barra | fica | Barra de métrica, 999px. |

### K. Arena, X1, duelo e resultado

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `arena.css:18` `.arena` (`Arena.tsx`, em `/x1/:code`, `/b/:code`, `/d/:id`), 440px, raio 32px, borda | Moldura da Arena no desktop | dúvida | `--radius-shell` 32px existe no §4 como "moldura no desktop quando aplicável". No mobile some. Recomendo `fica`. [R] 1440 em `/x1/abc123` |
| `arena.css:1148` `.sobreposicao-caixa` | Overlay da Arena | fica | Modal. [C] |
| `arena.css:1584` `.placar-linha` (`PlacarDoX1.tsx`) | Linha do placar X1 | fica | Resultado de X1 é item previsto no §4.1. [C] |
| `arena.css:945` `.origem` | Opções de origem do arroto | dúvida | Alternativas clicáveis (tiles). Perder a caixa pode matar a affordance e o toque de 44px (min 72px hoje). [C] |
| `arena.css:1215` `.link-linha` | Link do desafio com copiar | dúvida | Campo de copiar: controle, não seção. Recomendo `fica`. [C] |
| `arena.css:1945` `.podio-posicao`, `:1989` `.botao-secundario` | Bolinha de posição e botão | fica | Controle/marcador. |
| `dueloV2.css:22` `.duelo-v2 fieldset` | Grupo de opções do duelo | sai | Formulário. `dueloV2.css:10` `.duelo-v2 button` e inputs ficam. `/duelo` só mostra "Voltar" sem sessão. [C] |
| `dueloV2.css:23` `.duelo-v2 dl` | Placar de dois lados | fica | Resultado de X1. Hoje já separado por filete interno. [C] |
| `dueloV2.css:33` `.duelo-v2__previa` | Prévia do link/arroto | dúvida | Pode ser só texto com filete. [C] |
| `cartao.css` / `CartaoDaImagem.tsx` | Card de compartilhamento 9:12 | fica | Imagem de exportação. Não mexer. |
| `TelaArenaEmBreveOpenDesign.css:11` `.od-arena-coming__hero` | Hero "Aqui o arroto vira jogo" | sai | Só aparece com flag `arenaV2` desligada (em produção `/arena` é a Arena v2, já chapada). [R] |
| `TelaArenaEmBreveOpenDesign.css:74` `.od-arena-coming__steps li` ×3 | Passos "grava, nota, X1" | sai | Lista de passos. [R] |
| `arenaV2.css`, `ArenaV2`, tela de resultado v2 | Nenhuma caixa | fica | Já chapada. |

### L. `/landing`

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `TelaLanding.css:78` `.landing-previa` | Exemplo de post (Eu arroto, e daí?) | fica | É amostra de um post. Se a landing vender "timeline", ela deveria seguir o §4.1 para post: card. [R] |
| `TelaLanding.css:128` `.landing-audio` (dentro da prévia) | Pílula de áudio "em breve" | dúvida | Card dentro de card se a prévia fica. Recomendo tirar o fundo da pílula. [R] |
| `TelaLanding.css:177` `.landing-cartao` | Formulário Entrar/Criar | sai | Formulário. [R] 390 e 1440 |
| `TelaLanding.css:189` `.landing-abas` | Abas Entrar/Criar em pílula | sai | Filtro/abas. [R] |
| `TelaLanding.css:262` `.landing-passos` | Faixa "Ache sua turma" com fundo e filetes | sai | Seção. Full-bleed, fica só com filetes. [R] |
| Faixa final "A Arena está chegando" | Bloco com fundo `--surface` | sai | Sem borda e sem raio, é só faixa de fundo. [R] |
| `landing-avatar`, `publico-campo`, `publico-pilula` | Avatar, inputs, botões | fica | Controles. |

### M. Casca compartilhada (sidebar, topbar, coluna direita; aparece em `/feed`, `/seguindo`, perfil, informativas, ranking)

Consertar uma vez resolve todas as rotas. Em 1440 aparecem em quase toda tela; em 390 a coluna direita some (só `topbar` e barra inferior).

| Componente (arquivo:linha) | Caixa | Decisão | Risco / observação |
|---|---|---|---|
| `TopArrotadoresDaHome` na `PainelDireito.tsx:89` (`TopArrotadores.css:7`) | Widget "Top 5 Top arrotadores" | sai | Ver G. [R] |
| `PainelDireito.tsx:97` `.rightbar-bloco` "No Zap, Grupos" (`appShell.css:351`) | Widget de grupos | sai | §4.1 manda título + linhas com filete. [R] |
| `VitrineDeApps.tsx:136` `.vitrine-apps` (`casca.css:109`) com QR de 54px e logo | Anúncio da vitrine própria | dúvida | Widget lateral: pelo §4.1 sai. Mas é propaganda de parceiro e a caixa marca o limite entre anúncio e conteúdo. `SlotPatrocinadoDoFeed.test.tsx:61` só procura a classe `.vitrine-apps--sidebar`. [R] |
| `SlotPatrocinadoDoFeed.tsx:21` `.panel.adsterra-smartlink-panel` (`casca.css:1590`) | Slot patrocinado | dúvida | Mesma dúvida de anúncio. [R] |
| `PainelDireito.tsx` `.rightbar-account` (`casca.css:1246`) | Cabeçalho da conta, fundo `--aue-surface` com sombra | sai | Cabeçalho de perfil/conta. [C] |
| `PainelDireito.tsx:69` `.rightbar-account__menu` (`casca.css:1337`) | Menu da conta | fica | Popover. |
| `casca.css:463` `.topbar-search` | Campo de busca | fica | Campo. |
| `BarraLateral` `.nav-item.active` (fundo, raio 8px) | Item ativo do menu | fica | Estado de navegação, não card. |
| `casca.css:1014`, `:709`, `:1590` `.post`, `.hero`, `.panel` | Classes legadas da casca | sai | Sobram só onde o JSX ainda as usa (hero em `/seguindo`, panel nos slots). |

## Contagem por rota

Contada por script sobre a coluna Decisão das tabelas acima. Linha com vários elementos conta uma vez.

| Rota | fica | sai | dúvida |
|---|---|---|---|
| A. `/` | 0 | 0 | 1 |
| B. `/feed`, `/seguindo` | 3 | 4 | 1 |
| C. Compositor, comentários, modais | 7 | 2 | 2 |
| D. `/perfil`, `/u/:handle` | 5 | 6 | 0 |
| E. Comunidades (views internas) | 1 | 4 | 0 |
| F. `/grupos` | 1 | 2 | 0 |
| G. `/ranking-de-arrotos` | 1 | 3 | 0 |
| H. `/login`, `/redefinir-senha` | 1 | 2 | 0 |
| I. Informativas e legais | 2 | 5 | 2 |
| J. `/admin` | 1 | 4 | 0 |
| K. Arena, X1, duelo, resultado | 6 | 3 | 4 |
| L. `/landing` | 2 | 4 | 1 |
| M. Casca compartilhada | 3 | 4 | 2 |

## Ordem sugerida de execução (menor risco primeiro)

1. **M, casca compartilhada (coluna direita: Top 5, Grupos Zap):** uma regra, vale em todas as rotas. Sem teste que asserte estilo. Anúncios (`vitrine-apps`, smartlink) ficam de fora até o Luiz decidir.
2. **I, informativas (`como-jogar`, `como-arrotar`, `tipos-de-arroto`, `en`):** só CSS, nenhum teste assertivo, a home já mostra a versão chapada do mesmo conteúdo.
3. **G, `/ranking-de-arrotos`:** sai junto com M (mesmo componente).
4. **J, `/admin`:** só CSS; E2E mede geometria por classe, então manter classes e conferir overflow em 390px.
5. **B, `/feed` e `/seguindo`:** filtros (virar abas, tocar 44px) e palco da Arena. Cuidado com as duas camadas (`casca.css` e `appShell.css`).
6. **D, `/perfil`:** mais blocos e um conflito de CSS a decidir (achado 6). Sem sessão, só dá para ver estados vazios, então precisa de dados reais para o antes/depois.
7. **E, comunidades e tópicos, e C, compositor e thread:** exigem sessão e fluxo aberto para verificar; dúvida do thread-reply.
8. **L, `/landing`:** pedido do Luiz, mas ela tem família própria e a dúvida do mock de post.
9. **H, login:** mexe em `.dialog` global e quebra `contrato-visual.spec.ts:46`. Fazer por último dentro do escopo, com a expectativa ajustada e aprovada.
10. **K, Arena/X1/duelo:** só o `fieldset` e as dúvidas, depois da decisão do Luiz. Card 9:12 e placar não se tocam.

## Dúvidas para o Luiz

1. **Anúncios** (`vitrine-apps`, painel patrocinado, card nativo do feed e da home): saem como widget lateral ou ficam com caixa para o leitor saber que é propaganda?
2. **Resposta em thread** (`thread-reply-item`): linha com filete como no X, ou card? Rian recomenda filete.
3. **Grade de dicas e tipos de arroto** (`como-arrotar-card`, `publico-cartao`): são itens repetíveis ou texto de seção? Rian recomenda texto de seção (sai).
4. **Moldura da Arena em `/x1`** (440px, raio 32px, só desktop): fica como moldura funcional?
5. **Tiles de origem e linha do link do desafio** (`.origem`, `.link-linha`): ficam, por serem controles?
6. **Post no perfil** (`card-do-post--perfil`): fica card como no Mural, ou vira filete como o `perfilArena.css:38` já tentou?
7. **Tema claro:** ainda é requisito? Hoje nenhuma rota responde a ele.
8. **Login e `/landing`:** formulário sai da caixa mesmo com E2E que cobra o fundo? Autoriza ajustar o `contrato-visual.spec.ts:46`?
9. **`/desafios` e `/resenha/:id`** ainda renderizam telas legadas (`features/comunidade`) com caixas próprias. Ficam fora da missão ou entram numa faixa à parte?
10. **Mapa de telas:** autoriza o Tiago a corrigir o Mapa (rotas de comunidade que redirecionam, `PerfilDoUsuario` morto, landing escura)?
