# Como uma missão anda

A autoridade dos papéis e da precedência está em [AGENTS.md](../AGENTS.md). Este fluxo organiza a execução. O Product Owner decide produto, prioridade e autorização; a squad prepara opções e evidências. **WIP = 1:** uma entrega em execução por vez, mesmo quando há tarefas paralelas dentro dela.

`Ideia → Análise → Decisão → Missão → Implementação → Testes → Validação → Release`

## 1. Enquadramento

Marcelo define problema, pessoa, objetivo, decisão de produto, escopo, prioridade e dependências. Registra o [Cartão de Missão](templates/mission-card.md), a autorização aplicável, a estratégia de reaproveitamento e critérios observáveis. Camillo identifica fronteiras, contrato e necessidade de Gate Arquitetural; Felipe enquadra UX, acessibilidade e referência visual; Renan define como provar o resultado. Lacunas de produto aguardam decisão do PO; escolhas técnicas compatíveis são da squad.

Antes de tocar numa tela, Felipe consulta o mapa de páginas e o design system. Não existe autorização implícita para redesenhar, trocar tema ou inventar estado. Mudança visual depende de pedido e aprovação aplicáveis; a M01 não autoriza redesign.

## 2. Construção e Auto-Teste

O responsável altera somente o escopo autorizado, reaproveita a implementação e registra comandos, ambiente e resultados. Mudanças em áudio, segurança, API, schema, RLS, Storage, contrato compartilhado, fronteira de navegador ou performance crítica passam pelo plano de Camillo: invariante, alternativas, camadas, compatibilidade, dados, custo, riscos, testes e rollback. Quando o ADR 0001 exigir decisão formal, seguir seu §8; este workflow não revoga ADR.

Auto-teste detecta problemas cedo, mas não substitui a revisão de quem não implementou. A matriz de verificações fica em [QUALIDADE.md](../docs/technical/QUALIDADE.md). Falha, teste ignorado, retry e ausência de ambiente são registrados como tais.

## 3. Prova de Fogo

Renan verifica critérios e evidências sem auditar a própria implementação. Felipe avalia UX e prova visual quando houver impacto na experiência; Camillo confere arquitetura, segurança e contratos quando aplicável. Registre pessoas ou agentes efetivamente envolvidos e seu grau de independência. Sem outra instância disponível, registrar revisão por papéis; não chamá-la de independente. Uma instância distinta é revisão técnica cruzada, não validação humana independente.

Marcelo reúne os pareceres (`SEM ACHADOS MATERIAIS`, `AJUSTA`, `BLOQUEIA`, `ISSUE_FUTURA`) e recomenda `APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO` ou `NÃO VALIDADO`, com pendências. O PO dá o aceite quando exigido. Separar implementado, testado, homologado e publicado. A aprovação do código não significa release nem prova em aparelho ou produção.

## Release e próxima missão

Preparar a publicação somente quando ela integrar o escopo autorizado e os gates forem cumpridos; conferir [RELEASE.md](../docs/technical/operacao/RELEASE.md), versão e rollback. Deploy, merge, alteração de produção ou migração real precisam de autorização aplicável. Uma missão futura não começa automaticamente após a anterior. Exceção de incidente: conter o dano com a menor mudança e registrar cartão, validação e decisão assim que possível.
