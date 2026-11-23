# Gate Arquitetural (Camillo): mural chapado, arroto no centro

**Data:** 2026-11-23
**Lado:** plataforma, performance e arquitetura. Dados, RPC, contagens e migração são do Lucas e não estão decididos aqui.
**Insumos:** [ADR 0013](../../technical/adr/0013-mural-o-arroto-e-o-centro.md) (proposto), [Cartão de Missão](2026-11-23-mural-chapado.md), [protótipo](../../design/propostas/mural-chapado.html), ADRs 0001, 0004, 0010 e 0012.

## Parecer: APROVADO COM CONDIÇÕES

O desenho cabe na arquitetura. Nada exige revisão do §8 do ADR 0001, desde que as condições abaixo entrem no Cartão. O risco real não é o visual, é o custo de pôr um player em todo card sobre um feed que hoje já monta cada página com muita ida ao servidor.

## Condições (bloqueiam o merge se faltarem)

1. **Áudio por porta, um só elemento.** Controlador único de reprodução atrás de porta (`src/portas/reproducao.ts`, que o ADR 0001 §2 já lista e não existe) com adaptador em `src/plataforma/web/`. Um único `HTMLAudioElement` no app, zero bytes de áudio antes do toque, solta o recurso ao parar. Detalhe no item 1.
2. **Waveform só com pico pré-calculado.** Nenhum card decodifica áudio no cliente. Sem pico, o card mostra barra de progresso reta, não onda inventada. Detalhe no item 2.
3. **Feed em páginas pequenas, falha por card.** Primeira página de 12, assinatura de URL só quando o card ganha atenção, e erro de um anexo nunca derruba a página (hoje derruba). Detalhe no item 3.
4. **Tempo do player fora do estado da tela inteira.** O `timeupdate` não pode re-renderizar o feed. Detalhe no item 3.
5. **Barra inferior como variável de layout.** Uma custom property de altura, usada por todas as rotas, com safe area. Detalhe no item 4.
6. **Orçamento de bundle.** Zero dependência nova, `main` intacto, mural com no máximo +8 kB gzip no chunk `InicioOpenDesign`. Detalhe no item 5.
7. **Filtro de "tem áudio" no servidor.** Se for no cliente, a página volta vazia e a rolagem infinita para. Dependência do Lucas, ver item 3.

## 1. Ciclo de vida do áudio no feed

**Hoje.** `InicioOpenDesign.tsx` guarda um único `elementoAudio` (linha 425) e cria `new Audio(url)` direto no componente (linha 1223). Um áudio por vez já acontece de fato, porque há um só elemento. Mas é API de navegador fora de `src/plataforma/` (§4 do AGENTS.md), e a pasta `features/novo-aue` não está na lista vigiada de `src/qualidade/arquitetura.fronteira.test.ts` (linhas 45 a 55). Dívida existente; não pode crescer.

Três defeitos que viram problema com player em todo card:

- Liberar faz `audio.src = ''` (linhas 1187 e 1226). Em alguns navegadores isso dispara requisição e evento de erro. O certo é `pause()`, `removeAttribute('src')`, `load()`.
- `alternarAudio` faz `await urlOuResolver()` antes do `play()` (linhas 1216 a 1253). No Safari iOS o `play()` depois de uma ida à rede pode perder o gesto do toque. **Risco aberto, precisa de prova em aparelho** (Marcelo).
- A URL de anexo de áudio é assinada com validade de 300 s (`plataforma/web/forum.ts:1035`) no carregamento da página, para todos os itens (`InicioOpenDesign.tsx:1071-1072`). Card que o usuário alcança depois de 5 minutos toca com URL vencida.

**Proposta.**

- Porta `Reproducao` (`tocar(id, resolverEndereco)`, `parar()`, `assinar(id, aoMudar)`) e adaptador `src/plataforma/web/reprodutorDoMural.ts`, reaproveitando `tocarExclusivo`/`soltar` de `audioUnico.ts`. Estado (tocando, tempo, duração) sai por assinatura, não por `useState` da tela.
- O observador de visibilidade também vive no adaptador (hook fino `useNaTela(ref)`), com `rootMargin` de 200 px. O IntersectionObserver do scroll infinito (linha 1117) é dívida velha; não replicar no código novo.
- Regra de carga: `preload="none"` e nenhum `<audio>` por card. Ao ficar visível por cerca de 400 ms, o card só **pré-assina** a URL (uma requisição pequena, guardada por 240 s). Byte de áudio só no toque. Isso resolve a URL vencida e mantém o `play()` perto do gesto no iOS. Áudio da casa é URL pública (`forum.ts:1050`), não precisa assinar.
- Sair da tela com áudio tocando: segue tocando (como SoundCloud), e o card sai do DOM visível sem derrubar o controlador. Esconder a aba (`pagehide`/`visibilitychange`, porta `cicloDeVida` existente) pausa e libera. Desmontar a tela libera. Erro ou fim libera e mostra estado real, nunca "tocou".
- O sheet de comentários com player fixo no topo não cria outro `Audio`: lê o mesmo controlador pelo id do post.
- Teste de arquitetura: pasta nova `src/features/novo-aue/mural/` entra em `PASTAS_LIMPAS`. Teste unitário do controlador: um por vez, libera ao parar, URL vencida vira erro visível, pré-assinatura não baixa áudio.

## 2. Waveform

**Hoje.** `PlayerDoArroto.tsx` não decodifica nada. As 56 barras vêm de uma fórmula de seno (linhas 21 a 24), igual para todo arroto, só pintada conforme o tempo (linhas 40 a 43). O comentário do arquivo já assume que é desenho. O outro player, `arena/v2/PlayerDeAudio.tsx`, usa `wavesurfer.js` via `ondaDoAudio.ts`, que baixa e decodifica o arquivo inteiro. **Esse não pode ir para o mural.** Um arroto de 60 s decodificado vira cerca de 23 MB de PCM em memória por card, e 20 cards fecham a aba no celular médio.

O protótipo usa `rnd()` (linha ~304 do HTML) e o Cartão diz que a onda é "desenho da forma do som". Com todo post sendo áudio, onda igual para todos vira mentira visual repetida. Pico real custa quase nada.

**Proposta (contrato a fechar com o Lucas).**

- 56 valores de 0 a 255, um byte cada, mesma contagem do player atual. Cerca de 56 bytes por post, 76 caracteres em base64; página de 12 posts adiciona menos de 1 kB.
- Guardado no próprio registro do áudio do post e devolvido na linha do feed, para não somar nenhuma requisição.
- Quem calcula: o navegador já decodifica o arquivo na publicação (`plataforma/web/notaDoAudioPublicado.ts`), então pode mandar os picos junto. O servidor valida formato (tamanho 56, faixa 0..255) e o trabalhador do ADR 0012, que já abre o arquivo, **recalcula e sobrescreve**. Pico é cosmético, não afeta nota, mas o servidor não confia no cliente por princípio.
- Post sem pico (legado, ou aguardando trabalhador): barra de progresso reta e neutra. Nunca onda sintética.
- Render: um `<svg>` com um `<path>` de traços verticais, mais um segundo path para a parte tocada, recortado por `clip-path: inset(0 var(--resto) 0 0)`. `--resto` é atualizado direto no nó, sem render do React. Troca 56 `<i>` por 2 nós por card.

Custo: rede desprezível, CPU zero no cliente além de desenhar. Decodificação só no navegador de quem publica, uma vez.

## 3. Paginação e custo de render

**Hoje.** `paginacaoDoMural.ts` pede 30 por origem (linha 72) e intercala duas fontes no cliente. Cada página, em `InicioOpenDesign.tsx` (linhas 1030 a 1098), faz: anexos, áudios, notas, `obterTopico` um por um em lotes de 6 (linhas 1054 a 1062, ou seja 5 rodadas para 30 posts) e **assinatura de anexo item a item em série** (linhas 1066 a 1074). Depois ainda vêm contagem de reações (`useEngajamento.ts:84`) e prévia de conversas (`InicioOpenDesign.tsx:452`). Duas coisas graves:

- Falha de **uma** assinatura lança erro e esvazia o feed inteiro (linhas 1072 e 1103 a 1105). Com áudio em todo post, probabilidade de falha por página sobe. Tem de degradar por card: card sem áudio disponível mostra "áudio indisponível" e preserva post, denúncia e comentário (mesma regra do ADR 0010).
- O filtro `arrotos` (linhas 1131 a 1133) roda **depois** da paginação. Com o ADR 0013 o filtro tem de estar na consulta; no cliente, páginas voltam vazias com `temMais` verdadeiro.

**Re-render.** `tempoAtualDoAudio` é estado do componente de 3698 linhas (linha 423) e muda a cada `timeupdate` (cerca de 4 vezes por segundo). Os cards são `memo`, mas recebem `aoTocarAudio={(fonte) => ...}` e `{...propsDeEngajamento(post)}` novos a cada render (linhas 2556 a 2562), então todos re-renderizam. Hoje é aceitável, porque só 1 em N tem player. Com player em todos, é o gargalo. Solução na condição 4: tempo e progresso vão para o controlador, lidos só pelo player do card tocando.

**Proposta.**

- Página de 12 (primeira) e 12 (seguintes). Acima da dobra no celular cabem uns 3 posts; 30 de uma vez só atrasa o primeiro pixel.
- Sem virtualização agora. Altura variável, sheet, busca na página, restauração de scroll e leitor de tela ficam piores, e 12 por página aguenta bem uns 100 itens. Em troca: `content-visibility: auto` com `contain-intrinsic-size` em cada post. Reavaliar com número real; gatilho: mais de 150 posts no DOM ou queda de quadros medida.
- Uma ida ao servidor por página, com linha completa (autor, legenda, nota, picos, duração, contagens por reação, último comentário). O desenho disso é do Lucas. O que exijo da porta: sem `obterTopico` por item e sem assinatura por item no carregamento.
- Anúncio: o slot patrocinado a cada 3 posts (linha 2581) é iframe externo. Com player pesado, vale conferir CLS e peso; fora do escopo desta missão, só registro.

## 4. Barra inferior, safe area e trava lateral

**Hoje.** Não existe barra inferior. `BarraLateral.tsx` diz no comentário que no mobile some, e `casca.css:2069-2078` esconde a `.sidebar` abaixo de 700 px. O `viewport-fit=cover` já está certo (`index.html:27`). Safe area já é tratada em vários lugares, mas com números soltos.

**Riscos.**

- **Espaço no rodapé fixado em número.** O fim da página reserva `calc(40px + safe)` (`casca.css:2080`, `appShell.css:518`), 88 px em `InicioOpenDesign.css:444`, 104 px em `TelaExplorarOpenDesign.css:32`, 80 px em `diretorioArena.css:18`. Barra de 56 px + safe cobre o último post nas rotas que não forem atualizadas. Solução: `--altura-barra-inferior` no shell, usada por todas.
- **Camadas.** Modal compositor e gravador usam z-index 50 (`casca.css:1668-1672`); o `topbar` fica em 30. Barra em 8 a 20, abaixo dos dois. Sheet de comentários e popover cobrem a barra. `controleDeDialogo.ts` trava o corpo com `position: fixed`; a barra fixa não pode herdar isso. Ela deve ficar `inert` enquanto houver diálogo.
- **Teclado.** Em Android Chrome o teclado encolhe a viewport e empurra a barra para cima do campo do sheet. Esconder a barra enquanto o sheet de comentário estiver aberto.
- **Toast** e **popover**: o protótipo ancora o toast a `72px + safe` (linha 156) e o popover com `left: -8px` e `max-width: calc(100vw - 32px)` (linhas 113 e 156). Reação na borda direita pode estourar a largura. Medir `scrollWidth === innerWidth` com popover aberto, não só com a lista.
- **Trava lateral.** O `topbar` mobile usa margem negativa (`casca.css:2089-2093`) para sangrar. Se o `main` mudar de padding, a conta quebra e alarga o documento. Barra de reações com contagem em linha única precisa de `min-width: 0` em toda a cadeia e rolagem interna, nunca no documento.
- **Botão central de arrotar.** É só navegação para a Arena. Nenhum `getUserMedia` na barra. O gravador direto no modal segue a porta de captura existente.

Prova no aparelho (Marcelo): iOS Safari com barra de endereço recolhendo, instalado como PWA, e Chrome Android com teclado aberto.

## 5. Bundle e caminho de abrir o jogo

Medido no `dist/` local: `main` tem cerca de 60 kB gzip, `InicioOpenDesign` cerca de 46 kB gzip (chunk lazy em `App.tsx:22`), `wavesurfer` já fica em chunk próprio e só carrega na Arena. O ADR 0001 §8 item 11 limita dependência pesada (~50 kB gzip) no caminho de abrir o jogo. O mural não está nesse caminho, mas divide o mesmo orçamento de rede no celular.

Orçamento desta missão:

- Nenhuma dependência de runtime nova. `wavesurfer.js` fica fora do mural.
- `main` sem acréscimo. Barra inferior e controlador moram no chunk do mural.
- Mural: no máximo +8 kB gzip no chunk `InicioOpenDesign`. O CSS do chunk já tem 82 kB brutos; a limpeza de molduras deve reduzir, não somar.
- Fontes: Anton e Archivo já são locais (`public/fonts`, `src/index.css:10-19`). O protótipo traz `<link>` do Google Fonts (linha 3). **Não vai para produção.**
- Service worker: manter `NetworkOnly` para `/storage/v1/object/` (`vite.config.ts:120-123`). Áudio de mural não é cacheado pelo app, pelo mesmo motivo de moderação e exclusão registrado ali. Cache de áudio é o CDN do bucket público da casa, não o SW.

## 6. O que do protótipo é inviável ou caro

| Item | Problema | Alternativa |
|---|---|---|
| Onda com `rnd()` | Mentira visual repetida em todo post | Pico real; sem pico, barra reta (item 2) |
| `<link>` do Google Fonts | Requisição externa e bloqueio de render | Fontes locais já existentes |
| Player no sheet "fixo no topo" | Tentação de criar segundo `Audio` | Mesmo controlador, mesmo id |
| Contagem por reação e último comentário no card | N+1 se vier de leituras soltas | Linha única do feed (Lucas); o cliente só renderiza |
| Nota em post sem avaliação | ADR 0013 já proíbe | Player sem nota enquanto o ADR 0012 não devolver; nada de nota provisória |
| `Bater 70`, `Revanche`, `Levar pra Arena` | Barato, só rota | Parâmetros de rota para a Arena; nada de lógica de jogo no card |
| Reação otimista | Pode divergir do servidor | Manter a releitura do servidor que `useEngajamento` já faz; se houver otimismo, com reversão visível |
| Busca no áudio (arrastar na onda) | Exige range e URL válida | Fora do feed; só no sheet, e só se houver necessidade comprovada |

## Dívida anotada (não bloqueia, mas não pode piorar)

- `CardDoPost.tsx:103-121` usa `window`, `navigator.share`, `navigator.clipboard` e `window.prompt` direto. Ao mexer no card, mover para a porta de compartilhamento (existente ou com extensão aditiva).
- `InicioOpenDesign.tsx` tem 3698 linhas e concentra áudio, feed, perfil e comunidade. Extrair o controlador do mural já alivia; o resto é outra missão.

## Como o Camillo confere no fim

| Critério | Evidência |
|---|---|
| 1 elemento `<audio>` no app, 0 byte de áudio antes do toque | Teste + aba Rede no celular |
| Um por vez, libera ao parar e ao esconder a aba | Teste unitário do controlador |
| Nenhum `decodeAudioData` nem `wavesurfer` no mural | Busca no código + chunk analisado |
| Falha de assinatura de 1 card não derruba a página | Teste com porta falha |
| Primeira página de 12, sem `obterTopico` por item | Teste da paginação + contagem de requisições |
| `scrollWidth === innerWidth` a 390 com popover e sheet | Rota real |
| Orçamento de bundle respeitado | Saída do build comparada com a de hoje |
| Pasta `novo-aue/mural` na guarita de fronteira | `arquitetura.fronteira.test.ts` |
