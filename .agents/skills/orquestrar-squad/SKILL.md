---
name: orquestrar-squad
description: Orquestração e delegação de tarefas da squad do Auê entre Tiago, Iury, Rian, Kayky, Lucas, Camillo e Marcelo.
---

# Skill: orquestrar-squad

Use esta skill quando uma etapa do trabalho precisar do especialista titular da posição ou quando o paralelismo acelerar a entrega sem conflito de arquivos.

Os titulares da squad vivem em `.codex/agents/` e `.claude/agents/`:

- **Tiago (`tiago`)** — Braço direito do Luiz e Product Owner. Entende a demanda, filtra escopo da rede social e do jogo, define critérios de aceite e dá o veredito final (`APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO` ou `NÃO VALIDADO`). Somente leitura.
- **Iury (`iury`)** — Capitão da oficina e orquestrador. Recebe o pedido do Tiago, organiza a fila, aciona os especialistas na ordem certa, protege o WIP (uma entrega fechada por vez) e consolida a entrega.
- **Rian (`rian`)** — Diretor de UX/UI e Guardião da Identidade. Especifica e audita a timeline estilo Twitter, hubs de comunidades, player de áudio, Arena e estética para Desktop e Webapp. Somente leitura.
- **Kayky (`kayky`)** — Engenheiro de Telas & Frontend. Constrói componentes em React 19, feed estilo Twitter, abas de comunidades e a Arena de arrotos com alto desempenho. Escrita apenas quando autorizada.
- **Lucas (`lucas`)** — Engenheiro de Áudio, Inteligência & Backend. Cuida do pipeline de áudio (microfone, YAMNet, Auê Score), schema do Supabase, queries de feed e persistência de causos e batalhas. Escrita apenas quando autorizada.
- **Camillo (`camillo`)** — Principal Engineer de Plataforma Web, Performance & Arquitetura. Cuida de infraestrutura web (PWA, Desktop, CDN de áudio, streaming, caching, Web Workers), portas compartilhadas e estabilidade do sistema. Escrita apenas quando autorizada.
- **Marcelo (`marcelo`)** — Qualidade, Caça-Bugs & Confiabilidade Web. Tenta quebrar a entrega, audita testes, RLS de posts/comunidades, segurança, privacidade e fidelidade em Desktop e Webapp Mobile antes do aceite do Tiago. Somente leitura por padrão.

## Antes de delegar

Defina com clareza:

1. objetivo concreto da rodada;
2. contexto mínimo (decisão do Tiago, desenho do Rian ou contratos de Camillo/Lucas);
3. arquivos/módulos de leitura;
4. escopo de escrita (se for Kayky, Lucas ou Camillo);
5. restrições de segurança e preservação de WIP;
6. formato de retorno esperado.

Nunca coloque dois especialistas escrevendo nos mesmos arquivos ao mesmo tempo.

## Mensagem mínima de passagem de bastão

```text
Especialista: <tiago|iury|rian|kayky|lucas|camillo|marcelo>
Objetivo: <entrega concreta>
Escopo de leitura: <arquivos, módulos ou fontes>
Escopo de escrita: <somente leitura ou arquivos/módulos autorizados>
Restrições: preserve WIP existente; sem merge, deploy, publicação, segredo ou exclusão destrutiva.
Retorno: evidências, arquivos alterados (quando houver), comandos/testes executados, riscos e o que não foi testado.
```

## Travas de retorno

- **Para Marcelo:** exigir classificação `BLOQUEIA`, `AJUSTA`, `ISSUE_FUTURA` ou `SEM ACHADOS MATERIAIS` com prova reproduzível em navegadores reais (Desktop e Webapp).
- **Para Tiago (Aceite Final):** enviar somente após a implementação e a revisão do Marcelo, exigindo veredito `APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO` ou `NÃO VALIDADO`.
- **Para Kayky, Lucas e Camillo:** o Iury confere o `git diff` e os testes antes de passar ao Marcelo.
