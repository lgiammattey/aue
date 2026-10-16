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

**Auê é um jogo mobile casual, web-first, preparado para virar Android e iOS
depois.**

> **Arrote. Receba a nota. Humilhe seus amigos.**

Não é rede social. Não é feed. Não é app de perfil. É um joguinho de arroto que
cabe num toque e gera briga entre amigos.

O loop é:

```text
ARROTAR → RECEBER NOTA → DESAFIAR → RESPONDER → REVANCHE
```

A experiência acontece dentro de **uma Arena que muda de estado**, não numa
sequência de páginas.

Fontes:

- visão: [`docs/jogo/VISAO.md`](docs/jogo/VISAO.md)
- loop: [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md)
- estados da Arena: [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md)
- regras de gameplay: [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md)

---

## 2. Fontes canônicas

Não duplique regra. Leia a fonte certa.

| Pergunta | Fonte |
|---|---|
| **O que o jogo é?** | [`docs/jogo/VISAO.md`](docs/jogo/VISAO.md) |
| Qual é o loop? | [`docs/jogo/LOOP.md`](docs/jogo/LOOP.md) |
| Quais são os estados da Arena? | [`docs/jogo/ARENA.md`](docs/jogo/ARENA.md) |
| Como o jogo se comporta e pontua? | [`docs/jogo/REGRAS.md`](docs/jogo/REGRAS.md) |
| **Com o que a Arena se parece?** | [`docs/design/prototipo-arena/arena.html`](docs/design/prototipo-arena/arena.html) |
| De onde vêm cor, tipo, espaço e movimento? | [`docs/design/design-system/system/DESIGN.md`](docs/design/design-system/system/DESIGN.md) |
| **O que estamos construindo agora?** | [`docs/escopo/ESCOPO_ATUAL.md`](docs/escopo/ESCOPO_ATUAL.md) |
| O que vem depois? | [`docs/escopo/BACKLOG.md`](docs/escopo/BACKLOG.md) |
| **Como o jogo é construído por dentro?** | [`docs/technical/adr/0001-arquitetura-oficial-do-aue.md`](docs/technical/adr/0001-arquitetura-oficial-do-aue.md) |
| Isso exige decisão formal antes? | [§8 do ADR 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal) |
| **Como o jogo vira app de loja?** | [`docs/technical/adr/0002-o-aue-nas-lojas.md`](docs/technical/adr/0002-o-aue-nas-lojas.md) |
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

1. **Comportamento real** — código, migrações e o que roda no celular vencem
   qualquer documento de intenção.
2. **`docs/escopo/ESCOPO_ATUAL.md`** — decide o que pertence ao jogo agora.
3. **`docs/jogo/ARENA.md`** — decide **quais estados a Arena tem**, o que cada um
   faz, o que ele não pode fazer e para onde ele sai. Nenhum protótipo, design
   system, handoff ou export cria, renomeia ou remove estado.
4. **`docs/design/prototipo-arena/arena.html`** e
   **`docs/design/design-system/system/DESIGN.md`** — decidem como cada estado
   **se parece, se move e mede**: geometria, token, tipografia, componente,
   motion e acessibilidade. Entre os dois, o protótipo decide comportamento e
   geometria; o design system decide token, nome, regra e intenção.
5. **`docs/technical/adr/`** — decide **como o jogo é construído por dentro**:
   stack, camadas, fronteira com o aparelho, backend, empacotamento. Um ADR
   aceito só cai com outro ADR ([§8 do 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md#8-o-que-exige-revisão-formal)).
   Ele não decide escopo, estado da Arena nem aparência.
6. **Este arquivo** — decide como o trabalho acontece.
7. **`docs/jogo/AUÊ!-2.md`** — consolida desenho de produto, regras, loop, score,
   modos e escopo; não pode contradizer as fontes acima.
8. **`docs/design/AUÊ!.md`** — consolida direção artística, motion, áudio-
   reatividade e composição; não pode contradizer o protótipo nem o design system.
9. **Demais documentos** — contexto. História dá origem, voz orienta linguagem.
   Nenhum dos dois abre escopo sozinho.

O Art Bible em `docs/design/AUÊ!.md` é a direção artística do jogo e a imagem de
telas recebida é uma prancha visual de referência. Nenhum dos dois cria estado,
rota ou regra de gameplay. O material de design entregue afirma ser a única fonte canônica de UX/UI. **No
que toca à máquina de estados, não é** — ali manda o item 3. No resto, manda.

Documentos em [`docs/_arquivo/`](docs/_arquivo/) **não têm autoridade nenhuma**.
São registro da visão anterior. Não use um deles como argumento.

---


## Squad 2.0 Humanizada (6 Titulares & Governança)

Ao iniciar uma sessão ou demanda neste repositório, **Giam** atua como braço direito do Luiz na porta de entrada: entende a dor na língua de produto/negócio (sem jargão técnico), separa bate-papo de exploração do que é decisão de execução, abre o [Cartão de Missão](.agents/templates/mission-card.md), define a pista e repassa ao **Marco**. **Marco** é o capitão da oficina e orquestrador: mantém a mesa limpa (uma entrega fechada por vez, protegendo o WIP), coordena os especialistas e devolve a entrega consolidada com evidência para o Giam emitir o aceite final.

| Agente | Papel e Responsabilidade | Permissão de Escrita | A Trava de Ouro |
|---|---|---|---|
| **Giam** (`giam`) | **Braço Direito do Luiz & Product Owner:** entende a necessidade, abre o Cartão de Missão, define a pista, repassa ao Marco e dá o aceite final pelas 7 perguntas (`APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO`, `NÃO VALIDADO`) | Somente leitura por padrão | Ideia vaga não desce pra oficina; entrega sem prova real do Renan não sobe pro Luiz |
| **Marco** (`marco`) | **Capitão da Oficina & Orquestrador:** recebe o Cartão de Missão do Giam, organiza prioridades, aciona especialistas, protege WIP e mantém a mesa limpa | No escopo de coordenação/integração | Proibido ser fominha (fazer tudo sozinho no improviso) ou acumular frentes abertas |
| **Priscila** (`priscila`) | **Diretora de Experiência, UX/UI & Guardiã do Protótipo:** jornadas, Design System, visual 1:1, acessibilidade e adaptação nativa por plataforma | Somente leitura por padrão | Ninguém inventa tela/estado no código; não existe fidelidade visual sem ver a tela aberta |
| **Camillo** (`camillo`) | **Principal Engineer de Motor, Rede, Backend & Arquitetura:** Gate Arquitetural Obrigatório, motores determinísticos, APIs/Workers, persistência, segurança e casca nativa | Somente quando delegado no motor/arquitetura | Motor não se mistura com tela; falha, timeout ou dado ausente nunca viram `0` nem sucesso inventado |
| **Bia** (`bia`) | **Engenheira de Telas, Produto & Experiência:** constrói interfaces, fluxos, componentes e adaptadores 1:1 com o desenho da Priscila e integrados aos contratos do Camillo | Somente quando delegada na UI/produto | Sem Cartão de Missão do Giam, desenho da Priscila e contrato do Camillo, não abre código |
| **Renan** (`renan`) | **Qualidade, Aparelho Real & Caça-Bugs Implacável:** auditoria independente, testes, segurança, estados adversos e validação em aparelho/ambiente real | Somente leitura por padrão | "Compilou" não é "funcionou"; mentira visual ou desvio do protótipo recebe `BLOQUEIA` na hora |

### As 5 Pistas de Execução (Lanes)

Nenhuma implementação começa sem o [Cartão de Missão](.agents/templates/mission-card.md) aprovado pelo Giam (exceto Hot lane, registrada logo após estancar o incidente):

1. **Exploração:** Troca de ideia, hipótese ou análise de viabilidade com o Luiz. **Zero alteração de código.** Giam e Marco analisam impacto e trade-offs.
2. **Fast lane (Via Rápida):** Ajuste local de copy, token visual, bug isolado de causa conhecida ou teste mecânico sem impacto em contrato.
   `Giam enquadra → Marco aciona Bia ou Camillo → Priscila/Renan valida proporcionalmente → Giam encerra`.
3. **Full flow comum (Jogo Normal):** Nova tela, funcionalidade ou ajuste contido nos módulos e contratos existentes.
   `Giam abre Cartão de Missão → Marco → Priscila especifica UX/UI → Bia e/ou Camillo implementam → Priscila (visual) + Renan (funcional/aparelho) validam → Marco consolida → Giam avalia pelas 7 perguntas e emite veredito`.
4. **Full flow sistêmica (Gate Arquitetural Obrigatório do Camillo):** Mudança em motor central, múltiplos módulos, API/Worker, contrato compartilhado, migração de banco/persistência ou segurança/privacidade.
   `Giam abre Cartão de Missão → Marco → Camillo investiga e fecha Plano Arquitetural (+ Priscila se tocar UI) → Camillo e/ou Bia implementam → Renan valida tudo → Camillo confere aderência ao plano → Giam emite veredito`.
5. **Hot lane (Incêndio):** Build quebrada ou fluxo crítico inoperante.
   `Conserto cirúrgico mínimo por Camillo/Bia → Renan valida caminho crítico → Giam revisa e registra após estabilizar`.

### Regra de Ouro de Desempate (Ordem Inegociável)

Quando duas frentes discordarem antes do código, a decisão segue esta ordem:
`1º Verdade do resultado para quem usa → 2º Clareza e simplicidade da experiência → 3º Segurança, privacidade e saúde da base → 4º Custo sob controle → 5º Velocidade de entrega`.
Não convergiu ou mudou negócio/escopo/monetização, Giam e Marco sobem as opções limpas para o **Luiz** decidir.

---

## 6. Princípio de arquitetura

Modular por responsabilidade, não por contagem de linhas.

- cada regra importante tem dono claro;
- a Arena é uma máquina de estados, não um emaranhado de telas;
- UI não carrega detalhe de banco sem necessidade;
- regra crítica duplicada precisa de contrato/teste de paridade;
- recurso sensível (microfone, stream, timer, áudio) precisa de ciclo de vida
  explícito;
- arquivo grande é sinal para revisar coesão, não reprovação automática;
- abstração para feature futura não entra só para "deixar preparado".

A forma concreta disso — stack, as quatro camadas, a fronteira com o aparelho,
áudio, armazenamento, backend e o caminho até as lojas — está decidida em
[`docs/technical/adr/0001-arquitetura-oficial-do-aue.md`](docs/technical/adr/0001-arquitetura-oficial-do-aue.md).
A regra que mais aparece no dia a dia:

> **API de navegador (`navigator`, `MediaRecorder`, `AudioContext`,
> `localStorage`, `document`, `window`), plugin nativo e o cliente do Supabase só
> vivem em `src/plataforma/`.** O resto do código conversa por porta.

Duas implementações, uma fronteira: `plataforma/web/` é o produto,
`plataforma/nativo/` é a casca ([ADR 0002](docs/technical/adr/0002-o-aue-nas-lojas.md) §2).

---

## 7. Regras globais

- **O jogo manda.** Se não fortalece arrotar, receber nota, desafiar, responder
  ou revanche, provavelmente não é para agora.
- **Nada pode fingir que funciona.** Mock fica marcado; botão sem backend fica
  desabilitado; falha não vira sucesso por copy.
- **Segurança e privacidade vencem a piada.**
- **Gravou pra jogar não é a mesma coisa que autorizou publicar.** O arroto de
  um jogador não vira conteúdo do Auê por tabela — nem em vídeo, nem em prévia,
  nem em exemplo, nem em teste. Se um dia o jogo publicar áudio de gente, a
  pessoa escolhe isso na cara dura, sabendo onde vai parar
  ([#135](https://github.com/gmmattey/aue/issues/135)).
- **Audiência não é jogador.** View, clique e impressão não provam o jogo. O que
  prova é comportamento: abriu, arrotou, recebeu nota, chamou outra pessoa.
  Número que não prova comportamento não sustenta decisão.
- **Testa a hipótese antes de construir a igreja.** Experimento pequeno primeiro,
  infraestrutura depois. Um sinal bom não abre feed, perfil, marketplace nem
  assinatura.
- **A Arena é uma superfície de estado, não uma pilha de rotas.**
- **Protótipo é referência visual e comportamental, não licença de escopo.**
- **Nenhuma implementação sem plano do Giam.** Sem desenho, arquitetura,
  prioridade e requisitos de aceite, não abre branch.
- **Lacuna de produto não se preenche sozinha.** O Giam pergunta ao primo e
  espera. Decisão técnica, essa ele toma.
- **Nada escrito pode cheirar a IA.** Copy, issue, PR, commit e conversa passam
  pela [`matarCheiroDeIA`](.agents/skills/matarCheiroDeIA/SKILL.md).
- **Issue e PR são primos anotando o que fazer**, não documento corporativo.
- **Nenhuma entrega sem aceite do Giam.** Qualidade é do Marcelo; aceite
  contra os requisitos é do Giam.
- **Arquitetura decidida não se rediscute em PR.** O que está no
  [ADR 0001](docs/technical/adr/0001-arquitetura-oficial-do-aue.md) vale; mudar
  algo do §8 de lá exige ADR novo antes de existir código.
- **Modelo e esforço se escolhem por tarefa** (§3). Barato no mecânico, caro no
  que decide. Na dúvida, sobe.
- **Nenhum merge com `typecheck`, `lint`, `test` ou `build` falhando.**
- **Nenhum desenvolvimento direto na `main`.**
- **Commits e PRs em PT-BR.**
- **A casca nativa entra pela porta, ou não entra.** O
  [ADR 0002](docs/technical/adr/0002-o-aue-nas-lojas.md) liberou o Capacitor e as
  pastas `ios/` e `android/`, com dois batentes: plugin só atrás de porta que já
  existe em `src/portas/`, e **nenhuma tela, regra ou feature nasce do lado
  nativo**. A web continua sendo o produto.
