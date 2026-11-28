# M01 — Relatório executivo para o Product Owner

**Estado:** entregue para revisão; aceite do PO pendente. Marcelo recomenda **APROVADO COM RESSALVAS** para a fundação documental e de governança, não para homologação do jogo ou release. M02–M06 permanecem bloqueadas até autorização explícita.

## O que mudou e por quê

O pedido M01 do PO, em 27/11/2026, autorizou a fundação e estabeleceu a direção do Auê como plataforma competitiva, com comunidade em torno da competição. [AUE.md](../jogo/AUE.md) registra Arena, Mural, Perfil e gravador transversal sem ativar funcionalidades, redesign ou regras novas. O [registro de decisões](../DECISOES.md) identifica a autorização e distingue a [página de acompanhamento](https://chatgpt.com/space/page_78a57da82f108191baa7cafabdbac7dc), consultada em leitura, da governança versionada.

[AGENTS.md](../../AGENTS.md), [workflow](../../.agents/WORKFLOW.md) e [cartão](../../.agents/templates/mission-card.md) consolidam quatro titulares, WIP 1, fluxo e as três etapas. Perfis de Marcelo, Felipe, Camillo e Renan foram definidos nos formatos de Codex e Claude; Tiago/Diego foram retirados apenas das pastas de perfis ativos. O [inventário anterior e posterior](M01-INVENTARIO.md) lista os caminhos: Codex 3→4, Claude 3→4, 17 skills preservadas e alinhadas, 4 workflows preservados, documentação `docs/` 138→157 arquivos, incluindo evidências de teste.

A M01 aproveita o modo por missões, WIP e níveis de prova observados nas instruções locais do LagCheck, e a separação entre auditoria de reuso, resultado de testes e checklist de release encontrada na documentação local do Gamecast. São referências de trabalho, sem autoridade sobre as regras do Auê.

A [arquitetura](../technical/arquitetura.md) descreve o código no SHA auditado e suas divergências em relação ao ADR, sem alterar decisões aceitas. [Qualidade](../technical/QUALIDADE.md) e [release](../technical/operacao/RELEASE.md) registram gates e limites, sem criar pipeline verde artificial. A atualização em `validacao.yml` é apenas em comentários: gatilhos, jobs e comandos foram comparados e permanecem idênticos.

O [baseline M00](../technical/auditorias/M00-BASELINE.md) preserva resultados e limites; o [backlog](../escopo/BACKLOG.md) mantém AUE-T01–T15, prioridades e pendências de SEO/rastreabilidade abertas. O [roadmap](../escopo/ROADMAP.md) distingue M00 aceita para planejar de homologação integral. O [cartão M02](M02-INTEGRITY-PROPOSTA.md) é proposta bloqueada, não início da missão.

## Prova executada nesta M01

Cópia descartável da worktree de `ba161a10`, com as alterações documentais disponíveis no início dos testes; sem credenciais reais. Node 24.19.0/npm 11.17.0; `npm ci --ignore-scripts --no-audit --no-fund` usou o lockfile. Alterações posteriores foram documentais e de perfis, sem mudança de código do produto.

| Verificação | Resultado observado |
|---|---|
| `npm run typecheck` | Passou. |
| `npm run lint` | Passou com 23 avisos e nenhum erro. |
| `npm run test` | 2.600 passaram, 9 ignorados, 266 arquivos; sem retry nesta rodada. Uma rodada verde não apaga as falhas intermitentes M00. |
| `node --test scripts/nota-automatica/processar.test.mjs` | 9 passaram, com dados e gateway sintéticos. |
| `npm run build` | Passou; sem credenciais, geração das páginas de grupos foi pulada. Não é build de produção configurado. |
| TOML / YAML | Parser TOML aceitou 4 perfis e configuração; parser YAML aceitou 4 perfis Claude e 17 frontmatters de skills. Duas descrições YAML falharam inicialmente e foram corrigidas. |
| Descoberta de skills | O app-server local listou as 17 skills desta worktree sem erros. Os novos perfis de agentes foram validados em arquivo. A tentativa de invocar `renan` em sessão efêmera falhou com `no rollout found for thread id` antes de o agente responder; a execução dos perfis em sessão compatível permanece sem prova. |
| Revisão estrutural | Backlog contém os 15 IDs, M02–M06 estão bloqueadas, links locais verificados e `git diff --check` passou. O workflow de validação só mudou em comentários. |

Os [logs preservados e hashes da execução](../technical/auditorias/evidencias/M01-execucao.json) permitem conferir as saídas acima. O formato dos perfis Codex segue a [documentação oficial de subagentes](https://developers.openai.com/codex/multi-agent); isso não substitui testar o carregamento em sessão nova. E2E, acessibilidade em navegador, SQL, staging, dispositivo real, CI remoto, deploy e produção não foram reexecutados na M01 documental. As provas anteriores e limitações estão no baseline M00; não foram promovidas a homologação.

## Pareceres e independência

- **Felipe — UX/UI:** agente separado atuando no papel; revisou produto, escopo e arquitetura de outra frente. Após correção de trechos históricos contraditórios, `SEM ACHADOS MATERIAIS`; não houve teste visual novo ou validação em aparelho, pois não houve mudança de interface.
- **Camillo — arquitetura:** agente separado; `SEM ACHADOS MATERIAIS` na revisão cruzada de governança, qualidade e M02 após correções. Ele escreveu a arquitetura e não a autoauditou: Felipe e Renan revisaram esse documento.
- **Renan — qualidade:** agente separado; `SEM ACHADOS MATERIAIS` nos artefatos de outras frentes após corrigir inventário, links e YAML, e na arquitetura reavaliada. Não declarou revisão independente dos documentos de qualidade/release que ele próprio escreveu; Camillo os examinou.
- **Marcelo — produto/orquestração:** executado pelo agente principal como papel, não por uma quarta instância separada. Recomenda `APROVADO COM RESSALVAS`: a fundação está pronta para decisão do PO; execução dos novos perfis em sessão compatível e lacunas operacionais M00 continuam sem prova. A tentativa em sessão efêmera falhou com `no rollout found for thread id`, sem resposta do agente. Agentes distintos são revisão técnica cruzada, não revisão humana independente.

## Pendências, rollback e limites

Continuam abertas a integridade da pontuação e concorrência de grupos, RLS/Auth/Storage e worker reais, runner e suites SQL, instabilidade, aparelho físico, acessibilidade/desempenho de campo, SEO e confirmação do SHA servido. A aparência atual, o mapa e o design system ainda têm divergências históricas; a M01 não escolheu uma paleta nem autorizou redesign. Ao encerrar a fotografia da M01, as mudanças ainda estavam na worktree local. O [closeout M01.1](M01.1-RELATORIO.md) registra a consolidação posterior. A página de acompanhamento foi consultada, não editada.

O rollback da M01 é reverter o conjunto documental e de configuração de agentes; não há alteração de dados ou publicação para desfazer. A decisão de aceitar M01 e autorizar qualquer missão seguinte pertence ao PO.

## Arquivos criados, alterados ou retirados

A lista abaixo reflete a worktree, incluindo arquivos novos ainda não commitados. As retiradas são apenas as definições substituídas de Tiago e Diego nas pastas de agentes; conteúdo histórico permanece no Git.
- `.agents/README.md` — modificado
- `.agents/WORKFLOW.md` — criado
- `.agents/skills/alinhar-com-luiz/SKILL.md` — modificado
- `.agents/skills/auditar-modularidade/SKILL.md` — modificado
- `.agents/skills/auditar-qualidade/SKILL.md` — modificado
- `.agents/skills/conselho-arquitetura/SKILL.md` — modificado
- `.agents/skills/construir-interface/SKILL.md` — modificado
- `.agents/skills/design-ui/SKILL.md` — modificado
- `.agents/skills/design-ux/SKILL.md` — modificado
- `.agents/skills/escrever-testes/SKILL.md` — modificado
- `.agents/skills/filtro-anti-ia/SKILL.md` — modificado
- `.agents/skills/garantir-web/SKILL.md` — modificado
- `.agents/skills/google-search-console/SKILL.md` — modificado
- `.agents/skills/modelar-dados-e-api/SKILL.md` — modificado
- `.agents/skills/orquestrar-squad/SKILL.md` — modificado
- `.agents/skills/padrao-git-e-issues/SKILL.md` — modificado
- `.agents/skills/revisar-produto/SKILL.md` — modificado
- `.agents/skills/tom-de-voz/SKILL.md` — modificado
- `.agents/skills/visao-do-produto/SKILL.md` — modificado
- `.agents/templates/mission-card.md` — modificado
- `.claude/agents/camillo.md` — modificado
- `.claude/agents/diego.md` — retirado
- `.claude/agents/felipe.md` — criado
- `.claude/agents/marcelo.md` — criado
- `.claude/agents/renan.md` — criado
- `.claude/agents/tiago.md` — retirado
- `.codex/agents/camillo.toml` — modificado
- `.codex/agents/diego.toml` — retirado
- `.codex/agents/felipe.toml` — criado
- `.codex/agents/marcelo.toml` — criado
- `.codex/agents/renan.toml` — criado
- `.codex/agents/tiago.toml` — retirado
- `.codex/config.toml` — modificado
- `.github/workflows/validacao.yml` — modificado
- `AGENTS.md` — modificado
- `docs/DECISOES.md` — criado
- `docs/PRODUCAO_ATUAL.md` — modificado
- `docs/README.md` — modificado
- `docs/escopo/BACKLOG.md` — modificado
- `docs/escopo/ESCOPO_ATUAL.md` — modificado
- `docs/escopo/ROADMAP.md` — criado
- `docs/jogo/ARENA.md` — modificado
- `docs/jogo/AUE.md` — modificado
- `docs/missoes/M01-FOUNDATION.md` — criado
- `docs/missoes/M01-INVENTARIO.md` — criado
- `docs/missoes/M01-RELATORIO.md` — criado
- `docs/missoes/M02-INTEGRITY-PROPOSTA.md` — criado
- `docs/technical/QUALIDADE.md` — criado
- `docs/technical/README.md` — modificado
- `docs/technical/adr/README.md` — modificado
- `docs/technical/arquitetura.md` — modificado
- `docs/technical/auditorias/M00-BASELINE.md` — criado
- `docs/technical/auditorias/evidencias/M01-build.txt` — criado
- `docs/technical/auditorias/evidencias/M01-execucao.json` — criado
- `docs/technical/auditorias/evidencias/M01-governanca.txt` — criado
- `docs/technical/auditorias/evidencias/M01-lint.txt` — criado
- `docs/technical/auditorias/evidencias/M01-processamento.txt` — criado
- `docs/technical/auditorias/evidencias/M01-typecheck.txt` — criado
- `docs/technical/auditorias/evidencias/M01-unitarios.txt` — criado
- `docs/technical/auditorias/evidencias/avatar-pglite-probe.json` — criado
- `docs/technical/auditorias/evidencias/cadastrar-grupo-concorrencia.json` — criado
- `docs/technical/auditorias/evidencias/pglite-execucao-reproduzida.json` — criado
- `docs/technical/operacao/RELEASE.md` — criado

## Atualização de closeout M01.1

O PO autorizou o closeout após receber o parecer da M01. Em sessão Codex não efêmera com armazenamento isolado e histórico limitado, os quatro tipos personalizados responderam individualmente e leram suas skills. A tentativa efêmera anterior falhou antes da resposta; a alternativa funciona, mas não identifica de forma isolada a causa interna da falha. O resultado, as ressalvas de lint/testes e a situação de GitHub estão no [relatório M01.1](M01.1-RELATORIO.md).
