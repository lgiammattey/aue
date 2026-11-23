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

**Auê é um jogo web de arrotar, em desktop e mobile.** A pessoa grava um arroto, manda o áudio e recebe a nota do juiz. Em volta do jogo existe um mural. O jogo manda.

> **Arrote. Receba a nota. Chame os amigos pro X1.**

```text
GRAVAR → MANDAR → RECEBER A NOTA → (DESAFIAR NO X1 | TENTAR DE NOVO | IR AO MURAL)
```

A nota é um laudo experimental e não comprova a origem do som. Comunidades e tópicos saíram do produto (ADR 0015). O corte publicado e seus limites estão em [`docs/PRODUCAO_ATUAL.md`](docs/PRODUCAO_ATUAL.md).

A experiência roda tanto no **desktop** (3 colunas) quanto como **webapp mobile** (barra inferior, safe area e alvos tocáveis >= 44px).

---

## 2. Fontes canônicas

Não duplique regra. Leia a fonte certa.

| Pergunta | Fonte |
|---|---|
| **O que o Auê é?** | [`docs/jogo/AUE.md`](docs/jogo/AUE.md) (definição vigente) |
| Qual é o loop? | [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md), que distingue v2 de legado |
| **Qual é a jornada completa do jogador?** | [`docs/jogo/JORNADA.md`](docs/jogo/JORNADA.md) e [`docs/design/prototipo/Jornada.dc.html`](docs/design/prototipo/Jornada.dc.html) |
| Quais são os estados da Arena? | [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md) |
| Como o jogo se comporta e pontua? | [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md) |
| **Com o que a interface se parece?** | Protótipos canônicos em [`docs/design/prototipo/`](docs/design/prototipo/): [`Arena.dc.html`](docs/design/prototipo/Arena.dc.html), [`Landing.dc.html`](docs/design/prototipo/Landing.dc.html), [`Login.dc.html`](docs/design/prototipo/Login.dc.html), [`Páginas Públicas.dc.html`](docs/design/prototipo/P%C3%A1ginas%20P%C3%BAblicas.dc.html), [`Versões Webapp.dc.html`](docs/design/prototipo/Vers%C3%B5es%20Webapp.dc.html) |
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
| Qual é a direção artística? | [`docs/design/AUÊ!.md`](docs/design/AUÊ!.md) — Art Bible |
| Como nomear objetos no banco? | [`docs/schema/nomenclatura.md`](docs/schema/nomenclatura.md) |
| O que existe no banco? | `supabase/migrations/` + ambiente aplicado |
| Onde está o mapa completo? | [`docs/README.md`](docs/README.md) |

### Precedência

0. **`docs/jogo/AUE.md`** — define o que o Auê é e o que está fora. Nenhum outro documento a contradiz.
1. **Comportamento real** — código, migrações e o que roda no navegador vencem qualquer documento de intenção.
2. **`docs/escopo/ESCOPO_ATUAL.md`** — decide o que pertence ao produto agora.
3. **`docs/jogo/JORNADA.md` e `docs/jogo/ARENA.md`** — registram jornada e estados, com o recorte atual da Arena v2 identificado nos próprios documentos, o que cada um faz, o que ele não pode fazer e para onde ele sai. Nenhum protótipo, design system, handoff ou export cria, renomeia ou remove estado.
4. **Protótipos em `docs/design/prototipo/` e `docs/design/design-system/system/DESIGN.md`** — decidem como cada estado e tela **se parecem, se movem e medem**: geometria, token, tipografia (Anton + Archivo), componentes, temas escuro e claro, motion e acessibilidade. Entre os dois, o protótipo decide comportamento e geometria; o design system decide token, nome, regra e intenção.
5. **`docs/technical/adr/`** — decide **como o sistema é construído por dentro**: stack, camadas, fronteira com o navegador, backend, persistência. Um ADR aceito só cai com outro ADR ([§8 do 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal)). Ele não decide escopo, estado nem aparência.
6. **Este arquivo** — decide como o trabalho acontece.
7. **`docs/design/AUÊ!.md`** — consolida direção artística, motion, áudio-reatividade e composição; não pode contradizer os protótipos nem o design system.
8. **Demais documentos** — contexto. A voz orienta linguagem e não abre escopo sozinha.

Documentos antigos removidos de `docs/_arquivo/` (disponíveis apenas no histórico do Git) **não têm autoridade nenhuma**. São registro da visão anterior. Não use um deles como argumento.

---

## 3. Squad Auê: três titulares

A squad tem três agentes. Cada um tem dono claro, e **ninguém audita o próprio código**.

| Agente | Papel e responsabilidade | Escrita | A trava de ouro |
|---|---|---|---|
| **Tiago** (`tiago`) | **Produto, orquestração e aceite:** entende a necessidade com o Luiz, abre o [Cartão de Missão](.agents/templates/mission-card.md), define a pista, protege o WIP (uma entrega fechada por vez), aciona Camillo e Diego e dá o aceite final pelas 7 perguntas (`APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO`, `NÃO VALIDADO`) | Somente leitura | Ideia mole não desce pra oficina; entrega sem prova real não sobe pro Luiz |
| **Camillo** (`camillo`) | **Áudio, backend, arquitetura e plataforma:** captura de áudio, nota do juiz, Supabase, RLS, contratos, 4 camadas, Gate Arquitetural, performance, PWA e SEO técnico. Audita o que o Diego escreveu | Quando delegado | Motor e infra não se misturam com tela; a web é o produto; falha ou timeout nunca viram sucesso inventado |
| **Diego** (`diego`) | **Frontend, Arena e experiência:** telas em React 19 (desktop 3 colunas e webapp mobile), fidelidade ao protótipo e ao design system, mapa de telas. Audita o que o Camillo entregou na parte visível | Quando delegado | Ninguém inventa tela ou estado no código; não existe fidelidade visual sem ver a tela aberta |

**Auditoria cruzada.** Quem implementou não audita. Código do Diego é auditado pelo Camillo (testes, build, estados de erro, prova em aparelho). Código do Camillo que aparece na tela é conferido pelo Diego em desktop e celular real. A prova vai ao Tiago, que decide o aceite. Pareceres: `SEM ACHADOS MATERIAIS`, `AJUSTA`, `BLOQUEIA` ou `ISSUE_FUTURA`.

### As 5 Pistas de Execução (Lanes)

Nenhuma implementação começa sem o [Cartão de Missão](.agents/templates/mission-card.md) aprovado pelo Tiago (exceto Hot lane, registrada logo após estancar o incidente):

1. **Exploração:** troca de ideia, hipótese ou viabilidade com o Luiz. **Zero alteração de código.**
2. **Fast lane:** ajuste local de copy, token visual, bug isolado de causa conhecida ou teste mecânico sem impacto em contrato.
   `Tiago enquadra → Diego ou Camillo implementa → o outro confere → Tiago encerra`.
3. **Full flow comum:** nova tela, funcionalidade ou ajuste contido nos módulos e contratos existentes.
   `Tiago abre o Cartão → Diego especifica e implementa a tela (Camillo entrega o contrato, se precisar) → o outro audita com prova → Tiago avalia pelas 7 perguntas`.
4. **Full flow sistêmica (Gate Arquitetural do Camillo):** motor central, API/Supabase, contrato compartilhado, migração, modelo de áudio ou performance web.
   `Tiago abre o Cartão → Camillo fecha o Plano Arquitetural → Camillo implementa (e Diego, se tocar tela) → Diego audita o que aparece na tela e confere a aderência ao plano → Tiago emite o veredito`.
5. **Hot lane:** build quebrada ou fluxo crítico inoperante.
   `Conserto cirúrgico mínimo por quem for dono da área → o outro valida o caminho crítico → Tiago registra após estabilizar`.

### Regra de Ouro de Desempate (Ordem Inegociável)

Quando duas frentes discordarem antes do código, a decisão segue esta ordem:
`1º Verdade do resultado para quem usa → 2º Clareza e simplicidade da experiência → 3º Segurança, privacidade e saúde da base → 4º Custo sob controle → 5º Velocidade de entrega`.
Não convergiu ou mudou negócio/escopo/monetização, Tiago sobe as opções limpas para o **Luiz** decidir.

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
- **Tom de copy, zero travessão e linguagem real de comunidade:** toda copy pública segue [`docs/jogo/VOZ.md`](docs/jogo/VOZ.md), falando como gente real no X, Reddit, fóruns e grupos de WhatsApp no Brasil, com SEO natural em PT-BR (incluindo busca local quando couber). **É proibido usar travessão (`—` ou `–`) na copy do produto.**
- **Consistência de imagens e ilustrações:** ativos visuais ficam versionados em `public/` (`public/ilustracoes/`, `public/comunidades/`, `public/ecossistema/`) seguindo [`docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md#regras-comuns). Ilustrações da mesma página mantêm unidade de estilo (cartoon editorial flat integrado ao tema escuro), sem aparência genérica de IA, sem rostos reconhecíveis e sem misturar estilos díspares.
- **Issue e PR são anotações de primos experientes**, diretos, claros e sem corporativismo.
- **Nenhuma entrega sem aceite do Tiago.** Prova é de quem não escreveu o código; aceite contra os requisitos é do Tiago.
- **Fidelidade ao Design System:** Anton para display/scores/wordmark, Archivo para interface; cada rota segue a família visual registrada no [`mapa de telas`](docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md#4-diretrizes-visuais-inegociáveis). Login e páginas informativas usam o padrão OpenDesign existente e seus tokens; não recebem tema claro fixo por serem públicas. `/landing` é uma rota de apoio com visual próprio. Fundo chapado, sem gradientes falsos, verde elétrico `--accent: #c6ff00` limitado a no máximo 2 aparições por estado, suporte a temas escuro e claro na casca social, card de compartilhamento 9:12.
- **Sem cardificação.** Card é exceção, não o padrão. Conteúdo vive direto na superfície da página, separado por espaço, tipografia e uma linha fina (`--border`), como no X e no Reddit. Só vira card o que é **item discreto e repetível** (post, resultado de X1, comunidade numa grade) ou o que precisa de moldura funcional (modal, sheet, card de compartilhamento 9:12). É proibido embrulhar seção, bloco de texto, lista, formulário ou widget de página (ranking, filtros, métricas) em caixa com borda, fundo e raio só para "organizar"; e proibido card dentro de card. Regra completa em [`DESIGN.md` §4.1](docs/design/design-system/system/DESIGN.md#41-card-é-exceção).
- **Webapp mobile é travado na largura da tela.** A página só rola na vertical. Nada pode alargar o documento: lista horizontal (ranking, abas, chips) rola **dentro do próprio container**, que precisa de `min-width: 0` em toda a cadeia de flex/grid acima dele. Antes de fechar tela mobile, meça `document.documentElement.scrollWidth === window.innerWidth` com dados reais (ou simulados) na rota. Detalhe em [`DESIGN.md` §6.1](docs/design/design-system/system/DESIGN.md#61-trava-lateral-no-webapp-mobile).
- **Copy, ergonomia e testes não autorizam redesign:** alterar texto, alvo de toque ou teste não autoriza trocar tema, paleta, família tipográfica, moldura ou layout da tela. Preserve o visual atual. Mudança dessa natureza precisa estar explícita no pedido do Luiz e no Cartão de Missão. Um protótipo com nome parecido não autoriza transplantar sua aparência para outra rota.
- **Trava de regressão visual:** antes de encerrar mudança visual, confira a rota real em desktop e mobile, compare capturas de antes/depois e execute o contrato visual E2E. A revisão deve comprovar tema, tipografia, moldura e componentes ativos; teste funcional verde sozinho não aprova mudança de aparência. Se código, mapa e protótipo discordarem, registre o conflito e preserve o visual aprovado pelo Luiz, sem escolher um redesign por conta própria.
- **Nenhum merge com `typecheck`, `lint`, `test` ou `build` falhando.**
- **Nenhum desenvolvimento direto na `main`.**
- **Commits e PRs em PT-BR.**
- **Exclusivamente online via desktop e webapp.** O produto vive 100% na web moderna, responsivo para desktop e otimizado como webapp para mobile. Lojas nativas (Google Play / App Store) estão fora de escopo.
