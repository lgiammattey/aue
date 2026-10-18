# Mapa da documentação do Auê

O Auê é uma **rede social para arrotadores, exclusivamente online via desktop e webapp mobile**:

> **Arrote. Receba a nota. Publique seu causo. Humilhe seus amigos e domine as comunidades.**

A autoridade única do repositório é [`../AGENTS.md`](../AGENTS.md). Este arquivo serve como mapa para localizar cada decisão, protótipo e especificação.

---

## Comece por aqui

1. [`../AGENTS.md`](../AGENTS.md) — **a autoridade única**: squad, governança, precedência, escopo e regras.
2. [`jogo/VISAO.md`](jogo/VISAO.md) — **o que o produto é**: o Bonde do Arroto, comunidades, Arena e X1.
3. [`jogo/LOOP.md`](jogo/LOOP.md) — o loop em 6 fases da experiência.
4. [`jogo/JORNADA.md`](jogo/JORNADA.md) — a jornada completa do jogador do descobrimento à revanche.
5. [`jogo/ARENA.md`](jogo/ARENA.md) — os dez estados da máquina da Arena.
6. [`design/README.md`](design/README.md) e [`design/prototipo/`](design/prototipo/) — **os protótipos interativos canônicos**.
7. [`escopo/ESCOPO_ATUAL.md`](escopo/ESCOPO_ATUAL.md) — o que estamos construindo agora.
8. [`escopo/BACKLOG.md`](escopo/BACKLOG.md) — o que está na fila.
9. [`technical/adr/README.md`](technical/adr/README.md) — índice dos ADRs aceitos.
10. [`jogo/VOZ.md`](jogo/VOZ.md) — o tom de voz autêntico, zoeiro e direto.

---

## Quem manda em quê

| Pergunta | Fonte |
|---|---|
| O que o jogo e a rede social são? | [`jogo/VISAO.md`](jogo/VISAO.md) |
| Qual é o loop da experiência? | [`jogo/LOOP.md`](jogo/LOOP.md) |
| Qual é a jornada do jogador? | [`jogo/JORNADA.md`](jogo/JORNADA.md) e [`design/prototipo/Jornada.dc.html`](design/prototipo/Jornada.dc.html) |
| Que estados a Arena tem? | [`jogo/ARENA.md`](jogo/ARENA.md) |
| Como o jogo pontua e o que não vale? | [`jogo/REGRAS.md`](jogo/REGRAS.md) |
| Com o que a interface se parece? | Protótipos canônicos em [`design/prototipo/`](design/prototipo/) |
| De onde vêm cor, tipo, espaço e movimento? | [`design/design-system/system/DESIGN.md`](design/design-system/system/DESIGN.md) e [`design/prototipo/Design System.dc.html`](design/prototipo/Design%20System.dc.html) |
| Qual é a direção artística que une tudo? | [`design/AUÊ!.md`](design/AUÊ!.md) |
| Isso pertence ao produto agora? | [`escopo/ESCOPO_ATUAL.md`](escopo/ESCOPO_ATUAL.md) |
| O que pegar para fazer? | [`escopo/BACKLOG.md`](escopo/BACKLOG.md) |
| Quem implementa, valida e aceita? | [`../AGENTS.md`](../AGENTS.md) e [`.agents/README.md`](../.agents/README.md) |
| Como o Auê fala? | [`jogo/VOZ.md`](jogo/VOZ.md) |
| De onde veio o produto? | [`jogo/HISTORIA.md`](jogo/HISTORIA.md) |
| Que stack é essa e por quê? | [`technical/adr/0001-arquitetura-oficial-do-aue.md`](technical/adr/0001-arquitetura-oficial-do-aue.md) |
| Como o link chega no zap com prévia? | [`technical/adr/0003-a-previa-do-link.md`](technical/adr/0003-a-previa-do-link.md) |
| Como funciona a arquitetura de feed e comunidades? | [`technical/adr/0004-arquitetura-aue-3-comunidades-e-feed.md`](technical/adr/0004-arquitetura-aue-3-comunidades-e-feed.md) |
| Como funcionam as contas e perfis públicos? | [`technical/adr/0005-conta-opcional-e-perfil-publico.md`](technical/adr/0005-conta-opcional-e-perfil-publico.md) |
| Onde a aplicação é hospedada? | [`technical/adr/0006-hospedagem-somente-firebase.md`](technical/adr/0006-hospedagem-somente-firebase.md) |
| Como as páginas públicas de grupos são geradas? | [`technical/adr/0008-paginas-publicas-dos-grupos.md`](technical/adr/0008-paginas-publicas-dos-grupos.md) |
| Posso trocar isso ou preciso de decisão formal? | [`technical/adr/`](technical/adr/) (§8 do ADR 0001) |
| Como o código está organizado hoje? | [`technical/arquitetura.md`](technical/arquitetura.md) + o código |
| Por que essa gravação não virou nota? | [`technical/deteccao-de-arroto-yamnet.md`](technical/deteccao-de-arroto-yamnet.md) |
| Qual é o schema realmente aplicado? | `../supabase/migrations/` + ambiente aplicado |
| Como nomear um objeto novo do banco? | [`schema/nomenclatura.md`](schema/nomenclatura.md) |

---

## Precedência

1. **Comportamento real** — código, migrações e o que roda no navegador vencem documento de intenção.
2. **`escopo/ESCOPO_ATUAL.md`** — decide o que pertence ao produto agora.
3. **`jogo/JORNADA.md` e `jogo/ARENA.md`** — decidem as 6 fases da experiência e quais estados a Arena tem. Nenhum protótipo, design system ou handoff cria, renomeia ou remove estado.
4. **Protótipos em `design/prototipo/` e `design/design-system/system/DESIGN.md`** — decidem como cada estado e tela se parecem, se movem e medem.
5. **`technical/adr/`** — decide como o produto é construído por dentro. Um ADR aceito só cai com outro ADR.
6. **`../AGENTS.md`** — decide como o trabalho acontece.
7. **Demais documentos** — contexto e histórico.

---

## Estrutura de Documentos

```text
docs/
├── README.md                          ← você está aqui
├── jogo/        VISAO · LOOP · JORNADA · ARENA · REGRAS · VOZ · HISTORIA · AUÊ!-2
├── design/      README · AUÊ! (Art Bible) · prototipo/ · design-system/ · fontes/
├── escopo/      ESCOPO_ATUAL · BACKLOG
├── technical/   adr/ · arquitetura · ambientes · deploy · yamnet · moderação
├── schema/      nomenclatura · banco_de_dados
├── pesquisa/    análise competitiva de mercado
└── _arquivo/    histórico, versões anteriores, protótipos e pacotes legados
```

---

## Regra de Ouro

A documentação pode falar palavrão, zoar e parecer conversa de boteco entre parceiros.

Ela só não pode mentir: risco, erro, privacidade e comportamento real vêm sempre em primeiro lugar.
