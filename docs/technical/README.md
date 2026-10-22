# Técnica — como o Auê se sustenta

Este diretório explica a implementação. Ele não amplia escopo, cria tela nem
substitui o comportamento real do código e das migrações.

## Onde cada coisa mora

- [`arquitetura.md`](arquitetura.md) descreve a estrutura implementada hoje.
- [`adr/`](adr/) guarda as decisões arquiteturais aceitas. O
  [`ADR 0001`](adr/0001-arquitetura-oficial-do-aue.md) define as quatro camadas
  e a fronteira com o navegador.
- [`audio/`](audio/) concentra detecção, calibração e moderação dos áudios.
- [`dados/`](dados/) guarda diagnósticos de persistência que não são contrato de
  runtime.
- [`operacao/`](operacao/) reúne ambiente, hospedagem e aplicação de migrações.

Para saber o que pertence ao produto agora, consulte
[`../escopo/ESCOPO_ATUAL.md`](../escopo/ESCOPO_ATUAL.md). Para localizar a tela
e a rota canônicas, use
[`../design/MAPA_DE_PAGINAS_E_FLUXOS.md`](../design/MAPA_DE_PAGINAS_E_FLUXOS.md).
