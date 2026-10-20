# ADR 0012 — Vida social e governança de comunidades

**Status:** aceito
**Data:** 2026-10-19
**Decidiu:** Luiz, no Cartão de Missão 0026
**Vale para:** votos, salvos, notificações, fundação, moderação, regras, presença, karma e conquistas de comunidade

## O problema

O Open Design pede uma comunidade viva. O fórum atual já tem comunidade, tópico
e resposta, mas não tem os comportamentos sociais que fazem a interface ser
real: voto, salvar, caixa de notificações, governança, regras, presença, karma
e conquistas.

Copiar os números e controles do snapshot seria mentira visual.

## A decisão

> Vida social nasce em tabelas, RPCs e portas próprias, aditivas e fechadas por
> RLS; a interface nunca consulta nem escreve Supabase diretamente.

`PortaDeForum` continua dona da conversa. A nova `PortaDeVidaSocial` será dona
de voto, salvos, notificações, presença e governança. Não se reaproveita
`reacoes` ou `favoritos` legados: eles pertencem a causos/resultados e têm outra
semântica.

O Open Design é reproduzido sem trocar as identidades do Auê: uma pessoa é
referenciada por `@handle`, uma comunidade por `/slug` e um tópico por `#id`.
Esses identificadores aparecem na navegação, busca e URL; nome, descrição e
contagens continuam sendo dados separados e confirmados pelo servidor.

## O que muda na prática

- Voto é positivo ou negativo, um por pessoa e alvo (tópico ou resposta); o
  servidor rejeita voto no próprio conteúdo e atualiza a escolha de forma
  atômica.
- Salvo é privado da pessoa que salvou. Não há contador público de salvos.
- Notificação é inbox persistente, sem Web Push nesta fase. O texto é formado
  pelo alvo real; payload não guarda cópia de texto de usuário.
- Fundação cria comunidade, participação e papel fundador em uma RPC. Moderar
  exige papel real; regras vazias são uma ausência honesta.
- Presença é somente contagem agregada com heartbeat de 90 segundos. Não expõe
  pessoas online e não promete atividade real.
- Karma é derivado dos votos em conteúdo visível, nunca contador gravável pelo
  cliente. Ocultar/remover conteúdo recalcula a verdade automaticamente.
- Conquistas reaproveitam o catálogo existente e só são concedidas para eventos
  objetivos, por trigger no servidor. Sem XP, ranking ou conquista decorativa.

## Rollout

1. PR de migração aditiva + rollback, sem UI consumindo os objetos novos.
2. Confirmar aplicação no Supabase, RLS, grants e RPCs no ambiente real.
3. PR de porta/adaptador com testes de contrato e falha.
4. PRs de telas novas em `src/features/novo-aue/`, trocando rotas só quando cada
   jornada estiver validada.

## Alternativas descartadas

- **Usar dados do snapshot.** Não tem fonte real.
- **Reutilizar reações e favoritos legados.** Mistura causo/resultado com tópico/resposta.
- **Contador gravável de karma ou presença.** Deriva e expira no servidor para
  não virar métrica manipulável ou dado pessoal exposto.

## O que custa

Mais tabelas, RLS, triggers, auditoria e uma liberação em etapas. É o preço de
não transformar uma tela bonita em encenação.
