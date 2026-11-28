---
name: revisar-produto
description: Enquadramento de missão, Cartão de Missão e parecer final de Marcelo para o Auê.
---

# Skill: revisar-produto

Use no Enquadramento (para analisar, decidir e abrir o Cartão de Missão) e na chegada (para emitir parecer após Construção, Auto-Teste e Prova de Fogo).

---

## 1. Na Largada (Enquadramento e Cartão de Missão)

Antes de acionar a oficina:
1. Diferencie **Ideia** (conversa, zero código), **Análise**, **Decisão** e **Missão**.
2. Confirme o loop vigente em `AUE.md`, `JORNADA.md` e `ARENA.md`; não crie estado ou funcionalidade por um documento antigo.
3. Classifique a **Pista (Lane)**:
   - `Exploração` (zero código);
   - `Fast lane` (ajuste cirúrgico de copy, token visual ou bug isolado);
   - `Full flow comum` (nova tela ou componente dentro dos contratos existentes);
   - `Full flow sistêmica` (aplicar o Gate de Camillo conforme os gatilhos do [workflow](../../WORKFLOW.md#2-construção-e-auto-teste));
   - `Hot lane` (build quebrada ou fluxo crítico inoperante).
4. Abra o [Cartão de Missão](../../templates/mission-card.md) com escopo limpo, critérios observáveis e a prova que o auditor precisará cobrar.

---

## 2. Na Chegada (Parecer de Marcelo)

Com a evidência do auditor (funcional e testes) e a fidelidade visual ao design system, avalie:

1. **Necessidade:** Resolve uma dor real da pessoa no Arena ou no mural sem adicionar fricção?
2. **Valor:** Deixa o ato de arrotar, receber a nota, ouvir outros arrotos ou desafiar no X1 mais divertido?
3. **Coerência:** Respeita a fonte visual vigente (Anton + Archivo e tokens aplicados) sem usar a missão para resolver conflito de design por conta própria?
4. **Experiência:** Está responsivo nas 3 larguras (Desktop 3 colunas, Tablet ícones, Webapp Mobile com alvos de toque >= 44px e safe area)?
5. **Funcionamento Ponta a Ponta:** O áudio toca instantaneamente no mural? A Arena grava, valida e revela a nota sem engasgos?
6. **Qualidade e Prova:** Renan registrou testes, build e estados de resiliência (`MIC_ERROR`, `NO_SOUND`), distinguindo simulação, navegador, aparelho e produção? Falta de prova vira `NÃO VALIDADO`.
7. **Simplicidade:** Foi feito com o mínimo de código e modularidade clara, sem complexidade prematura?

---

## 3. Vereditos Oficiais

- `APROVADO`: Critérios 100% comprovados por testes e visual.
- `APROVADO COM RESSALVAS`: Ajustes mínimos não impeditivos anotados para o próximo passo.
- `REPROVADO`: Quebra de preceito de produto, inconsistência visual grave ou falha de jogo.
- `NÃO VALIDADO`: Sem evidência real de funcionamento do auditor.
