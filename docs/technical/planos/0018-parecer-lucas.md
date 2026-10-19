# Parecer do Lucas sobre o Plano Arquitetural 0018

**Plano:** [`0018-publicar-em-comunidade-ou-no-perfil.md`](0018-publicar-em-comunidade-ou-no-perfil.md) (Camillo)
**Data:** 2026-10-19
**Papel:** segunda metade do Gate Arquitetural (banco, RLS, contratos).

> Como li e provei: li as migrações `20260807000006`, `27`, `28`, `34`, `36`, `20261018000010` e `20261019000014` a `16`.
> Rodei só em PostgreSQL 16 local, em bancos descartáveis (`lucas_base`, `lucas_p`, `lucas_p2`), com
> `PSQL="runuser -u postgres -- psql" supabase/tests/local/rodar.sh <banco>`. Montei um protótipo descartável
> da M1 (coluna `dono_id`, índice, CHECK, 3 policies restritivas, `envios_de_conversa`, `criar_topico_no_perfil`,
> novo `obter_topico`) só para atacar o plano. **Não é a migração.** Nada foi escrito no Supabase real.

## Veredito: ACEITO COM CONDIÇÕES

O desenho central se sustenta: espaço pessoal como linha em `grupos`, com `slug` nulo e `dono_id`, cumpre as
quatro invariantes nos caminhos que testei. Mas o plano tem quatro furos que eu não deixo ir para a PR 1 como
está (C1 a C4), e uma promessa dele que se prova falsa (as 340 + 311 asserções "sem edição"). Nenhum deles
derruba o desenho; todos entram na M1 ou no teste dela.

## Condições (numeradas, na ordem em que bloqueiam)

**C1. Fechar `grupos` de verdade, dentro da M1 (não como pendência da #260).**
Só policies restritivas não bastam. Provado (seção "O que provei", P3 e P4): uma sessão anônima (role
`authenticated`, não promovida) faz `INSERT` em `grupos` e a comunidade aparece em `listar_comunidades_do_forum`
e `listar_comunidades_sociais` para o visitante. E ninguém bloqueia o nome: a conta B cria um grupo chamado
`perfil:<uuid da conta C>`; a primeira publicação de C no perfil estoura com `23502` em `topicos.comunidade_id`,
para sempre (o `ON CONFLICT DO NOTHING` engole a colisão de `nome` e o `SELECT` volta nulo).
Correção menos arriscada, em duas camadas:
1. `REVOKE ALL ON public.grupos FROM anon, authenticated` (mesmo padrão que a `20261018000010` aplicou a
   `membros_grupo`, `posts_comunidade` etc. e esqueceu em `grupos`). Nada em `src/`, `scripts/` ou
   `supabase/functions/` lê ou escreve `grupos` por PostgREST (a busca só acha `grupos_externos`); as RPCs são
   `SECURITY DEFINER` do dono da tabela. Não há policy de DELETE, então hoje nenhum cliente apaga.
2. As três policies restritivas do plano ficam como segunda camada (se alguém regrantear), com guarda de nome em
   INSERT e UPDATE: `nome NOT LIKE 'perfil:%'`.
Pré-condição de segurança do `REVOKE` (read-only, eu faço na 1b antes do merge): olhar o log da API dos últimos
30 dias por `/rest/v1/grupos`. Se aparecer cliente legítimo, o plano B é só as policies com a guarda de nome
(zero mudança de comportamento hoje, porque nenhuma linha tem `dono_id`). `REVOKE` e feature em **dois arquivos de
migração** na mesma PR, para o `down` cirúrgico não levar o espaço junto se o `REVOKE` incomodar.
Também: `aue_obter_espaco_pessoal` usa `ON CONFLICT (dono_id) WHERE dono_id IS NOT NULL DO NOTHING` e, se o
`SELECT` voltar nulo, levanta erro nomeado (`espaco_indisponivel`) em vez de deixar o `23502` cru subir.

**C2. `apagar_topico`: o plano não é "só uma mudança de corpo".**
- Provado (P5): com o corpo novo, `forum_leituras.sql` **falha** em "reparo: 2 tópicos removidos e limpos (P7, P8)"
  (`topicos_removidos` dá 1, não 2). O cenário P8 depende de `apagar_topico` deixar o conteúdo. Logo a frase do
  plano "340 + 311 intactas sem edição" é falsa. Solução: ajustar a fixture do P8 (`UPDATE ... SET status =
  'removido'` direto, que é o que o cenário quer simular) e dizer isso na PR.
- Usar o mesmo literal do espelho: `titulo = 'Tópico removido'`, `corpo = ''` (o `titulo` tem CHECK de 1 a 120, não
  aceita vazio), `resultado_id = NULL`, `consentimento_audio_publico = false`, `caminho_do_audio_da_casa = NULL`.
- **"Sem backfill" não vale.** Tópicos já removidos pelo corpo antigo (sem `legado_post_id`) ficam com conteúdo
  para sempre: `aue_reconciliar_acervo` só olha tópico com `legado_post_id`. Provado no cenário: 1 tópico removido
  com título, texto e resultado. A M1 leva um `UPDATE` único e idempotente para os `removido` que ainda têm
  conteúdo. Entra na lista de "o que a M1 não é puramente aditivo" e o `down` não desfaz (não há o que restaurar).
- LGPD: **não achei política de LGPD em aberto no ADR 0010.** O "ainda não está decidido" dele lista nome do
  acervo, papéis de moderação e fixados. O ADR já manda o espelho limpar título, texto e áudio ao apagar
  ("não deixa o conteúdo apagado guardado"). Então limpar no `apagar_topico` **segue** o ADR, não contradiz.
  O custo real é outro: denúncia guarda motivo, não conteúdo; o autor que apaga antes da moderação (#260) destrói a
  prova. Aceito, mas registrar essa troca no ADR 0010. Assimetria a registrar também: `apagar_resposta` continua
  soft e mantém o `corpo` na tabela (as leituras não o devolvem). E apagar o tópico espelhado de um post antigo não
  apaga o post antigo (já era assim).

**C3. `remover_audio_do_resultado` não alcança tópico novo (terceira mudança de corpo, ou decisão explícita).**
Provado (P2): com tópico novo que cita `resultado_id` com consentimento, "Apagar meu áudio" limpa o ponteiro, mas
`obter_topico` continua devolvendo nota e duração, `caminho_do_audio` nulo, `resultado_id` intacto: nota sem
arroto. Hoje a função só apaga `posts_comunidade`, e o espelho cobre só o legado. Duas saídas:
(a) M1 muda o corpo (mesma assinatura) para também zerar `resultado_id` e consentimento dos tópicos **do próprio
autor** com aquele resultado; ou (b) `abrir_topico` e `obter_topico` tratam consentimento com ponteiro nulo como
"áudio removido" e a nota some. Recomendo (a). Em qualquer caso a lista de "mudanças de corpo" da M1 passa de duas
para quatro (`obter_topico`, `apagar_topico`, `remover_audio_do_resultado`, mais o `UPDATE` de dados da C2) e o
teste de aditividade tem que dizer isso.

**C4. `enviar_resultado` não é idempotente e o plano não cobre o passo 1.**
Falha ambígua no passo 1 (resposta perdida): o retry cria **segundo resultado** (nota, XP e ranking em dobro,
resultado órfão). O progresso guardado só começa depois de ter o `resultado_id`. "O algoritmo é justo" não aceita
isso calado. Decidir **antes de abrir a PR 1** (para não abrir uma segunda migração): ou a chave também protege o
passo 1 (RPC nova com chave, mesma tabela `envios_de_conversa` com `tipo = 'resultado'`), ou o Tiago registra que o
risco é aceito, com a tela dizendo "pode ter contado duas vezes". Minha recomendação é a chave.

**C5. `obter_topico` e o resto: o filtro por slug é necessário, e ele não é a defesa.**
Provado (P1): `aue_ler_topicos(NULL, <id do tópico de perfil>)` cru devolve `comunidade_nome = 'perfil:<uuid>'` e
`comunidade_id`; com o `WHERE comunidade_slug IS NOT NULL` do protótipo, `obter_topico` devolve zero linhas. Então
o filtro novo é obrigatório. Use o predicado da 16 (`nullif(btrim(slug), '') IS NOT NULL`), não `IS NOT NULL`.
A defesa real é o CHECK `dono_id IS NULL OR slug IS NULL` mais ninguém casar por id sem passar por RPC; o teste
tem que provar isso por **varredura**: para cada leitor da lista e para `abrir_topico` e
`listar_topicos_da_pessoa`, `to_jsonb(linha)::text` não contém `perfil:` nem o uuid do espaço. O plano diz que
`abrir_topico` anula `comunidade_*` mas não diz o mesmo de `listar_topicos_da_pessoa`: anule também ali.

**C6. Idempotência: corretude boa, três buracos de teste e dois de cliente.**
- Provado (P6): o lock funciona. Duas sessões reais, mesma chave: a 2ª esperou 2,0 s, devolveu `repetido = t` com o
  mesmo `id`, 1 tópico, 1 espaço. Mesma chave com conteúdo diferente: `chave_reutilizada` depois de esperar.
  Primeira publicação concorrente com chaves diferentes: 1 espaço, 2 tópicos.
- Sem o lock a integridade ainda se segura pela PK de `envios_de_conversa`, mas a 2ª chamada recebe `23505` cru
  (provado), que o adaptador classifica como `falhou`, não `semConfirmacao`. O lock existe pela qualidade do erro.
- **O harness atual não vê isso.** `topicos.sql` e `forum_leituras.sql` rodam numa transação que termina em
  `ROLLBACK`; "duas chamadas simultâneas" ali é sequencial e passa verde sem o lock. Precisa de um teste de
  concorrência real (dois `psql`, dados commitados, banco descartável), como `supabase/tests/local/concorrencia.sh`.
- A impressão (SHA-256) tem que cobrir tipo, destino (slug normalizado ou perfil), título, texto, `resultado_id`,
  consentimento e `pai_id`/`topico_id`. O teste varia **um campo por vez**; um mutante que faz hash só do título
  passa a linha genérica "conteúdo diferente" da matriz.
- A limpeza dos 7 dias é só da própria conta (`usuario_id = auth.uid()`). Teste: chave antiga de **outra** conta não
  é varrida; chave recente da própria conta também não.
- Cliente: o rascunho guarda a chave "enquanto existir" e não tem prazo. Passou de 7 dias, o retry duplica sem
  aviso. Fixar TTL do rascunho/chave menor que o do servidor (sugiro 24 h). E `crypto.randomUUID` não existe em
  Safari anterior ao 15.4 nem fora de contexto seguro: o adaptador precisa de fallback.
- Tamanho: `impressao` em hex são 64 caracteres; `bytea` de 32 já serve. Linha de uns 150 bytes, sem pressão.
  A limpeza é preguiçosa por conta, então conta inativa mantém suas linhas. Aceitável.

**C7. `definir_audio_do_resultado` e `55000`: o caminho esperado do plano está certo, com uma trava.**
Provado (P2): a 2ª chamada devolve `55000` "Este resultado já tem áudio" mesmo com o **mesmo** caminho, e a
mensagem não revela o caminho gravado. Então o cliente não consegue conferir sozinho. Tratar `55000` como "etapa
já feita" só vale se o progresso diz que esta etapa foi tentada com este `resultado_id` e este caminho; a prova de
verdade fica no servidor: `criar_*` lê `caminho_do_audio` e recusa com `audio_ausente`. Não precisa de RPC nova
na M1. Adaptador: a 14 afirma que `55000` vira HTTP 500 no PostgREST (não verifiquei isso); então a decisão tem
que olhar o `code` do corpo **antes** da regra "5xx = `semConfirmacao`", com teste de dublê para os dois casos.

**C8. Órfãos e a ordem da limpeza (corrige o 1.6 do plano).**
O plano diz que o arquivo no bucket é audível por quem tem o caminho. Pela `034`, a policy de leitura pública
exige um `resultados.caminho_do_audio` apontando para o objeto (e não escondido); **antes do passo 3 só o dono lê**.
Depois do passo 3 o arquivo é assinável por qualquer `anon` que saiba o caminho (`<uid>/<uuid>.<ext>`, não
adivinhável, mas o `uid` é público). Consequência para o cancelamento e a falha **com certeza de não criação**
depois do passo 3: chamar `remover_audio_do_resultado` **primeiro** (revoga a assinatura na hora, como a `028`
explica) e só então `storage.remove`. Se o `remove` falhar, o áudio já não toca. Em falha ambígua não se limpa
nada, como o plano já diz. Órfãos dos passos 1 e 2 são benignos (resultado sem áudio; arquivo só do dono).

**C9. Estratégia, rollback e ordem de deploy: o que faltou.**
- A M1 não leva `src/`, então o deploy do Firebase que sobe junto é o mesmo bundle. Compatível com o frontend no ar:
  com o protótipo (sem `apagar_topico` novo) as 340 + 311 passam intactas (P5).
- Supabase e Firebase integram em paralelo no merge, sem ordem garantida. Por isso a PR 2 só abre depois da 1b, a
  flag nasce **desligada** e o bundle novo tem de tratar RPC inexistente (`PGRST202`) como "indisponível", não como
  sucesso nem erro genérico.
- Rollback: **primeiro desliga a flag, depois o `down`.** O `down` que aborta com espaço existente é correto. Ele
  restaura corpo de `obter_topico`, `apagar_topico` e `remover_audio_do_resultado`; o ensaio compara
  `md5(prosrc)` das funções, não só assinatura (restaurar o corpo errado passa na comparação de assinatura).
- Pré-condições da 1b a acrescentar: `select count(*) from grupos where dono_id is not null or nome like 'perfil:%'`
  igual a zero **antes** do merge (squat pré-existente); log da API por `grupos` (C1); `has_table_privilege`
  de `anon`/`authenticated` em `grupos` depois (deve ser falso).
- Nota de nomenclatura: o padrão do `nomenclatura.md` é `usuario_id`; `dono_id` foge. Trivial, mas decidam antes de
  o nome entrar em três lugares.

**C10. Matriz do §3.3: o que passaria verde com a migração quebrada.**
1. **Grants de `grupos` no ambiente local.** O `prelude.sql` só simula os *default privileges* do Supabase para
   tabelas criadas a partir da 14. `grupos` nasce na `20260807000006`, então localmente `anon` e `authenticated`
   não têm nenhum grant (provado: `permission denied for table grupos`). Os testes "SELECT/INSERT/UPDATE direto
   em `grupos` não alcança o espaço" **passam vazios** mesmo sem as policies. O teste novo faz
   `GRANT ALL ON public.grupos TO anon, authenticated` no começo (espelhando o Supabase) e, depois da M1, afirma
   que o `REVOKE` pegou. Mutantes mortos por isso: policy restritiva ausente, só `authenticated` sem `anon`.
2. Concorrência real (C6).
3. Hash por campo e varredura da própria conta (C6).
4. Varredura `to_jsonb ... NOT LIKE '%perfil:%'` (C5).
5. Conta B nomear o espaço de C (squat) e C publicar normalmente depois (C1).
6. `UPDATE` de grupo comum para virar espaço (`SET dono_id = auth.uid()`) falha. Provado que a restritiva barra.
7. Excluir `auth.users` leva espaço, tópicos e chaves por cascata. Provado que funciona; a matriz não tem a linha.
8. Rollback: comparar catálogo inteiro (`pg_policy`, `pg_constraint`, `pg_index`, colunas, ACL, `md5(prosrc)`),
   não só funções.
9. `remover_audio_do_resultado` e `apagar_topico` com tópico novo (C2, C3).
10. `repetido` e tópico removido depois; `chave_invalida` com nula; chaves de contas diferentes (já na matriz).

## O que respondo às oito perguntas, em uma linha cada

1. **Espaço pessoal com `slug` nulo e `dono_id`:** cumpre as quatro invariantes nos caminhos testados. O filtro
   `nullif(btrim(slug),'')` só protege os leitores da 16; os demais (`listar_comunidades_sociais`, `listar_topicos`,
   `entrar_na_comunidade`, `publicar_causo`) se protegem porque casam por slug. O único leitor que alcança o espaço
   **por id** é `aue_ler_topicos(NULL, id)` via `obter_topico`, e ele vaza sem o filtro novo (C5).
2. **`envios_de_conversa` + lock + SHA-256:** correto sob concorrência (provado); buracos só de teste e de cliente (C6).
3. **Achado do Camillo em `grupos`:** confirmado, e pior do que ele registrou (C1). Nenhuma migração faz `REVOKE`
   em `grupos`.
4. **Mudanças de corpo:** `obter_topico` seguro com o predicado da 16; `apagar_topico` quebra uma asserção existente
   e deixa legado sem limpar (C2); `remover_audio_do_resultado` entra na lista (C3). Não contradiz o ADR 0010.
5. **`55000`:** C7.
6. **Sequência sem transação:** C4 (passo 1) e C8 (ordem da limpeza).
7. **2 PRs, rollback, deploy:** C9.
8. **Decomposição e matriz:** C10. A decomposição em PRs está certa; a PR 1 só precisa dos dois arquivos de
   migração e do runner de concorrência.

## O que provei localmente (comandos e resultado)

Todos em bancos descartáveis; scripts em `/tmp/claude-0/-home-claude-aue/a9773d2e-652f-57c2-b59a-61b9c19c1982/scratchpad/lucas/`.

| # | Comando | Resultado |
|---|---|---|
| P0 | `PSQL="runuser -u postgres -- psql" supabase/tests/local/rodar.sh lucas_base` | baseline: 340 + 311 asserções verdes |
| P1 | protótipo da M1 em `lucas_p`; `probe1.sql` com tópico de perfil publicado | visitante: 0 linhas do espaço em `listar_comunidades_do_forum`, `obter_comunidade_do_forum`, `listar_comunidades_sociais`, `explorar_topicos`, `listar_topicos_do_autor`, `listar_topicos`, `obter_topico`, `listar_respostas_do_topico`; `SELECT` direto em `grupos` (com grant simulado) 0; `aue_ler_topicos(NULL,id)` cru **vaza** `perfil:<uuid>`; `aue_conferir_acervo`/`aue_reconciliar_acervo` ignoram o tópico; `sum(topicos_total)` e `sum(membros_total)` batem com o oráculo |
| P2 | `probe2.sql`: `enviar_resultado`, `definir_audio_do_resultado` duas vezes, `criar_topico` com arroto, `remover_audio_do_resultado`, `apagar_topico` (corpo atual) | 2ª chamada, mesmo caminho ou outro: `55000`; depois do `remover_audio`, o tópico segue com nota e sem áudio, `resultado_id` intacto; `apagar_topico` atual deixa título, texto, resultado e consentimento |
| P3 | `probe3.sql` | sessão anônima insere comunidade e ela aparece no diretório do fórum e em `listar_comunidades_sociais`; `anon` sem sessão é barrado; `DELETE` por `authenticated` remove 0 |
| P4 | `probe1.sql` e `probe4.sql` | B fabrica espaço para si ou para A por `INSERT`: barrado (`42501`); `UPDATE` para virar espaço: barrado; B cria grupo `perfil:<uuid de C>`: **passa**; C publica no perfil: `23502`; `responder_topico` por B e pelo dono no tópico de perfil: `42501 nao_e_membro`; excluir a conta leva espaço, tópicos e chaves (1/2/1 para 0/0/0) |
| P5 | `bash .../regressao.sh` (M1 do protótipo) e `bash .../regressao.sh apagar` | sem `apagar_topico` novo: 340 + 311 verdes; com ele: 340 verdes e `forum_leituras.sql` falha em "reparo: 2 tópicos removidos e limpos (P7, P8)" |
| P6 | `bash .../conc.sh` (dois `psql`, dados commitados) | lock: 2ª sessão esperou 2,0 s, `repetido = t`, 1 tópico, 1 espaço; chave com conteúdo diferente: `chave_reutilizada`; **sem lock**: `23505` cru na 2ª, 1 tópico; 1ª publicação concorrente com chaves diferentes: 1 espaço, 2 tópicos |

## O que não consegui verificar

- **Nada do Supabase vivo**: grants e policies reais de `grupos`, se o dono das funções ignora RLS em `grupos`
  (a 14 já depende disso em `topicos`), log da API por `/rest/v1/grupos`, `pg_stat` de escrita em `grupos`.
  Tudo isso é a 1b, executada por mim com o Marcelo conferindo.
- O mapeamento HTTP de `55000` no PostgREST real (só tenho a afirmação da 14).
- PostgREST, Auth e Storage reais; o `postgres` local é superusuário e o do Supabase não: erro de privilégio de
  função que só apareça com dono não superusuário não aparece aqui.
- Se a exclusão de conta limpa o bucket (o `moderacao-de-audio.md` diz que o produto não tem exclusão de conta).
- Os "4 tópicos de acervo" do cartão e qualquer número de produção.
- Desempenho sob carga (a pendência ACH-1 da 16 vale para as leituras novas).
- Se o fluxo de cadastro recarrega a página (é do Marcelo, no aparelho).
