---
name: revisar-produto
description: Enquadramento de missão (Cartão de Missão), modelo das 7 perguntas e aceite final do Tiago na rede social do Auê!
---

# Skill: revisar-produto

Use na largada (para classificar a pista, abrir o Cartão de Missão e repassar ao **Iury**) e na chegada (para dar o aceite final após a prova do **Marcelo** e do **Rian**).

---

## 1. Na Largada (Enquadramento e Cartão de Missão)

Antes de o Iury acionar a oficina:
1. Diferencie **Exploração** (troca de ideia com o Luiz, zero código) de **Decisão de Execução**.
2. Passe pelo filtro da jornada de 6 fases:
   `DESCOBERTA → BONDE (FEED) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO) → REVANCHE`
3. Classifique a **Pista (Lane)**:
   - `Exploração` (zero código);
   - `Fast lane` (ajuste cirúrgico de copy, token visual ou bug isolado);
   - `Full flow comum` (nova tela ou componente dentro dos contratos existentes);
   - `Full flow sistêmica` (Gate Arquitetural Obrigatório de Camillo/Lucas para banco, motor de áudio ou performance);
   - `Hot lane` (build quebrada ou fluxo crítico inoperante).
4. Abra o [Cartão de Missão](../../templates/mission-card.md) com escopo limpo, critérios observáveis e a prova que o Marcelo precisará cobrar.

---

## 2. Na Chegada (As 7 Perguntas de Aceite do Tiago)

Com a evidência do **Marcelo** (funcional e testes) e do **Rian** (fidelidade visual 1:1 com `docs/design/prototipo/`), avalie:

1. **Necessidade:** Resolve uma dor real da pessoa no Bonde do Arroto ou na Arena sem adicionar fricção?
2. **Valor:** Deixa o ato de arrotar, ouvir causos no feed, debater ou desafiar no X1 mais divertido?
3. **Coerência:** Comunidade, feed, perfil e acesso respeitam o Open Design (`DESIGN_OPEN.md`)? A Arena preserva sua referência própria até revisão explícita?
4. **Experiência:** Está responsivo nas 3 larguras (Desktop 3 colunas, Tablet ícones, Webapp Mobile com alvos de toque >= 44px e safe area)?
5. **Funcionamento Ponta a Ponta:** O áudio toca instantaneamente no feed? A Arena grava, valida e revela a nota sem engasgos?
6. **Qualidade e Prova:** O Marcelo auditou testes, build e estados de resiliência (`MIC_ERROR`, `NO_SOUND`)? Falta de prova vira `NÃO VALIDADO`.
7. **Simplicidade:** Foi feito com o mínimo de código e modularidade clara, sem complexidade prematura?

---

## 3. Vereditos Oficiais

- `APROVADO`: Critérios 100% comprovados por testes e visual.
- `APROVADO COM RESSALVAS`: Ajustes mínimos não impeditivos anotados para o próximo passo.
- `REPROVADO`: Quebra de preceito de produto, inconsistência visual grave ou falha de jogo.
- `NÃO VALIDADO`: Sem evidência real de funcionamento do Marcelo.
