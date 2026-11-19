# Ensaios HTTP do duelo no staging

Em 17/11/2026, no projeto `aue-staging` (`rrkkmzamjntplgxktkyc`), com contas anônimas e áudios sintéticos criados para os ensaios. Nenhuma evidência abaixo é teste em produção ou em aparelho real.

## Privacidade e concorrência

`duelo_http_staging.mjs` usa sessões distintas e serviços reais de Auth, PostgREST e Storage. Antes da resposta, o convite não revelou a gravação; o participante sem resposta e uma pessoa de fora tiveram download negado. Em corridas HTTP de duas respostas ao mesmo convite, houve uma resposta aceita e outra ocupada; os participantes recuperaram o resultado, e quem perdeu a corrida não o recuperou. Estas verificações passaram nas rodadas que chegaram até elas.

**Bloqueio para lançamento:** após uma denúncia retornar `registrada`, o banco mostrava a gravação ocultada, mas a mesma URL de download já acessada continuou retornando HTTP 200 com `cf-cache-status: HIT`. Isto ocorreu imediatamente e após 1,5 segundo. O mesmo endpoint com nonce retornou 400. Houve falhas tanto com download `cache: no-store` como com upload `cacheControl: '0'`; estas opções não são correção confiável. Em uma rodada, uma sessão terceira recém-criada recebeu HTTP 400 na URL previamente acessada pelo participante; isso é apenas uma amostra, não prova geral de isolamento entre sessões.

A denúncia bloqueou o acesso em algumas rodadas, evidenciando comportamento intermitente. O cenário de remoção chegou ao fim em rodadas sem a falha: a API Storage aceitou a remoção e, em seguida, o download com credencial privilegiada foi negado. Isso verifica a indisponibilidade pela API privilegiada, não inspeciona diretamente os bytes internos da infraestrutura.

## Função de áudio privado no staging

Em uma execução HTTP de `audio_edge_http_staging.mjs`, o download direto foi aquecido até `HIT` antes da aplicação da migration `20261118024347_duelos_v2_audio_privado_edge.sql` no staging. Após a mudança da policy, o mesmo GET retornou HTTP 400 nessa execução; isso não demonstra purga de todos os caches nem garante a eliminação imediata de conteúdos antigos em outros pontos da rede.

A função `duelo-audio-v2` respondeu 200 com 100 bytes sintéticos e `private, no-store, max-age=0` para participantes, 404 para uma terceira sessão, 404 ao participante após denúncia e 404 após solicitação de exclusão. Um moderador sintético autorizado acessou o áudio denunciado; uma pessoa não autorizada recebeu 404. O acesso de moderação foi habilitado por stub temporário restrito ao UID do teste no staging. Após o ensaio, a integração confirmou a restauração do stub `SELECT false` e zero duelos, gravações e denúncias sintéticos restantes. Nenhum desses ensaios prova proteção contra cópias já baixadas nem contra todas as corridas possíveis durante a transmissão.

## Trava de exclusão de conta

Após aplicar a migration `20261118023856_trava_exclusao_conta_duelo_v2.sql` **somente no staging**, `trava_conta_http_staging.mjs` passou em três rodadas. A corrida entre criação do duelo e início da exclusão teve dois casos em que a trava venceu e um em que a criação venceu; nos dois desfechos as novas tentativas posteriores foram negadas. Nas três corridas entre upload e início da exclusão, a trava venceu: falta provar o desfecho oposto sob upload real em andamento.

Também passaram o retry da trava, inventário da gravação, rejeição de preparo, confirmação, criação, resposta, reemissão, denúncia e novo upload pelo JWT da conta bloqueada, além da operação normal de outra conta. Os testes não executam o fluxo operacional completo de exclusão de conta existente em produção nem demonstram seu comportamento em todas as corridas possíveis.

Em 18/11, um upload HTTP em streaming iniciou o envio pelo cliente antes da trava e teve seu restante liberado após a trava: retornou HTTP 400, com a gravação no inventário e confirmação posterior negada. Um controle com o mesmo formato de streaming e sem trava retornou HTTP 200 e confirmou a gravação. O ensaio não comprova em que ponto interno o servidor recebeu os primeiros bytes nem se já havia adquirido a trava transacional.

Também em 18/11, a função de áudio do staging devolveu íntegro um WAV sintético de 0,1 segundo, que o Chromium headless decodificou. A sessão foi restaurada em uma nova instância de cliente, que recuperou o resultado e o áudio. Não houve audição física nem prova de recarregamento completo da interface nesse ensaio.

## Proteção de conversas antigas em ambiente isolado

Em 18/11, um recorte descartável de esquema foi montado no PGlite a partir de metadados consultados em produção, sem copiar dados. O recorte inclui as 12 tabelas necessárias à auditoria, colunas, defaults, obrigatoriedade, chaves e relacionamentos; tem CHECKs reais das tabelas de tópico, resposta, comentário e post. Auth e Storage são simulados; triggers, índices e outros recursos não foram reproduzidos integralmente.

Os testes independentes verificaram bloqueio de exclusão com resposta de terceiro, denúncia ou objeto associado; conta vazia pôde ser removida. Após anonimizar o autor e aplicar a correção complementar de prévia, resposta e comentário de terceiro ficaram visíveis, contagens coerentes, e a repetição da operação e anonimização sequencial preservaram os registros. Antes da correção, a prévia não retornava a resposta preservada. A busca pelo título original deixou de retorná-lo após a remoção do texto. Isso não prova a jornada real de exclusão de conta no Supabase.

Uma fixture local com componentes reais, mas dados simulados, mostrou tópico e causo em Chromium a 390 e 1440 px, com resposta de terceiro visível, link correto para seu perfil e sem link para o perfil excluído. Na inspeção de 390 px, o nome “Conta excluída” aparecia truncado. Rota real, envio de nova resposta e links antigos de posts pessoais após exclusão ainda precisam de validação específica.

Depois da correção visual, as quatro combinações da fixture passaram novamente e a inspeção em 390 px mostrou o rótulo completo. A rotina SQL de resposta passou em simulação isolada: uma conta simulada respondeu ao tópico anonimizado, sem poder editá-lo ou apagá-lo; autorização e participação reais continuam sem prova nesse ensaio. O diário de exclusão retomou em simulação após registrar o objeto do duelo antes da remoção, inclusive depois da anonimização zerar dono e caminho. Sem marca de remoção, ou enquanto o objeto permanecia no catálogo, a entrada seguiu pendente. Esse último ensaio usa Storage simulado.

## Limpeza

As execuções registraram IDs e caminhos criados por elas, removeram seus objetos pela API Storage e consultaram o download com credencial privilegiada em seguida. As rotinas finalizaram a limpeza dos próprios registros e contas; não foram direcionadas aos usuários ou buckets anteriores. Credenciais e conteúdo dos áudios não foram registrados nos logs.

## Nova execução HTTP — 18/11/2026

Com a função e o bucket já existentes no staging, `audio_edge_http_staging.mjs`
foi executado no modo que não altera políticas nem configurações. Quatro sessões
anônimas e os áudios foram criados pelo próprio ensaio. Os participantes receberam
o WAV íntegro sem cache; o Chromium o decodificou e uma nova instância recuperou
sessão e áudio. O acesso direto ao bucket e o acesso de terceiros foram negados;
após denúncia ou pedido de exclusão, a função negou o áudio afetado. A moderação
sem privilégio também foi negada. O ensaio confirmou a limpeza dos próprios
objetos, registros e contas.

Esta execução não testou moderação autorizada nem corrida entre upload e
exclusão. O staging usa versões de teste das migrations, e o resultado não é
prova do corte exato em produção, da audição física ou da exclusão física interna.

## Guarda conservadora de exclusão — transação revertida

Em 18/11, o staging recebeu um ensaio SQL sequencial em uma única transação.
A coluna de capa ausente e a guarda candidata foram criadas temporariamente;
duas contas sintéticas foram criadas dentro da transação. A exclusão da conta
com gravação v2 foi recusada e o vínculo permaneceu; a conta vazia pôde ser
removida e a identidade antiga foi negada pelo helper de upload legado.

Ao fim, `ROLLBACK` desfez o ensaio. A consulta posterior confirmou que a coluna,
o gatilho e as funções temporárias não permaneceram, a policy voltou ao mesmo
hash anterior e a migration não entrou no histórico. Nenhuma gravação, duelo
ou objeto v2 permaneceu no staging. O ambiente não tem tópicos, respostas ou
o schema completo de produção; o teste não cobre suas cascatas nem concorrência,
JWT real, Auth HTTP ou upload pela API Storage.
