# Decisões de produto e trabalho

Este registro reúne decisões de produto e governança que orientam as missões. A definição vigente continua em [AUE.md](jogo/AUE.md); decisões de arquitetura aceitas ficam nos [ADRs](technical/adr/), sem cópia concorrente aqui. O código versionado e o ambiente observado comprovam comportamento, não intenção.

## 27/11/2026 — direção de produto

No pedido M01 de 27/11/2026, o PO define o Auê como plataforma competitiva de arrotos, com comunidade em torno da competição: Arena como núcleo, Mural para interação e resenha, Perfil para identidade e reputação, gravador transversal. Essa direção preserva o jogo no centro e não reativa automaticamente comunidades temáticas, tópicos, votação, progressão ou alterações de interface. Nenhuma regra nova de competição ou implementação foi aprovada pela M01.

## 27/11/2026 — M00 e M01

No pedido M01 de 27/11/2026, o PO aceita a M00 com ressalvas para planejamento e autoriza M01 Foundation. O [acompanhamento executivo](https://chatgpt.com/space/page_78a57da82f108191baa7cafabdbac7dc) registra a mesma direção e autorização como contexto, sem substituir este registro versionado. O parecer técnico da auditoria integral continua `NÃO VALIDADO`; as lacunas seguem no [backlog](escopo/BACKLOG.md) e nos gates. M01 cobre governança, documentação e controles de engenharia; não autoriza redesign, funcionalidades, migrações reais, merge ou deploy. O aceite final da M01 ainda depende do PO.

## 27/11/2026 — squad e fluxo

Marcelo responde por produto e orquestração; Felipe por UX/UI e Design System; Camillo por engenharia e arquitetura; Renan por qualidade. WIP = 1. As responsabilidades e a independência efetivamente disponível são registradas no cartão, com as três etapas do [workflow](../.agents/WORKFLOW.md). O Product Owner mantém a decisão sobre escopo e aceite.

## 27/11/2026 — sequência

M02 Integrity, M03 Cleanup, M04 Reliability, M05 Experience e M06 Release ficam bloqueadas até autorização expressa. Preparar o cartão de M02 não a inicia; resolver T01/T02 pode ser parte de M02 e não é pré-requisito circular para decidir se ela começa. Prioridades e evidências da M00 permanecem no [backlog](escopo/BACKLOG.md).

## 27/11/2026 — M01.1 Closeout

A M01 recebeu parecer `APROVADO COM RESSALVAS`. O PO autorizou a M01.1 para validar os agentes, classificar avisos e testes ignorados, revisar a Foundation e consolidá-la em commit, push e PR draft quando comprovado que não haverá publicação automática. Não autorizou merge, deploy, mudança funcional ou início de M02. O aceite final do closeout aguarda o PO.
