# ADR 0015: o jogo é o centro; comunidades e tópicos saem

**Status:** aceito pelo Luiz em 23/11/2026.

## O problema

O produto mudou de direção várias vezes e os documentos acumularam definições concorrentes: rede social com comunidades e tópicos, mural como centro, Arena como centro.

## A decisão

O Auê é um jogo de gravar, mandar o áudio e receber a nota do juiz. O mural existe em volta do jogo. A definição vigente é [`docs/jogo/AUE.md`](../../jogo/AUE.md).

## O que muda na prática

- Comunidades temáticas e tópicos saem do produto. As rotas já redirecionam para `/`. O código de `forum` e `comunidade` só é removido em missão própria, com aprovação do Luiz.
- O mural deixa de ser o centro. Se vira fórum ou não é decisão aberta; até lá ele não ganha estrutura nova.
- O ADR 0004 e o ADR 0010 ficam substituídos por este.
- O ADR 0013 (o arroto é o centro do mural) e o ADR 0014 (X1 no mural) continuam valendo só para o mural, e sempre subordinados à `AUE.md`. O 0014 segue proposto.

## Alternativas descartadas

- Manter a rede social com comunidades e tópicos como produto principal: fora do que o Luiz quer testar agora.
- Tratar mural e jogo como iguais: foi a fonte da confusão.

## O que custa

Código de comunidades e tópicos fica morto até a remoção. Os ADRs 0004 e 0010 perdem a validade.
