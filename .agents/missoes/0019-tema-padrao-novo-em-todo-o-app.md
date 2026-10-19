# Cartão de Missão 0019 — Tema padrão novo em todo o app: claro por padrão, paleta creme

> Decisão do Luiz em 19/10/2026, literal: **"O novo padrão de tema."** Ele respondeu assim sobre tema padrão e paleta, que são o item 1 e o começo do item 2 da seção 20 de `docs/design/forum-comunidades.md`. O Tiago leu como: vale o §3.2 da spec e o `DESIGN.md` v5, **claro por padrão, creme `#f5f3ea`, para todo mundo, mesmo com o sistema no escuro**. Se o Luiz queria seguir o tema do sistema, é só dizer. Cartão aberto como proposta. Issue: #253. Contexto: #251.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o Auê hoje tem três jeitos de ser claro e dois jeitos de decidir o tema, e quem troca de tela muda de mundo. O fórum novo abre claro (creme). O perfil, a comunidade antiga e a história abrem escuros quando não há nada guardado. O `src/index.css` tem escuro `#000000` e claro `#ffffff`, que não são os do `DESIGN.md` v5 (`#0a0a08` e `#f5f3ea`); as páginas públicas têm outro claro (`#f7f8f5`, esverdeado). Na prática: a pessoa entra num tópico creme, toca em "Tema claro" no perfil e **o primeiro toque não faz nada**. Causa provável, a confirmar pelo Kayky: o fórum aplica o claro sem guardar, o perfil lê "nada guardado" como escuro e o botão do perfil "muda" para o que a tela já estava.
- **Comportamento esperado na tela:**
  - **Sem preferência guardada: tema claro, creme**, em todas as telas do app, ignorando `prefers-color-scheme`. Sem flash escuro na abertura.
  - **Preferência da pessoa manda.** Ela só passa a existir quando a pessoa toca no botão de tema. Abrir uma tela nunca grava preferência.
  - **Um só dono do tema.** Fórum, perfil, comunidade antiga, história, Arena e X1 leem o mesmo lugar e aplicam o mesmo atributo no mesmo momento. O botão de tema funciona no primeiro toque em qualquer tela.
  - **Tokens por nome** (`--bg`, `--surface`, `--surface-2`, `--fg`, `--muted`, `--border`, `--border-strong`, `--accent`, `--accent-strong`, `--accent-on`, `--danger`, `--fg-soft`) com os valores do `DESIGN.md` v5, definidos **uma vez** em `src/index.css`. Nenhum hex solto em componente. Verde nunca é cor de texto nem de borda.
  - **Páginas públicas continuam com claro fixo próprio** (AGENTS §5; `src/shared/publico/tema-claro.css`, escopo `.publico-site`): `/`, `/login`, `/privacidade`, `/termos`, `/como-jogar`, `/como-arrotar`, `/tipos-de-arroto`, `/ranking-de-arrotos`, `/grupos`, `/videos-de-arroto`. Quem tem escuro guardado abre essas páginas claras do mesmo jeito.
  - **Barra do navegador e área segura** (iOS e Android) combinam com o tema da hora: sem faixa escura sobre creme no topo, sem faixa clara sob a barra inferior, `safe-area` pintada com `--bg`.
- **Decisões do Tiago para o Luiz não ter que decidir:**
  - **Paleta:** a do `DESIGN.md` v5 (tabela do §3.2 da spec). A tabela da spec e a do `DESIGN.md` §2.1 e §2.2 já são iguais; o que diverge é o código.
  - **Migração de quem já tem `bda-theme`:** hoje a tela do feed antigo (`TelaComunidade`) **grava** `bda-theme` toda vez que monta, mesmo sem a pessoa ter escolhido nada. Então um `dark` guardado quase sempre é o padrão antigo, não uma escolha. Regra: a escolha passa a ter um marcador (`bda-theme-v` com o valor `2`), escrito só pelo botão. Sem marcador: `light` guardado vale como escolha (só vinha de toque no botão) e `dark` guardado é ignorado e apagado, então a pessoa cai no claro. Com marcador, vale o que está guardado. Quem escolheu escuro de propósito antes de hoje é virado para claro uma vez e escolhe de novo em um toque. Esse custo é a pergunta 2 abaixo.
  - **Dois estados no botão** (claro e escuro). "Automático, segue o sistema" não entra; se o Luiz quiser, é outro cartão.
  - **Telas do feed antigo** (`TelaComunidade`, `TelaHistoria`, `ColunaTendencias` e companhia) morrem no corte 2e. Elas só ganham o suficiente para ler o tema do dono único e não gravar sozinhas. Sem redesenho, sem polimento de contraste além de "não quebra".
- **Arena (identidade forte):** o `ARENA.md` e o Art Bible (`docs/design/AUÊ!.md`) tratam a Arena como lugar escuro, com a Bolha verde. O protótipo `Arena.dc.html` já tem botão de tema e desenha os dois. A spec do fórum deixou a pergunta aberta (§20 item 2). Recomendação do Tiago: **a Arena segue o tema**, porque o Luiz falou "todo o app" e o protótipo já tem o claro; a condição é o Rian provar a Bolha, o Auê Score e o verde no creme, onde o verde elétrico some (1,07:1). Se o Rian reprovar, a Arena vira exceção documentada: escura fixa, com o botão de tema escondido dentro dela. **Enquanto o Luiz não responder, a Arena fica escura fixa** na etapa de fundação (escopo de token na raiz da Arena), para o claro entrar no app sem a Arena virar claro sem auditoria. Remover essa trava depois custa poucas linhas.
- **Fora de escopo (Não vira):**
  - redesenhar telas legadas que saem no 2e; mudar copy, rotas ou navegação;
  - "Automático" que segue o sistema; terceiro tema; paleta nova;
  - mexer nas páginas públicas além de garantir que continuam claras e iguais;
  - trocar o `#c6ff00` ou o orçamento de verde (no máximo 2 por estado);
  - tema por comunidade;
  - consertar a #280: o bloco `.forum-embutido` que ela cola no `forum.css` com tokens próprios é **dívida anotada aqui**, não motivo para atrasar a PR.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** não mexe em banco, contrato de dados, áudio nem motor da Arena. É token compartilhado, uma porta de tema e um script de boot. O alcance é largo (toca todas as telas), então o risco é de regressão visual, e quem pega isso é a matriz por tela da seção 4. **Gatilho para virar sistêmica:** se o Camillo concluir que o script de boot nas entradas HTML, a hospedagem (cache, CSP) ou o desempenho da primeira pintura exigem plano próprio, a etapa de fundação para e passa pelo Gate dele.
- **Fonte de verdade afetada:** `docs/design/design-system/system/DESIGN.md` (§2, hoje diz "Tema Escuro (padrão)"), `docs/design/forum-comunidades.md` §3.2 e §17, `docs/design/AUÊ!.md` (onde trata a Arena como escura), `src/index.css`, `AGENTS.md` §5 (fidelidade ao Design System e páginas públicas). O ADR 0001 vale para a fronteira: `localStorage`, `document` e `window` só em `src/plataforma/`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Etapas em PRs separadas, uma por vez.
- **Responsável pela implementação:** Kayky (tokens, telas, botão de tema) com Camillo dono da porta, do script de boot e da fronteira de armazenamento. Lucas não entra.
- **Especificação e Auditoria Visual:** Rian. Atualiza protótipos e `DESIGN.md` antes do código (lista abaixo) e audita cada tela aberta, nos dois temas.
- **Gate Arquitetural (Camillo / Lucas):** não aplicável, com o gatilho da seção 1. Camillo revisa a porta de tema, o script de boot e a lista das entradas HTML que carregam o app.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** duas perguntas, abaixo. As duas têm padrão; sem resposta, vale o padrão e o trabalho segue.
  1. **A Arena segue o tema ou fica escura fixa?** Padrão enquanto não responder: escura fixa; a recomendação do Tiago, depois que o Rian provar, é seguir o tema.
  2. **Quem escolheu escuro de propósito antes de hoje pode ser virado para claro uma vez** (não dá para separar quem escolheu de quem só passou pelo feed antigo, que gravava `dark` sozinho)? Padrão: sim, vira para claro e escolhe de novo em um toque. A alternativa é respeitar todo `dark` guardado, e aí a maioria de quem usa o app continua escuro e a decisão de hoje quase não chega a ninguém.

### O que o Rian atualiza antes do código (#253)

- `Design System.dc.html`: os dois temas lado a lado, claro como padrão, com os tokens da seção 1 (incluindo `--border-strong` e `--danger` claro `#c4161a`).
- Todos os `.dc.html` que nascem com `theme: 'dark'` (Arena, Comunidades, Jornada, Versões Webapp, Bonde): padrão claro. O `Bonde do Arroto.dc.html` já está marcado para ser substituído (spec §17); não gasta tempo nele além disso.
- `Arena.dc.html`: Bolha, Auê Score, métricas, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD` e `ERROR` no claro, com o veredito sobre o verde (resposta da pergunta 1).
- `Versões Webapp.dc.html`: quadros em 320, 375, 430, 768 e 1280, claro e escuro (já pedido no §17 da spec).
- `DESIGN.md` §2 ("padrão claro"), §2.3 (a "Prioridade 3" do verde, "Postar", some) e a nota de barra do navegador e área segura.
- `docs/design/AUÊ!.md`: onde diz que o fundo escuro é a superfície, conforme a resposta da pergunta 1.
- Inventário de hex solto em componente e CSS (lista de arquivo e linha) para o Kayky varrer.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop (3 colunas) e Webapp Mobile (Safari iOS e Chrome Android), incluindo o app adicionado à tela de início do iPhone. Casca nativa fora de escopo.
- **Estados obrigatórios da Arena:** nenhum muda. Todos os dez (`IDLE`, `RECORDING`, `ORIGIN`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD`, `REMATCH`, `ERROR`) precisam ser vistos no tema em que a Arena ficar, e `ERROR` com microfone negado, sem som e não é arroto não pode ficar ilegível.
- **Estratégia de entrega, em etapas, nesta ordem:**
  1. **Desenho e documentos (Rian).** Protótipos e `DESIGN.md` da lista acima. Sem código.
  2. **Fundação (Kayky e Camillo), PR única, sem tocar em tela:**
     - `src/index.css` alinhado ao `DESIGN.md` v5, `--border-strong` global; `forum.css`, `Comunidade.css` e o resto deixam de repetir valores e passam a ler o token;
     - uma porta de tema em `src/plataforma/web/` (generaliza a que o fórum já tem) com a regra de padrão claro, do marcador e da migração; `TelaPerfil`, `TelaComunidade` e `useLayoutDaConversa` hoje usam `localStorage` e `document` direto, fora da fronteira do ADR 0001, e passam a usar a porta;
     - script mínimo antes da primeira pintura nas entradas HTML que carregam o app, com um teste que derruba a suíte se uma entrada ficar para trás (mesmo desenho do `src/fonte-nas-entradas.test.ts`); o Camillo lista quais entradas são;
     - `<meta name="theme-color">` do `index.html` (hoje fixo em `#0a0a08`) e `apple-mobile-web-app-status-bar-style` (hoje `black`) acompanham o tema; a porta atualiza o `theme-color` quando o tema muda;
     - correção do primeiro toque do botão de tema;
     - a Arena fica escura fixa por escopo de token até a pergunta 1.
  3. **Varredura de telas (Kayky), uma PR por grupo,** na ordem: perfil; X1 por link (`/x1/:code`, `/d/:id`, `/b/:code`), que é a primeira impressão de quem recebe desafio no zap; Arena (depois da pergunta 1 e do veredito do Rian); páginas públicas e páginas estáticas de grupos (só conferir que seguem claras); feed antigo (só "não quebra").
  4. **Auditoria (Rian e Marcelo)** com a matriz da seção 4. Sem print e sem aparelho, não fecha.
- **Maior risco de quebra ou mentira visual:**
  - A fundação mudar a Arena para claro sem ninguém ter olhado (por isso a trava).
  - Texto fraco ou ilegível por token novo em tela que tinha cor fixa; verde elétrico invisível no creme (botão `--accent` no claro leva o contorno interno da spec §3.2).
  - Flash de escuro na abertura porque o atributo chegou depois da primeira pintura.
  - Barra de status do iPhone escura sobre o creme, ou faixa branca sob a barra inferior no Safari.
  - Página pública herdar o tema escuro guardado.
  - O marcador da migração se perder (armazenamento barrado em aba privada do Safari): a pessoa precisa cair no claro, e o botão precisa funcionar na sessão sem gravar.
  - Quem tem aba antiga aberta regravar `dark` sem marcador: o marcador existe justamente para isso valer como "ainda não escolheu".
  - A dívida do `.forum-embutido` da #280 duplicar hex depois da fundação.
- **Limite da promessa:** o contraste que se mede é o das telas e estados que o Rian e o Marcelo abrem; tela que ninguém abriu não está provada. A barra do navegador no iOS não é controlável em todos os modos (aba comum, tela de início e janelas de navegador embutido de outros apps se comportam diferente), então o aceite diz em quais modos foi visto. 320 e 768 são provados com a janela do navegador no tamanho, não em aparelho; 375 é em aparelho real.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Evidência por tela quer dizer: print do claro e do escuro em 320, 375, 768 e 1280, mais contraste de texto (4,5:1) conferido, mais verde dentro do orçamento. 375 em Safari iOS e Chrome Android reais; 320, 768 e 1280 no navegador com a janela no tamanho. Onde a Arena fica escura fixa, a linha dela prova o escuro nas quatro larguras e que o botão de tema não promete o que não faz.

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| Protótipos e `DESIGN.md` com padrão claro, tokens iguais à spec §3.2 e veredito da Arena registrado | Rian | Documento / Protótipo aberto | pendente |
| `src/index.css` bate com o `DESIGN.md` v5 valor a valor nos dois temas, com `--border-strong` global; nenhum outro arquivo redefine esses tokens fora de `.publico-site` | Camillo / Marcelo | Código (revisão e busca por hex) | pendente |
| Sem preferência guardada, qualquer tela do app abre claro, mesmo com o sistema no escuro | Marcelo | Teste / Safari iOS / Chrome Android | pendente |
| Migração: sem valor; `light` sem marcador; `dark` sem marcador; `dark` com marcador; `light` com marcador; armazenamento barrado. Cada caso cai onde a seção 1 diz | Marcelo | Teste (unidade na porta) | pendente |
| Abrir qualquer tela não grava preferência; só o botão grava, com o marcador | Marcelo | Teste / Código | pendente |
| Botão de tema funciona no primeiro toque em fórum, perfil, comunidade antiga, história, X1 e Arena (onde houver botão); a escolha vale ao trocar de tela e ao recarregar | Marcelo | Safari iOS / Chrome Android / desktop | pendente |
| Sem flash escuro na abertura (vídeo ou captura de quadros em rede lenta) | Marcelo | Safari iOS / Chrome Android | pendente |
| Entradas HTML do app carregam o mesmo script; teste derruba a suíte se uma ficar para trás | Camillo | Teste / Código | pendente |
| `localStorage` e `document` do tema só existem em `src/plataforma/`; as telas legadas passaram a usar a porta | Camillo / Marcelo | Código (lint de fronteira) | pendente |
| `theme-color` e o estilo da barra de status acompanham o tema, no carregamento e depois de trocar; área segura inferior pintada com `--bg` | Rian / Marcelo | Safari iOS (aba e tela de início) / Chrome Android | pendente |
| Páginas públicas continuam claras e idênticas, mesmo com `dark` guardado; páginas estáticas de grupos com `theme-color` da paleta pública | Marcelo / Rodrigo | Safari iOS / desktop | pendente |
| Diretório de comunidades, claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS | pendente |
| Comunidade (lista de tópicos), claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS | pendente |
| Tópico com respostas, player e nota, claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS | pendente |
| Novo tópico (dialog no desktop, tela cheia no celular), claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS / Chrome Android | pendente |
| Explorar, claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS | pendente |
| Perfil (`/perfil` e `/u/:handle`) com abas Tópicos e Respostas e o que o perfil mantém, claro e escuro, 320/375/768/1280 | Rian / Marcelo | Tela aberta / Safari iOS | pendente |
| Arena: `IDLE`, `RECORDING`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD` e `ERROR`, no tema decidido, 320/375/768/1280; Bolha, Auê Score e métricas legíveis; verde dentro do orçamento | Rian / Marcelo | Tela aberta / Safari iOS / Chrome Android | pendente |
| X1 aberto por link (`/x1/:code`, `/d/:id`, `/b/:code`): desafio recebido, responder, `VERSUS`, `SCOREBOARD`, link expirado, claro e escuro, 320/375/768/1280 | Rian / Marcelo | Safari iOS / Chrome Android | pendente |
| Login e Landing: claro fixo, sem mudar | Rian | Tela aberta | pendente |
| Feed antigo, história e comunidade antiga: abrem, leem o tema do dono único e não quebram, nos dois temas, 375 e 1280 (sem polimento) | Marcelo | Safari iOS / desktop | pendente |
| Verde nunca em texto nem em borda; botão `--accent` no claro com contorno interno; no máximo 2 aparições por estado | Rian | Tela aberta, claro e escuro | pendente |
| Anton só em marca, nota e Arena; Archivo no resto, nos dois temas | Rian | Tela aberta | pendente |
| Contraste de texto >= 4,5:1 nos dois temas em todas as telas acima | Rian | Medição nas telas abertas | pendente |
| `prefers-reduced-motion` e foco visível continuam intactos nos dois temas | Marcelo | Safari iOS / Chrome Android | pendente |
| A dívida `.forum-embutido` da #280 está listada para a fundação e ficou zerada ao fim | Camillo / Marcelo | Código | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

> "Compilou" não é "funcionou". Token certo no CSS não prova a tela: a prova é a tela aberta, nos dois temas, nas quatro larguras.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** as duas perguntas da seção 2. A leitura de "o novo padrão de tema" como claro para todo mundo, ignorando o sistema, está no topo e vale até o Luiz dizer outra coisa.
