---
name: orquestrar-squad
description: Orquestração e delegação da squad do Auê entre Marcelo, Felipe, Camillo e Renan.
---

# Skill: orquestrar-squad

Use esta skill quando uma etapa do trabalho precisar do titular da área ou quando o paralelismo acelerar a entrega sem conflito de arquivos. Quem orquestra é **Marcelo**.

Os titulares vivem em `.codex/agents/` e `.claude/agents/`:

- **Marcelo (`marcelo`)**: Product Lead, Cartão de Missão, WIP 1, dependências, roadmap e parecer final. Pode registrar cartões, decisões e roadmap no escopo delegado; não implementa código de produto.
- **Felipe (`felipe`)**: UX/UI e Design Lead, design system, acessibilidade, responsividade e revisão da parte visível. Escreve quando delegado.
- **Camillo (`camillo`)**: Tech Lead full-stack, áudio, backend, Supabase, arquitetura, Gate Arquitetural, plataforma e SEO técnico. Escreve quando delegado.
- **Renan (`renan`)**: Quality Lead, Prova de Fogo, critérios de aceite e parecer de quem não implementou. Pode executar testes e registrar evidências no escopo delegado; declara o grau de independência.

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
Agente: <marcelo|felipe|camillo|renan>
Objetivo: <entrega concreta>
Escopo de leitura: <arquivos, módulos ou fontes>
Escopo de escrita: <somente leitura ou arquivos/módulos autorizados>
Restrições: preserve WIP existente; sem merge, deploy, publicação, segredo ou exclusão destrutiva.
Retorno: evidências, arquivos alterados, comandos e testes executados, riscos e o que não foi testado.
```

## Travas de retorno

- **Prova de Fogo:** Renan não valida o que implementou. Exigir parecer `BLOQUEIA`, `AJUSTA`, `ISSUE_FUTURA` ou `SEM ACHADOS MATERIAIS` com evidência compatível com o risco. Registrar se foi mock, ambiente descartável, navegador, aparelho ou produção; não prometer navegador ou aparelho real sem prova.
- **Para Marcelo:** enviar só depois da construção, auto-teste e Prova de Fogo.
- **Antes da validação:** Marcelo confere o `git diff`, o Cartão e as evidências.
