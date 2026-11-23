# Agentes e skills do Auê!

Tudo que a SQUAD usa mora aqui dentro. **Nada externo ao repositório é necessário para trabalhar no Auê!**, e nada externo tem autoridade sobre o que está definido aqui e no [`AGENTS.md`](../AGENTS.md).

---

## Quem é quem

A squad tem **três titulares**. Quem implementou não audita o próprio código.

- **Tiago**: produto, Cartão de Missão, WIP 1 e aceite final pelas 7 perguntas.
- **Camillo**: áudio, nota do juiz, backend, Supabase, arquitetura, Gate Arquitetural, plataforma e SEO técnico. Audita o que o Diego escreveu.
- **Diego**: telas, Arena e experiência em React 19, protótipo e design system. Audita a parte visível do que o Camillo entregou.

O produto vive definido em [`docs/jogo/AUE.md`](../docs/jogo/AUE.md). As pistas e a ordem de atuação estão no [`AGENTS.md`](../AGENTS.md).

---

## Onde os agentes estão definidos

O papel de cada um é decidido no [`AGENTS.md`](../AGENTS.md), a fonte canônica. Claude Code carrega [`.claude/agents/`](../.claude/agents/) e Codex carrega [`.codex/agents/`](../.codex/agents/), um arquivo por agente em cada pasta.

```text
.claude/agents/     .codex/agents/
├── tiago.md        ├── tiago.toml
├── camillo.md      ├── camillo.toml
└── diego.md        └── diego.toml
```

**Esses arquivos não criam papel nem regra.** Repetem o `AGENTS.md`. Mudou o `AGENTS.md`, muda o arquivo junto.

### A `description` vai entre aspas. Sempre.

O cabeçalho é YAML (em `.claude/`) ou TOML (em `.codex/`), e um valor sem aspas não pode ter dois-pontos seguido de espaço no meio. Se tiver, o arquivo não é lido e o agente não existe.

---

## Skills

As skills em `.agents/skills/` são procedimentos. Quem as usa é quem tem a área: Tiago (`revisar-produto`, `alinhar-com-luiz`, `visao-do-produto`, `tom-de-voz`, `filtro-anti-ia`, `orquestrar-squad`, `padrao-git-e-issues`), Diego (`design-ux`, `design-ui`, `construir-interface`, `garantir-web`, `escrever-testes`) e Camillo (`conselho-arquitetura`, `modelar-dados-e-api`, `google-search-console`, `escrever-testes`). `auditar-qualidade` e `auditar-modularidade` são da auditoria cruzada: quem não escreveu o código as roda.

Algumas skills ainda falam em "Bonde", "Marcelo" ou "Rian". Onde isso aparecer, leia como Tropa e como o papel de quem audita ou desenha, e corrija quando passar por ali.
