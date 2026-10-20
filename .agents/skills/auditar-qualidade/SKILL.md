---
name: auditar-qualidade
description: Procedimento do Marcelo para validar testes, build, RLS, microfone, resiliência e fidelidade 1:1 em Desktop e Webapp.
---

# Skill: auditar-qualidade

Runbook do **Marcelo (Qualidade & Caça-Bugs)** antes de certificar qualquer entrega da squad para o **Tiago**.

Marcelo atesta a qualidade e busca quebrar a aplicação com rigor. O **aceite final** contra os requisitos é do **Tiago**.

---

## 1. Pipeline Automático Inegociável

Antes de qualquer análise de interface:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Qualquer falha bloqueia a entrega imediatamente (`BLOQUEIA`).

---

## 2. Auditoria da Jornada e Resiliência

Verificação contra as 6 fases de [`JORNADA.md`](../../../docs/jogo/JORNADA.md):
1. **Descoberta:** Landing rápida ("Tá rolando agora"), atalho "Arrotar sem conta" leva direto à Arena, login sem fricção.
2. **Bonde do Arroto:** Feed de causos com áudios reproduzíveis, waveform e badges de score. Um áudio tocando pausa qualquer outro.
3. **Arena:** Ciclo `IDLE → RECORDING → VALIDATING → JUDGING → RESULT`. Bolha reage ao microfone sem travamentos.
4. **Resiliência:**
   - `MIC_ERROR`: Instrução clara se permissão for negada.
   - `NO_SOUND`: Convite a tentar de novo sem penalizar a nota.
   - Desligamento de microfone (`MediaStreamTrack.stop()`) em todos os desfechos.
5. **Depois da Nota:** Geração de card vertical 9:12 sem deformar layout, opção de postar na comunidade e desafio X1.
6. **X1 & Revanche:** Placar versus sem vermelho no derrotado; botão Revanche aciona contagem `3, 2, 1` e reinicia disputa sem criar rota fantasma.

---

## 3. Auditoria de Plataforma (Desktop & Webapp)

- **Desktop (>= 1060px):** Layout em 3 colunas impecável, sem scroll horizontal quebrado, navegação acessível por teclado.
- **Webapp Mobile (< 700px):** Safe area insets respeitados (`--safe-top`, `--safe-bottom`), alvos de toque >= 44px (`--hit-target-min`), layout sem pulos com dvh/svh.
- **Temas:** Coerência visual no tema escuro (`#0a0a08`) e tema claro (`#f5f3ea`), com persistência em `bda-theme`.

---

## 4. Pareceres Formais do Marcelo

- `SEM ACHADOS MATERIAIS`: Tudo aprovado com evidência real.
- `AJUSTA`: Pequena aresta corrigível antes do veredito do Tiago.
- `ISSUE_FUTURA`: Melhoria não impeditiva documentada para o backlog.
- `BLOQUEIA`: Falha de build, risco de privacidade, mentira visual ou bug impeditivo.
