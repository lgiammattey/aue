---
name: auditar-qualidade
description: Procedimento do Renan para validar qualidade, provas e regressões sem confundir simulação com operação.
---

# Skill: auditar-qualidade

Runbook do **Renan** — ou de quem Marcelo designar sem ter escrito a entrega — antes de certificar qualquer entrega da squad.

O auditor atesta a qualidade e busca quebrar a aplicação com rigor. O **parecer final** contra os requisitos é do **Marcelo**.

---

## 1. Etapas obrigatórias de prova

1. **Construção e Auto-Teste:** quem implementa executa as verificações aplicáveis e registra ambiente, resultado e falhas.
2. **Prova de Fogo:** Renan revisa critérios, regressões e o tipo de evidência sem executar o mesmo trabalho como se fosse independente quando não for.
3. **Parecer:** Marcelo recebe somente a evidência, os limites e o parecer do Renan. A próxima missão não começa automaticamente.

## 2. Pipeline Automático Inegociável

Antes de qualquer análise de interface:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Qualquer falha sem diagnóstico e decisão registrada bloqueia a entrega (`BLOQUEIA`). Retry pode revelar instabilidade, mas não apaga a falha anterior.

Quando aplicável ao risco, acrescente E2E, análise de segurança, acessibilidade, migrations em ambiente descartável e rastreabilidade da versão publicada. Não execute migração, deploy ou configuração real sem autorização específica.

---

## 3. Auditoria da Jornada e Resiliência

Verificação contra a jornada e estados vigentes em [`JORNADA.md`](../../../docs/jogo/JORNADA.md) e [`ARENA.md`](../../../docs/jogo/ARENA.md), limitada ao que a missão alterou:
1. **Entrada e descoberta:** validar somente caminhos, mensagens e retorno previstos pelo escopo.
2. **Mural:** quando tocado, validar publicação, reprodução e falhas contra o contrato ativo; não presumir comunidade, feed ou funcionalidade que tenha saído do produto.
3. **Arena:** validar somente os estados e transições definidos pela fonte vigente e exercitados pela missão.
4. **Resiliência:**
   - `MIC_ERROR`: Instrução clara se permissão for negada.
   - `NO_SOUND`: Convite a tentar de novo sem penalizar a nota.
   - Desligamento de microfone (`MediaStreamTrack.stop()`) em todos os desfechos.
5. **Depois da Nota e X1:** quando alterados, validar que publicação, compartilhamento, duelo ou revanche não anunciem um resultado que não exista.

---

## 4. Auditoria de Plataforma (Desktop & Webapp)

- **Desktop (>= 1060px):** Layout em 3 colunas impecável, sem scroll horizontal quebrado, navegação acessível por teclado.
- **Webapp Mobile (< 700px):** Safe area insets respeitados (`--safe-top`, `--safe-bottom`), alvos de toque >= 44px (`--hit-target-min`), layout sem pulos com dvh/svh.
- **Temas:** Conferir somente os temas e tokens efetivamente aplicados pela rota. Se design system e código divergem, registrar o conflito e preservar o visual aprovado; não inferir uma troca de paleta.

---

## 5. Pareceres Formais do Auditor

- `SEM ACHADOS MATERIAIS`: Nenhum achado material dentro do escopo e das evidências declaradas. Isso não transforma teste sintético em prova operacional.
- `AJUSTA`: Pequena aresta corrigível antes do veredito de Marcelo.
- `ISSUE_FUTURA`: Melhoria não impeditiva documentada para o backlog.
- `BLOQUEIA`: Falha de build, risco de privacidade, mentira visual ou bug impeditivo.
