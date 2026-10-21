# Cartão de Missão 0030 — Perfil igual ao print do Luiz (Fase A: visual)

Aberto em 21/10/2026. Insumos: print mobile do perfil `giamz` enviado pelo Luiz e plano aprovado por ele (`avalie-a-tela-de-vivid-shamir.md`, com a tabela print x código). O print não é protótipo canônico; só vira referência depois que o Rian o transportar para `docs/design/prototipo/`. Pista reaberta em 21/10/2026 após as respostas do Luiz (ver seção 1 e as decisões no fim).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o perfil de hoje parece uma ficha: capa grande, métricas em grade, posts como link solto. O Luiz quer o perfil com cara de rede social que a pessoa já conhece (Twitter): avatar e nome no topo, três números, abas, e cada post como card com player de arroto. Ele mandou o print como meta.
- **Comportamento esperado na tela (`/perfil` e `/u/:handle`, mobile primeiro):**
  - Topo da página: logo `AUÊ!` e busca com o texto "Buscar pessoas, rodas e posts". Sem botão de chat.
  - Cabeçalho do perfil: sem capa no mobile; avatar redondo à esquerda, nome em destaque, `@handle` em cinza. Sem bolinha de online.
  - Dono vê "Editar perfil" (contorno, com lápis) e um botão quadrado só com o ícone de compartilhar. Visitante vê Seguir no lugar de Editar (comportamento atual preservado) e o mesmo botão de compartilhar.
  - Três números centralizados: Posts, Seguidores, Seguindo. Seguidores e Seguindo continuam abrindo a lista de conexões.
  - Abas com sublinhado verde, sem contador ao lado do rótulo. Fase A entrega **Posts, Arrotos e Salvos** (Salvos só para o dono, como hoje). A aba Curtidas **não aparece** na Fase A.
  - Aba Posts: cada post no `CardDoPost` canônico (avatar, nome, `@handle · tempo`, menu `⋯` no canto, `r/roda` em linha própria, texto, player, ações). Player com forma de onda cinza, só a duração e o ícone de ondas.
  - Bio, cidade, "na roda desde" e redes sociais **ficam na tela** (decisão do Luiz), mas o print não mostra onde. O Rian desenha o lugar sem quebrar o cabeçalho 1:1. Hipótese a avaliar: linha compacta de cidade e "na roda desde" abaixo do `@handle`, bio em até duas linhas com "ver mais", redes em fila de ícones de 44px. Campo vazio não ocupa espaço nem mostra texto de enchimento.
  - Capa some no mobile. No desktop o Rian decide (manter, reduzir ou tirar).
- **O que a Fase A entrega no lugar de Curtidas:** nada de aba, nada de número. Os dois estados do dono e do visitante são: Posts, Arrotos (e Salvos para o dono). A prova da ausência é um teste: a aba Curtidas não existe no DOM e nenhum "0" de curtidas aparece fora do `CardDoPost`. O coração do card só aparece se já estiver ligado à porta real (`alternarCurtida` / `curtidoPorMim` já existem). Se não estiver ligado hoje, fica ausente, não desabilitado com número. A Fase B (aba Curtidas, privada, só do dono) abre outro cartão.
- **Fora de escopo (Não vira):** botão ou tela de chat; indicador de online; aba Curtidas funcional ou RPC de curtidos; XP, ranking, selo e contagem sem fonte; reações emoji dentro do card no perfil (esconder, salvo se o Rian provar o contrário); editar `PerfilConectado.tsx/.css` (ver risco 4); tocar em `CardDeCauso` e `HeaderSocial` (legados); mexer em `casca.css` além da regra do item ativo da barra inferior e do ajuste do FAB, e nunca sem rodar `casca.layout.test.ts` antes e depois; renomear slug ou contrato de dados.
- **Pista (Lane), reaberta em 21/10/2026:** **Full flow comum, com Gate leve do Camillo sobre o `CardDoPost` e a barra inferior, por escrito, antes de o Kayky abrir código.** Gatilhos de escalada para sistêmica abaixo, já atualizados.
- **Por que esta pista:** é tela nova dentro de módulos e contratos existentes. Os dados já saem de `listarFeed({ autorId })`, `arrotosDoPerfil` e `SalvosDoPerfil`. Nenhuma porta, RPC, migração ou modelo de áudio muda.
- **Reabertura da pista (21/10/2026):** o Luiz decidiu que o feed e as comunidades herdam o card novo. Isso dispara o gatilho (c) do texto original: o diff do card passa a decidir o visual de várias telas. Peso da decisão, em ordem:
  1. Não há dado, API, porta, migração nem modelo de áudio novos. A mudança é de apresentação e de props. Isso é o que separa sistêmica de comum no AGENTS.md §3.
  2. O estrago possível é visual e alcança três telas (feed, Seguindo, comunidade) mais a thread de comentários. É risco de regressão, não risco de arquitetura.
  3. O CSS de layout do card não existe hoje (risco 2). Escrever esse CSS do zero é mudança grande de superfície, e por isso não dá para tratar como Fast lane nem dispensar o Camillo.
  4. A barra inferior (`casca.css`, item ativo em `--fg`) vale para todas as telas e para a barra lateral do desktop, que divide a regra `.nav-item.active` (linha 192). Também é apresentação, mas sem teste de layout rodado vira regressão silenciosa.
  
  Decisão: **não sobe para sistêmica agora.** Fica em full flow comum, e o Gate do Camillo deixa de ser "leitura rápida de diff" e vira passo obrigatório e escrito, com os critérios abaixo. Camillo entrega uma nota curta neste cartão (aprovado, aprovado com condição ou barrado) antes de o Kayky abrir branch. Sem a nota, o Iury não libera.
- **O que o Camillo confere no Gate leve (todos por leitura de código, sem implementar):**
  1. **Contrato de props.** Toda prop nova do `CardDoPost` é opcional e o padrão não muda o que o chamador já recebe. `tsc` em modo estrito passa sem editar nenhum dos quatro chamadores só para compilar. Se algum chamador precisar mudar para a tela não regredir, ele entra na lista e o Camillo diz qual.
  2. **Os quatro chamadores**, um por um: `InicioOpenDesign.tsx` ~1680 (feed), ~1721 (Seguindo), ~1909 (comunidade) e `ThreadDeComentarios.tsx` ~258 (post-raiz da thread). Para cada um: quais props passa hoje, quais o design novo exige, o que cai em padrão. A thread de comentários é a mais fácil de esquecer: ela herda o card e não estava na lista de telas do cartão original.
  3. **CSS de layout inexistente.** Confirmar por busca que `feed-post`, `post-avatar-col`, `post-main-content`, `post-meta-header`, `post-meta-ident`, `badge-comunidade` e `card-do-post` seguem sem regra em `src/**/*.css`, e dizer onde o CSS novo vive (um arquivo do card, não `casca.css`) e como fica isolado do bloco legado `.post-body` (`casca.css:467`) para o card legado `CardDeCauso` não mexer junto.
  4. **Impacto no feed e nas comunidades.** Lista do que muda de verdade nas três telas e do que não pode mudar (composer, filtros, comentários inline, reações emoji do feed, menu `⋯`). Reações emoji: o cartão manda esconder no perfil; o Camillo diz se isso é prop opcional ou se o feed perde as reações sem querer.
  5. **`PlayerDoArroto` e `MenuDoPost`.** São usados fora do card? Se o player for usado por outra tela (thread, tela de resultado), mudar onda, duração em sans e ícone de ondas é mudança nessas telas também. Entra na lista de regressão.
  6. **Áudio.** Um player por vez continua valendo; nenhum `Audio`, `MediaRecorder` ou `AudioContext` sai de `src/plataforma/`. Sem exceção de fronteira.
  7. **Barra inferior.** A regra `.nav-item.active` (linha 192) atinge só a barra inferior ou também a lateral do desktop? Qual é o seletor mais estreito que cumpre a decisão do Luiz sem mexer em outra coisa. `casca.layout.test.ts` roda antes (base verde) e depois.
  8. **Tamanho do diff.** Se o CSS do card passar de um bloco coeso e começar a precisar de token novo no design system, ou se mexer em mais de um módulo de rota, o Camillo barra e o cartão sobe.
- **Gatilhos de escalada para sistêmica (revistos em 21/10/2026).** O gatilho (c) original já aconteceu e foi absorvido pelo Gate leve acima. Continuam valendo (a) e (b), e entram dois novos. Se qualquer um acontecer, o Iury para, devolve ao Tiago e eu reabro a pista:
  - (a) o contrato de props do `CardDoPost` mudar de forma que quebre um chamador existente;
  - (b) precisar de campo novo na porta de comunidade, de feed ou de perfil;
  - (d) o `PlayerDoArroto` ou o `MenuDoPost` ter de mudar de contrato porque outra tela os usa;
  - (e) o Camillo achar, no Gate, que a regra do item ativo da barra inferior não dá para fazer sem mexer na estrutura da casca (grade, FAB, rotas), e não só em cor.
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md`, `docs/technical/adr/0010-comunidades-topicos-e-respostas.md`, `docs/design/forum-comunidades.md`, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`, `docs/design/prototipo/Bonde do Arroto.dc.html` (nome de arquivo legado de `Tropa do Arroto`) e `docs/design/design-system/system/DESIGN.md`. Não mexe em `ARENA.md`, `REGRAS.md` nem `VISAO.md`.

### Antes do código: escopo e ADR (decisão do Luiz já tomada)

O Luiz decidiu que o print vence sobre a decisão de 19/10 (#251), que tirava curtida e post avulso do produto. A decisão está tomada; falta o texto dos documentos refletir, **antes do primeiro commit de código**. Textos exatos:

1. `docs/escopo/ESCOPO_ATUAL.md`, bloco "Direção decidida em 19/10/2026" (linhas 136-141) e "Complemento decidido pelo Luiz em 20/10/2026" (linhas 145-147, frase "não existe uma segunda ação de 'postar direto no feed'"). Acrescentar logo depois um bloco novo: "Exceção decidida pelo Luiz em 21/10/2026: o perfil lista os posts da pessoa em card com player, ações e curtida, como no print do perfil `giamz`; a aba Curtidas existe só para o próprio dono e entra na Fase B. Isso vale para a tela de perfil e não reabre o feed solto nem o composer avulso." Conferir também a linha 194 (mensagens privadas): continua fora, sem mudança.
2. `docs/technical/adr/0010-comunidades-topicos-e-respostas.md`: rota `/u/:handle  perfil: tópicos iniciados e respostas` (linha 61) passa a "perfil: posts, arrotos e salvos (curtidas só do dono, Fase B)"; incluir no cabeçalho de status uma nota "Exceção do Luiz, 21/10/2026: perfil e curtida no perfil" e registrar que o ADR **não** cai por isso, vale a exceção. O texto de decisão (linhas 20 e 156, "causo avulso") não muda. O ADR só cai com outro ADR (AGENTS.md §2); se o Camillo entender que a exceção contradiz o corpo do ADR 0010, ele escreve o ADR novo na Fase B, quando a curtida precisar de banco.
3. `docs/design/forum-comunidades.md`: §12.1 (linhas 784-789, "Passam a ser duas: Tópicos e Respostas. Curtidas não existem mais e Com áudio sai do perfil") e §2.3 (linha 73) e §14.3 (linha 887) ganham a anotação "superado para o perfil pela exceção de 21/10/2026". O restante do fórum fica como está.
4. `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`: linha 20 lista `PerfilConectado.tsx` como componente de Perfil de Jogador. Só o teste o importa. O Marcelo confirma por `grep` e o mapa passa a apontar a view `perfil` de `InicioOpenDesign.tsx` (a `TelaPerfilOpenDesign.tsx` é um invólucro de 32 linhas).

Quem escreve esses textos: Tiago redige, Luiz aprova a redação, Rian cuida do protótipo. Nada disso é feito por mim neste cartão.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Uma entrega por vez; a Fase B não abre enquanto a A não tiver veredito.
- **Responsável pela implementação:** Kayky (view `perfil` em `InicioOpenDesign.tsx` e `.css`, `CardDoPost`, `PlayerDoArroto`, `BarraSuperior`).
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Gate arquitetural completo não se aplica na Fase A. Desde 21/10/2026 o **Camillo faz o Gate leve, escrito, do `CardDoPost` e da barra inferior** (critérios na seção 1), antes de o Kayky abrir código. Lucas fica de fora. O Gate completo continua pendente na Fase B.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver o fim deste cartão.

### Sequência

1. **Iury** recebe o cartão, confere a mesa e libera o Rian.
2. **Rian** especifica e atualiza o protótipo canônico antes de qualquer código: perfil mobile com o print como alvo, lugar de bio/cidade/redes/"na roda desde", destino da "Melhor nota", capa no desktop, orçamento de verde, estado da aba Curtidas marcada como Fase B, medidas calibradas com a largura real do aparelho do print. O print vem em 607px de largura, com moldura do aparelho; em 390px o fator é cerca de 0,64. Avatar fica perto de 58-65px, não 92 nem 78.
3. **Camillo** faz o Gate leve (seção 1) e escreve a nota no cartão. Sem a nota, o Kayky não abre branch.
4. **PR #329** (documentos e protótipo) é mergeado **antes do código**, mas só depois do "pode" explícito do Luiz, do CI verde e do aceite visual do Rian real sobre o protótipo (o protótipo atual é rascunho feito pelo Iury).
5. **Kayky** só abre código com este cartão, o desenho do Rian, a nota do Camillo e o contrato pronto. Implementa mobile primeiro (`min-width` sobe para desktop). Ordem: card e player primeiro, perfil depois, barra inferior por último, cada passo com os testes do passo rodando.
6. **Rian + Marcelo** validam: Rian com a tela aberta ao lado do print; Marcelo com testes e Playwright, incluindo a regressão de feed, comunidades e barra inferior.
7. **Iury** consolida com evidência; **Tiago** passa pelas 7 perguntas e dá o veredito.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** webapp mobile (Safari iOS / Chrome Android), desktop, documentação.
- **Estados obrigatórios do perfil:** carregando, perfil próprio, perfil de terceiro, perfil inexistente, perfil sem posts, sem arrotos, sem salvos, erro de leitura com "Tentar de novo", rede fora, e aba aberta por URL. Estados da Arena não mudam.
- **Maior risco de quebra ou mentira visual:**
  1. `CardDoPost` é compartilhado: mexer nele muda feed e comunidades sem aviso.
  2. O CSS de layout do card (`feed-post`, `post-avatar-col`, `post-main-content`, `post-meta-header`, `post-meta-ident`, `badge-comunidade`) hoje não existe; o card herda um bloco legado (`.post-body` em `casca.css:467`). Antes de escrever, abrir o card no navegador e ver como renderiza hoje.
  3. Verde: o print tem aba ativa, play, ícone de ondas, ARROTAR e item Perfil da barra, mais a bolinha de online. A regra é no máximo 2 por estado (DESIGN.md §2.3). **Decidido pelo Luiz em 21/10/2026 (opção A):** verde só na aba ativa e no ARROTAR; play em `--fg`, ondas em muted, bolinha fora, item ativo da barra inferior em `--fg` em todas as telas. O risco que sobra é o efeito da barra inferior nas outras telas (ver item 20 da matriz).
  4. `PerfilConectado.tsx` aparece no mapa como componente a editar, mas parece código morto. Editar o arquivo errado seria entregar nada.
  5. Perda de função sem querer: bio, cidade, redes, "Melhor nota" e "Trocar capa/Remover" sumirem por falta de lugar no layout.
  6. "Sambar" no mobile: pulo de layout quando avatar, números e player carregam, e rolagem presa atrás da barra inferior.
  7. Regressão fora do perfil: o card novo e a barra inferior mudam feed, Seguindo, comunidades e thread de comentários. É o risco que o Gate leve do Camillo e os itens 8, 20 e 21 da matriz cobrem.
  8. Medida sem aparelho: o iPhone 17 (402x874, Safari) é o aparelho confirmado. O Motorola G67 (412x915, Chrome Android) é **premissa não confirmada**. Qualquer medida calibrada em 412x915 vale como premissa até o Luiz confirmar o modelo real.
- **Limite da promessa:** a tela mostra só o que existe: posts, arrotos e salvos reais, contagens vindas do servidor. Sem presença online, sem chat, sem curtidos listados. Curtida do card só se a porta real responde; se falhar, o erro aparece como erro.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Ambientes: Código/Teste = `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e testes de componente. Chromium = Playwright. Aparelho = Safari iOS e Chrome Android reais (Chromium não prova Safari; o que ficar só em Chromium sai marcado como não validado em aparelho).

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| 1 | Protótipo canônico atualizado com o perfil do print, e a tela aberta ao lado do print sem diferença material de geometria, tipo e ordem dos blocos (mobile 390). Sem isso não há aceite visual | Rian | Chromium + print lado a lado | pendente |
| 2 | Cabeçalho: sem capa no mobile, avatar redondo à esquerda, nome e `@handle`, "Editar perfil" com lápis e botão só-ícone de compartilhar com `aria-label="Compartilhar"`. Sem botão de chat e sem bolinha online. Visitante: "Seguir" em estilo neutro (sem verde), mesmo botão de compartilhar | Rian / Marcelo | Teste + Chromium | pendente |
| 3 | Três números centralizados (Posts, Seguidores, Seguindo), em colunas iguais, com números tabulares (`font-variant-numeric: tabular-nums`). Seguidores e Seguindo abrem a lista de conexões com alvo >= 44px | Marcelo | Teste + Chromium | pendente |
| 4 | Abas: Posts e Arrotos para todos, Salvos só para o dono, sublinhado verde, sem contador no rótulo. Aba Curtidas ausente do DOM. Semântica de aba (`tablist`, setas, Home, End) e aba na URL preservadas | Marcelo | Teste | pendente |
| 5 | Nenhum número de curtida inventado: o "0" do card vem da porta; coração só aparece se estiver ligado ao dado real | Marcelo | Teste + código | pendente |
| 6 | Bio, cidade, "na roda desde" e redes sociais continuam visíveis para quem tem o dado, no lugar que o Rian desenhou. Os testes de redes sociais (`TelaPerfilOpenDesign.test.tsx`, a partir da linha 224) continuam passando. Campo vazio não gera linha vazia nem texto de enchimento | Marcelo / Rian | Teste + Chromium | pendente |
| 7 | Aba Posts renderiza `CardDoPost` com `@handle · tempo`, `r/roda` em linha própria, `⋯` no canto (apagar no perfil do dono, denunciar no de outra pessoa), player com onda cinza (muted), play em `--fg`, ondas em muted, **duração em sans**, altura do player fixa em 44 | Rian / Marcelo | Teste + Chromium | pendente |
| 8 | O card novo vale para feed, Seguindo, comunidade e thread de comentários (decisão do Luiz, 21/10/2026): **as quatro telas ganham o mesmo card, e nada além do que o protótipo canônico mostra muda nelas**. Composer, filtros, comentários inline e reações do feed seguem funcionando. `CardDoPost.test.tsx`, `PlayerDoArroto.test.tsx`, `MenuDoPost.test.tsx`, `InicioOpenDesign.test.tsx` e o teste da thread passam; captura antes e depois sem diferença não prevista | Marcelo | Teste + Chromium | pendente |
| 9 | Viewports de 320, 360, 390 e 430 de largura, depois 768 e 1280; mais 402 (iPhone 17) e 412 (Moto G67, premissa). Sem rolagem horizontal, sem texto cortado, sem sobreposição, nome e `@handle` longos quebram ou cortam com reticências sem empurrar os botões | Marcelo | Chromium; 402 em Safari iOS e 412 em Chrome Android só contam em aparelho real | pendente |
| 10 | Altura de tela: uso de `dvh`/`svh` onde a altura da tela importa, sem `100vh` que salta quando a barra do navegador some. Safe area com `env(safe-area-inset-*)` no topo e na barra inferior | Kayky / Marcelo | Código + aparelho | pendente |
| 11 | Alvos de toque >= 44x44px: compartilhar, editar, abas, seguidores, seguindo, `⋯`, play, ações do card, redes sociais. Medido por script no Playwright | Marcelo | Chromium | pendente |
| 12 | Sem layout shift no carregamento: altura reservada para avatar, números, abas e player antes do dado chegar; CLS medido no Playwright fica em 0 (ou abaixo de 0,02, com justificativa escrita se passar de 0) | Marcelo | Chromium | pendente |
| 13 | Rolagem de app nativo: `overscroll-behavior` tratado, última lista rola até o fim sem ficar atrás da barra inferior, sem rolagem aninhada travada, sem jitter ao subir e descer a lista | Marcelo | Chromium + aparelho | pendente |
| 14 | Toque: `-webkit-tap-highlight-color` tratado e `touch-action: manipulation` nos controles, para não haver zoom por toque duplo nem atraso. Nada de `maximum-scale` que bloqueie o zoom da pessoa | Kayky / Marcelo | Código + aparelho | pendente |
| 15 | Tema escuro e tema claro conferidos, com contraste legível. Verde elétrico só na aba ativa e no ARROTAR (opção A do Luiz); play, ondas, "Seguir" do visitante e item ativo da barra inferior sem verde. Contado por estado, no perfil do dono e no do visitante | Rian | Chromium | pendente |
| 16 | `prefers-reduced-motion` respeitado: sem transição ou animação de entrada quando a pessoa pediu menos movimento | Marcelo | Teste + Chromium com a emulação ligada | pendente |
| 17 | Áudio do card toca com um toque, só um player por vez, estado de erro do áudio dito como erro | Marcelo | Chromium + aparelho | pendente |
| 18 | `typecheck`, `lint`, `test` e `build` passam. `TelaPerfilOpenDesign.test.tsx` atualizado ao novo layout sem apagar cobertura de seguidores, edição e compartilhar | Marcelo | CI local | pendente |
| 19 | Documentos antes do código: `ESCOPO_ATUAL.md`, ADR 0010, `forum-comunidades.md` e `MAPA_DE_PAGINAS_E_FLUXOS.md` com a exceção registrada e o mapa corrigido, **mergeados pelo PR #329 antes do primeiro commit de código**, depois do "pode" explícito do Luiz e do CI verde | Tiago / Rian | Revisão de documentos + PR #329 | pendente |
| 20 | **Barra inferior global.** Item ativo em `--fg` (não verde) em todas as telas do mobile; a barra lateral do desktop conferida, porque divide a regra `.nav-item.active` (`casca.css:192`) e só muda se o Luiz quis assim (ver "Ainda sem resposta do Luiz", item 6). FAB do ARROTAR conferido contra o print (~52px; hoje 56) sem perder alvo >= 44px e sem sobrepor conteúdo. `casca.layout.test.ts` roda antes (base) e depois, verde nos dois. Safe area inferior intacta | Marcelo / Rian | Teste (`casca.layout.test.ts`) + Chromium em 320/390/430/1280, claro e escuro; safe area só em aparelho | pendente |
| 21 | **Regressão de feed, Seguindo, comunidades e thread de comentários** com o card novo, em 320, 390, 430 e 1280, claro e escuro, capturas antes e depois lado a lado. Player toca, comentários abrem, `⋯` funciona, nada cortado atrás da barra inferior | Marcelo / Rian | Chromium | pendente |
| 22 | **Troca de foto pelo avatar do dono:** tocar no avatar abre a troca de foto (trocar e remover, com os handlers atuais); visitante tocando no avatar não abre troca. Alvo >= 44px, rótulo acessível ("Trocar foto"), foco e Esc fecham a folha. Sem capa no mobile, "Trocar capa" e "Remover capa" ficam no `ModalEditarPerfil` com os handlers existentes passados por prop; no desktop (>=700px) "Trocar capa" fica sobre a faixa de 132px | Marcelo / Rian | Teste + Chromium | pendente |
| 23 | **Gate leve do Camillo** escrito no cartão antes do código: contrato de props, 4 chamadores, CSS do card, impacto em feed e comunidades, `PlayerDoArroto`/`MenuDoPost`, barra inferior. Sem a nota, não há branch de código | Camillo | Leitura de código + nota no cartão | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela"). Sem aparelho real, saem como `NÃO VALIDADO` em aparelho, mesmo com Playwright verde: itens 9, 10, 13, 14 e 17; do item 20, safe area e FAB no Safari; do item 21, rolagem e toque em Safari iOS; do item 22, abertura da folha de troca de foto por toque em Safari e Chrome Android (seletor de arquivo e câmera). Aparelhos de referência: iPhone 17 (402x874, Safari) e Motorola G67 (412x915, premissa não confirmada, Chrome Android). Enquanto o Luiz não confirmar o G67, a linha do Chrome Android fica `NÃO VALIDADO` por inteiro,.

### As 7 perguntas de aceite (leitura provisória do Tiago, atualizada em 21/10/2026)

Veredito provisório: **ainda não há veredito.** O que existe é a leitura de entrada. O veredito final só sai depois do Gate do Camillo, da prova do Marcelo e do aceite visual do Rian. Com o que sabemos hoje, a tendência é `APROVADO COM RESSALVAS`, e sai `NÃO VALIDADO` nos itens que dependem de aparelho se o Luiz não os conferir.

1. **Necessidade:** passa. É a dor que o Luiz levou, com print na mão. O perfil de ficha não é lugar de ouvir arroto de ninguém.
2. **Valor:** passa. Post com player no perfil faz do perfil um lugar de ouvir, não de ler cadastro. Ressalva: os números do cabeçalho só valem se saírem do servidor.
3. **Coerência:** passa. O conflito de verde está fechado pela opção A do Luiz (aba ativa e ARROTAR, dentro do limite de 2). O conflito com a decisão de 19/10 está fechado pela exceção do Luiz; falta só o texto dos documentos chegar à `main`, que é o item 19. Ressalva nova: a barra inferior e o card mexem em telas que o Luiz não pediu para redesenhar, e cada uma precisa aparecer na regressão (itens 8, 20 e 21).
4. **Experiência:** exige prova. Itens 9 a 16 e 20 a 22 da matriz carregam isso. Sem aparelho real não vira aprovado, e o G67 ainda é premissa.
5. **Funcionamento ponta a ponta:** áudio toca no card do perfil e erro aparece como erro (itens 5, 7 e 17). A troca de foto pelo avatar entra aqui (item 22): foto trocada tem de aparecer de verdade no perfil, ou o erro aparece.
6. **Qualidade e prova:** Marcelo audita; falta de prova vira `NÃO VALIDADO`. Chromium sozinho não prova Safari nem a barra de endereço do Android.
7. **Simplicidade:** Fase A usa só dados que existem e deixa Curtidas para a Fase B. O card único é mais simples de manter do que uma variante só do perfil, desde que o Gate do Camillo confirme que o diff cabe num bloco coeso. Se o card ganhar prop só "para deixar preparado" para a Fase B, volta.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** a preencher pelo Iury ao consolidar.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` | `AJUSTA` | `BLOQUEIA` | `ISSUE_FUTURA` (a preencher)
- **Veredito Final do Tiago:** `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO` | `NÃO VALIDADO` (a preencher)
- **Pendências ou decisão necessária do Luiz:** abaixo.

### Decisões do Luiz em 21/10/2026 (requisito, não se reabre)

Decididas pelo **Luiz**, registradas pelo Tiago em 21/10/2026:

| # | Pergunta | Decisão do Luiz |
|---|---|---|
| 1 | Aparelho de referência | iPhone 17 (402x874, Safari) e Motorola G67 (412x915, Chrome Android). O 412x915 do G67 é premissa não confirmada |
| 2 | Feed e comunidades herdam o card novo? | Sim. Um card só, para perfil, feed, Seguindo, comunidades (e, por herança, a thread). Dispara o gatilho (c); pista reaberta na seção 1 |
| 3 | Verde | Opção A: só aba ativa e ARROTAR. Play em `--fg`, ondas em muted. O item ativo da barra inferior passa de verde para `--fg` em todas as telas, o que mexe em `casca.css` e exige `casca.layout.test.ts` |
| 4 | Duração do áudio e "Seguir" | Duração em sans, como no print. "Seguir" do visitante neutro |
| 5 | Foto e capa do dono | Tocar no avatar abre a troca de foto, em vez de ir só para o modal. No mobile sem capa, "Trocar capa" e "Remover" vão para o `ModalEditarPerfil`. No desktop, "Trocar capa" fica sobre a faixa |
| 6 | Curtidas | Só do dono, implementação na Fase B. Na Fase A a aba não existe no DOM |
| 7 | Ordem de entrega | O PR #329 (documentos e protótipo) é mergeado antes do código, mas só depois do "pode" explícito do Luiz |

Já respondidas antes e fora de dúvida: print vence a decisão de 19/10; sem chat; sem bolinha online; bio, cidade, "na roda desde" e redes ficam; capa some no mobile.

### Ainda sem resposta do Luiz

1. **"Melhor nota" e vitórias no X1.** O Luiz não respondeu. Segue a recomendação do Tiago: "Melhor nota" fica dentro da aba Arrotos, no topo da lista, em faixa neutra; "vitórias no X1" não entra, porque não há fonte de dado. Vira pergunta de novo só se o Luiz quiser outra coisa.
2. **Aba Salvos** só para o dono. Padrão deste cartão, sem confirmação explícita.
3. **Capa no desktop.** A faixa de 132px com "Trocar capa" sobre ela atende ao que o Luiz disse sobre o dono. Volta ao Luiz só se o Rian tirar a capa.
4. **Modelo e tela do Motorola G67.** Confirmar que o aparelho real é 412x915. Sem isso, o Chrome Android fica `NÃO VALIDADO` nas medidas.
5. **"Pode" do merge do PR #329.** O Luiz quer o merge antes do código e vai dizer quando. Ninguém mergeia sem esse "pode" nem com o CI vermelho.
6. **Barra lateral do desktop.** A regra `.nav-item.active` é compartilhada com a barra lateral. Se o Camillo mostrar que o item ativo do desktop vai para `--fg` junto, entendo que é isso que o Luiz quis com "todas as telas". Se o Luiz quiser o desktop como está, ele avisa.
