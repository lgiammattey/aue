# Visão do jogo — Auê

O desenho completo de produto está em [`AUÊ!-2.md`](AUÊ!-2.md). Esta visão é a
versão curta e normativa do que cabe no jogo; detalhes adicionais do GDD devem
respeitar a precedência definida em `AGENTS.md`.

## O que é o Auê 3.0

**Auê é a união do jogo casual de arroto em 1 toque com a comunidade de causos.**

> **Arrote. Receba a nota. Compartilhe o causo. Humilhe seus amigos.**

O Auê 3.0 junta três forças:
1. **O Jogo (A Arena):** abre no celular, arrota em 1 toque, ganha a nota de 0 a 100 do juiz de IA e desafia no X1 pelo WhatsApp. Sem burocracia e sem enrolação.
2. **As Comunidades (Estilo Reddit / Orkut):** espaços temáticos com a essência da lendária *"Eu arroto, e daí?"*, onde as pessoas se reúnem em torno de vergonhas e histórias reais (*"Na reunião da firma"*, *"Primeiro encontro"*, *"Arroto trovão"*).
3. **O Feed de Causos (Estilo Twitter / X):** timeline dinâmica e moderna onde o arroto ganha contexto com histórias curtas, áudios reproduzíveis direto no card e o botão "Duvido" para puxar duelo.

## O que NÃO é o Auê 3.0
- Não é rede social corporativa com algoritmo viciante ou feed infinito de enrolação.
- Não é app de dancinha ou fotos posadas: o conteúdo é o arroto, a nota e o causo bem contado.
- Não publica áudio de ninguém sem autorização explícita na hora do envio.
- Não tem assinatura, marketplace nem paywall para jogar ou rir dos causos.

## Web-first, nativo depois

O alvo é a **web no celular**. É onde um link cai no grupo do WhatsApp e alguém
joga em três segundos sem instalar nada — que é a razão de o Auê existir.

Android e iOS nativos são um destino possível **depois**, não agora. A
consequência prática hoje é só uma: não fechar a porta.

- a Arena é uma superfície de estado único, que empacota fácil;
- o motor de áudio e o de score são módulos, não código de tela;
- nada depende de API que só existe em desktop.

**Não implemente Android/iOS nativo.** Preparar não é começar.

## As quatro coisas que não se negociam

1. **O toque tem que valer.** Abrir e arrotar precisa custar um toque. Cada tela,
   campo ou confirmação a mais é uma pessoa a menos que joga.
2. **A nota tem que ser defensável.** O juiz mede áudio de verdade e recusa o que
   não é arroto. Número tirado do nada mata a graça na segunda rodada.
3. **A humilhação é o produto.** Nota sozinha é brinquedo de um minuto. O jogo
   começa quando ela vira provocação em cima de alguém.
4. **Nada finge funcionar.** Botão sem backend fica desabilitado, erro é dito na
   lata, mock fica marcado.

## Como se parece

A referência visual e comportamental é o protótipo da Arena:

**[`../design/prototipo-arena/arena.html`](../design/prototipo-arena/arena.html)**

Ele não é inspiração solta: é o contrato de como a Arena se comporta, de como a
Bolha reage e de como a nota entra na tela. Ver
[`../design/README.md`](../design/README.md).

A direção artística detalhada está em [`../design/AUÊ!.md`](../design/AUÊ!.md).

## Como fala

Direto, informal, meio ogro, sem papo corporativo. A fonte é
[`VOZ.md`](VOZ.md). Rótulo de botão é contrato e não varia; provocação e reação
variam, porque é o que faz parecer alguém falando.

A piada nunca pode esconder risco, erro, segurança ou privacidade.

## De onde veio

[`HISTORIA.md`](HISTORIA.md). Contexto humano, não requisito.
