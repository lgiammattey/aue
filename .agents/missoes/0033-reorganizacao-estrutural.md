# Cartão de Missão 0033 — Reorganização estrutural de código e documentação

## 1. Enquadramento (Tiago)

- **Dor / problema da pessoa:** camadas canônicas, compatibilidade e histórico
  estavam misturados, tornando fácil alterar o lugar errado.
- **Comportamento esperado na tela:** nenhum. Tropa, Comunidades, Arena e X1
  preservam comportamento e rotas.
- **Fora de escopo:** remoção de legado roteado, contratos, migrações, APIs de
  navegador, Supabase, rotas, deploy, merge e descarte de WIP.
- **Pista:** Full flow sistêmica.
- **Fonte de verdade afetada:** `AGENTS.md`, ADR 0001, mapa de páginas,
  arquitetura e código real.

## 2. Donos e fronteiras (Iury)

- **Aceite final:** Tiago.
- **Plano e gate:** Camillo — aprovado com trava para movimentos mecânicos.
- **Implementação:** Camillo, em worktree isolada.
- **Auditoria:** Marcelo.
- **WIP protegido:** `docs/auditorias/` no checkout principal,
  `aue-mvp-comunidade` e os demais worktrees ativos.

## 3. Movimentos aprovados

- Testes transversais da raiz de `src/` passam a morar em `src/qualidade/`.
- Documentação técnica passa a separar `audio/`, `dados/` e `operacao/`, com
  índice próprio.
- Cartões concluídos saem de `docs/historias/` e passam a
  `.agents/missoes/_arquivo/`; a história Burpzilla permanece onde está.
- O inventário de reposicionamento vira arquivo histórico em
  `docs/_arquivo/inventarios/`.

## 4. Aceite

| Critério observável | Dono da prova | Estado |
|---|---|---|
| Movimento preserva consumidor e contrato | Camillo | implementado |
| Não há caminho antigo em uso | Marcelo | pendente |
| Rotas e jornada permanecem iguais | Marcelo | pendente |
| Typecheck, lint, teste e build passam | Marcelo | pendente |
| WIP e worktrees externos ficam intactos | Iury / Marcelo | pendente |

## 5. Limite da entrega

`src/features/comunidade/` continua como compatibilidade declarada. Não entram
nesta missão `src/db/`, `features/audio/`, `shared/auth`, `plataforma`, portas,
rotas ou qualquer migração.
