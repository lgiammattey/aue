# Cartão de Missão — impedir troca visual não solicitada

- **Pedido do Luiz:** impedir a repetição da mudança indevida de cor e padrão no login e nas páginas informativas.
- **Pista:** Fast lane; governança e teste de regressão, sem nova alteração de interface.
- **Decisão de produto:** manter a restauração já aprovada. A raiz é social; login e informativas herdam a casca OpenDesign. A landing de apoio mantém seu visual próprio.
- **Escopo:** corrigir a instrução contraditória em `AGENTS.md`, registrar a família por rota no mapa e testar essa separação no navegador.
- **Fora de escopo:** redesign, publicação, refatoração de componentes, dados remotos e memória pessoal do agente.
- **Responsáveis:** coordenação e documentação no agente principal; Camillo no contrato E2E; revisão de qualidade após a execução.

| Critério | Prova | Estado |
|---|---|---|
| Copy, ergonomia ou testes não autorizam redesign | AGENTS e mapa por rota | atendido |
| Login e informativas não ganham tema claro fixo silenciosamente | Contrato E2E 390 e 1440 | atendido — 6/6 |
| Landing de apoio não muda a raiz nem o login | Contrato E2E | atendido — 6/6 |
| Nenhum componente visual alterado nesta missão | Revisão do diff da rodada | atendido |

- **Aceite final:** aprovado no escopo. Camillo revisou as regras e o teste; os seis cenários E2E passaram em 390 e 1440 px. A prova negativa detectou a troca indevida de fundo sem alterar arquivos. O teste faz parte de `npm run test:e2e`; nenhuma interface foi alterada nesta missão.
