# Agentes e skills do Auê!

Tudo que a SQUAD usa mora aqui dentro. **Nada externo ao repositório é necessário para trabalhar no Auê!**, e nada externo tem autoridade sobre o que está definido aqui e no [`AGENTS.md`](../AGENTS.md).

---

## Quem é quem

A squad tem **quatro titulares**. Quem implementou não valida a própria entrega.

- **Marcelo**: Product Lead e orquestrador. Controla escopo, WIP 1, Cartões de Missão, roadmap, decisões e parecer final.
- **Felipe**: UX/UI e Design Lead. Guarda o design system, acessibilidade, responsividade e a experiência sem autorizar redesign fora de missão.
- **Camillo**: Tech Lead full-stack. Guarda arquitetura, áudio, backend, Supabase, integridade, dependências, plataforma e Gate Arquitetural.
- **Renan**: Quality Lead. Faz a Prova de Fogo, confere critérios de aceite, separa simulação de prova operacional e emite parecer sem auditar a própria implementação, registrando o grau de independência da revisão.

O produto vive definido em [`docs/jogo/AUE.md`](../docs/jogo/AUE.md). As pistas e a ordem de atuação estão no [`AGENTS.md`](../AGENTS.md).

---

## Onde os agentes estão definidos

O papel de cada um é decidido no [`AGENTS.md`](../AGENTS.md), a fonte canônica. Claude Code carrega [`.claude/agents/`](../.claude/agents/) e Codex carrega [`.codex/agents/`](../.codex/agents/), um arquivo por agente em cada pasta.

```text
.claude/agents/     .codex/agents/
├── marcelo.md      ├── marcelo.toml
├── felipe.md       ├── felipe.toml
├── camillo.md      ├── camillo.toml
└── renan.md        └── renan.toml
```

**Esses arquivos não criam papel nem regra.** Repetem o `AGENTS.md`. Mudou o `AGENTS.md`, muda o arquivo junto.

### A `description` vai entre aspas. Sempre.

O cabeçalho é YAML (em `.claude/`) ou TOML (em `.codex/`), e um valor sem aspas não pode ter dois-pontos seguido de espaço no meio. Se tiver, o arquivo não é lido e o agente não existe.

---

## Skills

As skills em `.agents/skills/` são procedimentos: Marcelo usa `revisar-produto`, `alinhar-com-luiz`, `visao-do-produto`, `tom-de-voz`, `filtro-anti-ia`, `orquestrar-squad` e `padrao-git-e-issues`; Felipe usa `design-ux`, `design-ui`, `construir-interface` e `garantir-web`; Camillo usa `conselho-arquitetura`, `modelar-dados-e-api`, `google-search-console` e `escrever-testes`; Renan conduz `auditar-qualidade` e `auditar-modularidade`. Quem não implementou pode aplicar essas duas últimas conforme o Cartão de Missão, sem alegar independência que não exista.

