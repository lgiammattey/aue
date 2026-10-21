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
