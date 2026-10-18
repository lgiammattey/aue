# Cartão de Missão 0012 — Organização Hierárquica de Docs e Limpeza de Features/Battle

> Organização da documentação histórica em docs/_arquivo e desmonte cirúrgico do módulo legado features/battle.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** Pastas antigas de documentação de lojas nativas (`distribuicao`, `production-pack`, `prototipo-arena`) continuavam soltas na raiz de `docs/`, poluindo a leitura do time. No código, `src/features/battle/` mantinha telas da disputa presencial anterior cujas regras já foram migradas para o núcleo da Arena (`src/nucleo/disputa/`).
- **Comportamento esperado na tela:** Zero alteração visual ou funcional. O Bonde do Arroto, a Arena com duelos X1 e a roda de disputa continuam funcionando normalmente.
- **Fora de escopo (Não vira):**
  - Não vamos alterar os contratos de compartilhamento de desafio nem a lógica de duelos da Arena.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Reorganização de diretórios e desmonte de módulo legado com preservação de dependências ativas.
- **Fonte de verdade afetada:** `docs/`, `src/features/battle/`, `src/fonte-nas-entradas.test.ts`, `src/lancamento.smoke.test.ts`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky e Camillo
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado.
- **Auditoria e Prova Real:** Marcelo
- **Decisão do Luiz:** Aprovada a organização de docs em _arquivo e o desmonte de features/battle.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Webapp Mobile e Desktop.
- **Estados obrigatórios da Arena:** Preservados.
- **Maior risco de quebra:** Quebrar imports de `ultimaBatalha` ou caminhos nos testes unitários ao mover protótipos e arquivos de batalha.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| docs/distribuicao, docs/production-pack e docs/design/prototipo-arena movidos para docs/_arquivo/ | Marcelo | Git / FS | validado |
| src/fonte-nas-entradas.test.ts validando tokens a partir de typography.css | Marcelo | Teste | validado |
| Telas legadas de battle (BattleView, DisputaLocalScreen etc) e testes removidos | Marcelo | Git / Teste | validado |
| Utilitário essencial ultimaBatalha movido para src/features/audio/ com imports verdes | Marcelo | Typecheck / Teste | validado |
| Todos os testes da suíte e build passam 100% (1301 testes verdes) | Marcelo | CLI (npm run ...) | validado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `docs/distribuicao`, `docs/production-pack` e `docs/design/prototipo-arena`: movidos para `docs/_arquivo/`.
  - `docs/README.md`: árvore de diretórios atualizada sem os pacotes antigos.
  - `src/fonte-nas-entradas.test.ts`: aponta agora para `docs/design/design-system/tokens/typography.css` canônico.
  - `src/features/audio/ultimaBatalha.ts` e `ultimaBatalha.test.ts`: preservados dentro de `features/audio/`.
  - `src/features/audio/AudioRecorder.tsx`: import atualizado para `./ultimaBatalha`.
  - `src/features/battle/`: pasta e 22 arquivos legados removidos por completo.
  - `src/lancamento.smoke.test.ts`: removido import e teste de `BattleView`.
  - `src/nucleo/nota/fala.derivacao.test.ts`: contagem de chamadas a `falaDaNota` ajustada de 5 para 4.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — 117 arquivos de teste, 1.301 testes passando 100%; typecheck, lint e build verdes.
- **Veredito Final do Tiago:** `APROVADO` — hierarquia de `docs/` e `src/` limpa, modular e organizada, sem telas mortas e com dependências preservadas.
- **Pendências ou decisão necessária do Luiz:** nenhuma.
