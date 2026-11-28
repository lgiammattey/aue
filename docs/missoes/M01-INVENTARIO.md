# M01 — Inventário anterior e posterior

Base anterior: árvore versionada `ba161a10c50ffa8b7d7c060043e435a8deb59ea1`. Posterior: fotografia da worktree ao fim da M01, incluindo adições então sem commit. A fotografia da M01.1 é registrada separadamente no [relatório de closeout](M01.1-RELATORIO.md). A lista de documentação inclui ativos e evidências em `docs/`; não afirma revisão individual de conteúdo. Arquivos locais ignorados não entram.

| Conjunto | Antes | Depois |
|---|---:|---:|
| Agentes Codex | 3 | 4 |
| Agentes Claude | 3 | 4 |
| Skills | 17 | 17 |
| Governança .agents | 2 | 3 |
| Workflows | 4 | 4 |
| Documentação docs | 138 | 157 |

Antes: Tiago, Diego e Camillo. Depois: Marcelo, Felipe, Camillo e Renan. As definições antigas dos dois titulares substituídos foram removidas apenas das pastas de agentes; a nova configuração ainda depende de ser carregada por uma nova sessão/ferramenta compatível. Os documentos existentes permanecem, salvo edições listadas pelo diff.

## Caminhos anteriores por conjunto

### Agentes Codex

- `.codex/agents/camillo.toml`
- `.codex/agents/diego.toml`
- `.codex/agents/tiago.toml`

### Agentes Claude

- `.claude/agents/camillo.md`
- `.claude/agents/diego.md`
- `.claude/agents/tiago.md`

### Skills

- `.agents/skills/alinhar-com-luiz/SKILL.md`
- `.agents/skills/auditar-modularidade/SKILL.md`
- `.agents/skills/auditar-qualidade/SKILL.md`
- `.agents/skills/conselho-arquitetura/SKILL.md`
- `.agents/skills/construir-interface/SKILL.md`
- `.agents/skills/design-ui/SKILL.md`
- `.agents/skills/design-ux/SKILL.md`
- `.agents/skills/escrever-testes/SKILL.md`
- `.agents/skills/filtro-anti-ia/SKILL.md`
- `.agents/skills/garantir-web/SKILL.md`
- `.agents/skills/google-search-console/SKILL.md`
- `.agents/skills/modelar-dados-e-api/SKILL.md`
- `.agents/skills/orquestrar-squad/SKILL.md`
- `.agents/skills/padrao-git-e-issues/SKILL.md`
- `.agents/skills/revisar-produto/SKILL.md`
- `.agents/skills/tom-de-voz/SKILL.md`
- `.agents/skills/visao-do-produto/SKILL.md`

### Governança .agents

- `.agents/README.md`
- `.agents/templates/mission-card.md`

### Workflows

- `.github/workflows/notas-publicadas.yml`
- `.github/workflows/publicar-firebase.yml`
- `.github/workflows/publicar-redirect-legado.yml`
- `.github/workflows/validacao.yml`

### Documentação docs

- `docs/PRODUCAO_ATUAL.md`
- `docs/README.md`
- `docs/design/ARENA_MVP_V2.md`
- `docs/design/AUÊ!.md`
- `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`
- `docs/design/README.md`
- `docs/design/design-system/assets/aue-bolha-mark-inverted.svg`
- `docs/design/design-system/assets/aue-bolha-mark.svg`
- `docs/design/design-system/assets/candidatas/atual-16.png`
- `docs/design/design-system/assets/candidatas/atual-180.png`
- `docs/design/design-system/assets/candidatas/atual-32.png`
- `docs/design/design-system/assets/candidatas/atual-64.png`
- `docs/design/design-system/assets/candidatas/atual.svg`
- `docs/design/design-system/assets/candidatas/candidata-1-16.png`
- `docs/design/design-system/assets/candidatas/candidata-1-180.png`
- `docs/design/design-system/assets/candidatas/candidata-1-32.png`
- `docs/design/design-system/assets/candidatas/candidata-1-64.png`
- `docs/design/design-system/assets/candidatas/candidata-1.svg`
- `docs/design/design-system/assets/candidatas/candidata-2-16.png`
- `docs/design/design-system/assets/candidatas/candidata-2-180.png`
- `docs/design/design-system/assets/candidatas/candidata-2-32.png`
- `docs/design/design-system/assets/candidatas/candidata-2-64.png`
- `docs/design/design-system/assets/candidatas/candidata-2.svg`
- `docs/design/design-system/assets/candidatas/candidata-3-16.png`
- `docs/design/design-system/assets/candidatas/candidata-3-180.png`
- `docs/design/design-system/assets/candidatas/candidata-3-32.png`
- `docs/design/design-system/assets/candidatas/candidata-3-64.png`
- `docs/design/design-system/assets/candidatas/candidata-3.svg`
- `docs/design/design-system/assets/candidatas/candidata-4-16.png`
- `docs/design/design-system/assets/candidatas/candidata-4-180.png`
- `docs/design/design-system/assets/candidatas/candidata-4-32.png`
- `docs/design/design-system/assets/candidatas/candidata-4-64.png`
- `docs/design/design-system/assets/candidatas/candidata-4.svg`
- `docs/design/design-system/assets/favicon/android-chrome-192.png`
- `docs/design/design-system/assets/favicon/android-chrome-512.png`
- `docs/design/design-system/assets/favicon/apple-touch-icon.png`
- `docs/design/design-system/assets/favicon/favicon-16.png`
- `docs/design/design-system/assets/favicon/favicon-32.png`
- `docs/design/design-system/assets/favicon/favicon-48.png`
- `docs/design/design-system/assets/favicon/favicon.ico`
- `docs/design/design-system/assets/favicon/favicon.svg`
- `docs/design/design-system/assets/favicon/maskable-192.png`
- `docs/design/design-system/assets/favicon/maskable-512.png`
- `docs/design/design-system/assets/favicon/og-image.png`
- `docs/design/design-system/assets/favicon/safari-pinned-tab.svg`
- `docs/design/design-system/aue-design-system-showcase.html`
- `docs/design/design-system/base.css`
- `docs/design/design-system/brand.html`
- `docs/design/design-system/favicon-set.html`
- `docs/design/design-system/image.png`
- `docs/design/design-system/site.webmanifest`
- `docs/design/design-system/styles.css`
- `docs/design/design-system/system/BRAND-SYSTEM.md`
- `docs/design/design-system/system/DESIGN.md`
- `docs/design/design-system/system/artifacts/deck.html`
- `docs/design/design-system/system/artifacts/email.html`
- `docs/design/design-system/system/artifacts/form.html`
- `docs/design/design-system/system/artifacts/landing.html`
- `docs/design/design-system/system/artifacts/newsletter.html`
- `docs/design/design-system/system/artifacts/poster.html`
- `docs/design/design-system/system/assets/aue-bolha-mark-inverted.svg`
- `docs/design/design-system/system/assets/aue-bolha-mark.svg`
- `docs/design/design-system/system/brand.json`
- `docs/design/design-system/system/guide.md`
- `docs/design/design-system/system/index.html`
- `docs/design/design-system/system/kit.dark.html`
- `docs/design/design-system/system/kit.html`
- `docs/design/design-system/system/scripts/apply-design-tokens.mjs`
- `docs/design/design-system/system/scripts/build-favicons.py`
- `docs/design/design-system/system/scripts/gerar-marca.mjs`
- `docs/design/design-system/system/seed.json`
- `docs/design/design-system/system/theme.json`
- `docs/design/design-system/system/tokens.compact.json`
- `docs/design/design-system/system/tokens.dark.json`
- `docs/design/design-system/system/tokens.default.json`
- `docs/design/design-system/system/variables.css`
- `docs/design/design-system/system/variables.dark.css`
- `docs/design/design-system/tokens/colors.css`
- `docs/design/design-system/tokens/feedback.css`
- `docs/design/design-system/tokens/fonts.css`
- `docs/design/design-system/tokens/glow.css`
- `docs/design/design-system/tokens/motion.css`
- `docs/design/design-system/tokens/safe-area.css`
- `docs/design/design-system/tokens/spacing.css`
- `docs/design/design-system/tokens/typography.css`
- `docs/design/fontes/Aue-Design-System.zip`
- `docs/design/fontes/Aue-Prototipo-Arena.zip`
- `docs/design/propostas/mural-chapado.html`
- `docs/escopo/BACKLOG.md`
- `docs/escopo/ESCOPO_ATUAL.md`
- `docs/historias/burpzilla/01-o-novo-vizinho.md`
- `docs/historias/burpzilla/02-arrotando-na-rua.md`
- `docs/historias/burpzilla/03-jogo-de-futebol.md`
- `docs/historias/burpzilla/04-jogo-de-futebol-parte-2.md`
- `docs/historias/burpzilla/autorizacao-dos-audios.md`
- `docs/historias/burpzilla/cartao-de-missao-seed.md`
- `docs/historias/burpzilla/cronograma.md`
- `docs/historias/burpzilla/personagens.md`
- `docs/historias/burpzilla/vozes.md`
- `docs/historias/fase-1-trafego/cartao-de-missao.md`
- `docs/historias/fase-1-trafego/missao-3-arena-em-ingles.md`
- `docs/historias/fase-1-trafego/missao-4-conteudo-de-busca.md`
- `docs/jogo/ARENA.md`
- `docs/jogo/AUE.md`
- `docs/jogo/JORNADA.md`
- `docs/jogo/LOOP.md`
- `docs/jogo/REGRAS.md`
- `docs/jogo/VOZ.md`
- `docs/schema/banco_de_dados.md`
- `docs/schema/nomenclatura.md`
- `docs/technical/README.md`
- `docs/technical/adr/0001-arquitetura-oficial-do-aue.md`
- `docs/technical/adr/0002-o-aue-nas-lojas.md`
- `docs/technical/adr/0003-a-previa-do-link.md`
- `docs/technical/adr/0004-arquitetura-aue-3-comunidades-e-feed.md`
- `docs/technical/adr/0005-conta-opcional-e-perfil-publico.md`
- `docs/technical/adr/0006-hospedagem-somente-firebase.md`
- `docs/technical/adr/0007-audio-publico-da-casa.md`
- `docs/technical/adr/0008-paginas-publicas-dos-grupos.md`
- `docs/technical/adr/0009-identidade-social-promovida.md`
- `docs/technical/adr/0010-comunidades-topicos-e-respostas.md`
- `docs/technical/adr/0011-audio-privado-duelo-na-borda.md`
- `docs/technical/adr/0012-nota-de-audio-publicado-em-servidor.md`
- `docs/technical/adr/0013-mural-o-arroto-e-o-centro.md`
- `docs/technical/adr/0014-x1-no-mural-com-audio-consentido.md`
- `docs/technical/adr/0015-o-jogo-e-o-centro.md`
- `docs/technical/adr/README.md`
- `docs/technical/arquitetura.md`
- `docs/technical/audio/calibracao-motor-arroto-2026-08.md`
- `docs/technical/audio/deteccao-de-arroto-yamnet.md`
- `docs/technical/audio/moderacao-de-audio.md`
- `docs/technical/dados/banco-sem-consumidor.md`
- `docs/technical/ga4-no-admin.md`
- `docs/technical/operacao/ambientes.md`
- `docs/technical/operacao/hospedagem-firebase.md`
- `docs/technical/operacao/migracoes-supabase.md`
- `docs/technical/operacao/transicao-aue-oficial.md`
- `docs/technical/plano-arquitetural-arena-v2.md`

## Caminhos posteriores por conjunto

### Agentes Codex

- `.codex/agents/camillo.toml`
- `.codex/agents/felipe.toml`
- `.codex/agents/marcelo.toml`
- `.codex/agents/renan.toml`

### Agentes Claude

- `.claude/agents/camillo.md`
- `.claude/agents/felipe.md`
- `.claude/agents/marcelo.md`
- `.claude/agents/renan.md`

### Skills

- `.agents/skills/alinhar-com-luiz/SKILL.md`
- `.agents/skills/auditar-modularidade/SKILL.md`
- `.agents/skills/auditar-qualidade/SKILL.md`
- `.agents/skills/conselho-arquitetura/SKILL.md`
- `.agents/skills/construir-interface/SKILL.md`
- `.agents/skills/design-ui/SKILL.md`
- `.agents/skills/design-ux/SKILL.md`
- `.agents/skills/escrever-testes/SKILL.md`
- `.agents/skills/filtro-anti-ia/SKILL.md`
- `.agents/skills/garantir-web/SKILL.md`
- `.agents/skills/google-search-console/SKILL.md`
- `.agents/skills/modelar-dados-e-api/SKILL.md`
- `.agents/skills/orquestrar-squad/SKILL.md`
- `.agents/skills/padrao-git-e-issues/SKILL.md`
- `.agents/skills/revisar-produto/SKILL.md`
- `.agents/skills/tom-de-voz/SKILL.md`
- `.agents/skills/visao-do-produto/SKILL.md`

### Governança .agents

- `.agents/README.md`
- `.agents/WORKFLOW.md`
- `.agents/templates/mission-card.md`

### Workflows

- `.github/workflows/notas-publicadas.yml`
- `.github/workflows/publicar-firebase.yml`
- `.github/workflows/publicar-redirect-legado.yml`
- `.github/workflows/validacao.yml`

### Documentação docs

- `docs/DECISOES.md`
- `docs/PRODUCAO_ATUAL.md`
- `docs/README.md`
- `docs/design/ARENA_MVP_V2.md`
- `docs/design/AUÊ!.md`
- `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`
- `docs/design/README.md`
- `docs/design/design-system/assets/aue-bolha-mark-inverted.svg`
- `docs/design/design-system/assets/aue-bolha-mark.svg`
- `docs/design/design-system/assets/candidatas/atual-16.png`
- `docs/design/design-system/assets/candidatas/atual-180.png`
- `docs/design/design-system/assets/candidatas/atual-32.png`
- `docs/design/design-system/assets/candidatas/atual-64.png`
- `docs/design/design-system/assets/candidatas/atual.svg`
- `docs/design/design-system/assets/candidatas/candidata-1-16.png`
- `docs/design/design-system/assets/candidatas/candidata-1-180.png`
- `docs/design/design-system/assets/candidatas/candidata-1-32.png`
- `docs/design/design-system/assets/candidatas/candidata-1-64.png`
- `docs/design/design-system/assets/candidatas/candidata-1.svg`
- `docs/design/design-system/assets/candidatas/candidata-2-16.png`
- `docs/design/design-system/assets/candidatas/candidata-2-180.png`
- `docs/design/design-system/assets/candidatas/candidata-2-32.png`
- `docs/design/design-system/assets/candidatas/candidata-2-64.png`
- `docs/design/design-system/assets/candidatas/candidata-2.svg`
- `docs/design/design-system/assets/candidatas/candidata-3-16.png`
- `docs/design/design-system/assets/candidatas/candidata-3-180.png`
- `docs/design/design-system/assets/candidatas/candidata-3-32.png`
- `docs/design/design-system/assets/candidatas/candidata-3-64.png`
- `docs/design/design-system/assets/candidatas/candidata-3.svg`
- `docs/design/design-system/assets/candidatas/candidata-4-16.png`
- `docs/design/design-system/assets/candidatas/candidata-4-180.png`
- `docs/design/design-system/assets/candidatas/candidata-4-32.png`
- `docs/design/design-system/assets/candidatas/candidata-4-64.png`
- `docs/design/design-system/assets/candidatas/candidata-4.svg`
- `docs/design/design-system/assets/favicon/android-chrome-192.png`
- `docs/design/design-system/assets/favicon/android-chrome-512.png`
- `docs/design/design-system/assets/favicon/apple-touch-icon.png`
- `docs/design/design-system/assets/favicon/favicon-16.png`
- `docs/design/design-system/assets/favicon/favicon-32.png`
- `docs/design/design-system/assets/favicon/favicon-48.png`
- `docs/design/design-system/assets/favicon/favicon.ico`
- `docs/design/design-system/assets/favicon/favicon.svg`
- `docs/design/design-system/assets/favicon/maskable-192.png`
- `docs/design/design-system/assets/favicon/maskable-512.png`
- `docs/design/design-system/assets/favicon/og-image.png`
- `docs/design/design-system/assets/favicon/safari-pinned-tab.svg`
- `docs/design/design-system/aue-design-system-showcase.html`
- `docs/design/design-system/base.css`
- `docs/design/design-system/brand.html`
- `docs/design/design-system/favicon-set.html`
- `docs/design/design-system/image.png`
- `docs/design/design-system/site.webmanifest`
- `docs/design/design-system/styles.css`
- `docs/design/design-system/system/BRAND-SYSTEM.md`
- `docs/design/design-system/system/DESIGN.md`
- `docs/design/design-system/system/artifacts/deck.html`
- `docs/design/design-system/system/artifacts/email.html`
- `docs/design/design-system/system/artifacts/form.html`
- `docs/design/design-system/system/artifacts/landing.html`
- `docs/design/design-system/system/artifacts/newsletter.html`
- `docs/design/design-system/system/artifacts/poster.html`
- `docs/design/design-system/system/assets/aue-bolha-mark-inverted.svg`
- `docs/design/design-system/system/assets/aue-bolha-mark.svg`
- `docs/design/design-system/system/brand.json`
- `docs/design/design-system/system/guide.md`
- `docs/design/design-system/system/index.html`
- `docs/design/design-system/system/kit.dark.html`
- `docs/design/design-system/system/kit.html`
- `docs/design/design-system/system/scripts/apply-design-tokens.mjs`
- `docs/design/design-system/system/scripts/build-favicons.py`
- `docs/design/design-system/system/scripts/gerar-marca.mjs`
- `docs/design/design-system/system/seed.json`
- `docs/design/design-system/system/theme.json`
- `docs/design/design-system/system/tokens.compact.json`
- `docs/design/design-system/system/tokens.dark.json`
- `docs/design/design-system/system/tokens.default.json`
- `docs/design/design-system/system/variables.css`
- `docs/design/design-system/system/variables.dark.css`
- `docs/design/design-system/tokens/colors.css`
- `docs/design/design-system/tokens/feedback.css`
- `docs/design/design-system/tokens/fonts.css`
- `docs/design/design-system/tokens/glow.css`
- `docs/design/design-system/tokens/motion.css`
- `docs/design/design-system/tokens/safe-area.css`
- `docs/design/design-system/tokens/spacing.css`
- `docs/design/design-system/tokens/typography.css`
- `docs/design/fontes/Aue-Design-System.zip`
- `docs/design/fontes/Aue-Prototipo-Arena.zip`
- `docs/design/propostas/mural-chapado.html`
- `docs/escopo/BACKLOG.md`
- `docs/escopo/ESCOPO_ATUAL.md`
- `docs/escopo/ROADMAP.md`
- `docs/historias/burpzilla/01-o-novo-vizinho.md`
- `docs/historias/burpzilla/02-arrotando-na-rua.md`
- `docs/historias/burpzilla/03-jogo-de-futebol.md`
- `docs/historias/burpzilla/04-jogo-de-futebol-parte-2.md`
- `docs/historias/burpzilla/autorizacao-dos-audios.md`
- `docs/historias/burpzilla/cartao-de-missao-seed.md`
- `docs/historias/burpzilla/cronograma.md`
- `docs/historias/burpzilla/personagens.md`
- `docs/historias/burpzilla/vozes.md`
- `docs/historias/fase-1-trafego/cartao-de-missao.md`
- `docs/historias/fase-1-trafego/missao-3-arena-em-ingles.md`
- `docs/historias/fase-1-trafego/missao-4-conteudo-de-busca.md`
- `docs/jogo/ARENA.md`
- `docs/jogo/AUE.md`
- `docs/jogo/JORNADA.md`
- `docs/jogo/LOOP.md`
- `docs/jogo/REGRAS.md`
- `docs/jogo/VOZ.md`
- `docs/missoes/M01-FOUNDATION.md`
- `docs/missoes/M01-INVENTARIO.md`
- `docs/missoes/M01-RELATORIO.md`
- `docs/missoes/M02-INTEGRITY-PROPOSTA.md`
- `docs/schema/banco_de_dados.md`
- `docs/schema/nomenclatura.md`
- `docs/technical/QUALIDADE.md`
- `docs/technical/README.md`
- `docs/technical/adr/0001-arquitetura-oficial-do-aue.md`
- `docs/technical/adr/0002-o-aue-nas-lojas.md`
- `docs/technical/adr/0003-a-previa-do-link.md`
- `docs/technical/adr/0004-arquitetura-aue-3-comunidades-e-feed.md`
- `docs/technical/adr/0005-conta-opcional-e-perfil-publico.md`
- `docs/technical/adr/0006-hospedagem-somente-firebase.md`
- `docs/technical/adr/0007-audio-publico-da-casa.md`
- `docs/technical/adr/0008-paginas-publicas-dos-grupos.md`
- `docs/technical/adr/0009-identidade-social-promovida.md`
- `docs/technical/adr/0010-comunidades-topicos-e-respostas.md`
- `docs/technical/adr/0011-audio-privado-duelo-na-borda.md`
- `docs/technical/adr/0012-nota-de-audio-publicado-em-servidor.md`
- `docs/technical/adr/0013-mural-o-arroto-e-o-centro.md`
- `docs/technical/adr/0014-x1-no-mural-com-audio-consentido.md`
- `docs/technical/adr/0015-o-jogo-e-o-centro.md`
- `docs/technical/adr/README.md`
- `docs/technical/arquitetura.md`
- `docs/technical/audio/calibracao-motor-arroto-2026-08.md`
- `docs/technical/audio/deteccao-de-arroto-yamnet.md`
- `docs/technical/audio/moderacao-de-audio.md`
- `docs/technical/auditorias/M00-BASELINE.md`
- `docs/technical/auditorias/evidencias/M01-build.txt`
- `docs/technical/auditorias/evidencias/M01-execucao.json`
- `docs/technical/auditorias/evidencias/M01-governanca.txt`
- `docs/technical/auditorias/evidencias/M01-lint.txt`
- `docs/technical/auditorias/evidencias/M01-processamento.txt`
- `docs/technical/auditorias/evidencias/M01-typecheck.txt`
- `docs/technical/auditorias/evidencias/M01-unitarios.txt`
- `docs/technical/auditorias/evidencias/avatar-pglite-probe.json`
- `docs/technical/auditorias/evidencias/cadastrar-grupo-concorrencia.json`
- `docs/technical/auditorias/evidencias/pglite-execucao-reproduzida.json`
- `docs/technical/dados/banco-sem-consumidor.md`
- `docs/technical/ga4-no-admin.md`
- `docs/technical/operacao/RELEASE.md`
- `docs/technical/operacao/ambientes.md`
- `docs/technical/operacao/hospedagem-firebase.md`
- `docs/technical/operacao/migracoes-supabase.md`
- `docs/technical/operacao/transicao-aue-oficial.md`
- `docs/technical/plano-arquitetural-arena-v2.md`
