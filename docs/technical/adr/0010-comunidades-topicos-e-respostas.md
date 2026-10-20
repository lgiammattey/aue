# ADR 0010 — Comunidades, tópicos e respostas (sem feed solto)

**Status:** aceito — Gate Arquitetural do Camillo aprovado; implementação do composer e das mídias ainda pendente de PR, testes e aceite de qualidade.
**Data:** 2026-10-19 (atualizado em 2026-10-20)
**Decisão de produto:** Luiz, em 19/10/2026 ([#251](https://github.com/lgiammattey/aue/issues/251)), com mídia e composer definidos em 20/10/2026
**Pretende substituir:** ADR 0004 §1 (camada de Feed), §3 (modelo de dados) e §5 (UI do feed)
**Mantém:** ADR 0001, ADR 0004 §2 (fronteira do áudio e consentimento), ADR 0005, ADR 0009
**Vale para:** navegação, rotas, banco, permissões e conteúdo de comunidades

> Este ADR é uma decisão aceita de destino. Ele **não** prova que o comportamento
> já exista em produção: até a entrega passar por migração, implementação,
> testes e aceite, o código em operação continua sendo a referência do que o
> produto faz. A substituição do feed legado segue a migração incremental deste
> documento, sem derrubar o que já funciona.

---

## O problema

O produto herdou do Twitter uma timeline: `/feed`, causo avulso, aba "Seguindo".
O Luiz decidiu outra coisa: o Auê é uma **rede de comunidades** (convivência de
Orkut, organização de Reddit), e a conversa mora **dentro de tópicos**.

Hoje, no banco e no código, **não existe a entidade tópico**. `posts_comunidade`
guarda o causo; a coluna `topic` é o **nome da categoria/comunidade**, não uma
discussão. Construir a UI nova em cima dessa coluna misturaria comunidade com
conversa e não criaria fórum.

## A decisão

**Comunidade → Tópico → Resposta é a única hierarquia de conversa. Um post
raiz no feed da comunidade é um tópico; não há um segundo tipo de publicação
"direto no feed". A Arena continua independente e só publica com consentimento
explícito.**

## O que muda na prática

### Entidades

- **Comunidade** — já existe (`grupos` + `membros_grupo`). Ganha slug estável como identidade pública.
- **Tópico** — publicação raiz do composer. ID estável, `comunidade_id`,
  `autor_id`, corpo de até 180 caracteres, status (aberto, fechado, oculto,
  removido), datas de criação, edição e última atividade e, no máximo, um bloco
  de mídia. Não exige título separado.
- **Resposta** — publicação do mesmo composer dentro de um tópico, com pai
  opcional **do mesmo tópico**, o mesmo limite de 180 caracteres e, no máximo,
  um bloco de mídia.
- **Bloco de mídia** — união tipada e exclusiva: áudio livre, imagem/GIF ou
  embed de YouTube/TikTok. Documento, arquivo arbitrário e upload de vídeo não
  são tipos válidos. O card escolhe sua apresentação pelo tipo persistido, nunca
  por inspeção livre de URL na UI.

### Rotas

```text
/                    comunidades de que participo + explorar
/comunidades         diretório
/c/:slug             descrição, regras, membros reais, lista de tópicos
/c/:slug/t/:id       tópico + respostas encadeadas
/arena               arrotar, receber nota, desafiar; publicar é opcional
/u/:handle           perfil: tópicos iniciados e respostas
/explorar            comunidades e tópicos, sempre identificados por comunidade
/historia/:id        legado: redireciona para o tópico correspondente
```

Links antigos (`/historia`, `/resenha`, `/conto`, `/feed`) continuam abrindo
algo útil. Nenhum link compartilhado quebra.

### Regras no servidor, não no botão

- Visitante lê comunidades, tópicos e áudios públicos. Escrever exige conta promovida (ADR 0009) e participação na comunidade.
- O servidor recusa: comunidade errada, tópico ausente, oculto, fechado ou de outra comunidade; resposta cujo pai é de outro tópico.
- Autor é sempre `auth.uid()`. Título, nota, contagens e permissões nunca vêm do cliente.
- Texto de tópico e resposta tem de 1 a 180 caracteres, contado por
  `char_length` no servidor. Não há título obrigatório. As RPCs também validam
  tipo, cardinalidade e metadados do bloco de mídia, com códigos de erro que a UI
  sabe traduzir.
- Contagens e ordenação por atividade têm fonte real; paginação por cursor estável.
- Áudio publicado é uma gravação livre/voz, de até 60 segundos, tanto em tópico
  quanto em resposta. Não recebe nota nem passa pelo juiz da Arena. Áudio privado
  da Arena continua privado: gravar para jogar não autoriza publicar (ADR 0004
  §2 segue valendo).
- Um vídeo de YouTube ou TikTok é exibido no Auê por embed controlado, mas a
  mídia continua hospedada e transmitida pelo fornecedor externo. Bloqueio do
  fornecedor, rede, remoção do vídeo, política de embed ou timeout são falhas
  reais: o card mostra indisponibilidade e preserva o post, sem fingir playback.

### Contrato da porta

`listarComunidades`, `listarTopicos(comunidade, cursor, ordenacao)`, `obterTopico`,
`criarTopico`, `listarRespostas(topico, cursor)`, `responderTopico`, editar e
apagar o próprio, `denunciar`, `entrar`, `sair`. A UI não consulta o Supabase
direto; o adaptador fica em `src/plataforma/web/`.

O composer conversa apenas com portas de gravação, upload de mídia e resolução
de embed. `MediaRecorder`, permissões, URLs de objeto, `window`, iframe e o
cliente Supabase permanecem em `src/plataforma/web/`; Núcleo, Portas e UI usam
tipos e resultados explícitos. Cancelamento, falha, duração excedida ou upload
incompleto não criam publicação, nem retornam sucesso inventado.

### Limites arquiteturais do composer e das mídias

- **Uma publicação, um bloco de mídia.** Texto é opcional quando há mídia;
  sem mídia, o texto é obrigatório. Não há álbum, anexo múltiplo, documento ou
  vídeo enviado pelo usuário nesta decisão.
- **Áudio livre é separado do áudio da Arena.** A captura, prévia, validação de
  duração e envio vivem atrás de portas próprias. O resultado não tem `nota`,
  `score` ou vínculo implícito com uma batalha.
- **Embed não é HTML do usuário.** O servidor normaliza somente URL/ID de
  YouTube ou TikTok permitidos e persiste um descritor tipado; a plataforma
  constrói o embed com origem allowlisted e sandbox/restrições compatíveis. URL
  desconhecida, redirecionada para origem não permitida ou sem identificador
  válido é rejeitada pela RPC.
- **Thread sem recuo infinito.** Uma resposta pode apontar a qualquer ancestral
  do mesmo tópico. A persistência guarda `resposta_pai_id`; a UI limita o recuo
  visual a três níveis e, depois disso, mantém o contexto por “respondendo a”.
  Isso preserva a conversa sem esmagar a leitura no webapp mobile.
- **Leitura e playback são tolerantes à falha.** O feed pagina primeiro texto e
  descritores leves; bytes de áudio e embeds carregam sob demanda. Falha de
  áudio/embed não impede ler, denunciar, responder ou navegar, e não deve ser
  convertida em card falso ou contagem fictícia.
- **Reversibilidade.** Os novos campos/tabelas/RPCs de mídia são aditivos e
  têm rollback somente dos objetos novos. Uma futura troca de fornecedor ou
  remoção de um tipo cria novo adaptador/migração; não coloca SDK de terceiro na
  UI nem muda o contrato de post legado em produção.

## Como migrar sem quebrar (o ponto mais perigoso)

As migrações de `supabase/migrations/` são **aplicadas automaticamente no merge
na `main`**, pela integração GitHub↔Supabase, que mora fora do repositório. O
frontend também sobe no merge. Os dois acontecem juntos e sem ordem garantida.
Por isso:

1. **Duas PRs, nesta ordem.** Primeiro só a migração aditiva; confirmar que foi aplicada; só então o código que a usa.
2. **Só aditivo.** `CREATE TABLE IF NOT EXISTS`, colunas novas `NULL`áveis ou com default, RPCs novas. Nada de `DROP`, rename ou mudança de tipo de retorno em RPC existente — a RPC atual precisa continuar atendendo o frontend que ainda está no ar.
3. **Conteúdo existente não se perde.** Cada post vira um tópico, cada comentário vira resposta. O backfill é idempotente (coluna `legado_post_id` única, `ON CONFLICT DO NOTHING`), não ressuscita apagado nem oculto, manda post sem comunidade para uma comunidade "acervo" e **confere contagens antes e depois, abortando se divergirem**. Essa mesma coluna é o mapa para `/historia/:id`. Limites novos do composer não truncam conteúdo legado; ele permanece legível como legado.
4. **Post criado entre a migração e o deploy novo** não pode ficar fora: trigger espelho que nunca falha o `INSERT` antigo, ou um segundo backfill.
5. **Rollback** em `supabase/rollback/*.down.sql`, só dos objetos novos.
6. **O feed antigo só sai** depois que a jornada nova estiver provada ponta a ponta: banco, acervo convertido, lista de tópicos, criar tópico, conversa com respostas, diretório e E2E ([#248](https://github.com/lgiammattey/aue/issues/248)). Remover RPC ou coluna antiga é PR posterior, com revisão de Camillo e Lucas.
7. **Não repetir o seed de grupos** da migração `20261018000010`: o `ON CONFLICT (nome) DO UPDATE` sobrescreve slug e descrição.

## Alternativas descartadas

- **Usar a coluna `topic` de `posts_comunidade` como tópico.** Ela é o nome da comunidade. Misturaria dois conceitos e quebraria filtros.
- **Manter o feed e colocar "tópicos" como filtro.** É a timeline com outro nome: a conversa continuaria sem endereço nem dono.
- **Migração destrutiva em um passo.** O deploy do frontend e a migração disparam juntos; qualquer janela entre eles quebra a produção.
- **Chat, DM, recomendação e ranking inventado.** Fora do núcleo, como já decidido no épico.
- **Iframe/URL arbitrário e upload de vídeo.** Permitiriam conteúdo sem contrato,
  elevariam o risco de segurança e tornam o custo de streaming imprevisível. O
  primeiro é bloqueado por allowlist e o segundo fica explicitamente fora desta fase.

## O que custa

- Um período com dois modelos convivendo (legado e novo), com trigger ou backfill duplo.
- Backfill com validação própria, porque o `validacao.yml` não testa SQL.
- Reescrever rotas, telas e testes que hoje assumem causo avulso.
- Documentação e protótipos precisam acompanhar ([#252](https://github.com/lgiammattey/aue/issues/252), [#253](https://github.com/lgiammattey/aue/issues/253)).

## O que a implementação da migração decidiu (19/10/2026)

Estas decisões saíram do desenho da migração (`20261019000014` e `20261019000015`) e do Gate
Arquitetural. Onde divergem do texto acima, **vale esta seção**.

- **Resposta em tabela própria.** O texto acima dizia que a resposta reaproveita `comentarios`.
  Adicionar `topico_id` obrigatório em `comentarios` mudaria tabela e RPC que o frontend atual usa
  em produção. `respostas` é nova e usa o mesmo id do comentário.
- **Id preservado.** O id do tópico é o id do post; o da resposta é o do comentário. `legado_post_id`
  e `legado_comentario_id` (UNIQUE) são as chaves do backfill. `/historia/:id` resolve direto.
- **Acesso só por RPC.** `topicos`, `respostas` e `denuncias_conversa` têm RLS ligada, nenhuma
  policy e nenhum grant. Leitura pública (anon e authenticated) e escrita só authenticated, com
  conta promovida e participação na comunidade. Nenhuma RPC recebe o autor como parâmetro.
- **Limites.** Título de 1 a 120, texto de tópico de 1 a 1000 (a tabela aceita até 2000, por causa
  de posts antigos), resposta de 1 a 500. Contados por caractere, como o `char_length` do Postgres.
- **Erros.** Mensagem curta estável e `HINT` com código de máquina (`titulo_invalido`,
  `nao_e_membro`, `topico_fechado`...). `22023` entrada inválida ou inexistente, `42501` sem
  permissão, `P0001` tópico fechado (PostgREST responde 400; `55000` viraria 500). O adaptador
  decide pelo `HINT`.
- **Cursor.** Em `listar_topicos` o cursor é `(p_cursor_valor, p_cursor_id, p_cursor_fixado)`. Tem
  precisão de microssegundo: o adaptador devolve a string do servidor, sem passar por `Date`.
- **Apagar é soft** no lado novo. Pelo caminho antigo (`apagar_meu_causo`), o espelho limpa
  título, texto e áudio do tópico (não deixa o conteúdo apagado guardado).
- **Espelho em um sentido** (antigo → novo), enquanto o feed antigo existir. Denúncia do lado novo
  não esconde o post antigo.
- **Comunidade de acervo** só nasce se existir post sem comunidade. Em produção o esperado é zero.
- **A PR do frontend pode ter migração própria**, aplicada e conferida antes dela: faltam leituras
  que a UI exige (membros reais e contagem de tópicos por comunidade, tópicos e respostas por
  autor, leitura global para o Explorar) e uma função que **repare** (não só acuse) o espelho de
  esconder e apagar. Isso é a "PR 1b".

## Complemento de produto e arquitetura: composer e mídias (20/10/2026)

O Luiz aprovou o composer simples de comunidades. Esta seção substitui os
limites de criação novos descritos anteriormente, mas não reescreve nem
descaracteriza conteúdo legado já migrado.

- Tópico raiz e resposta usam o mesmo composer: até 180 caracteres e um único
  bloco de mídia opcional.
- Áudio livre/voz é aceito em ambos, limitado a 60 segundos. É conteúdo social,
  não uma partida da Arena e não recebe score.
- Imagem e GIF são aceitos como mídia enviada. YouTube e TikTok são aceitos
  somente como embed controlado exibido dentro do Auê; o fornecedor continua
  responsável por hospedar e transmitir o vídeo.
- Comentários podem responder tópicos ou comentários. A árvore é persistida;
  a limitação é somente de apresentação, nunca de autoria ou de pertencimento ao
  tópico.
- Documento, arquivo genérico e upload de vídeo não são suportados.

**Aceite de implementação:** pendente. A decisão está aceita, mas não há nesta
atualização evidência de migração aplicada, código implementado, mídia enviada,
embed reproduzido ou jornada validada em navegador. Cada uma dessas provas será
exigida antes de declarar o comportamento entregue.

## O que ainda não está decidido

- Nome da comunidade de acervo e seu texto público.
- Quem modera e como (papéis) — escopo de [#260](https://github.com/lgiammattey/aue/issues/260).
- Se há categorias ou tópicos fixados na primeira versão.
