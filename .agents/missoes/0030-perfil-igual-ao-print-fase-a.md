# Cartão de Missão 0030 — Perfil igual ao print do Luiz (Fase A: visual)

Aberto em 21/10/2026. Insumos: print mobile do perfil `giamz` enviado pelo Luiz e plano aprovado por ele (`avalie-a-tela-de-vivid-shamir.md`, com a tabela print x código). O print não é protótipo canônico; só vira referência depois que o Rian o transportar para `docs/design/prototipo/`.

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
- **Fora de escopo (Não vira):** botão ou tela de chat; indicador de online; aba Curtidas funcional ou RPC de curtidos; XP, ranking, selo e contagem sem fonte; reações emoji dentro do card no perfil (esconder, salvo se o Rian provar o contrário); editar `PerfilConectado.tsx/.css` (ver risco 4); tocar em `CardDeCauso` e `HeaderSocial` (legados); `casca.css` sem rodar `casca.layout.test.ts`; renomear slug ou contrato de dados.
- **Pista (Lane):** Full flow comum, com gatilho de escalada para sistêmica (abaixo).
- **Por que esta pista:** é tela nova dentro de módulos e contratos existentes. Os dados já saem de `listarFeed({ autorId })`, `arrotosDoPerfil` e `SalvosDoPerfil`. Nenhuma porta, RPC, migração ou modelo de áudio muda.
- **O ajuste no `CardDoPost` empurra para sistêmica?** Não por si só. O card é compartilhado com feed e comunidades, mas a mudança é de apresentação e de props, sem dado nem API novos. Fica em comum com regra de ouro: as props novas são opcionais e o comportamento antigo é o padrão. Sobe para **sistêmica, com Gate do Camillo antes de Kayky abrir código**, se qualquer um destes acontecer: (a) o contrato de props do `CardDoPost` mudar de forma que quebre um chamador existente; (b) precisar de campo novo na porta de comunidade ou de perfil; (c) o Luiz mandar o feed e as comunidades herdarem o card novo e o diff do card passar a decidir o visual dessas telas inteiras (ver decisão 2 do Luiz). Em qualquer um dos casos o Iury para, devolve ao Tiago e eu reabro a pista.
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
- **Gate Arquitetural (Camillo / Lucas):** não aplicável na Fase A, com os gatilhos de escalada acima. Camillo faz uma leitura rápida do diff do `CardDoPost` (sem gate) para garantir que feed e comunidades não mudam sem querer. Pendente apenas na Fase B.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver o fim deste cartão.

### Sequência

1. **Iury** recebe o cartão, confere a mesa e libera o Rian.
2. **Rian** especifica e atualiza o protótipo canônico antes de qualquer código: perfil mobile com o print como alvo, lugar de bio/cidade/redes/"na roda desde", destino da "Melhor nota", capa no desktop, orçamento de verde, estado da aba Curtidas marcada como Fase B, medidas calibradas com a largura real do aparelho do print. O print vem em 607px de largura, com moldura do aparelho; em 390px o fator é cerca de 0,64. Avatar fica perto de 58-65px, não 92 nem 78.
3. **Kayky** só abre código com este cartão, o desenho do Rian e o contrato pronto. Implementa mobile primeiro (`min-width` sobe para desktop).
4. **Rian + Marcelo** validam: Rian com a tela aberta ao lado do print; Marcelo com testes e Playwright.
5. **Iury** consolida com evidência; **Tiago** passa pelas 7 perguntas e dá o veredito.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** webapp mobile (Safari iOS / Chrome Android), desktop, documentação.
- **Estados obrigatórios do perfil:** carregando, perfil próprio, perfil de terceiro, perfil inexistente, perfil sem posts, sem arrotos, sem salvos, erro de leitura com "Tentar de novo", rede fora, e aba aberta por URL. Estados da Arena não mudam.
- **Maior risco de quebra ou mentira visual:**
  1. `CardDoPost` é compartilhado: mexer nele muda feed e comunidades sem aviso.
  2. O CSS de layout do card (`feed-post`, `post-avatar-col`, `post-main-content`, `post-meta-header`, `post-meta-ident`, `badge-comunidade`) hoje não existe; o card herda um bloco legado (`.post-body` em `casca.css:467`). Antes de escrever, abrir o card no navegador e ver como renderiza hoje.
  3. Verde: o print tem aba ativa, play, ícone de ondas, ARROTAR e item Perfil da barra, mais a bolinha de online. A regra é no máximo 2 por estado (DESIGN.md §2.3). O Rian decide quem cede; a bolinha já sai.
  4. `PerfilConectado.tsx` aparece no mapa como componente a editar, mas parece código morto. Editar o arquivo errado seria entregar nada.
  5. Perda de função sem querer: bio, cidade, redes, "Melhor nota" e "Trocar capa/Remover" sumirem por falta de lugar no layout.
  6. "Sambar" no mobile: pulo de layout quando avatar, números e player carregam, e rolagem presa atrás da barra inferior.
- **Limite da promessa:** a tela mostra só o que existe: posts, arrotos e salvos reais, contagens vindas do servidor. Sem presença online, sem chat, sem curtidos listados. Curtida do card só se a porta real responde; se falhar, o erro aparece como erro.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Ambientes: Código/Teste = `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e testes de componente. Chromium = Playwright. Aparelho = Safari iOS e Chrome Android reais (Chromium não prova Safari; o que ficar só em Chromium sai marcado como não validado em aparelho).

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| 1 | Protótipo canônico atualizado com o perfil do print, e a tela aberta ao lado do print sem diferença material de geometria, tipo e ordem dos blocos (mobile 390). Sem isso não há aceite visual | Rian | Chromium + print lado a lado | pendente |
| 2 | Cabeçalho: sem capa no mobile, avatar redondo à esquerda, nome e `@handle`, "Editar perfil" com lápis e botão só-ícone de compartilhar com `aria-label="Compartilhar"`. Sem botão de chat e sem bolinha online | Rian / Marcelo | Teste + Chromium | pendente |
| 3 | Três números centralizados (Posts, Seguidores, Seguindo), em colunas iguais, com números tabulares (`font-variant-numeric: tabular-nums`). Seguidores e Seguindo abrem a lista de conexões com alvo >= 44px | Marcelo | Teste + Chromium | pendente |
| 4 | Abas: Posts e Arrotos para todos, Salvos só para o dono, sublinhado verde, sem contador no rótulo. Aba Curtidas ausente do DOM. Semântica de aba (`tablist`, setas, Home, End) e aba na URL preservadas | Marcelo | Teste | pendente |
| 5 | Nenhum número de curtida inventado: o "0" do card vem da porta; coração só aparece se estiver ligado ao dado real | Marcelo | Teste + código | pendente |
| 6 | Bio, cidade, "na roda desde" e redes sociais continuam visíveis para quem tem o dado, no lugar que o Rian desenhou. Os testes de redes sociais (`TelaPerfilOpenDesign.test.tsx`, a partir da linha 224) continuam passando. Campo vazio não gera linha vazia nem texto de enchimento | Marcelo / Rian | Teste + Chromium | pendente |
| 7 | Aba Posts renderiza `CardDoPost` com `@handle · tempo`, `r/roda` em linha própria, `⋯` no canto (apagar no perfil do dono, denunciar no de outra pessoa), player com onda cinza, só duração e ícone de ondas | Rian / Marcelo | Teste + Chromium | pendente |
| 8 | Feed e comunidades **não mudam** por causa do card, ou mudam só no que o Luiz decidiu (decisão 2). `CardDoPost.test.tsx`, `MenuDoPost.test.tsx` e `InicioOpenDesign.test.tsx` passam; captura do feed antes e depois sem diferença não prevista | Marcelo | Teste + Chromium | pendente |
| 9 | Viewports de 320, 360, 390 e 430 de largura, depois 768 e 1280. Sem rolagem horizontal, sem texto cortado, sem sobreposição, nome e `@handle` longos quebram ou cortam com reticências sem empurrar os botões | Marcelo | Chromium (320 a 430 também em aparelho) | pendente |
| 10 | Altura de tela: uso de `dvh`/`svh` onde a altura da tela importa, sem `100vh` que salta quando a barra do navegador some. Safe area com `env(safe-area-inset-*)` no topo e na barra inferior | Kayky / Marcelo | Código + aparelho | pendente |
| 11 | Alvos de toque >= 44x44px: compartilhar, editar, abas, seguidores, seguindo, `⋯`, play, ações do card, redes sociais. Medido por script no Playwright | Marcelo | Chromium | pendente |
| 12 | Sem layout shift no carregamento: altura reservada para avatar, números, abas e player antes do dado chegar; CLS medido no Playwright fica em 0 (ou abaixo de 0,02, com justificativa escrita se passar de 0) | Marcelo | Chromium | pendente |
| 13 | Rolagem de app nativo: `overscroll-behavior` tratado, última lista rola até o fim sem ficar atrás da barra inferior, sem rolagem aninhada travada, sem jitter ao subir e descer a lista | Marcelo | Chromium + aparelho | pendente |
| 14 | Toque: `-webkit-tap-highlight-color` tratado e `touch-action: manipulation` nos controles, para não haver zoom por toque duplo nem atraso. Nada de `maximum-scale` que bloqueie o zoom da pessoa | Kayky / Marcelo | Código + aparelho | pendente |
| 15 | Tema escuro e tema claro conferidos, com contraste legível; verde elétrico em no máximo 2 aparições por estado, e a escolha de quem cede registrada pelo Rian | Rian | Chromium | pendente |
| 16 | `prefers-reduced-motion` respeitado: sem transição ou animação de entrada quando a pessoa pediu menos movimento | Marcelo | Teste + Chromium com a emulação ligada | pendente |
| 17 | Áudio do card toca com um toque, só um player por vez, estado de erro do áudio dito como erro | Marcelo | Chromium + aparelho | pendente |
| 18 | `typecheck`, `lint`, `test` e `build` passam. `TelaPerfilOpenDesign.test.tsx` atualizado ao novo layout sem apagar cobertura de seguidores, edição e compartilhar | Marcelo | CI local | pendente |
| 19 | Documentos antes do código: `ESCOPO_ATUAL.md`, ADR 0010, `forum-comunidades.md` e `MAPA_DE_PAGINAS_E_FLUXOS.md` com a exceção registrada e o mapa corrigido | Tiago / Rian | Revisão de documentos | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela"). Sem aparelho real, itens 9, 10, 13, 14 e 17 saem como `NÃO VALIDADO` em aparelho, mesmo com Playwright verde.

### As 7 perguntas de aceite (leitura do Tiago antes de abrir a oficina)

1. **Necessidade:** passa. É a dor que o Luiz levou, com print na mão. O perfil de ficha não é lugar de ouvir arroto de ninguém.
2. **Valor:** passa. Post com player no perfil faz do perfil um lugar de ouvir, não de ler cadastro. Ressalva: os números do cabeçalho só valem se saírem do servidor.
3. **Coerência:** passa com ressalva. Verde acima do orçamento no print (ver risco 3) e conflito de escopo com a decisão de 19/10 (resolvido pela exceção do Luiz, falta registrar nos documentos).
4. **Experiência:** exige prova. Itens 9 a 16 da matriz carregam isso; sem aparelho real não vira aprovado.
5. **Funcionamento ponta a ponta:** áudio toca no card do perfil e erro aparece como erro (itens 5, 7 e 17).
6. **Qualidade e prova:** Marcelo audita; falta de prova vira `NÃO VALIDADO`.
7. **Simplicidade:** Fase A usa só dados que existem e deixa Curtidas para a Fase B. Se o card ganhar prop só "para deixar preparado" para a Fase B, volta.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** a preencher pelo Iury ao consolidar.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` | `AJUSTA` | `BLOQUEIA` | `ISSUE_FUTURA` (a preencher)
- **Veredito Final do Tiago:** `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO` | `NÃO VALIDADO` (a preencher)
- **Pendências ou decisão necessária do Luiz:** abaixo.

### Ainda precisa de resposta do Luiz

1. **Aparelho e largura do print.** Qual celular e em qual largura? O print vem com moldura em 607px; sem o aparelho, o Rian calibra a 390 e registra a premissa. Não trava a especificação, mas pode mudar medida.
2. **Feed e comunidades herdam o card novo?** O perfil não pode ter um card diferente do feed. Se o `CardDoPost` muda (`@handle`, `r/roda` em linha própria, `⋯` no topo, onda cinza), o feed muda junto. Recomendação do Tiago: sim, mudam juntos e com um só card; o Rian valida as três telas. Se a resposta for "só o perfil", vira variante do card, o que pesa mais para manter. Se for "juntos" e o diff crescer, a pista sobe para sistêmica (gatilho c).
3. **"Melhor nota" e vitórias no X1.** O print traz só Posts, Seguidores e Seguindo. Pergunta: essas duas informações saem do cabeçalho? Recomendação: ficam, mas dentro da aba Arrotos, no topo da lista, porque são dado real que já existe. Sem resposta, o Rian segue a recomendação.
4. **Verde acima do limite.** Se o Rian não achar jeito de caber em 2 verdes por estado sem se afastar do print, a escolha entre print e regra é do Luiz. Só pergunto se o Rian devolver o conflito.
5. **Capa no desktop e controle "Trocar capa/Remover" do dono.** Rian propõe; preciso do Luiz só se a proposta tirar a capa por completo ou deixar o dono sem como trocar.
6. **Aba Salvos** continua só para o dono (padrão deste cartão). Confirma.

Respondidas e fora de dúvida: print vence a decisão de 19/10; sem chat; sem bolinha online; bio, cidade, "na roda desde" e redes ficam; capa some no mobile; Curtidas só do dono e só na Fase B.
