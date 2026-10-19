# Cartão de Missão 0018 — Depois da nota, a Arena publica em comunidade ou no próprio perfil

> Decisão do Luiz em 19/10/2026, literal: **"Publicar em comunidade ou no próprio perfil."** Cartão aberto como proposta. A pista depende do Gate Arquitetural (seção 2): sem parecer escrito do Camillo e do Lucas, ninguém abre SQL nem tela. Issues: #230, #236, #237, #235, #238, #239, #258. Contexto: #251, #254, #255, #257.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a pessoa arrota, tira a nota e quer mostrar. Hoje o botão da Arena é "Postar no bonde": abre o `ModalNovoCauso` ("Soltar Resenha no Mural"), que exige o aceite do arroto e grava em `posts_comunidade`. O Bonde está de saída (#251), então esse botão vai ficar sem destino. O Luiz deu duas saídas: uma comunidade de que a pessoa participa, ou o próprio perfil. Falta dizer o que é cada uma sem recriar feed solto e sem furar a regra do banco que não aceita tópico sem comunidade.

- **O que "publicar no próprio perfil" quer dizer (resolvido neste cartão, para o Gate confirmar):**
  - **O que é o item:** um tópico de verdade (tabela `topicos`), com título, texto e, se a pessoa autorizar, o arroto e a nota. A casa dele é o **espaço pessoal** do autor: uma comunidade de tipo "perfil", uma por conta promovida, criada na primeira vez que a pessoa publica lá. Continua Comunidade → Tópico → Resposta, a única hierarquia de conversa do ADR 0010. O `comunidade_id` obrigatório (#254) não é afrouxado.
  - **Onde aparece:** no `/u/:handle` e no `/perfil`, na aba **Tópicos** que a PR #280 já monta com `listarTopicosDoAutor`, com a marca "No perfil" no lugar do nome da comunidade; e no endereço próprio do tópico, para quem recebe o link. O endereço de comunidade desse espaço (`/c/<espaço>`) nunca mostra lista como se fosse comunidade: leva ao perfil.
  - **Onde NÃO aparece:** diretório, Explorar, contagem de tópicos e de membros de comunidade, busca, Bonde/feed. Se aparecesse em algum desses, seria o feed solto de volta com outro nome.
  - **Não reaproveita `posts_comunidade`.** Aquela tabela é legado, espelhada em um sentido (antigo para novo). Nada novo escreve nela. A tela de perfil que listava "Resenhas" lia dela; depois da #280 lê `topicos`.
  - **Precisa de contrato novo, pequeno e aditivo.** Hipótese de desenho (o Gate pode trocar, desde que respeite as quatro invariantes abaixo): marca de espaço pessoal em `grupos` (coluna nullable, por exemplo dono e tipo), uma RPC idempotente que devolve ou cria o espaço do dono, e ajuste das leituras de diretório, Explorar e contagem para excluí-lo. `criar_topico` passa a aceitar o espaço do próprio autor como destino.
  - **Invariantes que o Gate tem que garantir:** (i) nenhum tópico sem comunidade, nem por RPC chamada direto; (ii) espaço pessoal fora de diretório, Explorar, busca e contagens; (iii) só o dono cria tópico no espaço dele; (iv) tudo aditivo: nenhuma RPC ou coluna existente muda de forma, porque o frontend atual segue no ar.

- **Comportamento esperado na tela (da Arena ao tópico):**
  1. No `RESULT`, uma ação secundária de publicar (o rótulo é contrato de `VOZ.md`: Rian e Tiago fecham antes de codar) leva a **um único formulário**. Nada sobe antes disso.
  2. O formulário é o da spec do fórum (`docs/design/forum-comunidades.md` §10.3), com um campo a mais: **Destino**. É um `<select>` com as comunidades de que a pessoa participa e, no fim, "Meu perfil". Sem seleção padrão: a pessoa escolhe.
  3. Depois do destino: título, mensagem e o bloco "Seu arroto desta rodada" com a nota que a Arena mostrou e o player. A caixa de autorização vem **desmarcada** e o texto cita o destino ("neste tópico" ou "no seu perfil").
  4. Sem marcar, o tópico sai só com texto e o arroto continua privado. Marcado, vai `resultado_id` com `consentimento_audio_publico = true`. A nota publicada é a que o servidor calcula; a tela não promete o número.
  5. Sucesso leva ao tópico criado (`replace`). Cancelar volta ao resultado com o rascunho guardado. Falha de rede preserva o rascunho e não duplica.
  6. Visitante e sessão anônima jogam à vontade; só ao tentar publicar veem o convite para criar conta ou entrar (#230). Quem não participa de nenhuma comunidade ainda pode publicar no perfil.
  7. Vindo de um tópico ("Arrotar para responder", #258), o destino é aquele tópico e o formulário vira resposta. Depende do pedido 4 ao banco (§18 da spec) e fica na etapa 6.

- **Consentimento (AGENTS §5, "gravou pra jogar não é autorizou publicar"):** o arroto só sobe com a caixa marcada, na hora do envio, e **exatamente uma vez**. Nada de upload antes. Cancelar, voltar ou cair a rede não deixa áudio público para trás. O texto da caixa diz o que é verdade: quem tem o endereço do áudio ouve mesmo fora do tópico, e dá para apagar depois (apagar não desfaz quem já ouviu).

- **A Arena não muda de estado (`ARENA.md`):** os dez estados ficam como estão. Publicar não é estado nem sobreposição nova; é uma ação do `RESULT` que sai da Arena para o formulário e volta pela recuperação de sessão (`ARENA.md` §3). Como a ação não está escrita no `ARENA.md`, entra uma linha de documentação no `RESULT` (só ação, nenhum estado) na etapa 1. Gravar e julgar continuam sem tocar em publicação.

- **Bonde, feed e o botão "Postar" até o corte (2e do cartão 0017):**
  - O feed legado e o `ModalNovoCauso` ficam **sem edição** até o corte (spec §14.2). Quem usa a navegação antiga continua vendo "Postar no bonde", com o aceite obrigatório de hoje.
  - O fluxo novo entra **atrás do mesmo corte** da navegação nova (Camillo e Kayky escolhem o mecanismo). Com o corte ligado, a Arena mostra só o botão novo; desligado, só o antigo. **Nunca os dois na mesma tela.**
  - O espelho segue em um sentido: o que for postado pelo caminho antigo vira tópico; o que for publicado pelo caminho novo **não** aparece no Bonde antigo. Por isso o caminho novo só liga para quem testa até o E2E (#248) passar.
  - No 2e saem o "Postar no bonde", o callback `onPostarNoBonde`, o `ModalNovoCauso` e o `ComposerCauso`. Hoje, sem o callback, a Arena cai num link para `/feed`; esse fallback também morre no corte e não pode apontar para rota que redireciona.

- **Desafio dentro do tópico e X1 (#236, #237):**
  - Publicar não cria X1 e X1 não cria tópico. O código do X1 é privado e nunca vira tópico nem resposta.
  - Dentro de um tópico de texto só existe a ação genérica "Jogar na Arena", que volta ao mesmo tópico depois. "Responder a desafio" só aparece quando o tópico ou a resposta traz um código de batalha real, persistido. Hoje não existe vínculo tópico-batalha no banco (o Gate confirma), então tocar em "Desafiar" não pode convidar o autor nem fabricar código a partir do id do tópico.
  - A aba Duelos sai da navegação social no corte. "Meus X1" na Arena só existe com listagem confiável do servidor, com RLS que impeça terceira conta de ver batalha alheia. Sem isso, a tela oferece só criar ou abrir X1 e nunca mostra "zero duelos". Se a listagem não existir, vira cartão próprio.

- **Fora de escopo (Não vira):**
  - feed, aba Seguindo, repost (#243), chat, DM, ranking, recomendação;
  - tópico de perfil no Explorar ou em qualquer lista global;
  - nota ou duração fabricadas: sem `resultado_id` real não há selo; sem metadado confiável o player mostra traço, nunca `0:07` (#239);
  - nickname digitado no formulário: o autor é sempre a conta (`auth.uid()`), nome e foto se editam no Perfil (#238);
  - upload de áudio que não veio da Arena;
  - mexer em captura, juiz, pontuação ou nos estados da Arena;
  - mexer na tela de perfil além do rótulo "No perfil" (as abas e o que o perfil mantém são da #280).

- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** o item no perfil não cabe no banco de hoje sem contrato novo (espaço pessoal, RPC, ajuste de leituras), e o "não duplicar no retry" pede chave de idempotência (pedido 5 da spec). Isso é migração, RLS e contrato compartilhado entre banco e adaptador, então passa pelo Gate do Camillo e do Lucas antes de qualquer SQL, e a migração sobe sozinha em PR própria (ADR 0010: aditivo, migração primeiro, conferida em leitura, só então o código).
- **Fonte de verdade afetada:** ADR 0010 (o Gate decide se o espaço pessoal entra como seção nova dele ou como ADR 0011, porque o 0010 ainda está "proposto"), ADR 0004 §2, `ARENA.md` (uma linha de ação no `RESULT`), `JORNADA.md` (fase "Depois da nota"), `docs/design/forum-comunidades.md` §10, §13 e §14, `VOZ.md` (rótulo da ação).

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Uma entrega por vez; cada etapa abaixo é uma PR. A migração só tem a PR seguinte aberta depois de aplicada e conferida.
- **Responsável pela implementação:**
  - Lucas: migração, RPCs, RLS, backfill (se houver), rollback e testes de SQL.
  - Camillo: porta e adaptador em `src/plataforma/web/` (fronteira do ADR 0001) e o mecanismo do corte.
  - Kayky: formulário único, ação na Arena, retorno e recuperação de sessão.
- **Especificação e Auditoria Visual:** Rian. Desenha antes (Arena, formulário com Destino, tópico "No perfil", CTA contextual no tópico) e audita depois com a tela aberta. Sem desenho aprovado, Kayky não abre código.
- **Gate Arquitetural (Camillo / Lucas):** **pendente**. O parecer escrito precisa fechar:
  1. o desenho do espaço pessoal e as quatro invariantes da seção 1;
  2. o slug estável do espaço (não derivado do handle, que muda) e o que `/c/<espaço>` faz;
  3. se a chave de idempotência (pedido 5) e `responder_topico` com `resultado_id` (pedido 4) entram na mesma migração, para não abrir duas;
  4. como o resultado e o áudio sobrevivem à ida para o formulário (hoje o arroto vai em memória pelo callback; trocar de rota perde o blob se não houver um guardião de sessão) e à ida e volta do cadastro de quem é visitante;
  5. se já existe listagem de batalhas da pessoa com RLS (#237) ou se vira cartão próprio;
  6. o vínculo tópico-batalha: existe ou não (#236).
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** três perguntas, abaixo. Nenhuma bloqueia o Gate nem a etapa 1. Sem resposta, valem os padrões indicados e o trabalho segue. A 1 entra na regra da migração, então o Luiz responde antes da etapa 2 se quiser outro padrão.
  1. **Quem pode responder a um tópico que está no perfil de alguém: qualquer conta promovida, ou só o dono (como um diário)?** Sem resposta, vale qualquer conta promovida, igual a uma comunidade aberta.
  2. **Curtir tópico existe no fórum novo?** A spec do fórum (§14.3) diz que curtida e coração não viajam; o #235 pede coração sincronizado entre lista, tópico e perfil; e o perfil mantém "Curtidos". Os três não fecham juntos. Sem resposta, o #235 fica parado e o perfil mostra "Curtidos" só do que já existe.
  3. **Tópico publicado no perfil aparece no Explorar?** Sem resposta, vale que não: o Explorar mostra só tópicos de comunidade.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop (formulário em `<dialog>`) e Webapp Mobile (tela cheia, Safari iOS e Chrome Android). Casca nativa fora de escopo.
- **Estados obrigatórios da Arena:** os dez ficam intactos. O que a publicação toca é só uma ação do `RESULT`. `ERROR` (microfone negado, sem som, não é arroto), `CHALLENGE`, `VERSUS` e `SCOREBOARD` continuam como estão; com X1 aberto por link (`VERSUS`), a ação de publicar não aparece enquanto a pessoa responde a um desafio, a menos que o Rian desenhe diferente.
- **Estratégia de entrega, em etapas, nesta ordem:**
  1. **Documentos e desenho (sem código).** Rian: `Arena.dc.html`, formulário com Destino, tópico "No perfil", CTA contextual (#253). Tiago: linha no `ARENA.md` e rótulo na `VOZ.md`. Gate do Camillo e do Lucas em paralelo, porque é papel, não entrega.
  2. **Migração (Lucas), PR sozinha.** Aditiva, com teste de SQL e rollback ensaiado. Depois do merge, confere em leitura (`list_migrations`), sem `apply_migration` na mão.
  3. **Porta e adaptador (Camillo).** `criarTopico` com destino perfil, `resultado_id` e consentimento; guardião do resultado entre rotas. Sem UI.
  4. **Formulário único e ação na Arena (Kayky),** atrás do corte. Retorno ao resultado e ao tópico.
  5. **Prova real (Marcelo),** nos dois aparelhos, antes de qualquer coisa ser ligada.
  6. **Responder com o arroto no tópico (#258) e CTA contextual (#236),** quando o pedido 4 estiver aplicado.
  7. **Meus X1 (#237),** só se o Gate disser que a listagem existe; senão, cartão próprio.
- **Maior risco de quebra ou mentira visual:**
  - O espaço pessoal vazar para diretório, Explorar ou contagem: vira feed solto por baixo do pano.
  - O áudio subir sem o aceite, subir duas vezes ou ficar público depois de cancelar.
  - O arroto sumir na ida para o formulário (blob em memória) e a pessoa publicar sem o arroto achando que foi, ou ver nota sem áudio.
  - Retry sem idempotência criar tópico duplicado.
  - Dois botões de publicar na mesma Arena durante a convivência com o corte.
  - Visitante que cria conta no meio perder o resultado.
  - Verde: orçamento de no máximo 2 por estado; o botão de criar tópico é verde, então o selo de nota e a Bolha têm que caber no resto.
- **Limite da promessa (o que o motor e a API não medem):** a nota que aparece no formulário é a que a Arena mostrou; a publicada é a do servidor, e o formulário não garante que coincidam. O áudio público não é revogável para quem já ouviu ou guardou o endereço. O motor não prova que a pessoa publicou o próprio arroto, só que o resultado é da sessão dela. Teste de SQL e `list_migrations` não provam policy e grant no projeto vivo; isso exige a matriz de RLS rodada contra o ambiente aplicado. `typecheck`, `lint`, `test` e `build` verdes não dizem nada sobre o banco.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

"Visitante + 2 contas" quer dizer: um navegador sem login, mais duas contas promovidas, A e B, sendo pelo menos uma delas não membro da comunidade usada. Aparelho real para teclado e safe area.

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| Parecer do Gate escrito cobrindo os 6 pontos da seção 2 antes de qualquer SQL | Camillo / Lucas | Documento | pendente |
| Existe um único formulário depois da nota, com Destino (comunidades de que participo + "Meu perfil"), título, mensagem, bloco do arroto; nunca dois modais | Rian / Marcelo | Código / Safari iOS / Chrome Android / desktop | pendente |
| Desenho aprovado do formulário, da ação no `RESULT` e do tópico "No perfil", claro e escuro, 320/375/768/1280 | Rian | Protótipo aberto | pendente |
| Estados da Arena inalterados: mesma lista, mesmas saídas; só uma ação nova no `RESULT` documentada no `ARENA.md` | Rian / Tiago | Documento / Código | pendente |
| Nenhum upload de áudio antes de marcar a caixa; marcada, sobe uma vez só (contar requisições com clique duplo, retry e rede lenta) | Marcelo | Teste / Safari iOS / Chrome Android | pendente |
| Caixa desmarcada: tópico sai só com texto, arroto continua privado e não aparece em nenhuma leitura pública | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Texto da caixa cita o destino certo (comunidade ou perfil) e diz o que é verdade sobre o endereço do áudio | Rian / Tiago | Tela aberta | pendente |
| Cancelar volta ao resultado com nota e player e com o rascunho; nada publicado | Marcelo | Safari iOS / Chrome Android | pendente |
| O arroto e a nota sobrevivem à ida ao formulário, a um refresh no formulário e à volta (recuperação de sessão) | Marcelo / Camillo | Safari iOS / Chrome Android | pendente |
| Falha de rede: rascunho preservado, mensagem honesta, retry sem tópico duplicado (idempotência) | Marcelo | Teste SQL / Teste / Safari iOS | pendente |
| Sucesso leva a `/c/:slug/t/:id` com `replace`; Voltar não reabre o formulário | Marcelo | Safari iOS / Chrome Android | pendente |
| Publicar no perfil: o tópico aparece na aba Tópicos do `/u/:handle` do autor com "No perfil" e abre pelo endereço próprio | Marcelo / Rian | Supabase aplicado / Safari iOS | pendente |
| Tópico de perfil não aparece em diretório, Explorar, contagem de tópicos e membros, busca nem Bonde | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Não existe write path que crie tópico sem comunidade, nem chamando a RPC direto | Lucas / Marcelo | Teste SQL | pendente |
| Conta B não consegue criar tópico no espaço da conta A | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Trocar o nickname ou o autor no payload não muda o autor gravado; o autor é `auth.uid()` | Marcelo | Teste SQL | pendente |
| Visitante e sessão anônima jogam sem barreira; ao publicar veem o convite certo e não criam identidade pública por ter gravado | Marcelo / Rian | Código / Safari iOS | pendente |
| Visitante que cria conta no meio do caminho volta com o resultado, ou a tela diz com franqueza que perdeu | Marcelo | Safari iOS / Chrome Android | pendente |
| Conta sem nenhuma comunidade ainda consegue publicar no perfil; a mensagem de "entra numa comunidade" não bloqueia essa saída | Marcelo | Safari iOS | pendente |
| Migração 100% aditiva, sem `DROP`, rename ou mudança de retorno de RPC existente; Bonde antigo segue funcionando depois de aplicada | Camillo / Marcelo | Código (SQL) / navegador no feed antigo | pendente |
| Rollback ensaiado (sobe, desce, sobe) remove só os objetos novos | Lucas / Marcelo | Teste SQL em ambiente descartável | pendente |
| Corte ligado mostra só o botão novo; desligado mostra só "Postar no bonde"; nunca os dois | Marcelo | Código / Safari iOS / Chrome Android | pendente |
| O caminho antigo continua postando e virando tópico (espelho); o novo não aparece no Bonde antigo, e isso está dito na PR | Marcelo / Tiago | Teste SQL / Supabase aplicado | pendente |
| Dentro de tópico de texto só há a ação genérica; "Responder a desafio" só com código real; Desafiar não convida o autor nem fabrica código (#236) | Marcelo / Rian | Código / Safari iOS | pendente |
| X1 aberto por link e revanche seguem funcionando; código de X1 nunca vira tópico (#236) | Marcelo | Safari iOS / Chrome Android | pendente |
| Navegação sem aba Duelos social; "zero duelos" nunca aparece sem consulta confiável; terceira conta não lê batalha privada (#237) | Marcelo | Teste SQL / Código | pendente |
| Player do tópico e da resposta: sem duração fabricada, sem nota sem `resultado_id`, falha de mídia exibida (#239) | Marcelo | Teste / Safari iOS | pendente |
| Verde dentro do orçamento (no máximo 2 por estado) no formulário, no `RESULT` e no tópico, nos dois temas | Rian | Tela aberta, claro e escuro | pendente |
| Alvos >= 44px, safe area, teclado que não cobre o botão de criar, foco devolvido ao gatilho, Esc fecha | Rian / Marcelo | Safari iOS / Chrome Android | pendente |
| Copy no tom do Auê, sem "causo" solto, sem emoji, passada pelo `filtro-anti-ia` | Tiago | Tela aberta | pendente |
| E2E do #248 inclui "arrotar, receber nota, publicar em comunidade e no perfil, reabrir em outro aparelho", com visitante + 2 contas | Marcelo | Produção / aparelhos | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

> "Compilou" não é "funcionou". Teste de SQL local não substitui a conferência no Supabase aplicado.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente. A PR de migração só pode tocar `supabase/migrations/`, `supabase/rollback/` e testes de SQL; arquivo em `src/` ali é sinal de que saiu do escopo.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** as três perguntas da seção 2. O aceite do desenho do espaço pessoal é do Gate (Camillo e Lucas), não do Luiz. O corte do legado continua dependendo do E2E (#248) e de #254, #255, #256, #257, #258 e #259; este cartão não autoriza desligar nada.
