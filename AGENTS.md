# AGENTS.md — a autoridade do Auê

Este arquivo é a **autoridade única** do repositório `aue`.

Regras, papéis, escopo e fluxo de trabalho do projeto vivem aqui ou em documentos
que este arquivo aponta. **Tudo que o projeto precisa está dentro deste
repositório.** Nenhum agente, skill, política, configuração pessoal, instrução de
organização ou outro repositório é necessário para trabalhar no Auê — e nada
externo tem autoridade sobre o que está escrito aqui.

`CLAUDE.md` contém apenas `@AGENTS.md`. Não existe segunda governança escondida.

---

## 1. O que é o Auê

> **A definição vigente do produto é [`docs/jogo/AUE.md`](docs/jogo/AUE.md).** Onde o resto desta seção ou outro documento a contradisser, vale ela.

**Auê é uma plataforma web competitiva de arrotos, em desktop e mobile.** A Arena concentra o jogo, o Mural reúne a resenha e o Perfil representa identidade e reputação. O gravador atende aos fluxos que precisam dele.

> **Arrote. Receba a nota. Chame os amigos pro X1.**

```text
GRAVAR → MANDAR → RECEBER A NOTA → (DESAFIAR NO X1 | TENTAR DE NOVO | IR AO MURAL)
```

A nota é um laudo experimental e não comprova a origem do som. A comunidade existe em torno da competição; isso não reativa automaticamente comunidades temáticas ou tópicos. O corte publicado e seus limites estão em [`docs/PRODUCAO_ATUAL.md`](docs/PRODUCAO_ATUAL.md).

A experiência roda tanto no **desktop** (3 colunas) quanto como **webapp mobile** (barra inferior, safe area e alvos tocáveis >= 44px).

---

## 2. Fontes canônicas

Não duplique regra. Leia a fonte certa.

| Pergunta | Fonte |
|---|---|
| **O que o Auê é?** | [`docs/jogo/AUE.md`](docs/jogo/AUE.md) (definição vigente) |
| Qual é o loop? | [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md), que distingue v2 de legado |
| **Qual é a jornada completa do jogador?** | [`docs/jogo/JORNADA.md`](docs/jogo/JORNADA.md) e  |
| Quais são os estados da Arena? | [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md) |
| Como o jogo se comporta e pontua? | [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md) |
| **Com o que a interface se parece?** | O código em produção e o design system em [`DESIGN.md`](docs/design/design-system/system/DESIGN.md). Não há protótipos |
| **Qual componente implementa qual tela/rota e o que editar?** | [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md) — mapa oficial de rotas, componentes canônicos e anti-confusão |
| De onde vêm cor, tipo, espaço e movimento? | [`docs/design/design-system/system/DESIGN.md`](docs/design/design-system/system/DESIGN.md) e  |
| **O que estamos construindo agora?** | [`docs/escopo/ESCOPO_ATUAL.md`](docs/escopo/ESCOPO_ATUAL.md) |
| **O que está publicado e foi conferido?** | [`docs/PRODUCAO_ATUAL.md`](docs/PRODUCAO_ATUAL.md) |
| O que vem depois? | [`docs/escopo/ROADMAP.md`](docs/escopo/ROADMAP.md) e [`docs/escopo/BACKLOG.md`](docs/escopo/BACKLOG.md) |
| Como uma missão avança? | [`.agents/WORKFLOW.md`](.agents/WORKFLOW.md) |
| Como validar e preparar release? | [`docs/technical/QUALIDADE.md`](docs/technical/QUALIDADE.md) e [`docs/technical/operacao/RELEASE.md`](docs/technical/operacao/RELEASE.md) |
| Onde ficam as decisões? | [`docs/DECISOES.md`](docs/DECISOES.md) e [`docs/technical/adr/`](docs/technical/adr/) |
| **Como o produto é construído por dentro?** | [`docs/technical/adr/0001-arquitetura-oficial-do-aue.md`](docs/technical/adr/0001-arquitetura-oficial-do-aue.md) |
| Isso exige decisão formal antes? | [§8 do ADR 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal) |
| **Como o link chega no zap?** | [`docs/technical/adr/0003-a-previa-do-link.md`](docs/technical/adr/0003-a-previa-do-link.md) |
| Como o sistema está organizado hoje? | [`docs/technical/arquitetura.md`](docs/technical/arquitetura.md) |
| Como o Auê fala? | [`docs/jogo/VOZ.md`](docs/jogo/VOZ.md) |
| Qual é a direção artística? | [`docs/design/AUÊ!.md`](docs/design/AUÊ!.md) — Art Bible |
| Como nomear objetos no banco? | [`docs/schema/nomenclatura.md`](docs/schema/nomenclatura.md) |
| O que existe no banco? | `supabase/migrations/` + ambiente aplicado |
| Onde está o mapa completo? | [`docs/README.md`](docs/README.md) |

### Precedência

0. **`docs/jogo/AUE.md`** — define o que o Auê é e o que está fora. Nenhum outro documento a contradiz.
1. **Comportamento real** — código, migrações e o que roda no navegador vencem qualquer documento de intenção.
2. **`docs/escopo/ESCOPO_ATUAL.md`** — decide o que pertence ao produto agora.
3. **`docs/jogo/JORNADA.md` e `docs/jogo/ARENA.md`** — registram jornada e estados, com o recorte atual da Arena v2 identificado nos próprios documentos, o que cada um faz, o que ele não pode fazer e para onde ele sai. Nenhum design system, handoff ou export cria, renomeia ou remove estado.
4. **`docs/design/design-system/system/DESIGN.md`** — decide como cada estado e tela **se parecem, se movem e medem**: geometria, token, tipografia (Anton + Archivo), componentes, temas escuro e claro, motion e acessibilidade.
5. **`docs/technical/adr/`** — decide **como o sistema é construído por dentro**: stack, camadas, fronteira com o navegador, backend, persistência. Um ADR aceito só cai com outro ADR ([§8 do 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal)). Ele não decide escopo, estado nem aparência.
6. **Este arquivo** — decide como o trabalho acontece.
7. **`docs/design/AUÊ!.md`** — consolida direção artística, motion, áudio-reatividade e composição; não pode contradizer o design system.
8. **Demais documentos** — contexto. A voz orienta linguagem e não abre escopo sozinha.

Documentos antigos removidos de `docs/_arquivo/` (disponíveis apenas no histórico do Git) **não têm autoridade nenhuma**. São registro da visão anterior. Não use um deles como argumento.

---

## 3. Squad Auê: quatro titulares

| Agente | Responsabilidade |
|---|---|
| **Marcelo** (`marcelo`) | Produto, prioridades, dependências, Cartão de Missão, WIP e parecer para o Product Owner. |
| **Felipe** (`felipe`) | UX/UI, Design System, acessibilidade, responsividade e proteção da identidade visual. |
| **Camillo** (`camillo`) | Engenharia full-stack, áudio, backend, segurança, arquitetura e Gate Arquitetural. |
| **Renan** (`renan`) | Qualidade independente da implementação, testes, regressões, evidências e Prova de Fogo. |

As definições operacionais estão em `.codex/agents/` e `.claude/agents/`; este arquivo define os papéis. Quem implementa não faz a auditoria final da própria entrega. Registre se houve agente distinto ou análise por papéis; agente distinto não equivale a revisão humana independente.

**WIP = 1.** O fluxo é `Ideia → Análise → Decisão → Missão → Implementação → Testes → Validação → Release`, organizado em Enquadramento, Construção e Auto-Teste e Prova de Fogo. O [workflow](.agents/WORKFLOW.md) e o [Cartão de Missão](.agents/templates/mission-card.md) definem a execução. Nenhuma missão seguinte começa automaticamente.

Marcelo enquadra e recomenda o resultado com base nas provas de Felipe, Camillo e Renan. O aceite do Product Owner é distinto do parecer da squad. Quando faltar ambiente ou prova, registrar `NÃO VALIDADO`; não inventar sucesso. Incidentes críticos podem receber contenção mínima antes do cartão, com registro logo depois.

### Regra de Ouro de Desempate (Ordem Inegociável)

Quando duas frentes discordarem antes do código, a decisão segue esta ordem:
`1º Verdade do resultado para quem usa → 2º Clareza e simplicidade da experiência → 3º Segurança, privacidade e saúde da base → 4º Custo sob controle → 5º Velocidade de entrega`.
Não convergiu ou mudou negócio/escopo/monetização, Marcelo sobe as opções limpas para o **Luiz** decidir.

---

## 4. Princípio de arquitetura

Modular por responsabilidade, não por contagem de linhas.

- cada regra importante tem dono claro;
- a Arena é uma máquina de estados contínua, não um emaranhado de telas;
- UI não carrega detalhe de banco sem necessidade;
- regra crítica duplicada precisa de contrato/teste de paridade;
- recurso sensível (microfone, stream, timer, áudio) precisa de ciclo de vida explícito;
- arquivo grande é sinal para revisar coesão, não reprovação automática;
- abstração para feature futura não entra só para "deixar preparado".

A forma concreta disso — stack, as quatro camadas, a fronteira com o navegador, áudio, armazenamento e backend — está decidida em [`docs/technical/adr/0001-arquitetura-oficial-do-aue.md`](docs/technical/adr/0001-arquitetura-oficial-do-aue.md).
A regra que mais aparece no dia a dia:

> **API de navegador (`navigator`, `MediaRecorder`, `AudioContext`, `localStorage`, `document`, `window`) e o cliente do Supabase só vivem em `src/plataforma/`.** O resto do código conversa por porta.

---

## 5. Regras globais

- **O jogo e a zoeira mandam.** Se não fortalece arrotar, receber nota, publicar resenha, desafiar no X1 ou revanche, provavelmente não é para agora.
- **Nada pode fingir que funciona.** Mock fica marcado; botão sem backend fica desabilitado; falha não vira sucesso por copy.
- **Segurança e privacidade vencem a piada.**
- **Gravou pra jogar não é a mesma coisa que autorizou publicar.** O arroto gravado para um duelo ou teste não vira post público sem autorização explícita da pessoa na hora do envio.
- **Audiência não é jogador.** View, clique e impressão não provam o jogo. O que prova é comportamento: abriu, arrotou, recebeu nota, publicou resenha ou chamou outra pessoa pro X1.
- **Testa a hipótese antes de construir a igreja.** Experimento pequeno primeiro, infraestrutura pesada depois.
- **A Arena é uma superfície de estado, não uma pilha de rotas desconexas.**
- **Não há protótipos.** A referência visual é a tela em produção e o design system. Para tela nova, Felipe propõe o desenho e o Luiz aprova antes do código.
- **Mapa de telas obrigatório:** Antes de alterar qualquer componente visual ou fluxo, consulte [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md). É proibido mexer em componentes legados/zumbis (ex: `CardDeCauso`, `ComposerCauso`) quando existe componente canônico ativo no OpenDesign (`CardDoPost`, `ModalCompositor`, `ThreadDeComentarios`).
- **Nenhuma implementação sem Cartão de Missão enquadrado por Marcelo e autorização de execução aplicável.** O cartão registra desenho, arquitetura quando aplicável, prioridade e requisitos de aceite antes da construção.
- **Lacuna de produto não se preenche sozinha.** Marcelo pergunta ao Luiz e espera. Decisão técnica, essa a squad toma.
- **Nada escrito pode cheirar a IA.** Copy, issue, PR, commit e conversa passam pela [`filtro-anti-ia`](.agents/skills/filtro-anti-ia/SKILL.md).
- **Tom de copy, zero travessão e linguagem real de comunidade:** toda copy pública segue [`docs/jogo/VOZ.md`](docs/jogo/VOZ.md), falando como gente real no X, Reddit, fóruns e grupos de WhatsApp no Brasil, com SEO natural em PT-BR (incluindo busca local quando couber). **É proibido usar travessão (`—` ou `–`) na copy do produto.**
- **Consistência de imagens e ilustrações:** ativos visuais ficam versionados em `public/` (`public/ilustracoes/`, `public/comunidades/`, `public/ecossistema/`) seguindo [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md#regras-comuns). Ilustrações da mesma página mantêm unidade de estilo (cartoon editorial flat integrado ao tema escuro), sem aparência genérica de IA, sem rostos reconhecíveis e sem misturar estilos díspares.
- **Issue e PR são anotações de primos experientes**, diretos, claros e sem corporativismo.
- **Nenhuma entrega sem parecer de Marcelo e prova de quem não implementou.** O aceite do Product Owner é registrado separadamente quando exigido.
- **Fidelidade ao Design System:** Anton para display/scores/wordmark, Archivo para interface; cada rota segue a família visual registrada no [`mapa de telas`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md#4-diretrizes-visuais-inegociáveis). Login e páginas informativas usam o padrão OpenDesign existente e seus tokens; não recebem tema claro fixo por serem públicas. `/landing` é uma rota de apoio com visual próprio. Fundo chapado, sem gradientes falsos, verde elétrico `--accent: #c6ff00` limitado a no máximo 2 aparições por estado, suporte a temas escuro e claro na casca social, card de compartilhamento 9:12.
- **Sem cardificação.** Card é exceção, não o padrão. Conteúdo vive direto na superfície da página, separado por espaço, tipografia e uma linha fina (`--border`), como no X e no Reddit. Só vira card o que é **item discreto e repetível** (post, resultado de X1, comunidade numa grade) ou o que precisa de moldura funcional (modal, sheet, card de compartilhamento 9:12). É proibido embrulhar seção, bloco de texto, lista, formulário ou widget de página (ranking, filtros, métricas) em caixa com borda, fundo e raio só para "organizar"; e proibido card dentro de card. Regra completa em [`DESIGN.md` §4.1](docs/design/design-system/system/DESIGN.md#41-card-é-exceção).
- **Webapp mobile é travado na largura da tela.** A página só rola na vertical. Nada pode alargar o documento: lista horizontal (ranking, abas, chips) rola **dentro do próprio container**, que precisa de `min-width: 0` em toda a cadeia de flex/grid acima dele. Antes de fechar tela mobile, meça `document.documentElement.scrollWidth === window.innerWidth` com dados reais (ou simulados) na rota. Detalhe em [`DESIGN.md` §6.1](docs/design/design-system/system/DESIGN.md#61-trava-lateral-no-webapp-mobile).
- **Copy, ergonomia e testes não autorizam redesign:** alterar texto, alvo de toque ou teste não autoriza trocar tema, paleta, família tipográfica, moldura ou layout da tela. Preserve o visual atual. Mudança dessa natureza precisa estar explícita no pedido do Luiz e no Cartão de Missão.
- **Trava de regressão visual:** antes de encerrar mudança visual, confira a rota real em desktop e mobile, compare capturas de antes/depois e execute o contrato visual E2E. A revisão deve comprovar tema, tipografia, moldura e componentes ativos; teste funcional verde sozinho não aprova mudança de aparência. Se código, mapa e design system discordarem, registre o conflito e preserve o visual aprovado pelo Luiz, sem escolher um redesign por conta própria.
- **Nenhum merge com `typecheck`, `lint`, `test` ou `build` falhando.**
- **Nenhum desenvolvimento direto na `main`.**
- **Commits e PRs em PT-BR.**
- **Exclusivamente online via desktop e webapp.** O produto vive 100% na web moderna, responsivo para desktop e otimizado como webapp para mobile. Lojas nativas (Google Play / App Store) estão fora de escopo.
