# Cartão de Missão 0031 — Três ajustes do perfil: foco da folha de foto, toque no nome do card e rolagem de lado na barra inferior

Aberto em 21/10/2026. Insumo: auditoria do Marcelo no PR #330 (perfil Fase A, mergeado na `main` em `4ea81fc`), achados do commit `f3b1d05`, nível `AJUSTA`. Nenhum bloqueia; os três saíram do PR por decisão do Luiz e viram este cartão. Herda do [0030](0030-perfil-igual-ao-print-fase-a.md) a matriz de aceite, os aparelhos e as decisões do Luiz. Este cartão não implementa nada: só enquadra.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o perfil mobile está quase com cara de app, mas três coisas ainda entregam que é página web. (1) Quem navega por teclado abre a folha de troca de foto e, com Shift+Tab, cai na página de trás, e aí o Esc não fecha mais. (2) O nome de quem postou, e parte do `@handle`, só pega toque numa faixa de uns 20px, porque o link `r/roda` cobre o resto: o dedo erra e abre a comunidade em vez do perfil. (3) Na tela de 320px, quem ainda não entrou na conta arrasta a página 3px para o lado por causa da barra inferior. O Luiz quer o perfil mobile perfeito, sem quebrar e sem "sambar"; os três são o que falta para isso.
- **Comportamento esperado na tela:**
  1. **Folha de foto** (`FolhaDaFoto.tsx/.css`, `src/features/novo-aue`): com a folha aberta, o foco nunca sai dela. Tab e Shift+Tab ciclam entre Fechar, Trocar foto e Remover foto (quando existe). Esc fecha de qualquer foco dentro, inclusive com o foco no contêiner. Ao fechar, o foco volta ao avatar (já funciona; precisa continuar).
  2. **Nome no card** (`CardDoPost.tsx/.css`): o link do nome e o do `@handle` têm área tocável de pelo menos 44px de altura e não se sobrepõem a nenhum vizinho (link `r/roda`, menu `⋯`, avatar). Vale para feed, Seguindo, comunidade, thread e perfil, porque o card é um só.
  3. **Barra inferior** (`casca.css`, regras do `@media (max-width: 699px)`): em 320px, visitante e logado, a página não rola para o lado. A causa se corrige, não se esconde.
- **Fora de escopo (Não vira):**
  - Mascarar o problema com `overflow-x: hidden` em `html`, `body` ou `.app`. Se aparecer no diff, volta.
  - Mexer na grade do `.app`, nas rotas, no FAB (além do que a causa do item 3 exigir, e só com o Camillo dizendo) ou na barra lateral do desktop.
  - Prop nova no `CardDoPost`, mudança de assinatura do `MenuDoPost` ou do `PlayerDoArroto`.
  - Mudar a assinatura de `manterFocoNoDialogo` (ver item 1 do Gate).
  - Barra inferior de 67px para 56px e `stroke-width` 2.4 no ícone ativo: seguem em cartão separado (decisão abaixo).
  - Ver o backlog no fim: foco de teclado que começa pela barra inferior, aba Curtidas (Fase B), issue das variáveis `--border-strong`.
- **Pista (Lane):** **Full flow comum, com Gate leve do Camillo, por escrito, antes de o Kayky abrir código.**
- **Por que esta pista:**
  - Não é Fast lane. Fast lane é ajuste local de causa conhecida e sem efeito em contrato. Aqui o item 2 muda o card que quatro telas usam, o item 3 mexe na casca que todas as telas usam e a causa dele ainda não está provada. O item 1 mexe num helper de `src/plataforma/web/` que outros três diálogos também usam (`ModalConexoes`, `DialogoDoPost`, `ModalAjustarImagem`).
  - Não é sistêmica. Não há porta, RPC, migração, contrato de dados, modelo de áudio nem prop nova. É comportamento de foco, geometria de toque e uma regra de CSS dentro de módulos e contratos que já existem. O mesmo raciocínio do 0030 vale: risco de regressão visual, não de arquitetura.
  - O Gate do Camillo é necessário porque os três itens mexem em peça compartilhada. É leitura de código com nota escrita, não investigação de plano arquitetural.
- **Gate leve do Camillo — o que ele confere (por leitura, sem implementar):**
  1. **Helper de foco.** `focoNoDialogo.ts` só trata Tab quando o foco está exatamente no primeiro ou no último focável. Com o foco no contêiner (`tabIndex={-1}`, que é onde a folha abre), Shift+Tab não bate em nenhum dos dois e o navegador sai do diálogo. A peça certa para estender é esta mesma, porque já vive em `src/plataforma/web/` (ADR 0001) e já é usada por quatro diálogos. Camillo confirma que dá para corrigir sem mudar a assinatura, tratando "foco no contêiner ou fora da lista" como borda, e lista o efeito nos três outros chamadores. Se a correção exigir assinatura nova, ou um listener em `document` fora de `plataforma/`, ele diz e a pista sobe.
  2. **Esc com foco escapado.** O `onKeyDown` da folha está no contêiner; se o foco sair, o Esc nunca chega. Camillo diz se o foco preso resolve (o foco nunca sai, então o Esc sempre chega) ou se precisa de segunda camada, e onde ela mora.
  3. **Card.** Os quatro chamadores (`InicioOpenDesign.tsx` feed, Seguindo e comunidade; `ThreadDeComentarios.tsx`) mais o perfil continuam compilando sem edição. A correção fica em `CardDoPost.css` sob `.card-do-post`, sem `!important`, sem tocar em `.post-body` nem em `casca.css`. Camillo aponta o seletor mais estreito e confirma que nenhum vizinho (`r/roda`, `⋯`, avatar) perde área que já tem.
  4. **Casca.** Camillo localiza a causa dos 3px com medida (qual elemento passa de 320px, em visitante e em logado) antes de qualquer edição. Hipótese a provar ou derrubar: cinco colunas `1fr` na `.mobile-bottom-nav` crescem até o conteúdo mínimo do rótulo mais largo e empurram a barra além da largura. Se for isso, o conserto é `minmax(0, 1fr)` e corte do rótulo, não overflow escondido. Ele diz também se a causa vive só no `@media (max-width: 699px)` ou se encosta na estrutura da casca (gatilho abaixo).
  5. **Teste de layout.** `casca.layout.test.ts` roda antes (base verde) e depois. Ele já trava o `.app`, o item ativo sem verde, o FAB verde e o menu lateral; ganha uma asserção da correção do item 3.
  6. **Fronteira.** Nenhuma linha nova de `window`, `navigator`, `document` ou `localStorage` em `features/`. A busca de foco é `document.activeElement` e fica no helper em `plataforma/web/`.
- **Gatilhos que sobem a pista para sistêmica (Iury para e devolve ao Tiago):**
  - (a) a correção do foco exigir assinatura nova em `manterFocoNoDialogo` ou código de navegador fora de `src/plataforma/`;
  - (b) o card precisar de prop nova ou o `MenuDoPost` mudar de assinatura;
  - (c) a causa dos 3px estar na grade do `.app`, nas rotas ou no FAB, e não só em largura e conteúdo da barra;
  - (d) a correção do toque no card fazer o cabeçalho crescer além do orçamento do item 2.4 da matriz sem o Luiz ter visto.
- **Fonte de verdade afetada:** `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md` (componentes canônicos, sem mudança prevista), `docs/design/design-system/system/DESIGN.md` (alvo de toque de 44px), `docs/technical/adr/0001-arquitetura-oficial-do-aue.md` (fronteira do navegador), protótipo `Bonde do Arroto.dc.html` (nome legado de `Tropa do Arroto`). Não mexe em `ARENA.md`, `REGRAS.md` nem `VISAO.md`.

### Decisão do Tiago sobre o item 3: barra de 67px e `stroke-width` 2.4

**Os 3px entram neste cartão. A barra de 67px contra 56px e o `stroke-width` 2.4 ficam em cartão separado.**

Justificativa, em ordem:
1. Os 3px são defeito: a página rola para o lado e o critério do Luiz é "sem quebrar". Entra.
2. Mudar a altura da barra (67 para 56) muda o espaço reservado embaixo de toda tela (`padding-bottom` das páginas, posição do FAB, safe area) e o que o Luiz vê em todo o app. Isso é redesenho de peça global, com regressão em todas as rotas, e o Rian ainda precisa cravar a medida no protótipo. Misturar com um conserto de largura aumenta o diff e o risco sem ajudar a corrigir o defeito.
3. O `stroke-width` 2.4 é acabamento visual puro. Não bloqueia nada.
4. Condição para juntar, caso o Camillo prove que a causa dos 3px é a mesma coisa que faz a barra ter 67px (por exemplo, o rótulo quebrando em duas linhas e esticando a altura): ele escreve isso na nota do Gate, o Rian crava 56 no protótipo e o Tiago reavalia. Sem essa prova, segue separado.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Uma entrega por vez; o cartão de Fase B (Curtidas) não abre enquanto este não tiver veredito.
- **Responsável pela implementação:** Kayky (`FolhaDaFoto`, `CardDoPost.css`, `casca.css`). O ajuste em `src/plataforma/web/focoNoDialogo.ts` também é dele, com o Camillo revendo, porque é a peça mais compartilhada.
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Gate leve do Camillo, escrito neste cartão, **pendente**. Lucas fica de fora (sem áudio, sem backend).
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver o fim.

### Sequência

1. **Iury** recebe o cartão, confere a mesa e libera o Camillo e o Rian em paralelo (um lê código, o outro mede tela).
2. **Camillo** faz as medidas do item 4 do Gate (qual elemento passa de 320px) e escreve a nota no cartão: aprovado, aprovado com condição ou barrado, mais a resposta sobre a barra de 67px. Sem a nota, o Kayky não abre branch.
3. **Rian** especifica só o que precisa de desenho: como o link do nome e o do `r/roda` convivem com 44px cada sem sobreposição e sem inflar o card (duas opções com captura, se houver mais de uma), e o que acontece com o rótulo da barra em 320px (corte, reticências ou ícone sozinho). A folha de foto já tem desenho; foco não muda o visual. Atualiza o protótipo só se a geometria do card mudar.
4. **Kayky** abre código com o cartão, a nota do Camillo e o desenho do Rian. Ordem de commits, cada um com `typecheck`, `lint`, `test` e `build` rodados:
   1. Foco do diálogo: `focoNoDialogo.ts` + teste novo + `FolhaDaFoto` se precisar. Peça pequena e isolada.
   2. Toque no card: `CardDoPost.css` (e `.tsx` só se a estrutura exigir) + capturas de antes e depois nas telas.
   3. Barra inferior por último: `casca.css` + asserção em `casca.layout.test.ts`. É a mudança global e a mais barata de reverter, como no 0030.
5. **Rian + Marcelo** validam: Rian com a tela aberta e as capturas lado a lado; Marcelo com teclado, toque e regressão.
6. **Iury** consolida com evidência; **Tiago** passa pelas 7 perguntas e dá o veredito.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** webapp mobile (Safari iOS / Chrome Android), desktop (o card e o foco da folha valem lá também), documentação. Estados da Arena não mudam.
- **Aparelhos de referência (decisão do Luiz):** iPhone 17 (402x874, Safari iOS) e Motorola G67 (412x915, Chrome Android, **premissa não confirmada**). Faixa de teste de 320 a 430, mais 768 e 1280 para regressão, claro e escuro.
- **Maior risco de quebra ou mentira visual:**
  1. **Foco preso em um diálogo mexe em quatro.** `ModalConexoes`, `DialogoDoPost` e `ModalAjustarImagem` usam o mesmo helper. Consertar a folha e travar outro modal é o risco principal do item 1.
  2. **Duas faixas de 44px empilhadas não cabem em 40px.** Nome e `r/roda` ficam em linhas seguidas, cada uma com uns 20px de texto. Dar 44px a cada uma sem sobrepor exige altura, e altura no card é altura em todo o feed. Esse é o ponto do item 2 que o Luiz enxerga (ver pergunta no fim).
  3. **Esconder em vez de consertar** a rolagem lateral. Um `overflow-x: hidden` apaga o sintoma e deixa a barra mais larga que a tela, com item cortado.
  4. **Barra inferior é global.** Qualquer mudança vira regressão silenciosa em toda rota sem a captura em várias telas.
  5. **Sambar:** o ajuste do card mudar a altura do cabeçalho depois que o dado chega (pulo de layout). Altura reservada, CLS em 0.
  6. **Medida sem aparelho.** Chromium não prova Safari. O foco por teclado e o toque real em aparelho ficam `NÃO VALIDADO` até alguém conferir no iPhone 17 e no Moto.
- **Limite da promessa:** este cartão não promete foco perfeito em leitor de tela (VoiceOver/TalkBack) além do que o Marcelo medir; promete foco preso e Esc por teclado e a área de toque medida em Chromium e conferida em aparelho. Teclado em iPhone depende de teclado físico.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Ambientes: Teste = `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e testes de componente (Vitest). Chromium = Playwright. Aparelho = Safari iOS (iPhone 17) e Chrome Android (Moto G67, premissa) reais. O que ficar só em Chromium sai `NÃO VALIDADO` em aparelho.

### Item 1 — Folha de foto: foco preso

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| 1.1 | Com a folha aberta (foco inicial no contêiner), Shift+Tab vai para o último botão e Tab vai para o primeiro. Nenhuma tecla leva o foco para fora do diálogo | Marcelo | Teste (RTL) + Chromium | pendente |
| 1.2 | 12 Tab seguidos e 12 Shift+Tab seguidos, a partir do contêiner, do primeiro e do último botão: `document.activeElement` está dentro do diálogo em todos os passos, com e sem "Remover foto" (perfil com e sem foto) | Marcelo | Chromium | pendente |
| 1.3 | Esc fecha com o foco no contêiner, em cada botão e logo depois de um Shift+Tab. Depois de fechar, o foco está no avatar | Marcelo | Teste + Chromium | pendente |
| 1.4 | Toque fora da folha continua fechando; "Trocar foto" e "Remover foto" continuam chamando os mesmos handlers de antes (sem mudança de comportamento) | Marcelo | Teste | pendente |
| 1.5 | Teste novo do helper `focoNoDialogo` cobre: foco no contêiner, foco fora da lista, lista vazia, tecla que não é Tab, Tab no último, Shift+Tab no primeiro | Marcelo | Teste | pendente |
| 1.6 | Sem regressão nos três outros diálogos (`ModalConexoes`, `DialogoDoPost`, `ModalAjustarImagem`): ciclo de Tab e Shift+Tab igual ao de antes nas bordas, Esc e fechar iguais, foco volta a quem abriu | Marcelo | Teste + Chromium | pendente |
| 1.7 | Fronteira: `arquitetura.fronteira.test.ts` verde; nenhuma API de navegador nova em `features/` | Marcelo / Camillo | Teste + leitura | pendente |
| 1.8 | Visual da folha intacto (título, botões, ancoragem embaixo no celular, caixa no desktop), claro e escuro | Rian | Chromium | pendente |
| 1.9 | Teclado físico no iPhone 17 (Safari) e no Moto (Chrome Android): Tab/Shift+Tab/Esc na folha | Luiz (roteiro do Marcelo) | Aparelho | `NÃO VALIDADO` até conferir |

### Item 2 — Toque no nome do card (vale para as 5 telas)

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| 2.1 | O link do nome e o do `@handle` têm caixa de toque com altura >= 44px e largura >= 44px, medida por `getBoundingClientRect` da área que responde ao toque (não do texto) | Marcelo | Chromium (script) | pendente |
| 2.2 | Nenhuma sobreposição de área tocável entre nome, `@handle`, `r/roda`, `⋯` e avatar: interseção entre as caixas igual a zero | Marcelo | Chromium (script) | pendente |
| 2.3 | Toques de verdade nas bordas de cada caixa (topo, meio, base) caem no destino certo: nome e `@handle` vão ao perfil (`/u/:handle`), `r/roda` vai a `/c/:slug`, `⋯` abre o menu. Nenhum toque no nome abre a comunidade | Marcelo | Chromium | pendente |
| 2.4 | Altura do cabeçalho do card dentro do orçamento: até +8px por card sem consulta; acima disso o Rian mostra captura e o Luiz decide antes do código (ver pergunta). Altura medida antes e depois, em 320, 390 e 430 | Rian / Marcelo | Chromium | pendente |
| 2.5 | Regressão nas telas que usam o card, em 320, 360, 390, 402, 412, 430, 768 e 1280, claro e escuro, capturas antes e depois: **feed (com Seguindo), comunidade, thread de comentários e perfil (aba Posts)**. Nada cortado, sem sobreposição, sem rolagem lateral, nome e `@handle` longos com reticências sem empurrar o `⋯` | Marcelo / Rian | Chromium | pendente |
| 2.6 | Nada mais muda no card: `⋯` com o mesmo comportamento, player, ações, nota do feed, reações emoji do feed, verde do perfil (no máximo 2 por estado) e sem layout shift (CLS em 0 no perfil) | Marcelo / Rian | Teste + Chromium | pendente |
| 2.7 | `CardDoPost.test.tsx`, `MenuDoPost.test.tsx`, `InicioOpenDesign.test.tsx`, `DenunciarEApagar.test.tsx`, `ThreadDeComentarios.test.tsx` e `TelaPerfilOpenDesign.test.tsx` passam sem enfraquecer asserção | Marcelo | Teste | pendente |
| 2.8 | Toque real com o dedo no nome em feed, comunidade e perfil, no iPhone 17 e no Moto: acerta o perfil de primeira, sem abrir a comunidade por engano | Luiz (roteiro do Marcelo) | Aparelho | `NÃO VALIDADO` até conferir |

### Item 3 — Barra inferior sem rolagem lateral

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| 3.1 | **Medida de antes** registrada: em 320px, visitante e logado, `scrollWidth - clientWidth` da página e qual elemento passa da borda. Sem essa medida o Kayky não começa | Camillo / Marcelo | Chromium | pendente |
| 3.2 | Em 320, 360, 390, 402, 412 e 430, visitante e logado, nas rotas `/`, feed, `/perfil`, `/u/:handle`, comunidades e uma comunidade aberta: `document.documentElement.scrollWidth === clientWidth` (zero de rolagem lateral) | Marcelo | Chromium | pendente |
| 3.3 | A correção está na causa (largura da grade ou do rótulo). Prova: o diff não traz `overflow-x: hidden` em `html`, `body` nem `.app`, e a barra cabe inteira na tela, sem item cortado | Camillo / Marcelo | Leitura de código + Chromium | pendente |
| 3.4 | Os cinco itens da barra seguem com alvo >= 44px, rótulo legível ou, se o Rian mandar cortar, com reticências e `aria-label` completo; FAB do ARROTAR intacto (tamanho, posição, verde) | Marcelo / Rian | Chromium (script) | pendente |
| 3.5 | `casca.layout.test.ts` verde **antes** (base) e **depois**, com uma asserção nova que trava a correção. Nenhuma outra regra do arquivo enfraquecida | Marcelo | Teste | pendente |
| 3.6 | Regressão da casca: capturas antes e depois da barra em 320, 390, 430 e 1280, claro e escuro. Desktop e menu lateral sem nenhuma diferença; safe area inferior intacta; o fim da última lista rola até o fim sem ficar atrás da barra | Marcelo / Rian | Chromium; safe area só em aparelho | pendente |
| 3.7 | Altura da barra (hoje 67px) **não muda** neste cartão, salvo se a nota do Camillo juntar o assunto (ver decisão do item 3) | Marcelo | Chromium (medida) | pendente |
| 3.8 | iPhone 17 (Safari) e Moto (Chrome Android): sem rolagem lateral em nenhuma tela do perfil e do app, com a barra do navegador aparecendo e sumindo | Luiz (roteiro do Marcelo) | Aparelho | `NÃO VALIDADO` até conferir |

### Critério final (comum aos três)

| # | Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|---|
| F.1 | Perfil mobile perfeito, com cara de app, sem quebrar e sem "sambar": reexecutar os itens 9, 11, 12, 13, 15 e 21 da matriz do 0030 em 320 a 430 (sem rolagem lateral, alvos de 44px, CLS em 0, rolagem sem prender, claro e escuro, regressão de feed e comunidade). Nenhum deles piora | Marcelo / Rian | Chromium | pendente |
| F.2 | `typecheck`, `lint`, `test` e `build` verdes em cada commit. Falha conhecida e fora deste cartão: o teste intermitente da Arena (`Arena.test.tsx`, contagem 3-2-1), que também falha na `main`; se aparecer, o Marcelo roda de novo e registra | Marcelo | CI local | pendente |
| F.3 | Gate leve do Camillo escrito neste cartão antes do código, com a resposta sobre a barra de 67px | Camillo | Leitura de código + nota | pendente |
| F.4 | Cada achado do Marcelo no `f3b1d05` tem prova de fechamento citada com o número da linha da matriz acima | Marcelo | Relatório | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela"). Sem aparelho real, saem `NÃO VALIDADO` os itens 1.9, 2.8 e 3.8 e, do item 3.6, a safe area. O Moto G67 só deixa de ser premissa quando o Luiz confirmar o 412x915; até lá a linha do Chrome Android fica `NÃO VALIDADO` por inteiro.

### O que cada um valida

- **Rian** olha a tela aberta: o cabeçalho do card com 44px de toque ainda parece o cabeçalho do print (sem inflar, sem espaço vazio estranho), o rótulo da barra em 320px, a folha de foto igual à de antes, claro e escuro. Mede o toque pelo desenho; quem prova o toque é o Marcelo.
- **Marcelo** prova: teclado (1.1 a 1.6), toque medido e clicado (2.1 a 2.3), rolagem lateral e regressão (2.5, 3.2, 3.6, F.1). Entrega um roteiro curto de aparelho (cinco passos) para o Luiz conferir no iPhone e no Moto, sem jargão.
- **Camillo** não valida tela: prova a causa dos 3px, o efeito do helper nos outros diálogos e a fronteira.

### As 7 perguntas de aceite (leitura de entrada, sem veredito)

1. **Necessidade:** passa. São três defeitos que o Marcelo mostrou, e os três quebram o "app nativo" que o Luiz pediu.
2. **Valor:** passa. Foco que não vaza, toque que acerta o perfil e página que não balança são o básico de um perfil confiável no celular.
3. **Coerência:** passa, com atenção ao verde e ao DESIGN.md (44px de toque). Nada muda de regra do 0030.
4. **Experiência:** exige prova em aparelho; Chromium não basta.
5. **Funcionamento ponta a ponta:** a folha precisa fechar por Esc em qualquer foco e devolver o foco ao avatar; o nome precisa abrir o perfil, não a comunidade.
6. **Qualidade e prova:** Marcelo audita; sem aparelho vira `NÃO VALIDADO`.
7. **Simplicidade:** três correções pequenas, sem prop nova, sem contrato novo. Se o conserto da barra puxar redesenho, volta ao Tiago.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** a preencher pelo Iury ao consolidar.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` | `AJUSTA` | `BLOQUEIA` | `ISSUE_FUTURA` (a preencher)
- **Veredito Final do Tiago:** `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO` | `NÃO VALIDADO` (a preencher)
- **Pendências ou decisão necessária do Luiz:** abaixo.

### Pendências do Luiz (só o que muda o que ele vê)

1. **Altura do cabeçalho do card.** Para dar 44px de toque ao nome sem invadir o `r/roda`, o card pode ficar um pouco mais alto em todo o feed. Padrão do Tiago: até 8px por card passa sem consultar. Se o Rian não conseguir ficar dentro disso, ele leva duas capturas e o Luiz escolhe antes de o Kayky codar. Não é pergunta agora; vira pergunta só se estourar.
2. **Moto G67.** Confirmar se o aparelho real é 412x915 (pergunta que já vinha do 0030). Sem isso, o Chrome Android fica `NÃO VALIDADO`.
3. **Conferência no aparelho.** Quando o Marcelo entregar o roteiro, o Luiz passa pelo iPhone 17 e pelo Moto (itens 1.9, 2.8 e 3.8). Sem isso o veredito sai com ressalva.

Todo o resto (qual seletor, qual técnica de área de toque, como prender o foco, qual regra da grade) a squad decide.

### Backlog (fora deste cartão, sem implementar)

- **Foco de teclado que começa pela barra inferior antes da superior.** Anterior ao PR #330. Pede ajuste na ordem do DOM ou de `tabindex` na casca e conversa com leitor de tela; abre cartão próprio.
- **Aba Curtidas (Fase B).** Privada, só do dono, com porta e Gate completo do Camillo/Lucas. Segue o 0030.
- **Issue das variáveis `--border-strong`.** `casca.css` e `Comunidade.css` declaram o token com hex diferentes do `DESIGN.md`. Issue futura, anotada pelo Camillo no 0030.
- **Barra inferior de 67px para 56px e `stroke-width` 2.4 no ícone ativo.** Backlog do 0030 mantido; cartão separado, salvo a condição do item 4 da decisão do Tiago acima.
- **Harness e CSS morto** (`e2e/harness.tsx` fora de sincronia com o card; regras `.burp-player/.play/.wave` órfãs em `casca.css`). Já registrados no 0030, continuam fora.

## Gate Arquitetural do Camillo (21/10/2026)

Leitura de código mais medida no Chromium do Playwright (build 1194, `deviceScaleFactor` 2, `--hide-scrollbars`). Harness: cópia do `.shots/main.tsx` do Kayky no scratchpad, só com `?visitante=1` para tirar a sessão (o original fixa `autenticado`). Nada em `src/` foi alterado. Os scripts de medida ficam em `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/` (`cam-*.mjs`, fora do git) para o Marcelo reaproveitar.

**Veredito: APROVADO COM CONDIÇÕES.**

- Item 1 (foco): aprovado. Corrige-se no helper, sem assinatura nova.
- Item 3 (rolagem lateral): aprovado, mas a causa não é a do cartão. Não é a barra inferior, é o botão "Entrar" do topo do visitante. O arquivo a editar muda (`BarraSuperior.css`, não `casca.css`) e a asserção nova não vai no `casca.layout.test.ts`.
- Item 2 (toque no card): parado. O conserto custa 12px ou 24px por post, acima do orçamento de 8px. O gatilho (d) disparou. Não sobe para sistêmica; é a consulta que o cartão já previa: Rian leva as duas capturas, Luiz escolhe.

### A. Foco da folha (`focoNoDialogo.ts`)

- **Assinatura:** `manterFocoNoDialogo(evento: KeyboardEvent, dialogo: HTMLElement | null): void` (`focoNoDialogo.ts:5`). Só reage a Tab. A lista de focáveis (linha 7) é botão e campo habilitados, `[href]` e `[tabindex]` diferente de -1, então o contêiner (`tabIndex={-1}`) fica fora dela. Só age quando `document.activeElement` é exatamente o primeiro (com Shift) ou o último (sem Shift), linhas 11-17.
- **Quem usa** (grep em `src` e `e2e`, completo): `FolhaDaFoto.tsx:2,40`, `ModalConexoes.tsx:3,40`, `DialogoDoPost.tsx:2,48`, `ModalAjustarImagem.tsx:2,47`. Mais nenhum. Os quatro abrem com `.focus()` no contêiner (`FolhaDaFoto:24`, `ModalConexoes:24`, `DialogoDoPost:26`, `ModalAjustarImagem:26`), então os quatro têm o mesmo furo.
- **Por que escapa:** com o foco no contêiner, nem `primeiro` nem `ultimo` batem, o helper não chama `preventDefault` e o navegador anda para trás no documento. Reproduzido: perfil do dono, 390x800, clica no avatar. Foco inicial `div[role=dialog]`. Shift+Tab leva o foco a `button "Compartilhar"`, fora do diálogo. Esc em seguida não fecha (`[role=dialog]` continua com contagem 1).
- **Dá para estender sem mudar a assinatura:** sim. Menor diff, uns 8 linhas, só em `plataforma/web/`: `dentro = ativo !== dialogo && dialogo.contains(ativo)`. Shift+Tab com `!dentro || ativo === primeiro` vai ao último. Tab com `!dentro || ativo === ultimo` vai ao primeiro. Lista vazia: `preventDefault` e foco no contêiner. Testei essa versão num arquivo temporário (jsdom, 14 casos, atual e proposta lado a lado): com o foco no contêiner e Shift+Tab, a atual dá `defaultPrevented` falso e a proposta dá verdadeiro com o foco em "Remover". Borda, meio da lista e tecla que não é Tab ficam idênticos.
- **Efeito nos outros três diálogos:** é a mesma correção, não regressão. Três mudanças reais: (1) Shift+Tab logo depois de abrir passa a ir ao último botão, em vez de sair do diálogo; (2) foco no `body` (clique em área sem foco) volta para dentro no próximo Tab; (3) lista vazia (por exemplo `DialogoDoPost` enquanto envia, com botões desabilitados) segura o foco em vez de soltar. Esc, fechar e devolução do foco a quem abriu não mudam, porque ficam nos componentes.
- **Esc:** o foco preso resolve. O `onKeyDown` do contêiner recebe o Esc de qualquer filho e do próprio contêiner. Com o foco que não sai, o Esc sempre chega. Toque fora fecha pelo overlay (`FolhaDaFoto.tsx:30`). Segunda camada seria listener em `document`: não é preciso e não entra.
- **O que os testes travam hoje:** nada de Tab. Não existe teste do helper (grep `focoNoDialogo|manterFoco` só acha os quatro componentes). Os testes dos diálogos só disparam Esc (`ModalConexoes.test:58`, `DialogoDoPost.test:53,60`, `ModalAjustarImagem.test:52`, `TelaPerfilOpenDesign.test:528`). Teste novo em `src/plataforma/web/focoNoDialogo.test.ts` com `// @vitest-environment jsdom` (padrão do `controleDeDialogo.test.ts`), com os casos do 1.5 mais "foco no `body`" e "lista vazia". jsdom não anda o Tab nativo: prova `defaultPrevented` e `activeElement`. O Tab de verdade é do Marcelo no Chromium (1.2).

### B. Toque no nome do card (`CardDoPost.tsx` e `.css`)

- **Onde estão:** dentro de `<header className="post-meta-header">` (`CardDoPost.tsx:166`) ficam o link do nome `.author-profile-link` (171), o `@handle` `.post-meta-handle` (183) e o `⋯` (`MenuDoPost`, 203). Logo abaixo, `.post-meta-badges` (206) com o `r/slug` em `.badge-comunidade` (209).
- **Por que 20px:** nome e `@handle` têm caixa de 44px (`CardDoPost.css:119-128`, `min-height: 44px; margin: -12px 0`). O `r/roda` também (`:202`, `height: 44px; margin: -12px 0; z-index: 1`). As linhas de texto têm 20px e ficam coladas, então as duas caixas de 44px disputam os mesmos 24px e o `r/roda` ganha por `z-index`. Medido por `elementFromPoint`, card-relativo, 1º post:

| alvo | caixa | área que responde | texto |
|---|---|---|---|
| nome e `@handle` | 1..45 (44) | 0,5..20,5 (**20**) | 16..30 |
| `r/roda` | 21..65 (44) | 20,5..65 | 35..50 |
| `⋯` | 1..45 | 44 | |
| avatar (`::after`, x 25..69) | 10,5..55 | 44,5 | |

  O centro do texto do nome (23) cai dentro do `r/roda`. Só 4,5px do texto abrem o perfil; o resto abre a comunidade. Igual em 320 e 390 e nas cinco telas, porque o CSS é um só.
- **Pseudo-elemento e padding não resolvem:** o conflito é vertical, no mesmo espaço. Só espaço resolve. Não precisa mexer no TSX: injetei CSS na página aberta e medi.
- **Duas opções, CSS só em `CardDoPost.css` sob `.card-do-post`, medidas iguais em 320 e 390 e em feed, perfil e thread:**

| | crescimento por post | nome e `@handle` | `r/roda` | resto |
|---|---|---|---|---|
| **A** | **+12px** (feed 390: 117 para 129, +10%; perfil: 161 para 173, +7%) | 44, caixa 1..45 presa à borda do card | 44 onde nada vem embaixo; com corpo ou player logo abaixo cai a 20-22px (medi 20 no feed em 320, 22 na thread) | o texto do nome desce 12px (28..42, hoje 16..30) e deixa de alinhar com o topo do avatar; vão nome-roda segue em 5px |
| **B** | **+24px** (feed 390: 117 para 141, +21%; perfil: 161 para 185, +15%) | 44, caixa 0,5..44,5 | 44 sempre, 44,5..89 | zero sobreposição e zero corte; nome no lugar de hoje; vão nome-roda de 5px para 29px |

- **Orçamento de 8px estourado nas duas. Parei.** Crescimento zero não existe: a caixa do nome teria de subir uns 11px acima da borda do card, por cima do que vem antes (compositor, abas do perfil, card anterior). Não recomendo. Se o 44px do `r/roda` do protótipo (aceite do Rian) vale, é a B. Se o Luiz preferir o card mais baixo e aceitar `r/roda` com toque menor, é a A.
- **Os 5 pontos onde o card é renderizado:** `InicioOpenDesign.tsx:1703` (feed), `:1744` (Seguindo), `:1932` (comunidade), `:2139` (perfil), `ThreadDeComentarios.tsx:269` (post-raiz da thread). Mais `e2e/harness.tsx`, já fora de sincronia, fica como está.
- **Testes que travam o cabeçalho:** `CardDoPost.test.tsx` (texto e links), `InicioOpenDesign.test.tsx:163,632-633` (links "Abrir perfil de ..."), `DenunciarEApagar.test.tsx:67-68` (`⋯` dentro do `<article>`), `TelaPerfilOpenDesign.test.tsx:450`, `estilosDoPerfil.test.ts:21-25` (avatar `::after` com `inset: -2px`, sem `!important` no arquivo) e `verdeDoPerfil.test.ts`. Nenhum trava altura, margem nem tamanho de caixa. Nada quebra com A ou B, mas nada trava o conserto: a prova é o script do Marcelo (2.1 e 2.2) com `elementFromPoint`, não CSS lido.
- **Seletor mais estreito:** os que já existem (`.post-meta-header`, `.post-meta-ident`, `.author-profile-link`, `.post-meta-handle`, `.post-meta-badges`, `.badge-comunidade`, `.menu-do-post`), todos sob `.card-do-post` (0,2,0). Sem `!important`, sem `.post-body`, sem `casca.css`. `⋯` e avatar não perdem área: estão em x diferentes do nome (avatar até 69, nome desde 79, `⋯` desde 261 em 320).

### C. Os 3px em 320

- **Medido** (`scrollWidth` contra `clientWidth`, 320x640 e 320x800; feed, Seguindo, comunidade, thread, perfil e perfil de outra pessoa):

| | 320 | 330, 340, 359 | 360, 390, 430 |
|---|---|---|---|
| visitante | **323 contra 320 (+3)** | +3 | 0 |
| logado | 320 | 0 | 0 |

  A barra inferior não é a causa. Hipótese do cartão derrubada: com `.mobile-bottom-nav` escondida, 323; com `.sidebar` escondida, 323; com `repeat(5, minmax(0, 1fr))`, 323; com os rótulos escondidos, 323. As cinco colunas (55, 71, 56, 55, 55 mais quatro vãos de 4) somam 308 e cabem. A barra só parece culpada porque é `position: fixed; width: 100%` e herda o viewport já alargado: `.sidebar` 323 e nav 311 no visitante, 320 e 308 no logado.
- **Elemento:** esconder elemento por elemento devolve 320 só com `header.topbar` e, dentro dele, o botão "Entrar" do visitante (`BarraSuperior.tsx:68-70`, `className="icon-btn"`). `src/index.css:220-227` define `.icon-btn { width: 44px; height: 44px }`, pensado para botão de ícone. O texto "Entrar" em Archivo 800 16px mede 50,1px: botão em 266..310, texto em 273..323,1. Em menos de 360px o padding lateral do topo é 10px (`BarraSuperior.css:97-103`), o texto passa 13px da caixa e sobra 3px de página. A partir de 360 o padding é 14 e ainda cabe, mas o texto sai da caixa do botão em todas as larguras (capturas `cam-topbar-320.png` e `cam-topbar-390.png` no scratchpad). Logado não tem o problema: `.top-actions` vira `display: none` (`BarraSuperior.css:44`).
- **Mesma causa dos 67px contra 56px? Não.** 67 = `padding` do `.sidebar` (4px em cima e 6px embaixo, `casca.css:1036`) + `border-top` de 1px (`:1038`) + item de 56px (`:1070`). Medido `sbH` 67 e `navH` 56 em 320, 360, 390 e 430. É vertical e não depende da largura. Fica separado, como o Tiago decidiu.
- **Menor diff:** uma regra em `BarraSuperior.css`, no bloco mobile, junto da `.topbar .top-actions` (linha 92). Não mexer no `.icon-btn` global do `index.css` (o fluxo de áudio reaproveita a classe, `EstilosDoFluxo.tsx:14`). Medido com CSS injetado, 320, visitante:

| opção | botão | campo de busca | `scrollWidth` |
|---|---|---|---|
| hoje | 44, texto vaza | 179,7 | 323 |
| C: `padding: 0; font-size: 13px` | 44 (texto 40,7 em 42 úteis; 1,3px de folga, apertado no Safari) | 179,7 | 320 |
| D: `padding: 0; font-size: 12px` | 44 (4px de folga) | 179,7 | 320 |
| B: `width: auto; padding: 0 8px; font-size: 13px` | 58,7 | 165 | 320 |
| A: `width: auto; padding: 0 12px` | 76,1 | 147,5 | 320 |

  Nota para o Rian: o visitante já vê o placeholder cortado ("Buscar pessoas, ro…" em 320, "rodas e …" em 390). O placeholder mede 162,7px a 12px e o campo útil do visitante tem 136. O logado, com 231, vê inteiro. B e A cortam mais. O teste "a busca do celular cabe em 320 e 360 sem cortar a copy" (`estilosDoPerfil.test.ts:14-19`) só lê CSS e só vale para o logado.
- **`casca.layout.test.ts`:** quatro testes (`.app` com `275px minmax(0, 600px) 320px` e `justify-content: center`; item ativo da barra sem verde; ARROTAR verde; `.nav-item.active` em `--aue-text`). Rodei antes: 4 passando. Como `casca.css` não muda, ele segue verde e **nenhuma asserção nova entra nele**. A trava da correção entra em `estilosDoPerfil.test.ts`, que já lê `BarraSuperior.css`: a regra do `.icon-btn` dentro do topo no mobile, com `padding: 0` e `font-size` de 12 ou 13px (ou `width: auto`, conforme a opção do Rian), e o arquivo sem `overflow-x: hidden`. jsdom não mede largura; a prova é o `scrollWidth === clientWidth` do Marcelo (3.2), incluindo 330, 340 e 350, porque o estouro é da faixa inteira abaixo de 360.
- **A medida de antes do 3.1 está registrada aqui.** O 3.3 vale com outra redação: a causa está na largura do botão do topo, não na grade nem no rótulo da barra.

### D. Gatilhos

- (a) Não disparou. Mesma assinatura do helper; `document.activeElement` já estava lá, em `plataforma/web/`.
- (b) Não. As duas opções do card são CSS puro, sem prop nova. O `MenuDoPost` só perde a margem negativa.
- (c) Não. A causa não está na grade, nas rotas, no FAB nem na barra inferior.
- (d) **Disparou, pela medida:** +12px (A) ou +24px (B) contra 8px. Não vira sistêmica, porque é decisão visual sem porta nem contrato. O item 2 fica parado até o Rian levar as capturas e o Luiz escolher.
- (e) do 0030 (casca, grade, FAB): não. A barra inferior nem entra.
- (f) do 0030 (CSS do card): nada novo. O arquivo já tem 385 linhas e o conserto mexe em umas 10 a 15, sem token novo.

### E. Fronteira do ADR 0001

Nada novo fora de `src/plataforma/`. O helper segue em `plataforma/web/` e `document.activeElement` já é dele. Nenhuma linha nova de `window`, `navigator`, `document` ou `localStorage` em `features/`. A dívida que já existe (`window.prompt` e `navigator.share` em `CardDoPost.tsx:103-115`, `document.addEventListener` em `MenuDoPost.tsx:26-30`) não cresce neste cartão. Rodei antes: `arquitetura.fronteira.test.ts`, `casca.layout.test.ts`, `estilosDoPerfil.test.ts` e os testes de `ModalConexoes`, `DialogoDoPost`, `ModalAjustarImagem` e `BarraSuperior`: 31 passando.

### F. Condições para o Kayky (todas obrigatórias)

1. **Foco (commit 1):** só `src/plataforma/web/focoNoDialogo.ts` e o teste novo `focoNoDialogo.test.ts`. Assinatura intacta, `FolhaDaFoto.tsx` sem edição. Lógica da seção A. Rodar sem editar os testes de `ModalConexoes`, `DialogoDoPost`, `ModalAjustarImagem` e `TelaPerfilOpenDesign`.
2. **"Entrar" do visitante (commit 2):** só `BarraSuperior.css` (regra única no bloco mobile) e a asserção em `estilosDoPerfil.test.ts`. Não editar `casca.css`, `casca.layout.test.ts` nem o `.icon-btn` de `index.css`. Sem `overflow-x: hidden` e sem `!important`. Opção escolhida pelo Rian.
3. **Card (commit 3), só depois de o Rian e o Luiz escolherem A ou B.** Só `CardDoPost.css`, seletores existentes sob `.card-do-post`, sem TSX, sem `!important`, sem tocar `.post-body` nem `casca.css`. Medir o crescimento nas cinco telas e mostrar que bate com a opção.
4. **Provas, no estilo do script do Marcelo:** `elementFromPoint` no topo, meio e base de nome, `@handle`, `r/roda`, `⋯` e avatar (item 2.3); `scrollWidth === clientWidth` em visitante e logado em 320, 330, 340, 350, 360, 390, 430 (3.2); capturas antes e depois das cinco telas do card e do topo do visitante em 320 e 390.
5. **Fronteira:** nenhuma API de navegador nova em `features/`.
6. **Pedido ao Tiago:** corrigir o texto do cartão. O item 3 do enquadramento, o item 4 do Gate leve, o 3.3 e o 3.5 apontam `casca.css` e `casca.layout.test.ts`; passam a apontar `BarraSuperior.css` e `estilosDoPerfil.test.ts`. O 3.1 está cumprido por esta nota.

**Ordem segura:** foco, depois "Entrar" (os dois isolados e independentes da decisão do card), por último o card. Cada commit com `typecheck`, `lint`, `test` e `build`.

### O que o Rian decide antes do Kayky abrir o commit 3

1. **Card, A ou B**, com as duas capturas lado a lado em 390 e 320 (feed e perfil).
2. **Desenho do "Entrar" do visitante em 320:** C ou D (botão de 44 com rótulo menor), B, A, ou ícone com `aria-label` "Fazer login" (já existe). Define só o commit 2.
3. **Rótulo da barra inferior em 320:** nada a decidir. O rótulo mais largo ("Comunidades", 70,9px) cabe, a barra mede 308 sem corte e sem rolagem lateral. A pergunta do cartão sobre corte, reticências ou ícone sozinho cai. O 56px do protótipo segue em cartão separado.

### Pergunta que chega ao Luiz (só o que ele vê)

O toque certo no nome faz cada post ficar mais alto no feed, na comunidade, no perfil e na thread: **12px** (nome e `@` com toque de 44, `r/roda` com toque menor onde o corpo encosta) ou **24px** (tudo com 44, mais espaço entre nome e roda). O Rian leva as duas capturas. Fora isso, o botão "Entrar" do visitante vai mudar um pouco (hoje o texto sai da caixa), mas isso é do Rian, não é pergunta.

## Desenho do Rian (21/10/2026)

Medi no Chromium (Playwright, build 1194, `isMobile` e `hasTouch` ligados, Archivo e Anton carregadas) com o harness do Camillo copiado para o scratchpad, e abri o protótipo no mesmo navegador em 320x640, 320x800, 360x800 e 402x874. Nada em `src/` foi alterado. Capturas em `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/` (fora do git, caminhos completos nas seções abaixo).

**Resumo:** o toque do card cabe em **+8px por post com 36px de alvo e zero sobreposição** (opção A), ou em **+24px com 44px** (opção B). A é a que eu recomendo. A decisão é do Luiz, porque 44px só existe pagando +24px. A barra inferior não tem rolagem lateral e o "Entrar" do visitante é o culpado, como o Camillo mediu; mas a barra tem um defeito real em 320 e 360 que ninguém tinha visto: o ARROTAR fica fora do centro da tela. Proponho o conserto e mexi no protótipo. O foco usa `--aue-text` (`--fg`), nunca verde.

### A. Toque de 44px no cabeçalho do card

**Por que as duas faixas de 44px não cabem:** o texto de cada linha tem 20px. Para duas caixas de 44px sem sobreposição os centros das linhas precisam ficar 44px afastados e hoje ficam a 20. Pseudo-elemento invisível e padding vertical não adiantam: o conflito é de espaço, não de técnica. A única variável é quanto a linha cresce. O corte fica no meio entre as duas linhas; o nome usa a folga do topo do card (12px de padding) e o `r/roda` usa os 12px que já tinha embaixo, sobre o corpo (como hoje e como o `.pf-room::after` do protótipo).

Medido por `elementFromPoint` (varredura de 0,5px no centro do alvo), mesma medida em 320 e 390 e nas quatro telas com card (feed, comunidade, thread, perfil). Altura em relação à borda do card:

| | crescimento por post | nome e `@handle` | `r/roda` | sobreposição entre nome, `@handle`, `r/roda`, `⋯` e avatar |
|---|---|---|---|---|
| hoje | 0 | **20** (0,5 a 20,5) | 44,5 (20,5 a 65) | 8 pares em 4 cards do perfil, 5 em 3 do feed |
| Z (0) | 0 | 32 | 32 | zero |
| **A (+8)** | **8** (perfil 161 para 169; feed 117 para 125, +6,8%) | **36** (0,5 a 36,5) | **36** (36,5 a 73) | **zero** |
| M (+16) | 16 | 40 | 40 | zero |
| **B (+24)** | **24** (perfil 161 para 185, +15%; feed 117 para 141, +21%) | **44** (0,5 a 44,5) | **44** (44,5 a 89) | **zero** |

Cada +1px de crescimento dá +0,5px de alvo. Z, A, M e B usam a mesma regra com uma variável (`--cab-linha`: 20, 24, 28, 32). O `⋯` mantém os 44px e se alinha ao centro da linha de cima (`margin-top` de -12px mais metade da diferença). Com nome e `@handle` longos (thread, 320) o `⋯` não sai do card e não há rolagem lateral: zero em todas as combinações.

**Observação ao Gate:** a opção A do Camillo (+12) e a minha A (+8) não são a mesma coisa. A dele mantém a caixa de 44 no nome e deixa o `r/roda` com 20 a 22px; a minha divide o espaço por igual e passa no orçamento. Com isso o gatilho (d) do cartão **não dispara para a A**; só dispara se o Luiz quiser os 44px do item 2.1.

**Capturas lado a lado** (hoje | A +8 | B +24), 390px, claro e escuro, perfil e feed. Cada uma tem a versão limpa e a versão com as áreas de toque pintadas (azul nome, verde-água `@handle`, laranja `r/roda`, magenta `⋯`, amarelo avatar):

- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-cabecalho-perfil-escuro.png` e `...-perfil-escuro-areas.png`
- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-cabecalho-perfil-claro.png` e `...-perfil-claro-areas.png`
- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-cabecalho-feed-escuro.png` e `...-feed-escuro-areas.png`
- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-cabecalho-feed-claro.png` e `...-feed-claro-areas.png`

**Como cada uma se parece:** A fica a um respiro do print (linha de cima e de baixo 4px mais soltas), o card ainda lê como o do print. B mostra um vão claro entre o nome e o `r/roda` (de 5px para 29px) e o card parece de outro app, mais arejado e com menos posts por tela.

**Minha recomendação: A.** O defeito que o Marcelo achou (tocar no nome abrir a comunidade) é a sobreposição, e a A a elimina: cada alvo tem 12px de folga de cada lado do centro do texto, e o 36px passa com sobra do mínimo de 24px da WCAG 2.5.8. Custa 8px por post, que é o que o Tiago liberou sem consultar. Os 44px do `--hit-target-min` do DESIGN.md pagariam 16px a mais em todos os posts de cinco telas, para ganhar 8px de alvo. **Exceção ao DESIGN.md a registrar se for A:** nome, `@handle` e `r/roda` do card com 36px de alvo, não 44; a linha 2.1 da matriz passa a pedir 36px e zero sobreposição. Se o Luiz quiser os 44, é a B, e a diferença é 16px por post.

**Regra para o Kayky** (só `CardDoPost.css`, seletores que já existem sob `.card-do-post`, sem TSX, sem `!important`). Testada com CSS injetado; `L` é 24px na A e 32px na B:

```css
.card-do-post { --cab-linha: 24px; }
.card-do-post .post-meta-ident { height: var(--cab-linha); }
.card-do-post .author-profile-link,
.card-do-post .post-meta-handle {
  align-self: flex-start; box-sizing: border-box; min-height: 0;
  height: calc(var(--cab-linha) + 12px);
  margin: -12px 0 0; padding: 12px 3px 0;
  line-height: var(--cab-linha);
}
.card-do-post .author-profile-link { margin-left: -3px; }   /* o texto não anda */
.card-do-post .post-meta-handle { display: block; }
.card-do-post .post-meta-dot, .card-do-post .post-meta-time { line-height: var(--cab-linha); }
.card-do-post .menu-do-post { margin: calc(-12px + (var(--cab-linha) - 20px) / 2) -12px -12px 0; }
.card-do-post .post-meta-badges { height: var(--cab-linha); align-items: flex-start; }
.card-do-post .badge-comunidade {
  z-index: auto; height: calc(var(--cab-linha) + 12px);
  margin: 0 0 -12px -3px; padding-inline: 3px; line-height: var(--cab-linha);
}
.card-do-post .badge-nota { align-self: center; }
```

O alvo é a própria caixa do link (padding e margem negativa), não um `::after`, porque o `overflow: hidden` do link, que faz a reticência do nome longo, cortaria um pseudo-elemento. Por isso o Marcelo mede o alvo com `getBoundingClientRect` e confirma com `elementFromPoint`: os dois dão o mesmo número. O `z-index: 1` do `r/roda` sai (não é mais preciso). O espaço entre o texto do nome e o do `@handle` continua 6px (3 de cada lado).

**Reserva de altura (sem pulo):** a altura da linha é fixa (`--cab-linha`), não depende de dado. O card não muda de altura quando o tempo, a nota ou o handle chegam, então o CLS do perfil segue em 0.

### B. Barra inferior em 320 e 360

**Primeiro, o que a medida mostrou:** o Camillo está certo e eu repeti por outro caminho. Com `isMobile` ligado, o visitante em 320 tem `innerWidth` 323. Escondendo elemento por elemento (CSS aplicado antes do primeiro layout, porque o Chrome de celular não encolhe o viewport depois), só some com `.topbar` e, dentro dela, com `.top-actions`: o botão "Entrar" (44px de caixa, texto de 56). Esconder a barra inferior, a `.sidebar`, os rótulos ou trocar a grade por `minmax(0, 1fr)` não muda nada. Logado dá 320. Em 360, 402 e acima dá zero nos dois estados. A hipótese das colunas `1fr` está derrubada: as cinco colunas somam 308 e cabem.

**Entrar do visitante (desenho para o commit 2 do Camillo):** `width: auto; min-width: 44px; padding: 0 10px; font-size: 14px; font-weight: 700`, só no bloco mobile do `BarraSuperior.css`. Botão de 63x44 em 320 e 360, `scrollWidth` 320, campo de busca de 160 em 320 (hoje 180) e 188 em 360 (hoje 208). Escolhi essa entre as opções do Camillo (a B dele, com 14px/700 em vez de 13px) porque 12 ou 13px de texto em caixa de 44 fica apertado no Safari e o rótulo não pode parecer dentro de um quadradinho. O placeholder do visitante já era cortado e continua ("Buscar pessoa…" em 320); se o Tiago quiser a copy inteira, encurta para "Buscar" abaixo de 360, decisão de texto que não tomo. Captura: `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-topbar-visitante-320.png`.

**A barra em si (o que a medida achou):** os rótulos não quebram e a altura (56 na barra, 67 na `.sidebar`) não muda em nenhuma largura. O defeito é de equilíbrio, nos dois estados:

| largura | colunas hoje (px) | ARROTAR fora do centro | "Comunidades" |
|---|---|---|---|
| 320 | 55, 71, 56, 55, 55 | **7,9** (9,4 com Comunidades ativa) | 70,9 (73,1 em negrito), col. maior que as outras |
| 360 | 65, 71, 65, 65, 65 | 2,8 (4,2 ativa) | idem |
| 390 a 430 | iguais | 0 a 0,4 | cabe com folga de 0 a 9px |

A causa é a coluna do meio-esquerda crescer até o rótulo (`1fr` tem mínimo automático) e as outras repartirem o resto. O espaço entre os ícones sai desigual (67, 67, 59, 59 em 320) e o botão ARROTAR sai do eixo da tela. É o tipo de coisa que dá cara de página web.

**Desenho (só `casca.css`, bloco `@media (max-width: 699px)`, nada novo fora disso):**

```css
@media (max-width: 389px) {
  .sidebar .mobile-bottom-nav { grid-template-columns: 56px minmax(0, 1fr) 56px minmax(0, 1fr) 56px; gap: 0; }
  .mobile-nav-item span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
@media (max-width: 339px) {
  .mobile-nav-item:not(.mobile-nav-item--arrotar) span { font-size: 10px; }
}
```

- As três colunas de 56px (Feed, ARROTAR, Perfil) e as duas do meio dividindo o resto dão **ícones a distâncias iguais e o ARROTAR no centro exato**: espaço entre ícones 63px em 320, 69 em 344, 73 em 360, 77 em 375; desvio do ARROTAR 0 em todas.
- Precisa do seletor `.sidebar .mobile-bottom-nav` (0,2,0): `.sidebar nav { gap: 4px }` (`casca.css:111-117`, 0,1,1) ganha de `.mobile-bottom-nav` sozinho e o `gap: 0` não pega.
- **Rótulos:** 11px em 340 ou mais (negrito no ativo, como já é); **10px de 320 a 339**, em todos os rótulos juntos, porque "Comunidades" em 11px/700 mede 73,1 e a coluna de 320 tem 70. Com 10px mede 66,4 e sobra 3,6px. Nunca quebra linha (altura mantida) e, se uma fonte de reserva alargar, corta com reticência, e o `aria-label` completo já existe ("Rodas e comunidades"). Medido: nenhum rótulo cortado, nenhuma colisão com o botão ARROTAR (6px de vão entre o fim do rótulo e a borda do botão em 320) em 320, 344, 360, 375, com cada item ativo.
- **De 390 para cima nada muda** (a regra não vale lá): iPhone 17 (402) e Moto G67 (412, premissa) ficam como estão. Em 390 o ativo "Comunidades" tem folga 0 hoje; não toquei.
- FAB, altura 67 contra 56 e `stroke-width`: intactos, seguem para o cartão separado.

**Isto está além do que o Gate liberou** (o Camillo disse que `casca.css` não muda). Proponho como commit 4, opcional, só se o Tiago aceitar: é a mesma barra, CSS puro, e prova por script. Se o Tiago recusar, o protótipo volta ao que era (a linha acrescentada no `Bonde do Arroto.dc.html`, abaixo).

**Protótipo, 320 e 360:** o `Bonde do Arroto.dc.html` tinha o mesmo defeito, mais forte (colunas 59, 85, 52, 59, 59 em 320; ARROTAR 13,2px fora do centro em 320 e 8,2 em 360). **Não tem os 3px**: aberto na aba Perfil em 320x640 e 320x800, `scrollWidth` 320, nenhum elemento passa da borda (o protótipo nem tem o botão "Entrar" no topo). A aba Início passa de 320 por causa do botão "Postar" do compositor; é legado fora do perfil e não mexi. Atualizei só a barra do Perfil: `.pf-ni` sem padding padrão do botão e sem quebra, grade de 56/1fr/56/1fr/56 até 389px, rótulo de 10px até 339px. Medido depois: desvio do ARROTAR 0 em 320, 360 e 402, altura 56, rótulos inteiros. Antes e depois:

- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-proto-barra-320x640.png`
- `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-proto-barra-360x800.png`
- código real, hoje contra proposta: `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-barra-320.png`, `...-barra-360.png` e `...-barra-402.png` (o de 402 mostra que nada muda)

O card do protótipo (`.pf-post`) **não foi alterado**: ele só tem o `r/roda` com alvo de 44 e o nome nem é link. Fecho essa linha do protótipo depois da escolha do Luiz.

### C. Anel de foco

Nenhum token de foco no DESIGN.md. O `base.css` do design system manda `outline: 2px solid var(--accent)`, mas o foco **não pode ser verde**: a aba ativa e o ARROTAR já gastam os dois verdes do estado (opção A do Luiz) e um anel verde numa terceira coisa estoura o limite. O código já usa `--aue-text`, que vem de `--fg`. Fica assim, nos dois temas:

| onde | cor | espessura | offset | forma |
|---|---|---|---|---|
| folha de foto (Fechar, Trocar foto, Remover foto) | `--aue-text` (`--fg`: #f5f3ea escuro, #0a0a08 claro) | 2px | **+2px** (como já está) | raio do botão, 12px |
| card: nome, `@handle`, `r/roda` | `--aue-text` | 2px | dentro da caixa de toque | **anel só em volta da linha de texto**, 24px de altura, raio 8px |
| card: `⋯` e botões de ação | `--aue-text` | 2px | -4px (como já está) | círculo e caixa, sem mudança |

- Contraste do anel sobre `--bg`: cerca de 17 a 18:1 nos dois temas (WCAG 2.4.11 pede 3:1). Sobre `--surface` da folha também passa com folga.
- **Anel do card:** `outline: 0` no `:focus-visible` e um `::before` dentro do link (`position: absolute; left: 0; right: 0; height: 24px; border: 2px solid var(--aue-text); border-radius: 8px; box-sizing: border-box; pointer-events: none`), com `top: 12px` no nome e no `@handle` e `top: 0` no `r/roda`, e `position: relative` nos três. Dentro da caixa de toque o `overflow: hidden` do link não corta. O anel de `outline` na caixa inteira (36 ou 44px de altura) ficava gigante em volta de 13px de texto e o do `r/roda` cortava a primeira linha do corpo; testei os dois, o `::before` é o que aguenta.
- O verde não aparece em nenhum foco, então a contagem do estado não muda (aba ativa e ARROTAR, 2 no escuro e 1 no claro, como no aceite anterior). Sem sombra, sem gradiente.
- Capturas: `/tmp/claude-0/-home-user-aue/46fce86f-8195-57a6-9152-e07d428cf658/scratchpad/rian3/lado-a-lado-foco-card-escuro.png`, `...-foco-card-claro.png`, e a folha com foco em "Trocar foto": `.../foco-folha-trocar-escuro.png` e `.../foco-folha-trocar-claro.png` (mais `foco-folha-fechar-*.png` e `foco-folha-remover-*.png`, a última sem Remover porque o perfil de teste não tem foto).
- Reproduzi o defeito do item 1 antes de desenhar: abre a folha, Shift+Tab leva o foco a `button.action-btn--share` do card, fora da folha, e o Esc não fecha mais. Desenho nenhum muda na folha; o visual dela segue o aceito no 0030.

### D. O que o Marcelo e o Kayky medem

| item | o que medir | valor esperado | estado |
|---|---|---|---|
| 1.1 a 1.3 | `document.activeElement.closest('.folha-da-foto')` depois de cada Tab e Shift+Tab, a partir do contêiner, do primeiro e do último botão; Esc em cada ponto | sempre dentro; a folha fecha e o foco volta ao avatar | Chromium; teclado físico no iPhone e no Moto `NÃO VALIDADO` |
| 1.8 | anel de foco da folha | 2px `--aue-text`, offset 2px, nos dois temas | Chromium |
| 2.1 | `getBoundingClientRect` dos links e `elementFromPoint` em x = esquerda + min(largura/2, 20), de 0,5 em 0,5px | **A:** nome e `@handle` 36 (0,5 a 36,5), `r/roda` 36 (36,5 a 73). **B:** 44 e 44. Tolerância de 0,5px (a borda do card conta 1px) | Chromium |
| 2.2 | interseção entre as caixas de nome, `@handle`, `r/roda`, `⋯` e avatar | **zero** em todos os pares, nas quatro telas, 320 e 390 | Chromium |
| 2.3 | `elementFromPoint` no topo (+2px), meio e base (-2px) de cada caixa | nome e `@handle` caem em `/u/:handle`, `r/roda` em `/c/:slug`, nunca o nome em `/c/` | Chromium |
| 2.4 | altura do card, 1º post, 320, 390 e 430 | **A:** +8px (perfil 169, feed de texto 125). **B:** +24px (185 e 141). Se a altura medida fugir mais de 1px, volta | Chromium |
| 2.5 e 2.6 | rolagem lateral, `⋯` dentro do card, nome e `@handle` longos com reticência, CLS, verde | zero rolagem, `⋯` à direita da borda do card, CLS 0, verde igual ao de hoje | Chromium |
| 3.1 e 3.2 | `innerWidth`, `documentElement.scrollWidth` e `clientWidth` em 320, 330, 340, 350, 360, 390, 402, 412, 430, visitante e logado. **Precisa de contexto móvel (`isMobile: true`, `hasTouch: true`)**: sem ele o Chrome de mesa não alarga o viewport e o teste passa mesmo com o defeito | `scrollWidth === innerWidth === largura` em todas; o botão "Entrar" com 63x44 e `scrollWidth` do botão igual à `clientWidth` | Chromium |
| 3.4 (se o commit 4 entrar) | desvio do ARROTAR: `abs(centro do botão - largura/2)`; espaço entre os centros dos ícones; `scrollWidth <= clientWidth` de cada rótulo; altura da barra e da `.sidebar` | desvio <= 0,5px; espaços iguais com tolerância de 0,5px (63 em 320, 73 em 360); rótulo sem corte (folga >= 3px em 320 com Comunidades ativa); barra 56 e `.sidebar` 67 | Chromium |
| 3.6 | capturas antes e depois em 320, 390, 430 e 1280, claro e escuro | desktop e menu lateral idênticos; de 390 para cima, idêntico | Chromium |

**Fica `NÃO VALIDADO` sem aparelho real:** (1) o comportamento do Safari iOS: o iOS tem a mesma regra de alargar o viewport quando algo passa da borda, mas quem prova é o iPhone; a barra do navegador aparecendo e sumindo muda a altura útil e só o aparelho mostra; (2) fonte: a Archivo é a variável do projeto, mas o Safari e o Chrome do Android podem fatiar o texto com 0,5 a 1px de diferença, o que importa na folga de 3,6px do "Comunidades" em 320 (por isso o 10px e a reticência de reserva); (3) toque real com o dedo em 36 ou 44px, erro de pontaria e zona do polegar (2.8); (4) `env(safe-area-inset-*)`, o recorte do Dynamic Island e o teclado na busca; (5) teclado físico no iPhone e no Moto (1.9); (6) VoiceOver e TalkBack (o cartão já limita a promessa); (7) o Moto G67 segue premissa em 412x915, então o Chrome Android fica `NÃO VALIDADO` por inteiro.

### O que depende do Luiz e o que depende do Gate

- **Luiz (muda o que ele vê):** card A (+8px, alvo 36) ou B (+24px, alvo 44). Eu recomendo A. As capturas estão na seção A. O "Entrar" maior (63px) e o ARROTAR no centro são ajustes pequenos; o Tiago pode levar junto se achar que ele quer ver.
- **Tiago:** aceitar ou não o commit 4 da barra (centralizar o ARROTAR em 320 a 389), porque passa do que o Gate liberou. E, se for A, registrar a exceção do 36px ao DESIGN.md e mudar a linha 2.1 para 36px com zero sobreposição.
- **Camillo (conferir):** (1) o `.sidebar .mobile-bottom-nav` precisa da especificidade (0,2,0), senão o `gap: 0` perde para `.sidebar nav { gap: 4px }`; (2) a regra do `Entrar` é a opção B dele com 14px/700 e `padding: 0 10px`, 63px de largura; a trava em `estilosDoPerfil.test.ts` lê `width: auto` e o `font-size`; (3) se o commit 4 entrar, a asserção nova vai em `casca.layout.test.ts` (grade de 56/1fr/56/1fr/56 em `max-width: 389px` e o `gap: 0`), porque aí `casca.css` muda; (4) o `.badge-nota` do feed passa a `align-self: center` e o `z-index: 1` do `r/roda` sai; (5) o teste de medida dele deu `scrollWidth` 320 em 320 no visitante com `--hide-scrollbars`; o meu deu 323 só com contexto móvel ligado, então a prova do Marcelo (3.2) tem de rodar assim.
