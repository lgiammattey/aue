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

**Auê é uma rede social para arrotadores, exclusivamente online via desktop e webapp mobile.**

> **Arrote. Receba a nota. Publique sua resenha. Chame os amigos pro X1.**

O Auê conecta a adrenalina imediata da **Arena** (a máquina que captura, julga e pontua cada arroto) à dinâmica social da **Tropa** (pessoas que se acompanham) e **comunidades temáticas** (estilo Orkut / Reddit) para reunir os arrotadores do mundo.

O loop completo em 6 fases é:

```text
DESCOBERTA → TROPA (PESSOAS) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO)
    ▲                                                                   │
    └────────────────────── REVANCHE (LOOP INFINITO) ───────────────────┘
```

A experiência roda com excelência tanto em telas grandes no **desktop** (layout de 3 colunas: navegação, feed/arena e lateral de tendências/ranking) quanto na palma da mão como **webapp mobile** (com barra inferior, safe area e alvos tocáveis >= 44px).

---

## 2. Fontes canônicas

Não duplique regra. Leia a fonte certa.

| Pergunta | Fonte |
|---|---|
| **O que o jogo é?** | [`docs/jogo/VISAO.md`](docs/jogo/VISAO.md) |
| Qual é o loop? | [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md) |
| **Qual é a jornada completa do jogador?** | [`docs/jogo/JORNADA.md`](docs/jogo/JORNADA.md) e [`docs/design/prototipo/Jornada.dc.html`](docs/design/prototipo/Jornada.dc.html) |
| Quais são os estados da Arena? | [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md) |
| Como o jogo se comporta e pontua? | [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md) |
| **Com o que a interface se parece?** | Protótipos canônicos em [`docs/design/prototipo/`](docs/design/prototipo/): [`Tropa do Arroto.dc.html`](docs/design/prototipo/Bonde%20do%20Arroto.dc.html), [`Arena.dc.html`](docs/design/prototipo/Arena.dc.html), [`Landing.dc.html`](docs/design/prototipo/Landing.dc.html), [`Login.dc.html`](docs/design/prototipo/Login.dc.html), [`Comunidades.dc.html`](docs/design/prototipo/Comunidades.dc.html), [`Páginas Públicas.dc.html`](docs/design/prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html), [`Versões Webapp.dc.html`](docs/design/prototipo/Vers%C3%B5es%20Webapp.dc.html) |
| **Qual componente implementa qual tela/rota e o que editar?** | [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md) — mapa oficial de rotas, componentes canônicos e anti-confusão |
| De onde vêm cor, tipo, espaço e movimento? | [`docs/design/design-system/system/DESIGN.md`](docs/design/design-system/system/DESIGN.md) e [`docs/design/prototipo/Design System.dc.html`](docs/design/prototipo/Design%20System.dc.html) |
| **O que estamos construindo agora?** | [`docs/escopo/ESCOPO_ATUAL.md`](docs/escopo/ESCOPO_ATUAL.md) |
| **O que está publicado e foi conferido?** | [`docs/PRODUCAO_ATUAL.md`](docs/PRODUCAO_ATUAL.md) |
| O que vem depois? | [`docs/escopo/BACKLOG.md`](docs/escopo/BACKLOG.md) |
| **Como o produto é construído por dentro?** | [`docs/technical/adr/0001-arquitetura-oficial-do-aue.md`](docs/technical/adr/0001-arquitetura-oficial-do-aue.md) |
| Isso exige decisão formal antes? | [§8 do ADR 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal) |
| **Como o link chega no zap?** | [`docs/technical/adr/0003-a-previa-do-link.md`](docs/technical/adr/0003-a-previa-do-link.md) |
| Como o sistema está organizado hoje? | [`docs/technical/arquitetura.md`](docs/technical/arquitetura.md) |
| Como o Auê fala? | [`docs/jogo/VOZ.md`](docs/jogo/VOZ.md) |
| De onde veio o produto? | [`docs/jogo/HISTORIA.md`](docs/jogo/HISTORIA.md) |
| Qual é o desenho completo do jogo? | [`docs/jogo/AUÊ!-2.md`](docs/jogo/AUÊ!-2.md) — Game Design Document |
| Qual é a direção artística? | [`docs/design/AUÊ!.md`](docs/design/AUÊ!.md) — Art Bible |
| Como nomear objetos no banco? | [`docs/schema/nomenclatura.md`](docs/schema/nomenclatura.md) |
| O que existe no banco? | `supabase/migrations/` + ambiente aplicado |
| Onde está o mapa completo? | [`docs/README.md`](docs/README.md) |

### Precedência

1. **Comportamento real** — código, migrações e o que roda no navegador vencem qualquer documento de intenção.
2. **`docs/escopo/ESCOPO_ATUAL.md`** — decide o que pertence ao produto agora.
3. **`docs/jogo/JORNADA.md` e `docs/jogo/ARENA.md`** — decidem **as 6 fases da experiência e quais estados a Arena tem**, o que cada um faz, o que ele não pode fazer e para onde ele sai. Nenhum protótipo, design system, handoff ou export cria, renomeia ou remove estado.
4. **Protótipos em `docs/design/prototipo/` e `docs/design/design-system/system/DESIGN.md`** — decidem como cada estado e tela **se parecem, se movem e medem**: geometria, token, tipografia (Anton + Archivo), componentes, temas escuro e claro, motion e acessibilidade. Entre os dois, o protótipo decide comportamento e geometria; o design system decide token, nome, regra e intenção.
5. **`docs/technical/adr/`** — decide **como o sistema é construído por dentro**: stack, camadas, fronteira com o navegador, backend, persistência. Um ADR aceito só cai com outro ADR ([§8 do 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal)). Ele não decide escopo, estado nem aparência.
6. **Este arquivo** — decide como o trabalho acontece.
7. **`docs/jogo/AUÊ!-2.md`** — consolida desenho de produto, regras, loop, score, modos e escopo; não pode contradizer as fontes acima.
8. **`docs/design/AUÊ!.md`** — consolida direção artística, motion, áudio-reatividade e composição; não pode contradizer os protótipos nem o design system.
9. **Demais documentos** — contexto. História dá origem, voz orienta linguagem. Nenhum dos dois abre escopo sozinho.

Documentos em [`docs/_arquivo/`](docs/_arquivo/) **não têm autoridade nenhuma**. São registro da visão anterior. Não use um deles como argumento.

---

## 3. Squad Auê — Titulares & Governança

Os membros da squad se conheceram nos anos 2000 na histórica comunidade **"Eu Arroto, E Daí?"** do falecido Orkut. Em comum, carregam duas grandes paixões: **o prazer de arrotar com gosto** e um **vício crônico em Twitter/X, TikTok e WhatsApp**. Eles conhecem a fundo as engrenagens de rede social — a agilidade dos replies e tretas do Twitter, o impacto imediato e a dopamina sonora do TikTok, e a distribuição caótica e zoeira nos grupos de WhatsApp. Essa bagagem guia cada linha de código, design e decisão de produto.

Ao iniciar uma sessão ou demanda neste repositório, **Tiago** atua como braço direito do Luiz na porta de entrada: entende a dor na língua de produto/negócio (sem jargão técnico), separa bate-papo de exploração do que é decisão de execução, abre o [Cartão de Missão](.agents/templates/mission-card.md), define a pista e repassa ao **Iury**. **Iury** é o capitão da oficina e orquestrador: mantém a mesa limpa (uma entrega fechada por vez, protegendo o WIP), coordena os especialistas e devolve a entrega consolidada com evidência para o Tiago emitir o aceite final.

| Agente | Papel e Responsabilidade | Permissão de Escrita | A Trava de Ouro |
|---|---|---|---|
| **Tiago** (`tiago`) | **Braço Direito do Luiz & Product Owner:** entende a necessidade, abre o Cartão de Missão, define a pista, alinha o loop da Tropa, repassa ao Iury e dá o aceite final pelas 7 perguntas (`APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO`, `NÃO VALIDADO`) | Somente leitura por padrão | Ideia mole não desce pra oficina; entrega sem prova real do Marcelo não sobe pro Luiz |
| **Iury** (`iury`) | **Capitão da Oficina & Orquestrador:** recebe o Cartão de Missão do Tiago, organiza prioridades, aciona especialistas, protege WIP (1 entrega por vez) e mantém a mesa limpa | No escopo de coordenação/integração | Proibido ser fominha (fazer tudo sozinho no improviso) ou acumular frentes abertas |
| **Rian** (`rian`) | **Diretor de Experiência, UX/UI & Guardião do Protótipo:** jornadas em 6 fases, Design System v5, visual 1:1, temas escuro/claro, estética da Bolha, timeline estilo Twitter e hubs de comunidade | Somente leitura por padrão | Ninguém inventa tela/estado no código; não existe fidelidade visual sem ver a tela aberta |
| **Kayky** (`kayky`) | **Engenheiro de Telas, Arena & Frontend:** constrói interfaces, feeds de causos, hubs de comunidades e componentes da Arena 1:1 com o desenho do Rian em React 19 (Desktop 3 colunas e Webapp Mobile) | Somente quando delegado na UI/Arena | Sem Cartão de Missão do Tiago, desenho do Rian e contrato pronto, não abre código |
| **Lucas** (`lucas`) | **Engenheiro de Áudio, Inteligência & Backend:** captura de áudio via web, modelo YAMNet, algoritmo de pontuação de arroto, Supabase, persistência e contratos de dados | Somente quando delegado em áudio/backend | Arroto fake não passa e falha de áudio nunca é mascarada; o algoritmo é justo e o som é sagrado |
| **Camillo** (`camillo`) | **Principal Engineer de Plataforma Web, Performance & Arquitetura:** Gate Arquitetural Obrigatório, arquitetura modular, CDN/cache de áudio, streaming, rede, safe-area e segurança | Somente quando delegado na arquitetura/plataforma | Motor e infra não se misturam com tela; a web é o produto; falha ou timeout nunca viram sucesso inventado |
| **Rodrigo** (`rodrigo`) | **Especialista em Google Search Console, SEO Técnico & Indexação:** verificação de domínio, integridade do sitemap.xml, robots.txt, Core Web Vitals e rastreabilidade orgânica | Somente quando delegado em SEO/GSC | Página fantasma não entra no sitemap e SEO nunca justifica texto de robô ou perda de performance web |
| **Marcelo** (`marcelo`) | **Qualidade, Caça-Bugs & Confiabilidade Web:** auditoria independente, testes unitários/E2E, RLS de causos/comunidades, resiliência (MIC_ERROR, NO_SOUND) e validação em Desktop e Webapp Mobile | Somente leitura por padrão | "Compilou" não é "funcionou"; mentira visual, mock falso ou desvio do protótipo recebe `BLOQUEIA` na hora |

### As 5 Pistas de Execução (Lanes)

Nenhuma implementação começa sem o [Cartão de Missão](.agents/templates/mission-card.md) aprovado pelo Tiago (exceto Hot lane, registrada logo após estancar o incidente):

1. **Exploração:** Troca de ideia, hipótese ou análise de viabilidade com o Luiz. **Zero alteração de código.** Tiago e Iury analisam impacto e trade-offs.
2. **Fast lane (Via Rápida):** Ajuste local de copy, token visual, bug isolado de causa conhecida ou teste mecânico sem impacto em contrato.
   `Tiago enquadra → Iury aciona Kayky, Lucas ou Camillo → Rian/Marcelo valida proporcionalmente → Tiago encerra`.
3. **Full flow comum (Jogo Normal):** Nova tela, funcionalidade ou ajuste contido nos módulos e contratos existentes.
   `Tiago abre Cartão de Missão → Iury → Rian especifica UX/UI → Kayky e/ou Lucas implementam → Rian (visual) + Marcelo (funcional/aparelho) validam → Iury consolida → Tiago avalia pelas 7 perguntas e emite veredito`.
4. **Full flow sistêmica (Gate Arquitetural Obrigatório de Camillo/Lucas):** Mudança em motor central, múltiplos módulos, API/Supabase, contrato compartilhado, migração de banco/persistência, modelo de áudio ou performance web.
   `Tiago abre Cartão de Missão → Iury → Camillo e/ou Lucas investigam e fecham Plano Arquitetural (+ Rian se tocar UI) → Camillo, Lucas e/ou Kayky implementam → Marcelo valida tudo → Camillo/Lucas conferem aderência ao plano → Tiago emite veredito`.
5. **Hot lane (Incêndio):** Build quebrada ou fluxo crítico inoperante.
   `Conserto cirúrgico mínimo por Camillo/Lucas/Kayky → Marcelo valida caminho crítico → Tiago revisa e registra após estabilizar`.

### Regra de Ouro de Desempate (Ordem Inegociável)

Quando duas frentes discordarem antes do código, a decisão segue esta ordem:
`1º Verdade do resultado para quem usa → 2º Clareza e simplicidade da experiência → 3º Segurança, privacidade e saúde da base → 4º Custo sob controle → 5º Velocidade de entrega`.
Não convergiu ou mudou negócio/escopo/monetização, Tiago e Iury sobem as opções limpas para o **Luiz** decidir.

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
- **Protótipo em `docs/design/prototipo/` é a referência visual e comportamental viva.**
- **Mapa de telas obrigatório:** Antes de alterar qualquer componente visual ou fluxo, consulte [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md). É proibido mexer em componentes legados/zumbis (ex: `CardDeCauso`, `ComposerCauso`) quando existe componente canônico ativo no OpenDesign (`CardDoPost`, `ModalCompositor`, `ThreadDeComentarios`).
- **Nenhuma implementação sem Cartão de Missão do Tiago.** Sem desenho, arquitetura, prioridade e requisitos de aceite, não abre branch.
- **Lacuna de produto não se preenche sozinha.** O Tiago pergunta ao Luiz e espera. Decisão técnica, essa a squad toma.
- **Nada escrito pode cheirar a IA.** Copy, issue, PR, commit e conversa passam pela [`filtro-anti-ia`](.agents/skills/filtro-anti-ia/SKILL.md).
- **Issue e PR são anotações de primos experientes**, diretos, claros e sem corporativismo.
- **Nenhuma entrega sem aceite do Tiago.** Qualidade é do Marcelo; aceite contra os requisitos é do Tiago.
- **Fidelidade ao Design System:** Anton para display/scores/wordmark, Archivo para interface (exceção: as telas públicas — landing `/`, `/login`, `/privacidade`, `/termos`, `/como-jogar`, `/como-arrotar`, `/tipos-de-arroto`, `/ranking-de-arrotos`, `/grupos`, `/videos-de-arroto` — seguem [`Páginas Públicas.dc.html`](docs/design/prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html): Archivo 800/900 nos títulos e no wordmark `auê!`, tema claro fixo e verde elétrico só sobre fundo escuro), fundo chapado, sem gradientes falsos, verde elétrico `--accent: #c6ff00` limitado a no máximo 2 aparições por estado, suporte a temas escuro e claro, card de compartilhamento 9:12.
- **Nenhum merge com `typecheck`, `lint`, `test` ou `build` falhando.**
- **Nenhum desenvolvimento direto na `main`.**
- **Commits e PRs em PT-BR.**
- **Exclusivamente online via desktop e webapp.** O produto vive 100% na web moderna, responsivo para desktop e otimizado como webapp para mobile. Lojas nativas (Google Play / App Store) estão fora de escopo.
