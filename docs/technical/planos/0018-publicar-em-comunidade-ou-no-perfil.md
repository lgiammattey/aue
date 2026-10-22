# Plano Arquitetural 0018 — Publicar em comunidade ou no próprio perfil

**Status:** parecer do Gate (Camillo, com leitura de banco como o Lucas). Falta o aceite formal do Lucas.
**Data:** 2026-10-19
**Cartão:** [`.agents/missoes/0018-arena-publica-em-comunidade-ou-no-perfil.md`](../../../.agents/missoes/0018-arena-publica-em-comunidade-ou-no-perfil.md)
**Base:** ADR [0001](../adr/0001-arquitetura-oficial-do-aue.md), [0003](../adr/0003-a-previa-do-link.md), [0010](../adr/0010-comunidades-topicos-e-respostas.md), migrações `20261019000014` a `16`, [`forum-comunidades.md`](../../design/forum-comunidades.md) §10 e §18.
**O que este documento não é:** SQL nem código. Os contratos abaixo são o que a PR de migração tem que cumprir; o texto do SQL é do Lucas.

> Como li o banco: lendo as migrações e rodando `supabase/tests/local/rodar.sh` no PostgreSQL 16 local
> (baseline verde: 340 + 311 asserções). Não li o projeto vivo do Supabase. Onde o texto diz "grant vivo"
> ou "policy viva", é o que as migrações dizem, e a conferência no ambiente aplicado fica como critério de pronto.

---

## 0. Veredito em oito linhas

1. **Confirmo a hipótese com três trocas.** Espaço pessoal é uma linha em `grupos` (assim `topicos.comunidade_id` continua `NOT NULL`, a hierarquia do ADR 0010 não muda), **mas** com `slug` nulo, só `dono_id` (sem coluna `tipo`) e **sem linha em `membros_grupo`**.
2. **Slug nulo é a defesa principal.** Toda leitura e escrita antiga e nova da comunidade é amarrada ao slug. Com slug nulo, o espaço pessoal fica fora de tudo por construção, e não por um filtro que alguém esquece. Isso responde ao ponto 2 do Gate: **não existe `/c/<espaço>`**. O endereço do tópico de perfil é `/t/:id`.
3. A hipótese "uma RPC que devolve ou cria o espaço" vira **detalhe interno** (`aue_obter_espaco_pessoal`, sem grant). O cliente nunca vê nem passa o espaço: `criar_topico_no_perfil` deriva o dono de `auth.uid()`.
4. `grupos` tem **policy aberta de SELECT e INSERT/UPDATE para `authenticated`** (migração `20260807000006`) e nenhum `REVOKE` nas migrações. Sem tratar isso, qualquer pessoa lista o espaço por `GET /rest/v1/grupos` e qualquer conta poderia fabricar espaço em nome de outra. Fecho com **policies RESTRICTIVE** (aditivas).
5. **Uma migração só (M1)** cobre espaço pessoal e idempotência de criar e responder (pedido 5). **Áudio na resposta (pedido 4) fica numa M2** própria, porque exige leitor novo de qualquer jeito.
6. **IndexedDB não entra.** ADR 0001 §5 e §8 item 7 proíbem sem ADR novo, e o `ArmazenamentoLocal` diz "nada de áudio". O arroto viaja numa **retenção em memória** no adaptador web. Refresh no formulário perde o arroto, e a tela diz isso. A linha da matriz que pede sobreviver a refresh **cai** (seção 4.3).
7. Idempotência por **chave gerada no cliente, guardada com o rascunho**, tabela própria no servidor (não mexe no tipo de retorno de `criar_topico`).
8. **Seis PRs** (seção 7). A migração sobe sozinha; porta e UI só depois de aplicada e conferida em leitura.

---

## 1. Espaço pessoal do autor

### 1.1 Desenho

| Peça | Decisão |
|---|---|
| Onde mora | linha em `public.grupos`. `topicos.comunidade_id NOT NULL` fica como está. Invariante (i) segue valendo sem exceção. |
| Marca | `grupos.dono_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE`. Pessoal é `dono_id IS NOT NULL`. Sem coluna `tipo` (duas colunas que podem discordar). |
| Um por conta | índice único parcial em `dono_id WHERE dono_id IS NOT NULL`. |
| Slug | **nulo, sempre.** `CHECK (dono_id IS NULL OR slug IS NULL)`. |
| Nome | `grupos.nome` é `varchar(50) NOT NULL UNIQUE`. Valor interno `'perfil:' \|\| dono_id` (43 caracteres). Nunca sai em tela. |
| Membros | o dono **não** entra em `membros_grupo`. Quem escreve no espaço é decidido por `dono_id = auth.uid()`, não por participação. Nenhuma contagem de membros o enxerga. |
| Criação | preguiçosa, dentro de `criar_topico_no_perfil`, por `aue_obter_espaco_pessoal()` (interna): `INSERT ... ON CONFLICT DO NOTHING` seguido de `SELECT`. Sem backfill: não existe dado a converter. |
| Apagar conta | `ON DELETE CASCADE` leva espaço e tópicos. O arquivo de áudio no Storage não é coberto por isso (ver 1.6). |

Por que slug nulo e não "slug `u-<uuid>` mais filtro":

- `listar_comunidades_sociais`, `entrar_na_comunidade`, `sair_da_comunidade`, `listar_minhas_comunidades`, `publicar_causo`, `listar_topicos`, `aue_ler_comunidades_do_forum`, `explorar_topicos` e as duas leituras por autor (migrações `20261018000010`, `14` e `16`) casam ou filtram por slug. Com slug nulo nenhuma delas alcança o espaço, **sem alterar uma linha delas**. Com slug preenchido, eu teria que reescrever corpo de cinco RPCs que o frontend no ar usa, e qualquer leitor futuro que esquecesse o filtro vazaria o espaço.
- A regra vira: **todo leitor global novo parte do slug** e ganha um teste de exclusão do espaço pessoal. Busca (#241) entra nessa regra.

### 1.2 As quatro invariantes

| # | Invariante | Como é garantida |
|---|---|---|
| i | nenhum tópico sem comunidade, nem por RPC direta | `topicos.comunidade_id NOT NULL` + FK, sem alteração. Nenhuma RPC nova aceita `comunidade_id` do cliente. |
| ii | espaço fora de diretório, Explorar, busca, contagens | slug nulo (1.1) + leitura direta de `grupos` fechada (1.3). Teste por leitor (seção 3.3). |
| iii | só o dono cria tópico no espaço | `criar_topico_no_perfil` não recebe espaço nem dono. `criar_topico` e `criar_topico_com_chave` não acham o espaço (slug). Escrita direta em `grupos` fechada (1.3). Conta B não tem como nomear o espaço de A. |
| iv | tudo aditivo | só objetos novos, mais **duas mudanças de corpo com a mesma assinatura e o mesmo retorno** (1.4). Nenhum `DROP`, rename ou mudança de tipo. |

### 1.3 Fechar `grupos` sem quebrar o ar

Hoje `grupos` tem (migração `20260807000006`): SELECT para `public` com `USING (true)`, INSERT para `authenticated` com `created_by = auth.uid()`, UPDATE para o criador. Nenhuma migração faz `REVOKE` na tabela. Nenhum código em `src/` ou `scripts/` lê `grupos` direto (conferido por busca; `grupos_externos` é outra tabela).

M1 acrescenta **policies `AS RESTRICTIVE`** (somam-se às antigas por AND, não mudam o que existe):

- SELECT para `anon, authenticated`: `USING (dono_id IS NULL)`.
- INSERT para `authenticated`: `WITH CHECK (dono_id IS NULL)`.
- UPDATE para `authenticated`: `USING (dono_id IS NULL) WITH CHECK (dono_id IS NULL)`.

Todas as linhas de hoje têm `dono_id` nulo, então nada muda para o frontend no ar. As RPCs são `SECURITY DEFINER` do dono da tabela e leem `topicos` (RLS ligada, sem policy) em produção desde a 14; o mesmo mecanismo vale aqui. **A conferir no vivo:** que o dono das funções ignora RLS (mesma premissa já exercida pela 14).

Buraco antigo que o Gate achou e **não** corrige aqui: qualquer conta autenticada pode inserir uma linha em `grupos` com slug próprio (a policy só olha `created_by`), e `criar_topico` aceita grupo que ela mesma criou depois de `entrar_na_comunidade`. É um canal de "comunidade avulsa" fora do produto. Registro como pendência para o Lucas e o Marcelo na #260; não bloqueia o 0018.

### 1.4 O que as leituras fazem

| Leitura (existente) | Com o espaço pessoal | Muda? |
|---|---|---|
| `listar_comunidades_do_forum`, `obter_comunidade_do_forum` | exclui (JOIN exige slug não vazio) | não |
| `listar_comunidades_sociais`, `entrar_na_comunidade`, `sair_da_comunidade`, `listar_minhas_comunidades`, `publicar_causo` | inalcançável (casa por slug) | não |
| `listar_topicos(p_slug)` | inalcançável | não |
| `explorar_topicos` | exclui | não |
| `listar_topicos_do_autor`, `listar_respostas_do_autor` | exclui tópico de perfil e resposta dentro dele | não |
| `listar_respostas_do_topico(id)` | funciona por id, sem depender de grupo. É o que permite ler a conversa do tópico de perfil. | não |
| `editar_topico`, `apagar_topico`, `denunciar_topico`, `editar_resposta`, `apagar_resposta`, `denunciar_resposta` | funcionam por id e autoria, sem checar participação | não |
| `obter_topico(id)` | **hoje devolveria o tópico de perfil com `comunidade_slug` nulo e o nome interno `perfil:<uuid>`**, o que quebra o tipo `string` do adaptador e vaza o nome interno | **corpo muda** (mesma assinatura, mesmo retorno): filtra `comunidade_slug IS NOT NULL`. Tópico de perfil não existe para o frontend antigo. |
| `responder_topico(...)` | exige participação no grupo (`aue_exigir_participacao`), então ninguém responde tópico de perfil por ela. Fecha por construção; é por isso que M1 traz `responder_no_topico`. | não |
| `apagar_topico` | hoje só marca `removido` e deixa título, texto, `resultado_id` e áudio gravados. O formulário promete "posso apagar depois". | **corpo muda** (mesma assinatura): ao remover, limpa título, texto, `resultado_id`, consentimento e `caminho_do_audio_da_casa`, como o espelho antigo já faz (`aue_trigger_espelhar_post_apagado`). O Lucas pode contestar; sem isso, a promessa do formulário é falsa. |

Leituras **novas** (anon e authenticated), nomes em português, sem sobrecarga:

- `abrir_topico(p_topico_id uuid)`: mesmas colunas de `obter_topico`, mais `no_perfil boolean`, `dono_handle text`, `dono_apelido text`, `dono_url_do_avatar text`. Para tópico de perfil: `comunidade_id`, `comunidade_slug` e `comunidade_nome` **nulos** (o nome interno nunca sai). Para tópico de comunidade: iguais às de hoje. Usa o mesmo `aue_ler_topicos` (paridade), com a regra de áudio da 14 (consentimento, resultado não escondido).
- `listar_topicos_da_pessoa(p_handle, p_limite, p_cursor_criado_em, p_cursor_id)`: tópicos de comunidade **e** de perfil de uma pessoa, mais novo primeiro, mesmas regras de visibilidade e cursor de `listar_topicos_do_autor`, com `no_perfil boolean`. Handle inexistente, sem promoção ou sem conteúdo devolve zero linhas, igual (sem enumerar perfil).

Fora desta rodada: aba "Respostas" do perfil não mostra resposta escrita dentro de tópico de perfil alheio. Registrado, não resolvido (seção 6).

### 1.5 Quem lê e quem responde

- **Leitura:** igual à comunidade. Visitante e sessão anônima abrem `/t/:id` e ouvem o áudio autorizado, como já abrem `/c/:slug/t/:id`. Tópico oculto, removido ou de autor sem conta promovida não devolve linha.
- **Resposta (padrão do Luiz):** qualquer conta promovida responde, sem ser "membro". Quem decide é `responder_no_topico`: se o grupo do tópico tem `dono_id`, pula a checagem de participação; senão, `aue_exigir_participacao` como hoje.
- **Escrita no espaço:** só o dono. Não há como outra conta nomear o espaço.
- **Moderação:** denúncia por 3 pessoas oculta, como no fórum (reaproveita `denunciar_topico`). Dono apaga o próprio. Moderador de verdade é #260.
- **Indexação e prévia (ADR 0003, pedido 15):** tópico de perfil **fora do sitemap** e sem prévia rica. Quem define indexação dos tópicos públicos é o Rodrigo, junto com o pedido 15. Hoje nenhum tópico tem prévia.

### 1.6 Privacidade, LGPD e consentimento de áudio (AGENTS §5, ADR 0004 §2)

- **Gravou pra jogar não é autorizou publicar.** O servidor recusa `resultado_id` sem `consentimento_audio_publico = true` e sem `aue_resultado_e_meu` (regra da 14, repetida nas RPCs novas). **Regra nova nas RPCs novas:** com consentimento e resultado que ainda não tem `caminho_do_audio`, recusa com HINT `audio_ausente`. Evita "nota sem áudio" quando o upload falhou.
- **Sem consentimento:** o tópico grava só texto, `resultado_id` nulo. O arroto não vira dado do tópico.
- **O que continua verdade e a tela tem que dizer:** o bucket `audio_records` é privado só para moderação. Quem tem o caminho ouve (comentário em `src/db/supabase.ts`). Apagar o tópico não desfaz quem já ouviu. O texto da caixa do formulário (§10.3 da spec) já diz isso; trocar "neste tópico" por "no seu perfil" é copy do Rian/Tiago.
- **Apagar:** `apagar_topico` limpa os campos (1.4). O arquivo no Storage é apagado pelo adaptador, com a mesma opção `apagarAudio` do `apagarCauso` atual (a policy do bucket deixa o dono apagar a própria pasta). Se a limpeza do arquivo falhar, o tópico continua apagado e a tela avisa.
- **Excluir conta:** o banco leva espaço, tópicos e respostas por cascata. **Não verifiquei** se a exclusão de conta limpa o bucket; se não limpa, é pendência de LGPD que já existe para o áudio do `resultados`, e não nasce aqui.
- **Órfão:** se a pessoa fecha a aba no meio de um envio ambíguo (4.4), pode sobrar áudio no bucket sem tópico. Caminho é `<uid>/<uuid>.<ext>`, não adivinhável, e nada o referencia. Aceito, com limpeza de órfãos no BACKLOG (não entra).

### 1.7 Os quatro tópicos de `acervo`

Ficam onde estão: comunidade `acervo`, com seu slug, visível enquanto houver tópico visível (regra da 16). **Não** migram para espaço pessoal: mudaria URL e criaria espaço para quem nunca publicou no perfil. A M1 não toca neles, e o teste confere a contagem antes e depois. A "contagem 4" vem do cartão; não conferi em produção (o ADR 0010 esperava zero).

---

## 2. Contrato das RPCs (M1)

Todas: `SECURITY DEFINER`, `SET search_path = public, pg_temp`, `SET LOCAL lock_timeout = '5s'` na migração, autor sempre `auth.uid()`, conta promovida exigida nas escritas (`aue_exigir_conta_promovida`, que hoje falha com `42501` sem HINT; a porta já trata como `precisaEntrar`). Erro no formato da 14: mensagem curta estável, `HINT` com código de máquina, `22023` entrada inválida, `42501` sem permissão.

### 2.1 Escritas (só `authenticated`)

```text
criar_topico_com_chave(p_chave uuid, p_slug text, p_titulo text, p_corpo text,
                       p_resultado_id uuid DEFAULT NULL,
                       p_consentimento_audio_publico boolean DEFAULT false)
criar_topico_no_perfil(p_chave uuid, p_titulo text, p_corpo text,
                       p_resultado_id uuid DEFAULT NULL,
                       p_consentimento_audio_publico boolean DEFAULT false)
responder_no_topico(p_chave uuid, p_topico_id uuid, p_corpo text, p_pai_id uuid DEFAULT NULL)

as três: RETURNS TABLE (id uuid, comunidade_slug text, no_perfil boolean, repetido boolean)
  - criar_*: id = id do tópico. responder_no_topico: id = id da resposta;
    comunidade_slug e no_perfil descrevem o tópico respondido.
  - repetido = true quando a chave já tinha sido usada com o mesmo conteúdo
    (devolve o original, não grava de novo).
```

Limites iguais aos de hoje: título 1 a 120, texto do tópico 1 a 1000, resposta 1 a 500, contados por caractere, mesmo `aue_aparar_texto`.

| `HINT` | SQLSTATE | Quando |
|---|---|---|
| `titulo_invalido`, `corpo_invalido`, `resposta_invalida` | 22023 | limite ou vazio |
| `comunidade_inexistente` | 22023 | `p_slug` vazio ou sem grupo. **`p_slug` vazio nunca significa "perfil"**: perfil é outra RPC. |
| `nao_e_membro` | 42501 | comunidade comum sem participação (Bonde Geral entra sozinho, como hoje) |
| `audio_sem_consentimento` | 42501 | resultado sem consentimento ou de outra conta |
| `audio_ausente` | 22023 | consentimento marcado e resultado sem áudio gravado (novo) |
| `chave_invalida` | 22023 | `p_chave` nula |
| `chave_reutilizada` | 22023 | mesma chave, conteúdo diferente |
| `topico_nao_encontrado`, `pai_invalido`, `topico_fechado` | 22023 / 22023 / P0001 | como `responder_topico` hoje |

Nenhuma RPC recebe autor, nota, nome, comunidade por id ou dono. O corpo de `criar_topico_com_chave` e `criar_topico_no_perfil` chama um helper interno único (`aue_criar_topico_interno`) para não duplicar limites. `criar_topico` e `responder_topico` **não são reescritas**; o teste de paridade manda os mesmos casos de borda pelos dois caminhos.

### 2.2 Idempotência no servidor

- Tabela nova `envios_de_conversa (usuario_id uuid, chave uuid, tipo text, impressao text, topico_id uuid REFERENCES topicos ON DELETE CASCADE, resposta_id uuid REFERENCES respostas ON DELETE CASCADE, criado_em timestamptz)`, `PRIMARY KEY (usuario_id, chave)`, `CHECK (num_nonnulls(topico_id, resposta_id) = 1)`. RLS ligada, sem policy, `REVOKE ALL` de `PUBLIC, anon, authenticated`.
- `impressao` é o SHA-256 do conteúdo normalizado (tipo, destino, título, texto, `resultado_id`, consentimento, pai). Mesma chave e mesma impressão: devolve o original com `repetido = true`. Mesma chave e impressão diferente: `chave_reutilizada`.
- Concorrência: `pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_chave::text, 0))` antes de consultar e gravar. Dois toques simultâneos viram um.
- Retenção: a cada chamada, apaga as chaves da própria conta com mais de 7 dias (por prefixo da PK). Passou disso, o retry deixa de ser protegido; a UI não guarda chave por tanto tempo.
- Repetição de tópico que virou `removido`/`oculto` depois: `topico_nao_encontrado`. A chave não ressuscita conteúdo.

### 2.3 Grants

`REVOKE ALL ... FROM PUBLIC, anon, authenticated` em tudo que é novo, e depois:

- `GRANT EXECUTE ... TO authenticated`: `criar_topico_com_chave`, `criar_topico_no_perfil`, `responder_no_topico`.
- `GRANT EXECUTE ... TO anon, authenticated`: `abrir_topico`, `listar_topicos_da_pessoa`.
- Sem grant: `aue_obter_espaco_pessoal`, `aue_criar_topico_interno`, `envios_de_conversa`. Helpers também revogados de `service_role`, como a 16 fez.

Cuidado de PostgREST: **sem sobrecarga de nome.** Duas funções com o mesmo nome e parâmetros com default tornam a chamada ambígua (`PGRST203`). Por isso a M2 usa nome novo em vez de "mais parâmetros" em `responder_no_topico`.

---

## 3. Plano de migração e prova

### 3.1 Duas PRs, nesta ordem

| | Conteúdo | Pode tocar |
|---|---|---|
| **PR 1 (migração M1)** | `20261020000001_espaco_pessoal_e_chave_de_envio.sql`, o `.down.sql`, os testes e o runner | só `supabase/migrations/`, `supabase/rollback/`, `supabase/tests/`, `supabase/tests/LEIA-ME.md`. Arquivo em `src/` ali é sinal de fuga de escopo. |
| **PR 2 em diante** | porta, adaptador, UI | só depois da M1 aplicada e conferida |

Merge na `main` aplica a migração e sobe o frontend juntos (ADR 0010). A PR 1 não leva código de frontend, então o deploy que acompanha ela é o mesmo bundle de antes. Depois do merge: `list_migrations` no Supabase **e** a matriz de RLS rodada contra o ambiente aplicado (seção 3.4). Só então abre-se a PR 2.

### 3.2 Regras da M1

- Aditiva: `ADD COLUMN IF NOT EXISTS` nula, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE` com a **mesma** assinatura e o **mesmo** retorno nos dois corpos tocados (`obter_topico`, `apagar_topico`), policies novas, índices novos. Constraint de `grupos` entra `NOT VALID` e depois `VALIDATE` em comando separado (a tabela tem poucas linhas, o padrão é para não segurar trava).
- `SET LOCAL lock_timeout = '5s'` no topo, como a 15 e a 16: melhor falhar o deploy do que enfileirar o app.
- **Sem backfill** (não há dado a converter) e **sem trigger novo**. Os triggers espelho existentes casam por `legado_post_id = NEW.id`; tópico de perfil tem `legado_post_id` nulo e nunca é tocado. O espelho continua em um sentido (antigo para novo). Logo a regra "trigger que nunca derruba o INSERT antigo" não ganha nenhuma superfície nova.
- **Rollback** (`20261020000001_...down.sql`): remove só objetos novos (funções por assinatura, tabela `envios_de_conversa`, policies, índice, constraint, coluna) e restaura os corpos de `obter_topico` e `apagar_topico` copiados da 14. **Aborta com erro se existir algum espaço pessoal**, a menos que `aue.rollback_forcar` esteja `sim` na sessão: descer apagaria conteúdo de gente.
- Não repetir o seed de grupos da `20261018000010` (`ON CONFLICT ... DO UPDATE` sobrescreve slug). Criação do espaço usa `DO NOTHING`.

### 3.3 Prova local (PostgreSQL 16, `rodar.sh`)

Arquivo novo `supabase/tests/espaco_pessoal.sql`, e `rodar.sh` passa a rodá-lo depois de `topicos` e `forum_leituras`. As 340 + 311 asserções atuais **têm que continuar passando** sem edição. O rollback é ensaiado com sobe, desce, sobe (o runner já aceita `ate_versao`).

| Grupo | Asserções mínimas |
|---|---|
| **Aditividade** | o catálogo antes e depois: mesma assinatura e mesmo tipo de retorno (`pg_get_function_result`) para toda RPC pública anterior à M1; nenhuma função ou tabela desapareceu. Contagem de tópicos de `acervo` igual antes e depois. |
| **Invariante i** | `INSERT INTO topicos` direto como `authenticated` falha (sem grant). `criar_topico_no_perfil` sempre grava com `comunidade_id` preenchido. Nenhuma RPC aceita `comunidade_id`. |
| **Invariante ii** | com um tópico de perfil publicado, cada leitor abaixo não o devolve, nem na contagem: `listar_comunidades_do_forum`, `obter_comunidade_do_forum`, `explorar_topicos`, `listar_topicos(<slug qualquer>)`, `listar_topicos_do_autor`, `listar_respostas_do_autor`, `obter_topico`, `listar_comunidades_sociais`, `listar_minhas_comunidades`, `listar_feed_de_causos`. `membros_total` e `topicos_total` de todas as comunidades iguais ao oráculo. `SELECT` direto em `grupos` como `anon` e `authenticated` não vê o espaço. |
| **Invariante iii** | conta B não consegue tópico no espaço de A: não há parâmetro; `INSERT`/`UPDATE` em `grupos` com `dono_id` de outra conta falha; `entrar_na_comunidade` e `publicar_causo` não alcançam o espaço; `criar_topico_com_chave` com slug vazio devolve `comunidade_inexistente`. Duas chamadas concorrentes da primeira publicação criam um espaço só. |
| **Autor** | o autor gravado é `auth.uid()`; nada no payload o muda. |
| **Leitura nova** | `abrir_topico` devolve `comunidade_slug` e `comunidade_nome` nulos para perfil e `dono_handle` certo. Visitante lê. Tópico oculto, removido ou de autor sem promoção não devolve linha. `listar_topicos_da_pessoa`: cursor com empate, handle inexistente igual a conta vazia, `no_perfil` correto. |
| **Resposta** | conta promovida não membro responde em tópico de perfil; em comunidade comum continua `nao_e_membro`. Tópico fechado devolve `topico_fechado`. |
| **Consentimento** | sem marcar, sem `resultado_id` gravado; marcado com resultado alheio recusa; marcado com resultado sem áudio devolve `audio_ausente`; marcado e válido grava `consentimento_audio_publico` e `abrir_topico` entrega o caminho. |
| **Idempotência** | mesma chave e mesmo conteúdo: um tópico só, `repetido = true`, mesmo `id`. Mesma chave e conteúdo diferente: `chave_reutilizada`. Chave nula: `chave_invalida`. Chaves de contas diferentes não colidem. Duas chamadas simultâneas gravam uma vez. Replay depois de apagar: `topico_nao_encontrado`. Chave com mais de 7 dias é varrida. |
| **Apagar** | `apagar_topico` limpa título, texto, resultado, consentimento e áudio da casa. |
| **Paridade** | os mesmos casos de borda (limites, vazio, espaço em branco, quebra de linha) dão o mesmo resultado em `criar_topico` e `criar_topico_com_chave`, e em `responder_topico` e `responder_no_topico`. |
| **Grants e RLS** | `has_function_privilege` e `has_table_privilege` por papel para cada objeto novo (helpers e `envios_de_conversa` sem acesso a ninguém). `pg_policy` lista as três policies restritivas. |
| **Espelho antigo** | com a M1 aplicada, o fluxo antigo (`publicar_causo`, esconder, apagar) continua virando e atualizando tópico. |
| **Rollback** | sobe, desce, sobe deixa o catálogo idêntico ao de antes; desce com espaço existente aborta; com `aue.rollback_forcar` desce. |

### 3.4 O que a prova local não prova

O ambiente é simulação (`stubs.sql`, `prelude.sql`): sem PostgREST, Auth, Storage reais, sem carga. **Depois da aplicação**, leitura no projeto vivo (Lucas, com o Marcelo conferindo): `list_migrations`; `pg_policy` de `grupos`; `has_table_privilege('anon', 'public.grupos', ...)`; `has_function_privilege` das RPCs novas por papel; `select count(*)` de `topicos` por comunidade igual ao de antes; e uma chamada real de cada RPC com JWT de conta promovida, de conta anônima e sem JWT. Isso é a matriz de RLS do cartão; teste local verde não a substitui.

---

## 4. Ciclo de vida do arroto até publicar

### 4.1 O risco, medido no código

Hoje o `onPostarNoBonde` entrega `{nota, audio}` por callback, em memória (`Arena.tsx`, `audio.current`). Trocar de rota desmonta a Arena e o `Blob` some. Pior: o resultado oficial só existe **depois** do aceite, porque `postarCauso` faz `enviarResultado`, depois upload, depois `definir_audio_do_resultado`, depois `publicar_causo` (`plataforma/web/comunidade.ts`). São quatro passos sem transação, três deles não idempotentes (`enviar_resultado` cria linha nova; a segunda chamada de `definir_audio_do_resultado` falha com `55000`; o upload usa `upsert: false`).

### 4.2 Decisão: retenção em memória, uma vaga, no adaptador web

- **Porta nova** `src/portas/retencaoDoArroto.ts` (contrato puro, sem DOM): `reter(arroto) → ficha`, `recuperar() → arroto | null`, `liberar()`. Uma vaga só: o último arroto. Dado do tipo `{ nota, origem, audio }`, o mesmo que o `onPostarNoBonde` carrega hoje.
- **Adaptador** `src/plataforma/web/retencaoDoArroto.ts`: objeto em módulo, que sobrevive à troca de rota da SPA e **não** a reload. Nada de `localStorage` (a porta de armazenamento proíbe áudio) e nada de IndexedDB (§8 item 7 do ADR 0001).
- **Quem chama:** a Arena, ao tocar na ação de publicar, chama `reter` e navega. O formulário chama `recuperar`. `liberar` roda em: publicação confirmada, "Descartar rascunho", novo arroto na Arena, saída da conta e `limparDadosLocais`.
- **Fronteira:** `Blob` e `AudioCapturado` já são tipos da porta de captura (`src/portas/captura.ts`). Nada de `navigator`, `MediaRecorder`, `window` ou `document` fora de `src/plataforma/web/`. O teste `src/arquitetura.fronteira.test.ts` cobre o arquivo novo.
- **Microfone:** a retenção guarda o `Blob` já gravado, não o stream. O dono do microfone continua sendo a porta de captura; reter não mantém nada aberto.
- **Nada sobe antes do aceite.** `reter` não faz rede.

### 4.3 O que se perde, e a linha da matriz que cai

Sem IndexedDB, o arroto **não sobrevive**: a reload dentro do formulário, a fechar e reabrir a aba, ao cadastro por link de e-mail que abre outra aba, ao navegador matar a aba em segundo plano (acontece no iPhone). A tela diz, com franqueza: "Esse arroto saiu da memória. Arrota de novo." e leva à Arena. Nunca publica sem o arroto achando que foi.

**Decisão do Gate:** a linha da matriz "O arroto e a nota sobrevivem a um refresh no formulário" **cai** e vira "sobrevive à ida e volta dentro da mesma aba; no reload, a tela diz que perdeu". A linha do visitante já aceita a perda declarada. Cadastro por e-mail e senha promove o mesmo `uid` (ADR 0009); se isso acontece sem reload, a retenção sobrevive. **Não verifiquei** se o fluxo atual de cadastro recarrega a página. O Marcelo mede no aparelho.

Para decidir com dado e não com palpite: a PR 2 grava um evento de telemetria "arroto perdido na ida ao formulário" (a porta de telemetria existe). Se o número doer, abre-se um ADR para uma vaga de IndexedDB com TTL de 30 minutos. Antes disso, não.

### 4.4 Publicar é uma sequência com progresso guardado

Orquestrada no adaptador (`plataforma/web/forum.ts`), não na UI. Ordem: `enviar_resultado`, upload, `definir_audio_do_resultado`, RPC de criar. Só roda com a caixa marcada.

- O adaptador guarda o **progresso** (`chave`, `resultado_id`, `caminho`, etapa) junto da retenção, só em memória. Retry retoma da etapa seguinte; **não** cria resultado novo nem sobe duas vezes.
- Falha antes da RPC de criar, com certeza de que não gravou: o adaptador tenta apagar o arquivo subido (como `enviarAudioDoResultado` já faz) e devolve `falhou`. O arroto continua retido para tentar de novo.
- Falha ambígua (rede, 5xx, tempo esgotado): **não apaga** o arquivo, devolve `semConfirmacao`, mantém o progresso. O retry usa a mesma chave e o servidor devolve o tópico original se ele já existia.
- O usuário desmarca a caixa ou cancela depois de o áudio ter subido: o adaptador tenta apagar o arquivo antes de liberar. Se não conseguir, a tela avisa; vale o caso do órfão (1.6).
- `definir_audio_do_resultado` falha na segunda chamada. Retomar significa **pular** essa etapa quando o progresso diz que ela terminou. **A conferir pelo Lucas:** o que acontece se o servidor aplicou a etapa e a resposta se perdeu (a retomada vai tentar de novo e receber `55000`). A saída esperada é tratar `55000` com o mesmo caminho como "já feito", lendo o resultado; o Lucas confirma ou propõe RPC idempotente na M1.

---

## 5. Idempotência no cliente e `semConfirmacao`

- **A chave** é um UUID gerado no adaptador (`crypto.randomUUID`, API de navegador, então dentro de `plataforma/web/`) quando o formulário abre e guardada com o rascunho (porta de armazenamento, só a chave). Dura enquanto o rascunho existir. Troca só depois de sucesso, de "Descartar rascunho" ou de `chave_reutilizada` resolvido.
- **Porta** (`src/portas/forum.ts`): `criarTopico` e `responderTopico` ganham `chave`. O valor de sucesso ganha `repetido: boolean`. Entra o destino como união: comunidade (`slug`) ou perfil. Entra `abrirTopico` e `listarTopicosDaPessoa`. Motivos novos: `audioAusente`, `chaveReutilizada`, `chaveInvalida`.
- **Adaptador:** o mapeamento por `HINT` que já existe ganha os três códigos. `semConfirmacao` continua sendo o que o `motivoDeEscrita` devolve para rede, 5xx, `PGRST` e tempo esgotado, e **passa a ser seguro tentar de novo** com a mesma chave. A copy da spec §6.7 ("pode duplicar") deixa de valer para estas chamadas; Rian e Tiago atualizam o texto.
- **Edição durante pendência:** com um envio em `semConfirmacao`, os campos ficam somente leitura e a tela oferece "Tentar de novo" (mesma chave, mesmo conteúdo) e "Descartar rascunho" (chave nova). Editar e reusar a chave devolveria `chave_reutilizada`, e o `chaveReutilizada` mostra "seu envio anterior ainda está pendente".
- Duplo toque: o `useEnvio` já ignora o segundo; a chave cobre o resto.

---

## 6. O que NÃO entra

- **IndexedDB, fila offline, retenção do arroto entre reloads** (ADR novo se a telemetria pedir).
- **Áudio em resposta (#258, pedido 4)** e seu leitor novo: M2, plano próprio. Sai da M1 de propósito.
- **Curtir (#235):** parado, como decidiu o Luiz. Nada de coração, reação ou "Curtidos" novo.
- **Listagem "Meus X1" (#237):** **não existe** no banco. As funções de batalha são `criar`, `obter`, `responder`, `revanchar`; as tabelas têm RLS sem policy e `REVOKE`. Vira cartão próprio do Lucas, com RLS por participante. Até lá a tela oferece criar ou abrir X1, nunca "zero duelos".
- **Vínculo tópico-batalha (#236):** **não existe** (nenhuma coluna ou tabela nas migrações 14 a 16). "Desafiar" dentro do tópico oferece só "Jogar na Arena" e volta ao tópico. Não convida o autor e não fabrica código.
- **Resposta do perfil em tópico de perfil alheio** na aba "Respostas" (precisa de leitor novo; fica para depois do 0018).
- **Busca, Explorar de perfil, contagem de perfil em lista global, Bonde, repost, DM.**
- **Limite de taxa por conta, moderador, fixar e fechar** (#260). Espaço pessoal permite quantos tópicos a pessoa quiser; o abuso é risco conhecido, e só a #260 o fecha.
- **Corrigir o INSERT livre em `grupos`** (1.3, pendência para a #260).
- **Limpeza de áudio órfão** no Storage.
- **Mexer em captura, juiz, pontuação ou nos estados da Arena.**

---

## 7. PRs, na ordem de menor retrabalho

A ordem segue o ADR 0010 (migração, conferir, código) e põe o que muda contrato antes do que o consome. Rian e Tiago correm em paralelo à PR 1, porque é papel.

| # | Entrega | Dono | Depende de | Pronto quando |
|---|---|---|---|---|
| **0** | Documentos: este plano; seção nova no ADR 0010 ("Espaço pessoal", mantém `proposto`, sem ADR 0011); linha de ação no `RESULT` do `ARENA.md`; rótulo na `VOZ.md`; protótipo do formulário com Destino, tópico "No perfil" e telas de perda do arroto | Camillo (ADR e plano), Tiago (`ARENA.md`, `VOZ.md`), Rian (protótipo) | nada | Rian aprovou claro e escuro em 320, 375, 768 e 1280; Tiago passou `filtro-anti-ia` |
| **1** | **Migração M1** + down + `espaco_pessoal.sql` + runner e `LEIA-ME` | Lucas; Marcelo audita | 0 (contrato desta seção) | Seção 3.3 inteira verde, 340 + 311 intactas, rollback ensaiado, só arquivos permitidos na PR |
| **1b** | **Conferência no vivo** (não é PR de código): `list_migrations`, policies, grants, contagens, chamada real com e sem JWT | Lucas executa, Marcelo confirma | 1 mergeada | Evidência colada na PR 2. Sem ela a PR 2 não abre |
| **2** | **Porta e adaptador**: `criarTopico` com destino e chave; `responderTopico` com chave; `abrirTopico`; `listarTopicosDaPessoa`; `retencaoDoArroto`; orquestração de publicar (4.4); evento de telemetria; flag de corte em `src/shared/flags.ts` mais a paridade com o workflow de publicação. Sem UI | Camillo | 1b | Testes com dublê cobrem: caixa desmarcada não faz rede; marcada sobe uma vez; retry retoma sem duplicar; cancelar apaga o que subiu; `semConfirmacao` vs `falhou` por cada `HINT`; fronteira de camadas verde; typecheck, lint, test, build |
| **3** | **UI**: rota `/t/:id`, formulário único (`<dialog>` no desktop, tela cheia no celular) com Destino, ação no `RESULT`, marca "No perfil", telas de perda do arroto, remoção do fallback para `/feed` só no corte. Atrás da flag | Kayky | 2 e desenho do Rian aprovado | Nunca os dois botões ao mesmo tempo (teste); cancelar volta ao resultado; sucesso leva ao tópico com `replace`; conta sem comunidade publica no perfil |
| **4** | **Prova real**: dois aparelhos, visitante mais 2 contas, contagem de requisições no duplo toque, retry e rede lenta, matriz de RLS no vivo, auditoria visual do Rian | Marcelo, Rian | 3 | Matriz do cartão preenchida (com a linha de refresh reescrita, 4.3); nada ligado antes disso |
| **5** | **M2** (plano próprio): áudio na resposta (#258), leitor novo de respostas com arroto, `HINT` do pedido 6 | Lucas, depois Camillo e Kayky | 4 | fora do 0018 |

Fora de sequência, sem PR aqui: #237 (cartão do Lucas) e #236 (precisa de vínculo que não existe; decisão de produto antes).

---

## 8. Riscos que sobram e o que não verifiquei

- **Grants vivos de `grupos`.** Li policies e ausência de `REVOKE` nas migrações; o projeto vivo pode diferir. A 1b confere.
- **RLS ignorada pelo dono das funções no vivo.** Premissa já usada pela 14, mas não vista funcionando em `grupos`.
- **Cadastro recarrega a página?** Define se a retenção em memória sobrevive ao visitante que cria conta no meio. Marcelo mede.
- **Retomada de `definir_audio_do_resultado`** (4.4). Aberta para o Lucas.
- **Exclusão de conta e bucket.** Não verifiquei.
- **Os "4 tópicos de acervo".** Número do cartão, não visto em produção.
- **Desempenho.** `abrir_topico` e `listar_topicos_da_pessoa` repetem o padrão da 16 (`aue_e_conta_promovida` por linha). Sem medição nova; a pendência ACH-1 da 16 vale para eles.
- **Nada deste plano foi executado contra Supabase.** Só rodei o baseline local.

---

## 9. Para o Luiz (só produto; nenhuma bloqueia a PR 1)

1. **Tópico de perfil abre para quem não tem conta, só com o link?** Padrão adotado: sim, igual a comunidade, e fora do sitemap. Se preferir só logado, muda a grant de `abrir_topico`.
2. **Quem perde o arroto ao recarregar a tela aceita ouvir "arrota de novo"?** Padrão adotado: sim, e a gente mede quantos caem nisso antes de pensar em guardar o áudio no aparelho. A alternativa (guardar o áudio no aparelho até publicar) é decisão de arquitetura e privacidade, e fica atrás de ADR.
3. **Resposta que a pessoa escreve no perfil de outra aparece na aba "Respostas" dela?** Padrão adotado: não nesta rodada.

As três perguntas do cartão seguem com os padrões dele: responder tópico de perfil é qualquer conta promovida, tópico de perfil não aparece no Explorar, curtir parado.
