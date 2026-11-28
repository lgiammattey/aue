# M02 · Integridade de resultados e cadastro de grupos

**Parecer de coordenação: aprovado com ressalvas para revisão em PR.** O laudo experimental continua disponível. Uma medição declarada pelo navegador deixou de valer como prova para XP, conquistas, vitória e placar. No X1, tanto quem abre o resultado quanto quem volta pelo histórico vê as duas durações como medições experimentais. O PO aceitou a M02 com as ressalvas registradas. Homologação e publicação seguem pendentes.

## O que foi entregue

| Recorte | Decisão aplicada |
|---|---|
| Laudo e histórico | A RPC existente grava novos resultados como `nao_verificado`. Resultados anteriores recebem `legado` e conservam os registros históricos. Para criar consequência competitiva, as portas de posse e comparação exigem resultado verificado pelo servidor e, quando se trata de posse, a sessão correspondente. O cliente não pode marcar o laudo como verificado nem consultar o comparador interno diretamente. A implantação não prevê recalcular XP antigo. |
| Áudio publicado | A fila e o worker de notas existentes agora reconhecem o áudio consentido da Arena. O vínculo exige o tópico e o resultado do mesmo autor, o objeto correspondente e seu proprietário. A concessão de trabalho e a versão do objeto impedem reaproveitar uma conclusão vencida. Só a publicação pode aparecer no top com essa nota. O laudo pessoal continua experimental. |
| Consumidores | A melhor nota do perfil, o resumo de notas publicadas e os placares de batalha e campeonato usam as fontes permitidas. A resposta do duelo V2, inclusive na recuperação, expõe as medidas e declara ausência de efeito competitivo. O frontend conserva as rotas e o visual existentes. |
| Cadastro de grupos | O handler limita a leitura de bytes antes de interpretar o formulário. Uma RPC restrita ao serviço reserva a vaga e persiste o grupo na mesma transação, com janela móvel de uma hora e tetos de 3 por origem e 100 no total. Quando falta a origem confiável, aplica a cota compartilhada. |
| Acesso e banco de teste | Sete policies do Storage usam um helper restrito à sessão atual. O helper interno antigo do fórum perdeu execução direta pelo cliente. As RPCs públicas previstas continuam disponíveis. O runner interrompe a cadeia na primeira migration inválida. |

O [cartão e a decisão de engenharia](M02-INTEGRITY-PROPOSTA.md) registram os contratos reaproveitados. As seis migrations, a mudança nas duas Edge Functions, os consumidores do duelo, os testes e a documentação constam do diff da branch.

## Provas

| Ambiente e execução | Resultado observado |
|---|---|
| Aplicação local, Node 24.22.3 | Typecheck e build passaram. Lint manteve os 23 avisos preexistentes. Vitest passou em 2.603 testes. Os nove de fórum ficaram fora por opt-in e passaram em outra execução com visitante, dados sintéticos e PostgREST local. |
| PostgreSQL 17 descartável | Passaram as 117 migrations da Foundation e as seis da M02. Após aplicar as seis numa transação de ensaio e revertê-la, o dump do esquema teve o mesmo hash da Foundation. Uma migration inválida introduzida no teste fez o runner parar antes da próxima. |
| Persistência e concorrência | Oito solicitações da mesma origem resultaram em três cadastros. Com 99 vagas globais já usadas, cinco origens disputaram a última e só uma entrou. Pelo handler Deno e PostgREST locais, seis requisições simultâneas retornaram três HTTP 201 e três 429. Uma falha forçada ao persistir a cota retornou 500 sem deixar grupo. Passaram os seis testes de corpo, concorrência e runner. |
| SQL de integridade e regressão | Oito scripts passaram no esquema atual: Storage e sessão, revelação e recuperação V2, resultado e worker, convites, exclusão, anonimização, denúncia e respostas no mural. A prova do worker cobriu autoria, consentimento, troca de eTag, concessão vencida, repetição e ausência de consequência pessoal. A regra do comparador foi exercitada pela RPC permitida e pela negação de acesso direto. |
| SQL social e contratos históricos | Duas suítes continuam vermelhas. `topicos.sql:192` requer comunidade já removida. `forum_leituras.sql:217` exige o conjunto de colunas de uma versão anterior. As asserções seguintes não rodaram. Os scripts históricos do V2 com a antiga assinatura de um argumento seguem vinculados ao respectivo esquema histórico. A cobertura do contrato atual está em `local/duelo_medicoes.sql`. |
| Worker e Edge | Dez testes passaram no motor/worker, incluindo leitura de áudio e resposta do gateway. O Deno validou os dois entrypoints alterados. Os objetos, identidades e serviços da prova eram locais. |
| Chromium | Dez E2E passaram sem retry nas suítes de contrato visual e duelo, em 320, 390 e 1440 px. Na rota real do convite, com Auth e RPC simulados, o resultado mostrou 1,20 e 1,83 s em 390 e 1440 px, sem vencedor e sem alargar a página. A primeira execução do E2E não carregou a configuração pública local; a repetição usou os valores do ambiente descartável. |

A suíte geral rodou com o Node 24 adotado pela validação do projeto. Uma execução com Node 26 encontrou incompatibilidade de Web Storage no ambiente de testes. A prova visual foi feita em navegador desktop com viewport móvel. Captura física no iPhone e no Android, identidade de origem do gateway, serviço hospedado de Auth e entrega dos bytes pelo Storage continuam sem prova. O ensaio transacional cobriu a reversão antes do commit. Reverter uma instalação já confirmada exige migration corretiva que preserve a contenção.

## Revisão, GitHub e continuidade

Camillo atuou com o perfil nativo e fechou a decisão de engenharia. Um agente distinto aplicou o roteiro de qualidade de Renan, revisou as correções e emitiu **sem achados materiais** no recorte testado. Outro agente aplicou o roteiro de experiência de Felipe e conferiu a rota em Chromium. Duas tentativas de abrir os demais perfis pelo cliente persistente falharam com `model_not_found`. Marco consolidou a entrega no papel de coordenação de Marcelo. Não houve assinatura nativa de Marcelo, Renan ou Felipe nesta execução.

A branch `codex/m02-integrity` parte de `921a3cc6fddd8990c7f30432d645232d1c302cee`, na [Foundation #385](https://github.com/lgiammattey/aue/pull/385). O workflow de validação só atende PRs destinados à main ou pushes na main. Os gatilhos versionados de publicação foram conferidos antes do push. A situação observada no GitHub consta do PR.

Com o aceite da M02, o PO autorizou a [M03](M03-RELATORIO.md). As pendências de homologação seguem no [backlog](../escopo/BACKLOG.md).
