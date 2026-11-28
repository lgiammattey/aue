# Qualidade e evidência

Este documento define como a squad demonstra que uma mudança funciona. Ele não
substitui o comportamento real, os critérios de aceite da missão nem a decisão
final de Produto.

O ponto de partida é a M00, aceita para planejamento com ressalvas: há provas
locais úteis, mas não há validação completa de banco, Auth, Storage, worker,
aparelhos reais ou versão implantada. Uma checagem verde não transforma uma
hipótese ou um dublê em prova operacional.

## O gate da missão

Toda missão passa por três etapas, nesta ordem:

1. **Enquadramento.** O Cartão de Missão define o problema, o recorte, os
   critérios de aceite, riscos, reaproveitamento, prova esperada e rollback se
   aplicável. Sem isso, não começa implementação.
2. **Construção e auto-teste.** Quem implementa executa as verificações
   aplicáveis à mudança e registra resultado, ambiente e qualquer limitação.
3. **Prova de Fogo.** Quem não implementou confere a evidência contra os
   critérios do cartão. Marcelo consolida e recomenda o parecer; o Product Owner
   dá o aceite quando aplicável. A prova não inicia a próxima missão automaticamente.

WIP é um: uma missão só sai da mesa quando tiver parecer final. A regra de
trabalho está em [`../../AGENTS.md`](../../AGENTS.md), e o
[`Cartão de Missão`](../../.agents/templates/mission-card.md) é o seu registro.

## Verificações exigidas

As quatro verificações mecânicas são obrigatórias para mudança de código que
possa chegar ao merge: typecheck, lint, testes unitários e build. Os scripts
canônicos estão em [`package.json`](../../package.json); a CI os executa em
[`validacao.yml`](../../.github/workflows/validacao.yml). A documentação não
repete comandos para não criar outra fonte operacional.

Além delas, a missão inclui somente as provas que seu risco pede:

| Quando a mudança toca | Prova mínima antes do parecer |
| --- | --- |
| Fluxo React, rota ou estado de Arena | Teste unitário/integrado e E2E local aplicável, incluindo estado de erro e retorno seguro. |
| Microfone, gravação, player ou Web Audio | Ciclo de vida do recurso, interrupções e mídia sintética; aparelho real entra na Prova de Fogo quando o comportamento depende de hardware. |
| Banco, RLS, RPC, Auth ou Storage | Teste descartável de migrations e papéis relevantes; prova no ambiente autorizado quando a decisão depende do serviço implantado. |
| Migration | Reconstituição descartável, teste SQL aplicável e plano de rollback. A ausência de um ambiente fiel fica explícita no parecer. |
| Interface, CSS ou fluxo mobile | Revisão desktop e webapp, sem overflow horizontal, teclado, alvos de toque e contraste. Alteração visual também segue o mapa de telas e o design system. |
| Segurança, privacidade ou entrada externa | Cenários de negação, autorização, limites e falhas honestas. O teste não pode converter erro em sucesso aparente. |
| Hospedagem, SEO, PWA ou artefato público | Build configurado, rotas e metadados esperados, além da rastreabilidade da versão publicada definida em [`operacao/RELEASE.md`](operacao/RELEASE.md). |

Testes em jsdom, PGlite, mocks, mídia falsa e harness local comprovam o cenário
declarado, não o equivalente no Supabase, navegador físico ou produção.

## Resultado e estabilidade

Um retry pode ajudar a diagnosticar intermitência, mas não converte a primeira
falha em aprovação estável. O relatório deve guardar a falha original, a
repetição e a hipótese, se houver. Uma entrega com falha não explicada em
verificação exigida recebe `BLOQUEIA` até a missão própria resolver ou o
critério for reavaliado por Produto.

A M00 encontrou falhas intermitentes na suíte de fórum e registrou que uma
execução integral com retry terminou verde. Esse resultado é baseline de
investigação, não selo de estabilidade. AUE-T13 permanece aberto.

Os únicos pareceres possíveis da revisão são:

- `SEM ACHADOS MATERIAIS`: a prova cobre os critérios da missão e não deixou
  achado que impeça o aceite.
- `AJUSTA`: há uma aresta concreta para resolver antes do parecer final.
- `ISSUE_FUTURA`: há melhoria não impeditiva com limite e dono registrados.
- `BLOQUEIA`: há falha de gate, privacidade, integridade, regressão impeditiva
  ou prova insuficiente para uma afirmação exigida pela missão.

Quem escreveu não audita o próprio código. Quando o trabalho for executado por
papéis na mesma ferramenta, o registro diz isso; não chama essa atividade de
revisão independente.

## Banco e migrations

O runner local em [`supabase/tests/local/rodar.sh`](../../supabase/tests/local/rodar.sh)
é uma ajuda de reconstrução, não uma prova do Supabase implantado. A M00
identificou que seu pipeline de migrations usa `|| true`, capaz de ocultar uma
falha antes da mensagem de sucesso. Esse é o AUE-T11: até sua correção e prova
descartável, o runner não pode certificar migration.

As suítes SQL e seus limites estão em
[`supabase/tests/LEIA-ME.md`](../../supabase/tests/LEIA-ME.md). Não execute
SQL, migration, rollback ou script com escrita fora de ambiente descartável e
expressamente autorizado.

## CI e limites conhecidos

`validacao.yml` cobre typecheck, lint, Vitest, processamento de áudio em Node
e Chromium e build. Hoje ela não executa a suíte E2E geral, as suítes SQL,
auditoria de dependências, acessibilidade, validação em aparelho ou checagem
do ambiente Supabase. Esses itens não podem ser declarados aprovados por
analogia.

O workflow de publicação é separado e está em
[`publicar-firebase.yml`](../../.github/workflows/publicar-firebase.yml). Ele
não depende do workflow de validação. A exigência de checks antes de merge é
uma configuração externa de proteção de branch; o repositório não prova que
ela esteja ativa. Enquanto essa configuração não for conferida em leitura, a
CI verde é evidência, não trava de merge.

## Pendências de qualidade que não se fecham por documento

Permanecem abertas as provas operacionais de áudio em aparelhos, Auth, RLS,
Storage, worker de notas, SQL com ambiente fiel, estabilidade do fórum,
acessibilidade completa, desempenho de campo e versão efetivamente publicada.
Elas devem manter seus identificadores AUE-T01 a AUE-T15 no backlog técnico;
documentá-las não as resolve.
