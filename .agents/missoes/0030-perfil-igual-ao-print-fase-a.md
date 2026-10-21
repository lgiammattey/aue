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

### Decisões do Luiz depois do Gate (21/10/2026, requisito, não se reabre)

Dadas ao Kayky no momento de abrir o código. Valem acima do que o Gate do Camillo e o aceite do Rian escreveram sobre os mesmos pontos.

| # | Pergunta | Decisão do Luiz |
|---|---|---|
| 8 | O que o card único mantém do feed? | O feed mantém repostar, desafiar e a nota verde no card. O `CardDoPost` ganha `variante?: 'feed' \| 'perfil'`, padrão `'feed'`. A `'feed'` segue com esses elementos e com as reações emoji. A `'perfil'` segue o print. Os itens comuns às duas variantes (`@handle`, `r/comunidade` em linha própria, `⋯` no topo) só valem para as duas se não tirarem repost, desafiar nem nota do feed. Se uma mudança do card comum tirar algo do feed, ela fica restrita à variante `'perfil'` e o Kayky registra no relatório. Na dúvida, o feed não muda de comportamento. |
| 9 | Brilho verde atrás do ARROTAR | Fica como no print. É sombra decorativa e não conta no limite de 2 verdes. |
| 10 | Barra inferior | O item ativo do celular vai a `--fg` (apagar `casca.css:1098-1100`, como o Camillo definiu). O menu lateral do desktop não muda. |
| 11 | Foto, capa, abas e detalhes | Foto do avatar tocável abre a folha de troca de foto. Capa só no desktop; no mobile "Trocar capa" e "Remover" ficam no `ModalEditarPerfil`. A aba Curtidas não existe no DOM. Duração do áudio em sans. "Seguir" do visitante neutro. |

O Luiz quer o perfil mobile perfeito e com cara de app nativo, sem quebrar e sem "sambar". Aparelhos: iPhone 17 (402x874, Safari) e Moto G67 (412x915, premissa). Teste de 320 a 430, depois 768 e 1280, claro e escuro.

### Ainda sem resposta do Luiz

1. **"Melhor nota" e vitórias no X1.** O Luiz não respondeu. Segue a recomendação do Tiago: "Melhor nota" fica dentro da aba Arrotos, no topo da lista, em faixa neutra; "vitórias no X1" não entra, porque não há fonte de dado. Vira pergunta de novo só se o Luiz quiser outra coisa.
2. **Aba Salvos** só para o dono. Padrão deste cartão, sem confirmação explícita.
3. **Capa no desktop.** A faixa de 132px com "Trocar capa" sobre ela atende ao que o Luiz disse sobre o dono. Volta ao Luiz só se o Rian tirar a capa.
4. **Modelo e tela do Motorola G67.** Confirmar que o aparelho real é 412x915. Sem isso, o Chrome Android fica `NÃO VALIDADO` nas medidas.
5. **"Pode" do merge do PR #329.** O Luiz quer o merge antes do código e vai dizer quando. Ninguém mergeia sem esse "pode" nem com o CI vermelho.
6. **Barra lateral do desktop.** A regra `.nav-item.active` é compartilhada com a barra lateral. Se o Camillo mostrar que o item ativo do desktop vai para `--fg` junto, entendo que é isso que o Luiz quis com "todas as telas". Se o Luiz quiser o desktop como está, ele avisa.

## Gate Arquitetural do Camillo (21/10/2026)

Leitura de código contra o plano `avalie-a-tela-de-vivid-shamir.md`, sem escrever código de produção. Não abri a tela no navegador: o que digo sobre "como renderiza hoje" vem do CSS e do JSX, e a captura de antes (condição 2) confirma ou derruba.

**Veredito: APROVADO COM CONDIÇÕES.** Nenhum gatilho de escalada disparou. Não há porta, RPC, migração nem campo novo; o `PlayerDoArroto` e o `MenuDoPost` não mudam de assinatura; a barra inferior se resolve só em cor. Com as 12 condições abaixo, o Kayky pode abrir branch depois do "pode" do Luiz no PR #329.

Esclarecimento do Luiz (coordenador, 21/10): o item ativo em `--fg` vale só para a barra inferior do celular; o menu lateral do desktop não muda. Dá para separar, ver item 6.

### Achados, com evidência

**1. Contrato de props do `CardDoPost` (`src/features/novo-aue/CardDoPost.tsx`)**
- Props de hoje: linhas 18-46. Tudo que o plano pede cabe em **uma** prop opcional nova, `variante?: 'feed' | 'perfil'`, padrão `'feed'`. Ela liga só o que é do perfil: esconder as reações emoji (linhas 326-345), omitir o coração quando não há `aoCurtir` (hoje fica desabilitado, linhas 300-324) e trocar para neutro os pontos que ficariam verdes (item 3 abaixo). Com isso nenhum dos quatro chamadores precisa mudar para compilar.
- O que **não** é variante, é o card novo para todo mundo (decisão do Luiz): `@handle` (linha 187, hoje `u/`), `r/comunidade` em linha própria (linhas 200-207, hoje no cabeçalho), `⋯` no topo direito (`MenuDoPost` hoje na linha 399, dentro da barra de ações), contadores sempre visíveis (linhas 293, 322, 342, hoje só se `> 0`), ícone de compartilhar e onda/duração do player.
- Chamadores: `InicioOpenDesign.tsx:1680` (feed), `:1721` (Seguindo), `:1909` (comunidade) passam `{...propsDeEngajamento} {...propsDeModeracao}`, áudio, comentários. Todos continuam iguais. **`ThreadDeComentarios.tsx:258` entra na lista de mudança**: a thread não repassa `reacoes`, `minhas`, `aoDenunciar` nem `aoApagar` (Props em `ThreadDeComentarios.tsx:22-37`; `InicioOpenDesign.tsx:1610` espalha essas props, mas o componente as ignora, e o TypeScript não reclama de spread). Hoje a thread já mostra o card sem contagem, sem estado de curtido e **sem o menu `⋯`**. Com "contador sempre visível" ela mostraria "0" falso. Precisa repassar as quatro props opcionais.
- Busca completa por `CardDoPost`: só `InicioOpenDesign.tsx`, `ThreadDeComentarios.tsx`, testes e `e2e/harness.tsx:17`. O harness já está fora de sincronia (passa `aoAlternarReacao` e `aoAlternarSalvo`, que o card não tem); fica como está. `CardDeCauso`/`TelaComunidade` só citam o card em comentário.
- O perfil não passa por nenhum dos quatro: hoje `InicioOpenDesign.tsx:2179-2185` renderiza `CausoPostado` como `<Link>`. O card pede `ItemDoFeed`. Existe um mapeamento causo para item, inline, em `InicioOpenDesign.tsx:572-588` (Seguindo), com `engajamentoDoCauso` (`useEngajamento.ts:9`). O perfil precisa dele sem copiar o bloco: extrair uma função pura (`causoParaItemDoFeed`, no mesmo módulo ou em `tipos`) e usar nas duas telas.
- Número real: `useEngajamento` cai em `ZERO` quando a contagem ainda não chegou (`useEngajamento.ts:6`, uso em `propsDeEngajamento`). Hoje o 0 fica escondido; com contador sempre visível ele apareceria como fato antes de carregar. Ver condição 4.
- Coração: para causo, `aoCurtir` já existe e vem de `comunidadePort.alternarCurtida` (`useEngajamento.ts:122`); para tópico, de `forum.alternarReacaoDoTopico`. A regra do plano ("`alternarCurtida`/`curtidoPorMim`") é estreita demais. A regra certa é `aoCurtir !== undefined`, que o hook já calcula.

**2. O que muda nas telas e o que os testes travam**
- Protótipo canônico do feed (`Bonde do Arroto.dc.html:172-195`) já usa: `@handle · tempo` na primeira linha, `⋯` à direita no topo, comunidade em linha própria ("Postado em ..."), play em `--fg`, contadores sempre visíveis (respostas, reposts, curtidas), sem emoji de reação, duração em `ui-monospace`. Então `@handle`, `⋯` no topo, contador visível e play neutro **aproximam** o feed do protótipo. Afastam: a duração em sans (o Luiz decidiu sans; o protótipo do feed usa monospace, Rian precisa alinhar) e o `r/slug` (o protótipo do feed escreve "Postado em"; o do perfil usa `r/`). Rian decide qual vale e escreve.
- No feed, Seguindo e comunidade o que muda de fato: `@handle`, `r/` em linha própria, `⋯` sai da barra de ações, contadores `0` aparecem, player novo. **Não pode mudar**: composer, filtros, comentários, reações emoji (ficam, a variante `perfil` é a única que as esconde), banner de anúncio.
- Hoje o card quase não tem CSS de layout (item 3). O visual "de antes" é, na prática, avatar empilhado em cima do conteúdo e sem moldura. Então o "antes e depois" do feed é mais diferença que ajuste fino; Marcelo e Rian precisam saber disso antes de olhar a captura.
- Testes que travam e **precisam ser atualizados de propósito** (não são regressão):
  - `CardDoPost.test.tsx` (~42): espera `u/mestre_eco`; passa a `@mestre_eco`. (~151) "botão sem ação fica desabilitado" fica valendo para a variante `feed`; cria-se um teste para o `perfil` (coração ausente sem `aoCurtir`). (~190) toolbar com 7 botões continua valendo na variante `feed`.
  - `InicioOpenDesign.test.tsx:162-163`: `u/ze_do_eco` e o `aria-label` "Abrir perfil de u/ze_do_eco" mudam. `:166` (🔥 no feed) **deve continuar passando**, é a prova de que o feed não perde reação.
  - `PlayerDoArroto.test.tsx` (~15, ~29): esperam "1:01 / 1:33" e "0:12 / 0:36"; passam a só duração. Quando a duração é `null`, segue mostrando o tempo corrido (o teste "não inventa duração" continua valendo).
  - `useEngajamento.test.tsx:41,56,66,69,70`: acessam `.reacoes.like` sem `?.`; se a condição 4 for feita no hook, esses acessos ganham `?.`.
  - `DenunciarEApagar.test.tsx:67-68`: acha `Mais ações` por `within(article)`. O `⋯` indo para o cabeçalho continua dentro do `<article>`, passa.
  - `MenuDoPost.test.tsx`: não muda enquanto o `MenuDoPost` mantiver a assinatura.
  - `ThreadDeComentarios.test.tsx` só trava texto e comentários; não é afetado.

**3. CSS**
- Confirmado por `grep` em `src/**/*.css`: `feed-post`, `post-avatar-col`, `post-main-content`, `post-meta-header`, `post-meta-ident`, `badge-comunidade`, `card-do-post` e `post-avatar-static` têm **zero** regras. Já existem regras soltas para classes irmãs em `InicioOpenDesign.css`: `.post-avatar-link/-fallback` (348), `.post-meta-handle/-time/-dot` (380-388), `.post-meta-badges` (390), `.post-topic-tag` (396), `.post-audio-wrapper` (428), `.post-actions--twitter` (446), `.action-btn` (457-510, 1146, 1195-1213), `.post-media-image` (301). O CSS novo reaproveita ou sobrescreve essas; não as apaga.
- Armadilhas do bloco legado: `<p className="post-body">` (CardDoPost linha 227) pega `casca.css:467` (`padding: 16px 18px 14px`) e `:1185` (mobile `12px 14px`). `.badge-nota` (`casca.css:517`) é verde cheio. `.burp-player/.play/.wave/.wave i/.player-time` existem **duplicados** em `casca.css:591-645` e `InicioOpenDesign.css:433, 1215-1230`, e `.play` e `.wave` são nomes globais. Só o `PlayerDoArroto` usa essas classes (busca em `tsx`); a Arena (`arena.css`) não define nenhuma delas.
- Onde o CSS novo mora: **um arquivo novo `src/features/novo-aue/CardDoPost.css`**, importado por `CardDoPost.tsx` (como `PerfilConectado.tsx` faz com o seu), com todo seletor começando por `.card-do-post`. Isso dá especificidade (0,2,0) sobre `.post-body` e `.badge-nota` (0,1,0) sem depender de ordem de import e sem editar `casca.css`. O `.post-body` global **não se edita**: o `CardDeCauso` legado ainda o usa. Dentro do card, `.card-do-post .post-body { padding: 0 }`.
- O player ganha o mesmo tratamento: `PlayerDoArroto.tsx` passa a usar classes próprias (`player-arroto`, `player-arroto__play`, `player-arroto__onda`, `player-arroto__tempo`) em `PlayerDoArroto.css`. Assim a aba Arrotos do perfil (`InicioOpenDesign.tsx:2220`) herda o mesmo visual e nenhuma regra global `.play`/`.wave` é tocada. As regras antigas ficam órfãs; remover é issue futura (mexer em `casca.css` fora da barra está vetado neste cartão).
- Tokens: `--border-strong` e `--ind` estão no `DESIGN.md` (linhas 82-83, 99-100) mas **não são declarados no CSS do app** (só em `tema-claro.css`, das páginas públicas). No card, usar `var(--border-strong, var(--aue-line))`. Isso não é token novo no design system, então não dispara o critério 8 do Gate. Em `casca.css`, `--aue-text` é `var(--fg)`: "`--fg`" do cartão é `--aue-text`.
- Verde no perfil (opção A, no máximo 2 por estado): dentro do card existem quatro fontes de verde fora da aba ativa e do ARROTAR: `.badge-nota` (`casca.css:517`), `.post-topic-tag__label` (`InicioOpenDesign.css:401`), `.action-btn.is-active` (1146) e `.action-btn--save.is-saved`/`__feedback` (493, 505). Na variante `perfil`, todas passam a `--aue-text`/`--aue-muted` (a nota vira contorno neutro, como o `.pf-nota` do protótipo). Sem isso o perfil estoura o orçamento de verde.
- Tamanho: estimo 120 a 160 linhas num bloco só (grade avatar + conteúdo, cabeçalho, linha da roda, player, barra de ações, 4 overrides da variante `perfil`, um bloco `@media (min-width: 700px)`), mais ~40 do player. **Cabe num bloco coeso.** Não pede token novo. O critério 8 não barra.

**4. `PlayerDoArroto` e `MenuDoPost` fora do card**
- `PlayerDoArroto`: usado no `CardDoPost` (233) e em `InicioOpenDesign.tsx:2220` (aba Arrotos do perfil). Nenhuma outra tela. Mudar a onda, a duração e o ícone muda as duas, e é o desejado (o protótipo usa o mesmo player nas duas). A **assinatura não muda** (`tocando`, `tempoAtualSegundos`, `duracaoSegundos`, `aoAlternar`); só o que ele desenha. Gatilho (d) **não dispara**. Regra: com duração conhecida, mostra só a duração; sem duração, o tempo corrido; nunca inventa.
- `MenuDoPost`: só o `CardDoPost` o usa. Muda de lugar (topo do card) sem mudar assinatura. Atenção: o menu abre para cima (`bottom: 100%`, `MenuDoPost.tsx:57`) com estilos inline; no topo do card o menu pode sair da tela e ficar atrás da barra superior. Abrir para baixo no topo (condição 8).

**5. Fronteira do ADR 0001**
- Nenhum arquivo do plano acrescenta API de navegador. Dívida que **já existe** e não cresce: `CardDoPost.tsx:103-115` usa `window`, `navigator.share`, `navigator.clipboard`, `window.prompt`; `MenuDoPost.tsx:26-30` usa `document.addEventListener`; `ThreadDeComentarios.tsx:111-152` usa `window.setInterval`. Essa pasta (`features/novo-aue`) não está na lista `PASTAS_LIMPAS` de `src/arquitetura.fronteira.test.ts`, por isso nenhum teste reclama. Não faço a migração aqui (não é escopo, e mover o compartilhar do card para uma porta é outro cartão), mas o Kayky não pode escrever mais nenhuma linha dessas no card, no player nem no perfil. Áudio: um player por vez continua pelo `alternarAudio` do `InicioOpenDesign`; o `Audio` fica em `elementoAudio` e nada novo sai de `plataforma/`.

**6. Barra inferior**
- A regra `.nav-item.active` (`casca.css:192-196`) **já está em `--aue-text`** (com fundo `--aue-surface-2`). Ela só atinge a barra lateral do desktop e não é verde. O verde do item ativo no celular vem de outra regra: `.mobile-nav-item.active svg { stroke: var(--aue-accent) }` (`casca.css:1098-1100`), dentro do `@media (max-width: 699px)` que abre em `:1021`. O rótulo do item ativo já é `--aue-text` (`:1093-1096`) e o `svg` herda `stroke: currentColor` (`:1086-1088`).
- Os dois ficam separados sem tocar na estrutura: o seletor é exclusivo do celular e a barra lateral não o usa. A barra do celular só existe em `BarraLateral.tsx:137-210` com `.mobile-nav-item`, e o desktop usa `.nav-item` (linhas 49-122). **Gatilho (e) não dispara.**
- Menor diff: apagar as três linhas `:1098-1100` (o traço passa a seguir `currentColor`, que no item ativo é `--aue-text`). Uma regra, nenhuma linha acrescentada. Os ícones `.nav-item .ico` verdes (`:198-204`) são do desktop e do modo tablet (`@media (max-width: 1059px)`, `:985+`); ficam como estão. Observação para o Tiago: o Luiz não pediu isso, mas o menu lateral continua com todos os ícones em verde, e isso é do desktop.
- O FAB (`.mobile-nav-item--arrotar`, `:1106+`) não recebe a classe `active` e define o próprio `svg` (`fill: accent-on`, `stroke: none`, `:1129-1134`), então a mudança não o toca. Reduzir de 56 para 52 é só `width`/`height`; só entra se o Rian cravar 52 no protótipo, em commit separado, sem mexer em `top`/`border`/grade.
- `casca.layout.test.ts` (13 linhas) trava hoje **uma coisa só**: o bloco `.app` (`\n\.app \{[^}]*\}`) com `grid-template-columns: 275px minmax(0, 600px) 320px` e `justify-content: center`. Ele não diz nada sobre a barra. Verde antes e depois só prova que o `.app` não foi tocado. Precisa ganhar duas asserções: (1) o CSS não contém regra `.mobile-nav-item.active svg` com `--aue-accent`; (2) `.mobile-nav-item--arrotar` continua com `background: var(--aue-accent)`. Cuidado para não inserir outra regra `.app {` antes da existente, o regex pega a primeira.

### Condições para o Kayky (todas obrigatórias)

1. **Uma prop nova só no card**: `variante?: 'feed' | 'perfil'`, padrão `'feed'`. Nada de prop "para deixar preparado" para a Fase B. `tsc -b && tsc -p tsconfig.test.json` passa sem editar os chamadores só para compilar.
2. **Capturas de antes** (feed, Seguindo, comunidade e thread; 320, 390, 430, 1280; claro e escuro) **antes** do primeiro commit do card. É o único jeito de saber como renderiza hoje.
3. **CSS do card em `CardDoPost.css`** (e do player em `PlayerDoArroto.css`), seletores sempre sob `.card-do-post`, sem editar `.post-body` nem `.burp-player/.play/.wave` e sem `!important`. `casca.css` só recebe a remoção das linhas 1098-1100.
4. **Nenhum número inventado**: o contador de curtidas só aparece com `reacoes` carregado. Fazer em `propsDeEngajamento`: omitir `reacoes` enquanto não houver contagem do servidor nem `post.engajamento` (e ajustar os acessos de `useEngajamento.test.tsx` para `?.`). O contador de comentários vem de `respostasTotal`, que é dado real. O espaço do número tem largura reservada para não saltar o layout.
5. **Thread**: `ThreadDeComentarios` passa a aceitar e repassar `reacoes`, `minhas`, `aoDenunciar`, `aoApagar` (opcionais). Teste novo: a thread mostra o `⋯` quando há `aoApagar`/`aoDenunciar`. Sem isso o card novo regride na thread.
6. **Perfil**: extrair `causoParaItemDoFeed` (a partir de `InicioOpenDesign.tsx:572-588`) e usar na lista do perfil e no Seguindo; não duplicar o bloco. Perfil usa `variante="perfil"` e as mesmas props de engajamento e moderação dos outros chamadores (`propsDeEngajamento`, `propsDeModeracao`), de modo que o `⋯` mostre apagar no perfil do dono e denunciar no de outra pessoa.
7. **Verde**: na variante `perfil`, nota, tag de tópico, estado ativo e salvo/feedback sem `--aue-accent`. Teste de CSS (leitura do arquivo, no estilo do `casca.layout.test.ts`) ou captura contada pelo Rian. Fora do perfil, as cores não mudam.
8. **`MenuDoPost`** no topo abre para baixo e para dentro da tela (hoje abre para cima, `MenuDoPost.tsx:57`); alvo do `⋯` de 44px com margem negativa para não aumentar a linha, como no protótipo. Assinatura intacta.
9. **`PlayerDoArroto`**: assinatura intacta; mostra só a duração quando existe e o tempo corrido quando não; `aria-label` de tempo preservado; altura fixa de 44. Atualizar `PlayerDoArroto.test.tsx` e conferir a aba Arrotos.
10. **Testes alterados de propósito** (lista do item 2) entram no mesmo commit da mudança, cada um explicado na mensagem. O `InicioOpenDesign.test.tsx:166` (🔥 no feed) e `DenunciarEApagar.test.tsx` passam sem edição.
11. **Fronteira**: nenhuma chamada nova de `window`, `navigator`, `document`, `localStorage`, `Audio` nem Supabase em arquivo de `features/`. Nada de migrar o compartilhar do card neste cartão.
12. **Barra**: só apagar `casca.css:1098-1100` e acrescentar as duas asserções ao `casca.layout.test.ts`. Rodar o teste antes (base verde) e depois. FAB 52 só com o Rian pedindo.

### Gatilhos que ainda sobem a pista

- **(a)** se a condição 5 ou a 6 exigirem prop **obrigatória** nova no card, ou se algum dos quatro chamadores precisar mudar de forma que o TypeScript acuse;
- **(b)** se o perfil precisar de campo que `listarFeed({ autorId })` não devolve (por exemplo contagem de curtidas de tópico fora do `forum.contarReacoesDosTopicos`);
- **(d)** se o `PlayerDoArroto` ou o `MenuDoPost` precisarem mudar de assinatura (hoje não precisam);
- **(e)** se, ao mexer na barra, aparecer necessidade de alterar grade, rotas ou o FAB além de `width`/`height`; hoje não;
- **novo, (f)**: se o CSS do card passar de um arquivo coeso (mais de uns 200 linhas) ou pedir token fora do `DESIGN.md`, o Kayky para e o Camillo divide o trabalho.

### Ordem segura de commits

0. PR #329 mergeado antes de qualquer código (já definido no cartão).
1. **Player**: `PlayerDoArroto.tsx` + `PlayerDoArroto.css` + teste. Muda a aba Arrotos e o card ao mesmo tempo, mas é peça pequena e isolada.
2. **Encanamento sem mudança visual**: `causoParaItemDoFeed` extraído, condição 4 no hook, thread repassando as quatro props. Tudo opcional; feed e Seguindo iguais.
3. **Card**: `CardDoPost.tsx` + `CardDoPost.css` + `variante` + `MenuDoPost` no topo + testes atualizados. Aqui as quatro telas mudam; é onde entram as capturas de depois (itens 8 e 21 da matriz).
4. **Perfil**: view `perfil`, `InicioOpenDesign.css`, `BarraSuperior` (placeholder), `ModalEditarPerfil`, `TelaPerfilOpenDesign.test.tsx`.
5. **Barra inferior por último**: apagar `casca.css:1098-1100` + asserções no `casca.layout.test.ts`. Fica por último porque é a única mudança global e a mais barata de reverter.

Rodar `typecheck`, `lint`, `test` e `build` em cada commit, não só no último. Mobile primeiro, `min-width` sobe para o desktop; `dvh/svh`, `env(safe-area-inset-*)`, `touch-action: manipulation` e `overscroll-behavior-y: contain` como na matriz (itens 10, 13, 14); o critério do Luiz é perfil mobile com cara de app, sem quebrar e sem "sambar".

**Item 6 de "Ainda sem resposta do Luiz": resolvido.** O desktop não muda; a regra do menu lateral já estava em `--aue-text`.

## Aceite visual do Rian (21/10/2026)

**Veredito: APROVADO COM RESSALVAS.** Protótipo aberto no Chromium (Playwright) em 402x874 (iPhone 17) e 412x915 (Moto G67, premissa), claro e escuro, dono e visitante, carregando, vazio, erro e inexistente; também 320, 360, 430, 768 e 1280. Medido contra o print: avatar, abas, cards e player batem em geometria (±3px). Sem rolagem horizontal em nenhuma largura. Chromium não prova Safari nem Chrome Android; aparelho real segue `NÃO VALIDADO`.

**Mudou no protótipo (`Bonde do Arroto.dc.html`):**
- Verde opção A: só aba ativa e ARROTAR (contado por script: 2 no escuro, 1 no claro, 2 no desktop com o Postar). Variante `#verde-print` removida.
- Avatar do dono é botão (`aria-label="Trocar foto do perfil"`) e abre a folha com "Trocar foto" e "Remover foto". Visitante não tem botão. Sem selo no avatar, igual ao print.
- Capa: no mobile não existe e "Trocar capa" / "Remover capa" ficam no modal Editar perfil; no desktop ficam sobre a faixa. O modal não tem mais foto.
- Curtidas: nenhuma aba nem texto no DOM; o código morto da aba saiu do script.
- Calibração: nome 19px, "Editar perfil" 13px/700, nome do post 13px, card 2px mais baixo, área de toque do `r/roda` em 44px.
- Fonte: o link do Google Fonts carregava Archivo só até 700, mas a tela usa 800. Agora carrega 800. O harness local mascarava isso.
- Corrigido o campo Bio do modal (caía em monoespaçada) e o esqueleto de carregamento ganhou as linhas da bio.

**Decisões do Rian:** busca ocupa a largura toda onde o print tem o botão de chat (sem chat, espaço vazio seria sobra). Sem bolinha online. Painel um tom mais claro sob o topo no print não entra (DESIGN.md manda fundo único). "Melhor nota" fica no topo da aba Arrotos.

**Exceções ao design system, para registro:**
1. Duração e `2d` em sans (decisão do Luiz). DESIGN.md §3 e §5.3 pedem mono; o DESIGN.md precisa da nota.
2. Card do post sem selo de nota. §5.3 prevê o selo `--accent` em Anton; no perfil ele estouraria o orçamento de verde e o print não o mostra.
3. Brilho verde ao redor do ARROTAR (como no print). É o mesmo elemento, não conta como segundo verde, mas é sombra decorativa: o Luiz decide se fica.
4. Selo "ARROTAR" da barra em Anton 8px, abaixo da escala de §3. Igual ao print.
5. Modais e feed do arquivo seguem em Google Sans Flex (legado, fora desta fase). Só a folha de foto nova e o perfil usam Archivo.

**Ainda diverge do print (e por quê):**
- Bloco bio/cidade/redes empurra stats e abas uns 90px para baixo; é decisão do Luiz. Abas continuam acima da dobra em 402x874.
- Botão "Editar perfil" 122px contra 104px do print: o print usa outra família, mais estreita. Em 320px o botão quebra para linha própria.
- Archivo é uns 8% mais larga que a fonte do print; compensei no tamanho do nome, não em todo texto.
- Esqueleto de carregamento não evita deslocamento se a pessoa não tiver bio.
- Sem aba Curtidas, sem chat, sem bolinha, sem foto no avatar de exemplo: intencionais.

**Pendências que não são do perfil (precisam de dono):**
- Card único: o feed deste mesmo protótipo ainda mostra o card antigo (repost, desafiar, nota verde, duração mono). O print só prova o card do perfil. Antes do Kayky mexer no `CardDoPost` compartilhado, o Tiago ou o Luiz decidem o que o card único mantém do feed. Sem isso, o Rian não valida feed e comunidades.
- Barra inferior nas outras telas: `Arena.dc.html` e `Comunidades.dc.html` já usam `--fg` no item ativo, então a cor está coerente. Divergem na estrutura: só ícones sem rótulo, sem FAB, ordem Início, Auê, Comunidades, Desafios, Perfil (a nova é Feed, Comunidades, ARROTAR, X1, Perfil), sem safe-area. `Versões Webapp.dc.html` só embute as duas e herda. Não reescrevi.
- Heart do card só aparece no código real se `alternarCurtida` estiver ligado (item 5 da matriz).

## Correções do PR #330 (21/10/2026)

Registro do Kayky depois das auditorias do Camillo (APROVADO COM CONDIÇÕES) e do Marcelo (APROVADO COM RESSALVAS).

**Decisões do Luiz nesta rodada**

- (a) A barra superior sem o botão Buscar e sem o mini-perfil vale para todo o app no celular, não só para o perfil. Desktop e menu lateral não mudam.
- Repostar e desafiar não entram: nunca existiram no `CardDoPost` e não há cartão para eles.

**O que a implementação decidiu e fica registrado**

- (b) A duração real do áudio aparece no card do feed e do Seguindo antes do play (`ItemDoFeed.duracaoSegundos` ou `anexo.duracaoMs`). Antes era "0:00" até tocar.
- (c) A variante `perfil` esconde Salvar, como o protótipo e o print. O Camillo tinha deixado o botão; o desenho vence. Salvar segue no feed, na comunidade e na thread.
- (d) As abas têm teclado (setas, Home, End) e `?aba=arrotos|salvos`. A aba é lida da URL a cada render e o `?aba=` é compartilhável (valor inválido, ou Salvos de outra pessoa, cai em Posts). Decisão do Luiz: trocar de aba não empilha histórico (`replace`), como em app nativo; voltar sai do perfil.
- (f) O gatilho (f) do Gate disparou na letra: o CSS do card tem cerca de 350 linhas e o do perfil cerca de 680. O Camillo liberou os dois como bloco coeso, sem token novo fora do DESIGN.md.

**Conferência do Camillo, em 3 linhas**

1. Sem porta, RPC, migração nem contrato novo; `PlayerDoArroto` e `MenuDoPost` mantiveram a assinatura.
2. Pediu tokens (`--border-strong`, `--ind`) com os valores do DESIGN.md em um lugar só, peso explícito no verde do feed e remoção do CSS morto de salvar.
3. Apontou que `casca.css` e `Comunidade.css` declaram `--border-strong` com outros hex: issue futura, fora desta fase.

**Auditoria do Marcelo, em 3 linhas**

1. Bug real: o menu ⋯ abria atrás da barra inferior (botão entre y 660 e 745 numa tela de 800).
2. A folha de foto não travava a rolagem do fundo; havia alvos abaixo de 44px, placeholder cortado em 320, data inventada ("agora") e player sem progresso.
3. O teste intermitente da Arena (`Arena.test.tsx`, contagem 3-2-1) falha na `main` também e não é deste PR.
