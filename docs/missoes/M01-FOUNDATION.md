# M01 — Foundation

**Estado:** M01 recebeu parecer `APROVADO COM RESSALVAS`; o PO autorizou a M01.1 para encaminhar as ressalvas e consolidar a Foundation. M01.1 é a única missão em execução; seu aceite final aguarda o PO.

## Enquadramento

- **Problema:** regras, papéis, arquitetura descrita e gates estavam espalhados ou contraditórios, e as pendências M00 precisavam permanecer rastreáveis.
- **Objetivo:** consolidar squad, fluxo, documentos canônicos, arquitetura observada, backlog, roadmap e qualidade sem alterar o comportamento do produto.
- **Escopo:** governança, agentes, skills, documentação e controles de engenharia compatíveis. A autorização do PO consta do pedido M01; não implica autorização de release.
- **Fora:** redesign, funcionalidades, novas regras competitivas, limpeza em massa, dados/configuração de produção, migrations reais, deploy, merge e início de outra missão.
- **Dependências:** baseline M00 aceito com ressalvas, histórico e ADRs existentes; nenhuma prova de produção é inventada.
- **Reuso:** `AGENTS.md`, `.agents/`, ADRs, arquitetura, escopo, backlog, workflows e runbooks existentes.
- **Riscos:** múltiplas fontes canônicas, quebra de links, troca visual indevida, prometer integridade não provada e sobrescrever WIP. Mitigar com worktree isolada, links, revisão cruzada e níveis de prova.
- **Gate:** Camillo registra arquitetura observada e divergências; não altera stack nem substitui ADR aceito nesta missão.

## Critérios de aceite

| Critério | Prova | Estado |
|---|---|---|
| Quatro titulares e skills coerentes, sem donos antigos ativos | Inventário; parsers TOML/YAML; descoberta das 17 skills; tentativa efêmera de invocar `renan` falhou antes da resposta; execução em sessão compatível ainda não comprovada | atendido com ressalva |
| Fluxo, três etapas, WIP 1 e cartão com riscos, testes, evidências e rollback | Leitura cruzada e links | atendido |
| Direção de produto registrada sem ativar funcionalidades | Pedido M01 do PO; diff documental sem alterações de UI/negócio | atendido |
| M00 aceita para planejamento; AUE-T01–T15 e SEO mantidos abertos | Backlog e baseline rastreáveis | atendido |
| Roadmap M00–M06, com M02–M06 bloqueadas | Roadmap e cartão M02 proposto | atendido |
| Arquitetura, qualidade, release e limites de prova documentados | Revisão cruzada e checks aplicáveis no relatório | atendido com ressalvas operacionais M00 |
| PO recebe pareceres e decide aceite | Pareceres identificados e evidências | pendente |

## Testes e rollback

Testar consistência das definições de agente, links, documentação, diff e verificações aplicáveis sem credenciais ou efeitos externos. Registrar testes históricos da M00 separadamente de qualquer execução da M01. Como a missão não altera dados nem runtime, rollback consiste em reverter a mudança documental/operacional da M01; não há rollback de produção a executar.

## Resultado

- **Construção e Auto-Teste:** registrados no [relatório executivo](M01-RELATORIO.md).
- **Prova de Fogo:** revisão cruzada por agentes distintos, sem alegação de revisão humana independente; resultados e limites no relatório.
- **Pareceres:** Felipe, Camillo e Renan `SEM ACHADOS MATERIAIS` nos escopos cruzados após correções; Marcelo recomenda `APROVADO COM RESSALVAS`, sem substituir o aceite do PO.
- **Aceite do Product Owner:** parecer de M01 recebido com ressalvas; M01.1 autorizada para closeout, com aceite final do closeout pendente.
- **M02:** bloqueada, apenas [cartão proposto](M02-INTEGRITY-PROPOSTA.md).
