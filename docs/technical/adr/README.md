# ADRs do Auê

Decisão de arquitetura que **não se muda dentro de uma PR**.

Um ADR existe quando a escolha é cara de desfazer: stack, backend, fronteira
entre camadas, forma de empacotar o jogo, onde a regra oficial mora. Coisa que,
se cada um resolver do seu jeito, vira migração e retrabalho seis meses depois.

O que **não** é ADR: como um componente foi escrito, qual biblioteca de teste,
nome de pasta dentro de uma camada, refactor. Isso é PR.

---

## Os ADRs

| # | Decisão | Status |
|---|---|---|
| [0001](0001-arquitetura-oficial-do-aue.md) | A arquitetura oficial do Auê — stack, quatro camadas, web-first | aceito |
| [0002](0002-o-aue-nas-lojas.md) | O Auê nas lojas — Capacitor (substituído pela decisão de produto 100% web/webapp) | substituído por AGENTS.md |
| [0003](0003-a-previa-do-link.md) | A prévia do link — o link vira `/x/<código>` e a prévia é montada na borda | aceito |
| [0004](0004-arquitetura-aue-3-comunidades-e-feed.md) | Auê 3.0: Arquitetura de Comunidades, Feed de Causos e Jogo | substituído pelo 0015 |
| [0005](0005-conta-opcional-e-perfil-publico.md) | Conta opcional (promove a sessão anônima), perfil público e comentário em níveis | aceito |
| [0006](0006-hospedagem-somente-firebase.md) | Hospedagem somente Firebase | aceito |
| [0007](0007-audio-publico-da-casa.md) | Áudio público da casa — bucket público separado só com conteúdo da casa | aceito |
| [0008](0008-paginas-publicas-dos-grupos.md) | Páginas públicas dos grupos externos no build | aceito |
| [0009](0009-identidade-social-promovida.md) | Identidade social promovida | aceito |
| [0010](0010-comunidades-topicos-e-respostas.md) | Comunidades, tópicos e respostas (sem feed solto) | substituído pelo 0015 |
| [0011](0011-audio-privado-duelo-na-borda.md) | Entrega de áudio privado do duelo | aceito, ativação condicionada às verificações do próprio ADR |
| [0012](0012-nota-de-audio-publicado-em-servidor.md) | Nota de áudio publicado em serviço confiável | aceito |
| [0013](0013-mural-o-arroto-e-o-centro.md) | Mural: o arroto é o centro, texto e resultado de X1 também postam | aceito |
| [0014](0014-x1-no-mural-com-audio-consentido.md) | Resultado de X1 no Mural, com áudio só de quem consentir | proposto |
| [0015](0015-o-jogo-e-o-centro.md) | O jogo é o centro; comunidades e tópicos saem | aceito |

---

## Como escrever um

Numere na sequência, use o mesmo esqueleto do 0001 e não passe de uma leitura de
café:

1. **O problema** — o que dói hoje.
2. **A decisão** — em uma frase, antes de qualquer justificativa.
3. **O que muda na prática** — as regras que o código passa a obedecer.
4. **Alternativas descartadas** — cada uma com o motivo. Sem isso, o próximo
   agente propõe a mesma coisa de novo.
5. **O que custa** — decisão sem preço escrito é propaganda.

## Status

- **proposto** — escrito e esperando a decisão formal; não vale ainda;
- **aceito** — vale agora;
- **substituído por NNNN** — perdeu para um ADR mais novo;
- **descartado** — foi proposto e não passou.

ADR aceito **não se edita para virar outra decisão**. Escreve um novo e marca o
antigo como substituído. O histórico é o que impede a gente de rodar em círculo.

## Leitura no dia a dia

O [registro de arquitetura](../arquitetura.md) descreve código e limites de
prova no SHA revisado; ele não altera ADR. Para produto, valem `docs/jogo/AUE.md`
e `docs/escopo/ESCOPO_ATUAL.md`. A M01 registrou esse arranjo documental sem
trocar stack, backend, hospedagem ou qualquer contrato do sistema.

## Quando um ADR é obrigatório

A lista está no §8 do [0001](0001-arquitetura-oficial-do-aue.md). Se a mudança
está lá, ela não entra em PR sem ADR aceito antes — por mais pronta que esteja
a implementação.
