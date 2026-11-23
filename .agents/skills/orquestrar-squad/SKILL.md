---
name: orquestrar-squad
description: Orquestração e delegação de tarefas da squad do Auê entre Tiago, Camillo e Diego.
---

# Skill: orquestrar-squad

Use esta skill quando uma etapa do trabalho precisar do titular da área ou quando o paralelismo acelerar a entrega sem conflito de arquivos. Quem orquestra é o **Tiago**.

Os titulares vivem em `.codex/agents/` e `.claude/agents/`:

- **Tiago (`tiago`)**: produto, Cartão de Missão, WIP 1 e aceite final. Somente leitura.
- **Camillo (`camillo`)**: áudio, nota do juiz, backend, Supabase, arquitetura, Gate Arquitetural, plataforma e SEO técnico. Escreve quando delegado e audita o Diego.
- **Diego (`diego`)**: telas, Arena e experiência em React 19, fidelidade ao protótipo e ao design system. Escreve quando delegado e audita a parte visível do Camillo.

## Antes de delegar

Defina com clareza:

1. objetivo concreto da rodada;
2. contexto mínimo (Cartão de Missão, desenho ou contrato);
3. arquivos e módulos de leitura;
4. escopo de escrita;
5. restrições de segurança e preservação de WIP;
6. formato de retorno esperado.

Nunca coloque dois agentes escrevendo nos mesmos arquivos ao mesmo tempo.

## Mensagem mínima de passagem de bastão

```text
Agente: <tiago|camillo|diego>
Objetivo: <entrega concreta>
Escopo de leitura: <arquivos, módulos ou fontes>
Escopo de escrita: <somente leitura ou arquivos/módulos autorizados>
Restrições: preserve WIP existente; sem merge, deploy, publicação, segredo ou exclusão destrutiva.
Retorno: evidências, arquivos alterados, comandos e testes executados, riscos e o que não foi testado.
```

## Travas de retorno

- **Auditoria cruzada:** quem implementou não audita. Exigir parecer `BLOQUEIA`, `AJUSTA`, `ISSUE_FUTURA` ou `SEM ACHADOS MATERIAIS` com prova reproduzível em navegador real (desktop e webapp mobile).
- **Para o Tiago (aceite final):** enviar só depois da implementação e da auditoria do outro agente.
- **Antes da auditoria:** o Tiago confere o `git diff` e os testes.
