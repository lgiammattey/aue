---
name: escrever-testes
description: Diretrizes para Felipe e Camillo escreverem testes do Auê, com Renan diferenciando auto-teste de validação.
---

# Skill: escrever-testes

Procedimento de **Felipe** e **Camillo** para escrever testes automatizados junto com o código — cobrindo regras do jogo, máquina da Arena, mural e recursos de áudio. Renan usa as evidências na Prova de Fogo dos trechos que não implementou. Registre revisão técnica cruzada, revisão humana ou atuação por papéis conforme o [workflow](../../WORKFLOW.md).

Ferramenta: `vitest` via `npm run test`.

---

## 1. O que sempre deve ter teste automatizado

1. **Algoritmo de Pontuação do Arroto (Auê Score):**
   - Garantir paridade da conta (duração, potência, ressonância).
   - Casos limites (áudio muito curto, áudio mudo, nota máxima).
2. **Máquina de Estados da Arena:**
   - Testar as transições do fluxo tocado. Na V2, partir dos estados em `src/arena/v2/ArenaV2.tsx` (pronto, permissão, calibração, gravação, finalização, revisão e erro). No legado, seguir `src/nucleo/arena/maquina.ts`, incluindo os passos `RECORDING`, `ORIGIN`, `JUDGING` e `RESULT`.
   - Bloqueio de transições inválidas.
3. **Feed & Timeline de Causos:**
   - Carregamento e paginação da lista de posts.
   - Formatação dos dados do post (autor, áudio, pontuação, data).
4. **Ciclo de Vida de Áudio & Microfone:**
   - Liberação de recursos após término ou cancelamento.
   - Tratamento de erro quando o microfone é negado.

---

## 2. Padrões de Teste

- Escrever testes em TypeScript com descrições em português claro indicando o comportamento testado.
- Evitar mocks circulares que apenas testam a si mesmos.
- Testar caminhos de erro reais, e não apenas o fluxo perfeito.
