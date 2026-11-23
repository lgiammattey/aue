---
name: escrever-testes
description: Diretrizes para Diego e Camillo escreverem testes unitários e de integração (vitest) para a Arena, o mural e o X1 do Auê.
---

# Skill: escrever-testes

Procedimento do **Diego** e **Camillo** para escrever testes automatizados junto com o código — cobrindo regras do jogo, máquina da Arena, mural e recursos de áudio.

Ferramenta: `vitest` via `npm run test`.

---

## 1. O que sempre deve ter teste automatizado

1. **Algoritmo de Pontuação do Arroto (Auê Score):**
   - Garantir paridade da conta (duração, potência, ressonância).
   - Casos limites (áudio muito curto, áudio mudo, nota máxima).
2. **Máquina de Estados da Arena:**
   - Transições de estado corretas (`IDLE` → `RECORDING` → `ANALYZING` → `RESULT`).
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
