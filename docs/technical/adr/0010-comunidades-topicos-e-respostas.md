# ADR 0010 — Comunidades, tópicos e respostas (sem feed solto)

**Status:** proposto — Gate Arquitetural do Camillo: **aprovado com condições** (cumpridas na PR da migração, 19/10/2026). Falta o aceite formal do Lucas e do Luiz.
**Data:** 2026-10-19
**Decisão de produto:** Luiz, em 19/10/2026 ([#251](https://github.com/lgiammattey/aue/issues/251))
**Pretende substituir:** ADR 0004 §1 (camada de Feed), §3 (modelo de dados) e §5 (UI do feed)
**Mantém:** ADR 0001, ADR 0004 §2 (fronteira do áudio e consentimento), ADR 0005, ADR 0009
**Vale para:** navegação, rotas, banco, permissões e conteúdo de comunidades

> Enquanto este ADR estiver **proposto**, o 0004 continua valendo e o código
> continua sendo o feed. Este documento descreve para onde vamos e como chegar
> sem derrubar o que já funciona. Nada aqui é comportamento atual.

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

**Comunidade → Tópico → Resposta é a única hierarquia de conversa. Não existe
publicação sem comunidade e tópico. A Arena continua independente e só publica
com consentimento explícito.**

## O que muda na prática

### Entidades

- **Comunidade** — já existe (`grupos` + `membros_grupo`). Ganha slug estável como identidade pública.
- **Tópico** — nova. ID estável, `comunidade_id`, `autor_id`, título, corpo, status
  (aberto, fechado, oculto, removido), datas de criação, edição e última atividade,
  vínculo opcional com resultado + áudio (opt-in).
- **Resposta** — reaproveita `comentarios`, com `topico_id` obrigatório e pai
  opcional **do mesmo tópico**.

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
- Limites de título e texto validados na RPC, com códigos de erro que a UI sabe traduzir.
- Contagens e ordenação por atividade têm fonte real; paginação por cursor estável.
- Áudio privado continua privado. Gravar para jogar não autoriza publicar (ADR 0004 §2 segue valendo).

### Contrato da porta

`listarComunidades`, `listarTopicos(comunidade, cursor, ordenacao)`, `obterTopico`,
`criarTopico`, `listarRespostas(topico, cursor)`, `responderTopico`, editar e
apagar o próprio, `denunciar`, `entrar`, `sair`. A UI não consulta o Supabase
direto; o adaptador fica em `src/plataforma/web/`.

## Como migrar sem quebrar (o ponto mais perigoso)

As migrações de `supabase/migrations/` são **aplicadas automaticamente no merge
na `main`**, pela integração GitHub↔Supabase, que mora fora do repositório. O
frontend também sobe no merge. Os dois acontecem juntos e sem ordem garantida.
Por isso:

1. **Duas PRs, nesta ordem.** Primeiro só a migração aditiva; confirmar que foi aplicada; só então o código que a usa.
2. **Só aditivo.** `CREATE TABLE IF NOT EXISTS`, colunas novas `NULL`áveis ou com default, RPCs novas. Nada de `DROP`, rename ou mudança de tipo de retorno em RPC existente — a RPC atual precisa continuar atendendo o frontend que ainda está no ar.
3. **Conteúdo existente não se perde.** Cada post vira um tópico, cada comentário vira resposta. O backfill é idempotente (coluna `legado_post_id` única, `ON CONFLICT DO NOTHING`), não ressuscita apagado nem oculto, manda post sem comunidade para uma comunidade "acervo" e **confere contagens antes e depois, abortando se divergirem**. Essa mesma coluna é o mapa para `/historia/:id`.
4. **Post criado entre a migração e o deploy novo** não pode ficar fora: trigger espelho que nunca falha o `INSERT` antigo, ou um segundo backfill.
5. **Rollback** em `supabase/rollback/*.down.sql`, só dos objetos novos.
6. **O feed antigo só sai** depois que a jornada nova estiver provada ponta a ponta: banco, acervo convertido, lista de tópicos, criar tópico, conversa com respostas, diretório e E2E ([#248](https://github.com/lgiammattey/aue/issues/248)). Remover RPC ou coluna antiga é PR posterior, com revisão de Camillo e Lucas.
7. **Não repetir o seed de grupos** da migração `20261018000010`: o `ON CONFLICT (nome) DO UPDATE` sobrescreve slug e descrição.

## Alternativas descartadas

- **Usar a coluna `topic` de `posts_comunidade` como tópico.** Ela é o nome da comunidade. Misturaria dois conceitos e quebraria filtros.
- **Manter o feed e colocar "tópicos" como filtro.** É a timeline com outro nome: a conversa continuaria sem endereço nem dono.
- **Migração destrutiva em um passo.** O deploy do frontend e a migração disparam juntos; qualquer janela entre eles quebra a produção.
- **Chat, DM, recomendação e ranking inventado.** Fora do núcleo, como já decidido no épico.

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

## O que ainda não está decidido

- Nome da comunidade de acervo e seu texto público.
- Quem modera e como (papéis) — escopo de [#260](https://github.com/lgiammattey/aue/issues/260).
- Se há categorias ou tópicos fixados na primeira versão.
