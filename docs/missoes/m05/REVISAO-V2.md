# M05 | Protótipo V2

[Desktop](prototipo/index.html) · [Mobile a 390 px](prototipo/mobile.html) · [V1 e V2 lado a lado](prototipo/comparativo.html)

A segunda rodada responde à avaliação de Luiz. A força visual fica na Home. Por dentro, a Arena abre espaço para os desafios, o X1 põe as duas tentativas frente a frente, o Mural mostra a resenha das jogadas e o Perfil vira ficha. Pessoas, posts, convites, conexões e notas são exemplos da demonstração local.

| Superfície | V1 | V2 |
|---|---|---|
| Home PT/EN | Título sobre foto de microfone e resumo lateral | Roda de churrasco com onomatopeia e falas em PT e EN, CTA antes da imagem no mobile e explicação curta de Arena, X1 e Mural |
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
| [Cena de rivalidade](prototipo/hero-rivalidade.webp) | Nova ilustração feita com ImageGen usando as referências do Auê. Ficha, X1 e Mural usam recortes dos personagens fictícios como avatares. |
| [Churrasco](prototipo/hero-churrasco.webp) | Arte da Home aprovada para o protótipo. Balões em texto, localização PT e EN e a mesma imagem nas duas versões. |
| [PlayerDoArroto](../../../src/features/novo-aue/PlayerDoArroto.tsx), [CardDoPost](../../../src/features/novo-aue/CardDoPost.tsx), [ModalCompositor](../../../src/features/novo-aue/ModalCompositor.tsx) e [ThreadDeComentarios](../../../src/features/novo-aue/ThreadDeComentarios.tsx) | Referências para onda, cor, composição e conversa. O player local conserva o áudio HTML e oferece controles próprios. As duas amostras são as sintéticas da V1. |
| [Anton e Archivo](../../../public/fonts) e [componentes de X1](../../../src/arena/v2/duelo) | Tipos carregados dos arquivos existentes. Os contratos do X1 servem de referência, com a jornada funcionando na camada de demonstração. |

O inventário consultou o repositório e o DOM do [guia público](https://arrotaaue.com.br/como-arrotar), da [Home PT](https://arrotaaue.com.br/) e da [Home EN](https://arrotaaue.com.br/en).

<details>
<summary>Pedido usado no ImageGen</summary>

Create an original illustrated hero artwork for the Auê adult Brazilian burping competition web club. Input images are the user's own Auê repository assets and are style references: first, cap-backwards competitor says what the orange sound arcs and black/cream contour look like; second, laughing group says what the warmth, drawn faces, and camaraderie look like. Evolve this same illustrated world into a polished contemporary sports-comic cover panel. Landscape composition around 3:2, preserve all key characters in the central 80% so it reads on mobile. Two distinct fictional adult friends and competitors, one a tan man in a backwards charcoal cap and black jersey on the left, the other an adult dark-skinned woman with dark hair pulled back and black sports jacket with orange trim on the right, each seen chest-up in profile or three-quarter profile with ample space in between. The man has just let out a comic sound, with bold graphic orange concentric waves launching towards center; the woman on the other side grins with eyebrows raised and points back in teasing 'my turn' rivalry. Keep faces separated, wide shot friendly body language, no contact. Two small adult cheering friends in the back, expressed in confident high-contrast ink and halftone within a charcoal local hangout / neighborhood competition backdrop. Sports heat and a lot of humor, solid ink blacks, bone rim highlights, near-black graphite around the edges, limited burnt and saturated Auê oranges, editorial linework with bold weight, clean flat stylized shading, subtle graphic paper grain. Bright faces read immediately in a dark web page; avoid visual clutter. Image only, no typography, no lettering, no score, no panel text, no logos, no mic, no podcast, no ring ropes, no fighting, no drinks, no bottles, no childlike aesthetic, no sexual content or excessive exertion. No stock photography or 3D. Sporting friendly rivalry with a very Brazilian hangout feeling.

</details>

<details>
<summary>Pedido e edição da arte do churrasco no ImageGen</summary>

Create a new ORIGINAL landscape illustration for the hero area of Auê, a Brazilian adult burp game, matching the user's attached existing Auê artwork as a style reference only. 3:2 canvas. An instantly readable comedy comic panel of FOUR ADULT FRIENDS at a modest backyard Brazilian churrasco at dusk. Compose as follows, strictly: adult male friend in a backwards charcoal cap at LEFT, around x=20%, lets out a comically long burp, mouth open casually, in a loose black-and-orange shirt; adult male friend around x=46% dead center watches with wide eyes and raised eyebrows, a spontaneous hilarious 'holy shit' reaction; TWO adult women grouped on the RIGHT, around x=74% and 88%, make expressive joking disgust faces, one side-eye with lips curled, one recoils just slightly and shares a knowing look, palpable affectionate friendship. Make each face easy to distinguish from the others. All four heads and mouths should sit in a readable band around 42%-60% down the image, not in the top quarter. Reserve a genuinely quiet top 25% across the full width, naturally dark charcoal wall or dark shaded awning, with NO heads, people, lettering or foreground objects in that top band. The web app will put three independently localized speech bubbles in that reserved space above LEFT, CENTER and RIGHT characters. Background details only in the remaining space: smoky small brick or black backyard charcoal grill off to the right with skewers and glowing coals, simple outdoor table to connect the group, tiled roof, leafy dusk subtly, neighborhood lights. The grill and familiar details should make the location unmistakable. No bottles, no alcoholic drinks. Mid shot from waist up, funny and human, bold creamy rim contours, strong black ink, orange accents, skin tones, graphite blacks, fine print halftone, crisp graphic-novel shapes, premium contemporary Brazilian sports comics. Do not draw any speech bubbles, tails, sound waves, phonetic effects, words, logos or lettering; the three speech bubbles are separately added in the UI. No microphones, no fetish framing, no childish caricature, no aggressive strain. Single continuous composition, proper human anatomy, all four friends visibly distinct, no extra people.

Precisely edit the supplied image without changing the rest. Erase EVERY bright orange graphic sound-wave crescent, from the little flare touching the left man's mouth through the largest crescent, in the localized area between the left man and the middle man. The place where these graphic shapes were must now show the continuous natural dark charcoal wall in shadow behind them, with the same comic halftone texture. Ensure the left man's face, teeth, hair, and all four people's exact poses, the grill/table, lighting, and frame remain. Remove the little orange sprout sticking out of his mouth too, leaving his unobstructed normal drawn open mouth. The orange colors of shirts, warm lights and scenery remain. Do not add any replacement symbols, text, lines, waves, bubbles, glow or new decoration. Only remove the graphic crescents and reconstruct background.

</details>

## Cor e prova

Abra a mesma V2 em [cobre, #EC6B3A](prototipo/index.html?cor=cobre) e no [laranja atual, #FF5500](prototipo/index.html?cor=saturado). O cobre dá continuidade à paleta da primeira proposta e deixa a ilustração puxar o laranja saturado. O laranja atual reforça a assinatura que já aparece no botão de gravar e no player do Auê. A escolha aguarda o aceite de Luiz.

As 28 capturas comparam a V1 do commit 91b63b9 e a V2 em Chromium nos mesmos estados, a 1440 × 900 e 390 × 844. Renan confirmou largura sem rolagem lateral a 320, 390 e 1440 px, teclado, troca de idioma, player com seek por teclado, fluxo de convite e resposta, filtros e compositor. A publicação de áudio só habilita após o consentimento. Renan também conferiu a arte do churrasco e os três balões em PT e EN nas mesmas larguras. O comparativo mostra a Home atualizada. A prova usa navegador e dados locais. Microfone, codecs em aparelhos físicos, autenticação e serviços hospedados ainda pedem homologação antes de publicar.

Felipe conduziu a composição. Camillo inventariou a base e adaptou os players. Marcelo deu parecer favorável à apresentação e pediu rótulos explícitos nos dados de exemplo. Renan registrou **SEM ACHADOS MATERIAIS** no recorte local. A implementação aguarda aprovação visual e funcional do Product Owner.
