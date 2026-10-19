# Cartão de Missão 0017 — Frontend do fórum de comunidades: porta, adaptador e telas

> Segunda camada da direção do Luiz de 19/10/2026 (#251). O cartão 0016 fez o chão: o banco do fórum (migrações 14, 15 e 16) já está aplicado em produção, conferido em leitura. Agora a pessoa precisa conseguir entrar nisso. Esta entrega é grande, então ela sobe em pedaços fechados, um por vez. Cartão aberto como proposta; cada pedaço só começa quando o anterior estiver provado.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o banco já sabe o que é comunidade, tópico e resposta, mas ninguém enxerga isso. Quem entra no Auê ainda cai no feed e no causo solto. Falta o caminho que o Luiz desenhou: achar a turma, abrir uma conversa, ler e ouvir, responder ou abrir um assunto novo. Enquanto a tela não existir, o acervo convertido e as regras do servidor não servem pra ninguém.
- **Comportamento esperado na tela:**
  - **Descobrir:** `/comunidades` mostra o diretório. Visitante lê tudo; logado vê as dele separadas das outras.
  - **Entrar no assunto:** `/c/:slug` mostra a comunidade (nome, descrição, regras, membros reais) e a lista de tópicos só daquela comunidade. A URL manda: slug que não existe mostra "não achei", nunca o mural de outra.
  - **Ler e ouvir:** `/c/:slug/t/:id` mostra o tópico, a mensagem inicial e as respostas encadeadas. Player e nota só aparecem quando existem de verdade.
  - **Participar:** membro responde e cria tópico. Visitante e não-membro veem o convite certo (cadastro ou Entrar) em vez de um botão que falha.
  - **Procurar:** `/explorar` lista tópicos recentes ou movimentados, sempre com a comunidade identificada.
  - **Voltar ao assunto:** o perfil (`/u/:handle`) mostra os tópicos que a pessoa abriu e as respostas que deu, cada uma no contexto certo.
- **Fora de escopo (Não vira):**
  - chat, DM, recomendação, ranking inventado, aba "Seguindo", repost (#243);
  - moderação por papéis, tópico fixado e fechado pela comunidade (#260). A tela só mostra esses estados quando o servidor devolve; não existe botão para mudar;
  - notificações e assinatura de tópico (#244), silenciar (#245);
  - mexer em Arena, X1, pontuação ou captura;
  - criar comunidade nova pela UI, ou encher diretório com comunidade vazia;
  - editor rico, álbum de mídia, subfórum;
  - tirar o feed, `/historia/:id` ou `TelaComunidade` do ar antes do E2E (#248). Isso é o pedaço 2e e só roda no fim.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** o banco foi fechado no 0016 e passou pelo Gate Arquitetural. Aqui não nasce tabela, RLS nem RPC nova; nasce tela, rota e um adaptador que consome RPC que já existe. **Gate Arquitetural: APROVADO** (contrato de banco pronto, confirmado em leitura em produção). A regra de ouro do ADR 0001 segue: o adaptador novo vive em `src/plataforma/web/`, a UI só fala por porta em `src/portas/`, e o cliente do Supabase não aparece em tela nem em hook.
  - **Gatilho que reabre o gate:** se qualquer pedaço descobrir que falta RPC, coluna ou grant, o pedaço para e vira cartão de Full flow sistêmica com Lucas (a "PR 1b" do ADR 0010 §"O que a implementação da migração decidiu"). Nada de remendo no cliente.
- **Fonte de verdade afetada:** ADR 0010 (proposto, gate do Camillo aprovado com condições), `JORNADA.md`, `ESCOPO_ATUAL.md`, protótipos de `docs/design/prototipo/` (os de comunidade e tópico precisam estar atualizados pelo #253 antes da tela correspondente), `docs/jogo/VOZ.md`. Contrato de banco: `supabase/migrations/20261019000014`, `…15` e `…16`. Issues de origem: #251 (épico), #253, #256, #257, #258, #259, #227. Transversais que entram como critério: #229, #234, #247, #250, #225.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Uma entrega por vez (WIP 1): o pedaço seguinte só abre com o anterior mergulhado na `main`, com o Marcelo tendo carimbado. Se um pedaço travar, não se abre outro em paralelo.
- **Responsável pela implementação:** Kayky (telas e rotas), com a porta e o adaptador em `src/plataforma/web/` e `src/portas/` definidos junto com Camillo (dono da fronteira). Lucas só entra se o gatilho do gate disparar.
- **Especificação e Auditoria Visual:** Rian. Especifica antes de cada tela e audita depois, **com a tela aberta**. Sem protótipo canônico atualizado (#253) para aquela tela, Kayky não abre código dela.
- **Gate Arquitetural (Camillo / Lucas):** aprovado. Condição de manutenção: o pedaço 2a passa por revisão de Camillo (porta, tratamento de erro, cursor) antes de qualquer tela depender dele.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:**
  1. **Nome público do acervo.** Herdado do 0016. Em produção o esperado é zero post sem comunidade, então a comunidade de acervo pode nem nascer. Se nascer, a tela mostra o nome provisório do banco, marcado, e o Luiz decide o definitivo. Não bloqueia 2a, 2b nem 2c.
  2. **O que o feed faz na home até o corte.** Opções limpas:
     - **A.** A home continua como hoje (landing para visitante, Bonde para logado) e o diretório entra só em `/comunidades`. Zero risco, mas a porta de entrada segue sendo o feed até o fim.
     - **B.** A home logada passa a abrir `/comunidades` no pedaço 2b e o feed fica acessível só por `/feed`, sem destaque. Prova a jornada nova mais cedo, mas o feed perde audiência antes do E2E.
     - **C.** O diretório entra na home ao lado do feed, ambos visíveis. Dois caminhos competindo, e o Luiz já disse que não quer timeline disfarçada.

     Recomendação do Tiago: **A até o 2d, B no 2e**, junto com os redirecionamentos. A decisão é do Luiz. Sem resposta, vale A, que não derruba nada.
  3. **Áudio dentro de tópico e resposta.** Ver "O que fica pendente de decisão", abaixo. Enquanto não houver decisão, o frontend não oferece.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop (3 colunas) e Webapp Mobile (Safari iOS e Chrome Android). Casca nativa fora de escopo.
- **Estados obrigatórios da Arena:** a Arena não é tocada. O botão "Arrotar para responder" fica **desabilitado e marcado** até o contrato de áudio fechar (ver pendências). Gravar nunca publica sozinho (ADR 0004 §2).
- **Estratégia de entrega, em pedaços, nesta ordem:**
  1. **2a. Porta, adaptador e testes (sem UI).** Nova porta em `src/portas/` e adaptador em `src/plataforma/web/` cobrindo as 8 leituras e as escritas do banco (`criar_topico`, `responder_topico`, `editar_topico`, `editar_resposta`, `apagar_topico`, `apagar_resposta`, `denunciar_topico`, `denunciar_resposta`) mais `entrarComunidade` e `sairComunidade`, que já existem na porta atual e são reaproveitados. Testes unitários do adaptador com resposta simulada do servidor: cursor, cada HINT, visitante, falha de rede. Mais um teste contra o ambiente aplicado, rodado por Marcelo, mesmo padrão do `comunidade.servidor.test.ts`. Não toca em tela nem em rota. Saída: o que a porta promete está escrito e provado.
  2. **2b. Rotas e telas de leitura.** `/comunidades` (diretório), `/c/:slug` (comunidade e lista de tópicos com ordenação e cursor), `/c/:slug/t/:id` (conversa), `/explorar`. Só leitura: nenhum botão de escrita, o que não existe ainda não aparece. Layout em uma coluna no celular, sidebar compacta no tablet e três colunas no desktop. As rotas novas convivem com as antigas (`/c/:slug` hoje aponta para `EntradaComunidadeSlug`, e o pedaço troca o miolo só desta rota, sem tocar `/comunidade/:slug` nem `/comunidades/:slug`; Kayky confirma o encaixe com o Iury antes de abrir código).
  3. **2c. Escrever.** Novo tópico, responder (inclusive resposta de resposta), editar e apagar o próprio, denunciar. Rascunho preservado em falha. Proteção de duplo envio. Entrar e Sair da comunidade na própria tela.
  4. **2d. Perfil.** Em `/u/:handle`, aba de tópicos iniciados e de respostas (#227), consumindo `listar_topicos_do_autor` e `listar_respostas_do_autor`. Cada item aponta para o contexto (`/c/:slug/t/:id`).
  5. **2e. Corte do legado, só depois do E2E (#248).** `/historia/:id`, `/resenha/:id` e `/conto/:id` passam a redirecionar para o tópico (o id do tópico é o id do post, ADR 0010); `/feed` redireciona para `/comunidades`; menu vira Comunidades, Explorar, Arena, Perfil. Remover RPC ou coluna antiga **não** é este cartão: é PR posterior, com revisão de Camillo e Lucas.

  Cada pedaço é uma PR. O merge na `main` sobe frontend e já tem o banco no ar, então não existe a janela do 0016. Se o pedaço precisar de migração (gatilho do gate), a regra do ADR 0010 volta: migração em PR própria, aplicada e conferida antes.
- **Regras que o frontend DEVE respeitar (valem para todos os pedaços):**
  - **Cursor é string do servidor.** `ultima_atividade_em` e `criado_em` têm microssegundo. O adaptador devolve a string como veio e manda de volta como veio. Nunca passa por `Date`, `toISOString` ou `JSON.parse` de data. Paginação sem repetir nem pular item, com teste que prova.
  - **Erro se decide pelo HINT, não pela mensagem nem pelo status.** `22023`, `42501` e `P0001` são só a classe; o que a tela traduz é o HINT (`titulo_invalido`, `corpo_invalido`, `nao_e_membro`, `topico_fechado`, `topico_nao_encontrado`, `cursor_invalido`, `ordem_invalida`, `pai_invalido`, `nao_e_autor` e os demais do contrato). HINT desconhecido cai em "falhou" genérico, honesto, nunca em sucesso.
  - **Erro nunca vira lista vazia.** Comunidade sem tópico é um estado ("ninguém abriu assunto ainda"). Falha de rede, servidor fora ou HINT inesperado é outro estado, com botão de tentar de novo. A porta devolve resultado com `ok: false` e motivo, como `PortaDeGrupos` já faz, para a tela não ter como confundir os dois.
  - **Bonde Geral e conta promovida.** Conta promovida conta como membro do Bonde Geral e a tela não mostra botão Entrar nele. Vale para o botão, para o convite e para o contador. A fonte é o que o servidor devolve, não uma regra copiada no cliente; se a leitura não disser, a tela não chuta.
  - **Nada de contador inventado.** Respostas, membros e tópicos são o que o servidor devolveu (`respostas_total` e afins). Sem somar no cliente, sem arredondar para parecer movimento, sem "mil+". Zero aparece como zero.
  - **Ação sem backend fica desabilitada e marcada.** Nada de botão que clica e não faz. Vale para áudio, fixar, fechar, moderar.
  - **O cliente nunca fabrica autor, título de acervo, nota, permissão nem contagem.** Autor é o que o servidor devolveu (`sou_autor` decide se mostra Editar e Apagar). Nota e áudio só aparecem quando vierem com `resultado_id` real.
  - **URL manda.** O conteúdo vem do slug e do id da rota, nunca de estado de outra aba. Refresh, Voltar e Avançar mostram a URL.
  - **Gravou para jogar não é publicar.** Nenhum caminho novo publica áudio sem o consentimento explícito do servidor (`p_consentimento_audio_publico`).
  - **Copy no tom do Auê (`VOZ.md`, `filtro-anti-ia`).** Fala-se **resenha, tópico, conversa**; nunca "causo" solto. Sem emoji, sem "Ops!", sem "Algo deu errado :(". Erro é frase curta e honesta: "Não deu pra carregar a conversa. Tenta de novo." Número só com dado. Não promete o que não existe.
  - **Acessibilidade desde o primeiro commit (#247).** Link real para comunidade e tópico, foco visível, headings em ordem, alvo de toque >= 44px, safe area, teclado que não cobre o composer, modal que devolve foco ao gatilho e fecha com Esc. Sem autoplay.
- **Maior risco de quebra ou mentira visual:**
  - **Dois mundos no ar.** O feed e as rotas novas convivem por semanas. Risco de a tela nova mostrar um tópico que o feed já apagou, ou o contrário. O espelho é de um só sentido (antigo para novo, ADR 0010) e denúncia do lado novo não esconde o post antigo. Marcelo precisa provar os dois lados.
  - **Rota `/c/:slug` já existe** apontando para a tela antiga. Trocar sem cuidado quebra link compartilhado. A troca é feita no 2b, com teste de deep link.
  - **Lista vazia que esconde erro.** O pior bug possível desta entrega: o servidor falha e a tela diz "ninguém postou ainda". Teste obrigatório por HINT e por falha de rede, em cada leitura.
  - **Cursor pelo Date.** Se escapar uma conversão de data, a paginação repete ou pula item e ninguém percebe no teste pequeno. Exige teste com microssegundo real.
  - **Contador que mente.** Número do cliente que diverge do servidor depois de responder. Atualizar só pelo que o servidor devolve, ou recarregar.
  - **Duplo envio e perda de rascunho** no Novo tópico e no Responder, principalmente no celular, com rede ruim.
  - **Visual pesado.** Cartão empilhado, placar e verde repetido. O #253 pede fórum leve: texto do tópico manda, o resto apoia. Verde elétrico fica no máximo em 2 aparições por estado.
  - **Segurança.** Texto do usuário (título, corpo, resposta) renderizado como texto, nunca como HTML. Nenhum link do servidor entra em `href` sem validação.
  - **Safari iOS.** Teclado cobrindo o composer, safe area e foco em modal são onde mais quebra.
- **Limite da promessa:** teste automático com resposta simulada prova que o adaptador entende o contrato, não que o servidor vivo se comporta assim. `typecheck`, `lint`, `test` e `build` verdes dizem que compilou. Só a prova do Marcelo no ambiente aplicado, com visitante e contas reais, diz que a jornada funciona. Também não prometemos: desempenho com milhares de tópicos, moderação, áudio de tópico, nem ordenação "boa" além de atividade recente e mais novos.

### O que fica pendente de decisão (não entra enquanto não fechar)

- **Áudio de tópico e de resposta.** O banco aceita vincular um resultado da Arena ao tópico (`p_resultado_id` com consentimento público) e as leituras devolvem `resultado_id`, `nota`, `duracao` e o caminho do áudio. O que **não está decidido**: (a) o fluxo de ida e volta Arena para tópico (#258: "Arrotar para responder" volta ao mesmo tópico, com rascunho e consentimento desmarcado); (b) como o player pede a URL assinada sem travar o Safari (#250); (c) se existe upload de áudio que não veio da Arena. Sem os três, o pedaço 2b mostra áudio **só de leitura**, quando a leitura devolver caminho, e as telas de escrita (2c) **não oferecem** anexar áudio. O botão "Arrotar para responder" aparece desabilitado e marcado. Quem fecha o contrato é Lucas e Camillo, com o Luiz decidindo a parte de produto (upload comum sim ou não). Vira cartão próprio.
- **Compartilhar tópico (#225).** A URL canônica é `/c/:slug/t/:id` e o card nunca ganha nota sem resultado real. Depende do modal de compartilhar atual ser corrigido antes de virar funcional. **Fica fora do 2b e do 2c**; entra como pedaço próprio ou aditivo, quando o Rian desenhar o card do tópico.
- **Player único (#250).** Parar um áudio ao tocar outro, inclusive entre tópicos e Arena. Existe `audioUnico` na plataforma; reaproveitar no pedaço que tiver áudio. Não bloqueia 2a, 2b sem áudio nem 2c.
- **Moderação (#260).** Quem fixa, fecha e oculta. Hoje a tela só reflete o estado que o servidor devolve.
- **Notificações e assinatura (#244, #245).** Fora.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Critérios tirados do ADR 0010 e das issues #251, #253, #256, #257, #258, #259, #229, #234, #247, #250, #225. "Visitante + 2 contas reais" quer dizer: um navegador sem login, mais duas contas promovidas diferentes (A e B), pelo menos uma delas **não** membro da comunidade usada no teste. Ambiente "Safari iOS" e "Chrome Android" são aparelho real; emulador de desktop não vale como prova de teclado e safe area.

### Pedaço 2a: porta e adaptador

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Porta em `src/portas/` cobre as leituras e escritas do banco, e nenhuma tela ou hook importa o cliente do Supabase nem `navigator`, `window` ou `localStorage` fora de `src/plataforma/` | Camillo / Marcelo | Código (revisão e lint de fronteira) | pendente |
| Cursor de `listar_topicos`, `listar_respostas_do_topico` e `explorar_topicos` atravessa o adaptador como string, com microssegundo preservado, e volta idêntico na página seguinte | Marcelo | Teste (unidade com precisão de microssegundo) e Código | pendente |
| Cada HINT do contrato vira um motivo tipado na porta; HINT desconhecido vira falha genérica, nunca sucesso nem lista vazia | Marcelo | Teste (unidade, um caso por HINT) | pendente |
| Falha de rede, servidor fora e resposta malformada devolvem `ok: false`, nunca lista vazia | Marcelo | Teste (unidade) | pendente |
| Nenhuma escrita recebe autor, nota ou contagem do cliente | Camillo / Marcelo | Código (revisão) | pendente |
| Leitura de visitante funciona sem sessão; escrita sem sessão devolve motivo de "precisa entrar", não "falhou" | Marcelo | Teste contra o ambiente aplicado | pendente |
| Paginação contra o servidor vivo não repete nem pula item entre páginas (comunidade com mais de uma página) | Marcelo | Teste contra o ambiente aplicado | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

### Pedaço 2b: telas de leitura

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Duas comunidades com tópicos diferentes abrem em URLs próprias; tópico da A não aparece na B (#256) | Marcelo | Teste (visitante) / Chrome Android | pendente |
| `/c/slug-inexistente` mostra "não achei" e nenhum conteúdo de outra comunidade; `/c/reuniao-da-firma` não abre outra comunidade (#256) | Marcelo | Teste / Safari iOS | pendente |
| Lista mostra título, autor, última atividade, respostas reais e estado fixado ou fechado quando o servidor devolve; ordenação por atividade (padrão) e por mais novos (#256) | Marcelo | Teste / Chrome Android | pendente |
| Voltar da conversa para a lista restaura ordem, filtro e posição de rolagem (#234) | Marcelo | Safari iOS / Chrome Android | pendente |
| Carregar mais não duplica nem pula tópico, também depois de alguém criar tópico novo no meio da leitura | Marcelo | Teste (2 contas) | pendente |
| Estados da lista: carregando, vazia (comunidade sem tópico), erro com tentar de novo, removido e não encontrado, todos distinguíveis na tela. Falha de rede nunca aparece como "vazia" | Marcelo / Rian | Teste (rede derrubada) / Chrome Android | pendente |
| Conversa abre por link direto, em aba anônima, com mensagem inicial e respostas encadeadas na ordem certa; resposta de resposta aparece sob o pai certo e sem cortar o texto em 120 caracteres (#258) | Marcelo | Teste (visitante) / Safari iOS | pendente |
| Tópico fechado, oculto ou apagado mostra o estado honesto; oculto não vaza conteúdo; apagado não deixa texto guardado na tela (#258, #225) | Marcelo | Teste (visitante, e conta A dona) | pendente |
| Nota e player aparecem **só** quando o servidor devolve resultado e áudio reais; texto sem nota não ganha pontuação inventada (#258, #225) | Marcelo | Teste / Chrome Android | pendente |
| Diretório `/comunidades` e Explorar: visitante e logado chegam a comunidade para tópico para resposta em até três toques; Explorar mostra só tópico com comunidade identificada; sem composer nem aba "Para você" ou "Seguindo" (#259) | Marcelo / Tiago | Safari iOS / Chrome Android | pendente |
| Conta nova, sem comunidade, vê orientação para comunidades verdadeiras e Arena, sem massa fictícia (#259) | Marcelo | Teste (conta zerada) | pendente |
| Conta promovida no Bonde Geral: sem botão Entrar, tratada como membro; conta que não é membro de outra comunidade vê Entrar (#256, regra do 0016) | Marcelo | Teste (2 contas) | pendente |
| Contadores (respostas, membros, tópicos) batem com o servidor, sem número somado no cliente | Marcelo | Teste contra o ambiente aplicado | pendente |
| Rotas antigas (`/comunidade/:slug`, `/comunidades/:slug`, `/historia/:id`, feed) seguem funcionando como antes; este pedaço não quebra nada que estava no ar | Marcelo | Safari iOS / Chrome Android | pendente |
| Visual: Rian audita com a tela aberta, em 320, 375 e 430 (sem rolagem horizontal), tablet (768) e desktop (1280), tema claro e escuro; hierarquia igual nos três tamanhos; o texto do tópico pesa mais que contador e cartão; verde elétrico até 2 aparições por estado (#253, #229) | Rian | Safari iOS / Chrome Android / desktop | pendente |
| Navegação: desktop com lateral e sem barra mobile; mobile com barra inferior e safe area; tablet com navegação compacta (#229, #259) | Rian | Safari iOS / Chrome Android / desktop | pendente |
| Acessibilidade: Tab e Shift+Tab percorrem diretório, lista e conversa; links reais; headings em ordem; foco visível; alvo >= 44px; leitor de tela entende título, autoria e ordem das respostas; contraste nos dois temas (#247) | Marcelo / Rian | Teste (teclado) / Safari iOS (VoiceOver) / Chrome Android (TalkBack) | pendente |
| Copy: sem "causo" solto, sem emoji, erro honesto, tom de `VOZ.md`; passou pelo `filtro-anti-ia` | Tiago | Código (revisão de texto) | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

### Pedaço 2c: escrever

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Membro cria tópico pela comunidade: salva um só, abre `/c/:slug/t/:id` e o título aparece na lista da comunidade de origem, em nenhum outro lugar (#257) | Marcelo | Teste (conta A) / Chrome Android | pendente |
| Visitante e não-membro não conseguem criar nem responder, nem na tela (convite certo, sem botão que falha) nem chamando a RPC direto (#257) | Marcelo | Teste (visitante + conta B não-membro) | pendente |
| Título e corpo: limites iguais em tela e servidor (título 1 a 120, tópico 1 a 1000, resposta 1 a 500), com contagem visível e mensagem por HINT (#257) | Marcelo | Teste / Safari iOS | pendente |
| Falha ao criar ou responder (rede caída, HINT) mantém o rascunho intacto e mostra mensagem honesta (#257, #258) | Marcelo | Teste (rede derrubada) / Safari iOS | pendente |
| Duplo toque e duplo envio criam um tópico ou uma resposta só (#257) | Marcelo | Teste / Chrome Android (toque rápido) | pendente |
| Responder aparece no lugar certo; a conta A responde, a B abre em outro aparelho e encontra a resposta sob o pai certo (#258) | Marcelo | Teste (2 contas, 2 aparelhos) | pendente |
| Tópico fechado, oculto ou apagado não aceita resposta, e a tela já nem oferece o campo; erro por HINT se chegar a tentar (#256, #258) | Marcelo | Teste (2 contas) | pendente |
| Editar e Apagar aparecem só para o autor (`sou_autor`) e funcionam; a outra conta não vê nem consegue por RPC (ADR 0010) | Marcelo | Teste (2 contas) | pendente |
| Denunciar tópico e resposta registra e confirma; falha não mostra "denunciado" (ADR 0010, #260 fica de fora) | Marcelo | Teste (conta B) / Chrome Android | pendente |
| Entrar e Sair persistem entre aparelhos e liberam ou bloqueiam o Novo tópico (#256) | Marcelo | Teste (2 contas, 2 aparelhos) | pendente |
| Modal ou folha de Novo tópico e Responder: foco entra e volta ao gatilho, Esc fecha quando seguro, teclado não cobre o botão de enviar; estado de envio anunciado (#247, #257) | Marcelo / Rian | Safari iOS / Chrome Android / Teste (teclado) | pendente |
| Botão "Arrotar para responder" aparece desabilitado e marcado enquanto o contrato de áudio não fechar; nenhum anexo de áudio é oferecido (#258, regra do cartão) | Marcelo / Tiago | Safari iOS / Chrome Android | pendente |
| Visual: Rian audita o formulário e o estado de envio nas 3 larguras de celular, tablet e desktop, claro e escuro | Rian | Safari iOS / Chrome Android / desktop | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

### Pedaço 2d: perfil

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/u/:handle` mostra os tópicos que a pessoa iniciou e as respostas que deu, cada item com a comunidade e o link para o contexto certo (#251, #227) | Marcelo | Teste (visitante + conta A) / Chrome Android | pendente |
| Tópico oculto, apagado ou de resposta apagada não aparece no perfil de ninguém, nem no da própria pessoa como se estivesse ativo | Marcelo | Teste (2 contas) | pendente |
| Perfil sem atividade mostra estado vazio honesto; handle inexistente mostra "não achei" | Marcelo | Teste | pendente |
| Paginação do perfil sem repetir nem pular item | Marcelo | Teste contra o ambiente aplicado | pendente |
| Visual e acessibilidade como no 2b, no perfil | Rian / Marcelo | Safari iOS / Chrome Android / desktop | pendente |

### Pedaço 2e: corte do legado (só depois do E2E, #248)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| **Pré-condição:** E2E da jornada completa passou (visitante + 2 contas reais): descobrir, abrir tópico, ler, responder, criar tópico, perfil, e Marcelo carimbou 2b, 2c e 2d | Marcelo → Tiago | Teste E2E / Safari iOS / Chrome Android | pendente |
| `/historia/:id`, `/resenha/:id` e `/conto/:id` antigos abrem o tópico correspondente, sem revelar conteúdo moderado; id inexistente cai em "não achei" útil (#234, #255) | Marcelo | Teste (amostra de links reais antigos) / Safari iOS | pendente |
| `/feed` leva a `/comunidades`; nenhum link compartilhado quebra (#259) | Marcelo | Teste / Chrome Android | pendente |
| Menu final: Comunidades, Explorar, Arena, Perfil; nenhum destino "Feed" nem "Postar" avulso (#253, #259) | Rian / Tiago | Safari iOS / Chrome Android / desktop | pendente |
| Comunidade, tópico, Arena e voltar: o retorno da Arena cai no tópico de origem (se o contrato de áudio já existir; se não, fica registrado como não validado) (#234) | Marcelo | Safari iOS / Chrome Android | pendente |
| Verificação final em 320, 375, 430, 768 e 1280, claro e escuro (#259) | Rian | Safari iOS / Chrome Android / desktop | pendente |
| Remoção de RPC, coluna ou tela antiga **não** está neste pedaço | Tiago | Código (revisão do diff) | pendente |

### Prova final do Marcelo (antes de o Tiago aceitar qualquer pedaço com tela)

- **Elenco:** um visitante sem login e duas contas promovidas reais (A e B), em dois aparelhos quando a linha pedir. A é membro da comunidade de teste, B não é, até entrar.
- **Roteiro mínimo:** visitante abre diretório, comunidade e tópico por link direto e lê; tenta escrever e é barrado. A cria tópico e responde. B (não-membro) tenta e é barrada, entra, responde. A volta em outro aparelho e encontra a resposta no lugar certo. B denuncia. A edita e apaga o próprio. Alguém tenta o mesmo por RPC direto.
- **Evidência:** capturas de tela e anotação por critério, com o aparelho e o navegador, não só "passou".
- **Gate visual do Rian:** com a tela aberta, nas 3 larguras de celular (320, 375, 430), tablet e desktop, claro e escuro. Fidelidade ao protótipo vigente; se o protótipo não cobre a tela, a tela não sobe.

> "Compilou" não é "funcionou na tela". Teste com resposta simulada não substitui o ambiente aplicado. Emulador não substitui aparelho.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente. Esperado, por pedaço: 2a toca só `src/portas/`, `src/plataforma/web/` e testes; 2b a 2e tocam rotas e telas. Qualquer arquivo em `supabase/` é sinal de que o gatilho do gate disparou e a PR saiu do escopo deste cartão.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:**
  - o que a home faz com o feed até o corte (opções A, B e C acima; Tiago recomenda A até o 2d e B no 2e);
  - nome público e texto da comunidade de acervo, se ela chegar a existir;
  - se haverá upload de áudio que não venha da Arena (define o contrato de áudio de tópico);
  - o feed antigo só sai depois do E2E (#248). Este cartão não autoriza desligar nada antes disso.
