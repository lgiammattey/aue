# Cartão de Missão 0011 — Remoção das Telas Zumbis (home e desktop)

> Missão de faxina de código morto no frontend conforme alinhamento com o Luiz e auditoria (Mapa_Aue_2026-10-18.md).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O código ainda mantinha duas pastas de telas antigas desativadas (`src/features/home` e `src/features/desktop`) que não estão em nenhuma rota do roteador atual (`App.tsx`). A HomeScreen e a TelaDesktop antiga confundiam quem lia o código e mantinham testes artificiais de um fluxo que não existe mais.
- **Comportamento esperado na tela:** Zero impacto visual para o usuário. A navegação web mobile e desktop (3 colunas com feed do Bonde, Arena, Comunidades e Perfis) continua idêntica e intacta.
- **Fora de escopo (Não vira):**
  - Não mexer em `src/features/audio` (onde vive o motor e o modelo do juiz).
  - Não quebrar o teste de fumaça das rotas reais.
- **Pista (Lane):** Fast lane / Full flow comum
- **Por que esta pista:** Remoção cirúrgica de código morto isolado sem alteração de contratos ou API.
- **Fonte de verdade afetada:** `src/features/home/`, `src/features/desktop/`, `src/lancamento.smoke.test.ts`, `src/arquitetura.fronteira.test.ts`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Frontend)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Não aplicável (sem impacto em arquitetura central).
- **Auditoria e Prova Real:** Marcelo
- **Decisão do Luiz:** Autorizada continuidade da faxina.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Webapp Mobile e Desktop.
- **Estados obrigatórios da Arena:** Intactos.
- **Maior risco de quebra ou mentira visual:** Remover import em teste que quebre a suíte do Vitest.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Pasta src/features/home/ removida por completo | Marcelo | Código / Git | validado |
| Pasta src/features/desktop/ removida por completo | Marcelo | Código / Git | validado |
| lancamento.smoke.test.ts e arquitetura.fronteira.test.ts ajustados | Marcelo | Código / Teste | validado |
| Toda a suíte de testes passa 100% verde (1395 testes) | Marcelo | CLI (npm run test) | validado |
| Typecheck, lint e build passam 100% | Marcelo | CLI (npm run ...) | validado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/home/`: removido (HomeScreen, CSS e testes).
  - `src/features/desktop/`: removido (TelaDesktop, CodigoQrDoApp, EnderecoParaLevar, CSS e testes).
  - `src/lancamento.smoke.test.ts`: removidos testes das telas desativadas.
  - `src/arquitetura.fronteira.test.ts`: removida pasta da lista de vistoria.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — 127 arquivos de teste, 1.395 testes passando 100%; typecheck, lint e build verificados.
- **Veredito Final do Tiago:** `APROVADO` — telas zumbis limpas sem nenhum efeito colateral na Arena ou no Bonde do Arroto.
- **Pendências ou decisão necessária do Luiz:** nenhuma.
