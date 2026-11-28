# M05 | Protótipo V2

[Desktop](prototipo/index.html) · [Mobile a 390 px](prototipo/mobile.html) · [V1 e V2 lado a lado](prototipo/comparativo.html)

A segunda rodada responde à avaliação de Luiz. A força visual fica na Home. Por dentro, a Arena abre espaço para os desafios, o X1 põe as duas tentativas frente a frente, o Mural mostra a resenha das jogadas e o Perfil vira ficha. Pessoas, posts, convites, conexões e notas são exemplos da demonstração local.

| Superfície | V1 | V2 |
|---|---|---|
| Home PT/EN | Título sobre foto de microfone e resumo lateral | Ilustração de rivalidade amistosa, CTA antes da imagem no mobile e explicação curta de Arena, X1 e Mural |
| Arena | Gravador central com informações de apoio | Lobby com gravação, mesa de desafios recebidos, em andamento e encerrados, ficha e entrada para novo X1 |
| Gravação e laudo | Captura e laudo dominados por texto e nota central | Captura no lobby com estado visível. Nota, player e ações de convidar, tentar de novo e publicar dividem o laudo |
| X1 | Medições em blocos e players abaixo | Avatar, nome, duração e player de cada pessoa no próprio lado. Expiração e revogação ocultam a mídia |
| Mural | Um áudio com player nativo e um formato de batalha em estudo | Filtros Tudo, Áudios, Mídia e Seguindo. Exemplos de áudio, texto, imagem e vídeo ilustrado, com compositor e conversa encadeada |
| Perfil | Nome dominante, números e publicação isolada | Avatar em primeiro plano, nome menor, nota publicada de exemplo, publicações, histórico próprio e botão Desafiar |
| Navegação | Faixa horizontal comum às telas | Cabeçalho público na Home, lateral de clube no desktop e barra inferior no mobile |

Batalhas publicadas e destaques de recorde aparecem como **formatos em proposta**. Patente, ranking competitivo e disputas oficiais aparecem na ficha sem valor atribuído. A demo preserva o consentimento separado para publicar áudio, o X1 privado e a comparação experimental sem vencedor oficial. [M02](../M02-RELATORIO.md)

## Arte e componentes

| Origem | Uso na V2 |
|---|---|
| [Arte de comando](../../../public/ilustracoes/como-arrotar-comando-codex.png) | Referência para o contorno forte e as ondas laranja. Entra no primeiro quadro e na capa do clipe do Mural. O DOM publicado cita a arte na Home PT, na Home EN e no guia. |
| [Arte da roda](../../../public/ilustracoes/como-arrotar-postura-codex.png) | Reuso direto na publicação de imagem e no segundo quadro do clipe. É referência de camaradagem para a nova Home. O DOM publicado cita a arte na Home PT e no guia. |
| [Arte de gás](../../../public/ilustracoes/como-arrotar-gas-codex.png) e capas de comunidade | Inventariadas para reconhecer o repertório. A primeira fica como referência do guia. As capas pertencem aos espaços legados. |
| [Cena de rivalidade](prototipo/hero-rivalidade.webp) | Nova ilustração feita com ImageGen usando as referências do Auê. A Home usa a composição inteira. Ficha, X1 e Mural usam recortes dos personagens fictícios como avatares. |
| [PlayerDoArroto](../../../src/features/novo-aue/PlayerDoArroto.tsx), [CardDoPost](../../../src/features/novo-aue/CardDoPost.tsx), [ModalCompositor](../../../src/features/novo-aue/ModalCompositor.tsx) e [ThreadDeComentarios](../../../src/features/novo-aue/ThreadDeComentarios.tsx) | Referências para onda, cor, composição e conversa. O player local conserva o áudio HTML e oferece controles próprios. As duas amostras são as sintéticas da V1. |
| [Anton e Archivo](../../../public/fonts) e [componentes de X1](../../../src/arena/v2/duelo) | Tipos carregados dos arquivos existentes. Os contratos do X1 servem de referência, com a jornada funcionando na camada de demonstração. |

O inventário consultou o repositório e o DOM do [guia público](https://arrotaaue.com.br/como-arrotar), da [Home PT](https://arrotaaue.com.br/) e da [Home EN](https://arrotaaue.com.br/en).

<details>
<summary>Pedido usado no ImageGen</summary>

Create an original illustrated hero artwork for the Auê adult Brazilian burping competition web club. Input images are the user's own Auê repository assets and are style references: first, cap-backwards competitor says what the orange sound arcs and black/cream contour look like; second, laughing group says what the warmth, drawn faces, and camaraderie look like. Evolve this same illustrated world into a polished contemporary sports-comic cover panel. Landscape composition around 3:2, preserve all key characters in the central 80% so it reads on mobile. Two distinct fictional adult friends and competitors, one a tan man in a backwards charcoal cap and black jersey on the left, the other an adult dark-skinned woman with dark hair pulled back and black sports jacket with orange trim on the right, each seen chest-up in profile or three-quarter profile with ample space in between. The man has just let out a comic sound, with bold graphic orange concentric waves launching towards center; the woman on the other side grins with eyebrows raised and points back in teasing 'my turn' rivalry. Keep faces separated, wide shot friendly body language, no contact. Two small adult cheering friends in the back, expressed in confident high-contrast ink and halftone within a charcoal local hangout / neighborhood competition backdrop. Sports heat and a lot of humor, solid ink blacks, bone rim highlights, near-black graphite around the edges, limited burnt and saturated Auê oranges, editorial linework with bold weight, clean flat stylized shading, subtle graphic paper grain. Bright faces read immediately in a dark web page; avoid visual clutter. Image only, no typography, no lettering, no score, no panel text, no logos, no mic, no podcast, no ring ropes, no fighting, no drinks, no bottles, no childlike aesthetic, no sexual content or excessive exertion. No stock photography or 3D. Sporting friendly rivalry with a very Brazilian hangout feeling.

</details>

## Cor e prova

Abra a mesma V2 em [cobre, #EC6B3A](prototipo/index.html?cor=cobre) e no [laranja atual, #FF5500](prototipo/index.html?cor=saturado). O cobre dá continuidade à paleta da primeira proposta e deixa a ilustração puxar o laranja saturado. O laranja atual reforça a assinatura que já aparece no botão de gravar e no player do Auê. A escolha aguarda o aceite de Luiz.

As 28 capturas comparam a V1 do commit 91b63b9 e a V2 em Chromium nos mesmos estados, a 1440 × 900 e 390 × 844. Renan confirmou largura sem rolagem lateral a 320, 390 e 1440 px, teclado, troca de idioma, player com seek por teclado, fluxo de convite e resposta, filtros e compositor. A publicação de áudio só habilita após o consentimento. A prova usa navegador e dados locais. Microfone, codecs em aparelhos físicos, autenticação e serviços hospedados ainda pedem homologação antes de publicar.

Felipe conduziu a composição. Camillo inventariou a base e adaptou os players. Marcelo deu parecer favorável à apresentação e pediu rótulos explícitos nos dados de exemplo. Renan registrou **SEM ACHADOS MATERIAIS** no recorte local. A implementação aguarda aprovação visual e funcional do Product Owner.
