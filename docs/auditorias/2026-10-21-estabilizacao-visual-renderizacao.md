# Estabilização visual e de renderização do webapp

Data: 21 de outubro de 2026  
Escopo: casca pública, Tropa canônica, diálogos canônicos e entrada da Arena. Não é uma prova de publicação.

## Diagnóstico

| Achado | Causa raiz confirmada | Risco para quem usa | Correção |
| --- | --- | --- | --- |
| A casca da Tropa usava `100dvh` como altura estrutural | A altura dinâmica acompanhava o recolhimento das barras do navegador | Barras e colunas podiam saltar no webapp mobile | Casca estrutural em `100svh`; Arena foi preservada porque já usa uma grade própria estável |
| Cabeçalho mobile não permanecia na leitura | Não havia regra sticky nem geometria mínima | A pessoa perdia a referência ao rolar | Cabeçalho sticky com 53 px e fundo/borda próprios |
| Imagem de post entrava sem área reservada | O card só conhecia a altura depois de baixar a imagem | A leitura abaixo da imagem podia descer de lugar | Moldura 4:3 e imagem em `object-fit: cover` |
| Modais concorriam com a rolagem do documento | Bottom sheets não travavam/restauravam o documento; teclado não tinha porta de viewport | Fundo rolando, retorno a outro ponto e campo escondido | Porta `ControleDeDialogo`, implementada só em `plataforma/web`: trava aninhada, restaura o Y inicial e usa `VisualViewport` apenas para revelar o campo quando ele sair da área visível |
| A rota `/arena` montava a comunidade legada | Rota apontava para `EntradaArena`, que renderizava `TelaComunidade` | A Arena canônica podia nascer com estrutura e navegação erradas | `/arena` renderiza `Arena` diretamente |
| A geometria da página pública chegava tarde | `LayoutPublico.css` era lazy; a fonte dependia de Google Fonts | Primeiro quadro podia ser refeito quando CSS/fonte chegavam | CSS público no CSS inicial; Anton e Archivo Latin auto-hospedadas, pré-carregadas em todas as nove entradas HTML |
| Entradas públicas secundárias não declaravam a safe area | Só `index.html` tinha `viewport-fit=cover` | Páginas abertas diretamente podiam divergir da área segura do webapp | As nove entradas passaram a declarar `viewport-fit=cover`, protegido por teste |

Não houve achado de `key` mutável nas listas canônicas nem de efeito que remonte a Arena. A mudança não mexe em score, áudio, contrato remoto ou persistência.

## Modelo de rolagem decidido

- Tropa mobile: a página é a dona da rolagem; header e navegação permanecem estruturais.
- Desktop: a coluna central continua no documento; laterais preservam o comportamento sticky já existente.
- Comentários e compositor: documento bloqueado enquanto o sheet está aberto; só a lista/formulário longo do próprio sheet pode rolar.
- Arena: permanece uma superfície própria de estado; nenhuma regra estrutural de Tropa foi aplicada nela.

## Instrumentação e regressões

`e2e/estabilidade-publica.spec.ts` cria um `PerformanceObserver` antes da navegação, registra `value`, `hadRecentInput`, tempo e nós-fontes de cada layout shift. Também confere overflow horizontal e caixas persistentes de navegação após rolagem/menu/troca de rota.

`e2e/componentes-canonicos.spec.ts` usa um harness React local, sem Supabase e sem dados sociais fabricados, para montar os componentes reais em 390 e 768 px. Ele conserva trace e screenshot também quando passa e prova: retorno ao mesmo Y após abrir/fechar compositor, comentários e gravador; rascunho/foco no compositor e na resposta; caixa 4:3 do `CardDoPost`; e `/arena` em `IDLE`, sem feed legado. Os artefatos locais ficam em `test-results/` e são ignorados pelo Git.

O Playwright sobe um preview exclusivo deste worktree em `127.0.0.1:4187`; ele não reutiliza a porta 4173 de outro trabalho. Uma medição inicial de CLS `0,1602103` em 390 px foi descartada: o trace demonstrou que ela vinha desse preview alheio, com HTML antigo e Google Fonts. Não é baseline válido desta mudança.

Medição limpa no preview desta branch, depois de `document.fonts.ready` e dois quadros de animação:

| Viewport | CLS observado | Overflow horizontal |
| --- | ---: | ---: |
| 320 x 740 | 0,000000 | 0 px |
| 375 x 812 | 0,000000 | 0 px |
| 390 x 844 | 0,000000 | 0 px |
| 430 x 932 | 0,000000 | 0 px |
| 768 x 1024 | 0,000000 | 0 px |
| 1440 x 1000 | 0,000000 | 0 px |

O gate E2E aceita no máximo `0,05`; os seis cenários públicos passaram. Com quatro cenários de componentes canônicos (390 e 768 px), a suíte tem 10 de 10 cenários aprovados.

## Componentes alterados

- `src/features/novo-aue/casca.css`, `InicioOpenDesign.css` e `CardDoPost`: viewport estrutural, topo mobile e reserva de mídia.
- `ModalComentarios`, `ModalCompositor`, `ModalGravarArroto`, `InicioOpenDesign`: posse de scroll e foco/teclado pelos componentes canônicos.
- `src/portas/controleDeDialogo.ts` e `src/plataforma/web/controleDeDialogo.ts`: fronteira entre interface e APIs do navegador.
- `src/App.tsx`: rota canônica da Arena.
- Entradas HTML, `src/index.css` e `public/fonts/`: carregamento estável de fonte e CSS público inicial.

## Validação executada

- `npm run typecheck` — passou.
- `npm run lint` — passou com avisos preexistentes em protótipos, `support.js` e hooks já existentes.
- `npm test` — 192 arquivos passaram, 1 pulado; 2.133 testes passaram, 9 pulados.
- `npm run build` — passou. O gerador de páginas de grupos informou Supabase local indisponível e pulou somente essas páginas dependentes de dados.
- `npm run test:e2e` — 10 de 10 passaram: seis viewports da casca pública em preview de produção isolado e quatro cenários de componentes reais (390 e 768 px) no harness local separado.
- Navegador local Chrome: `/como-jogar` abriu em desktop e em 390 px; fonte carregada, topo de 53 px e largura do documento igual à viewport. Isso é prova de navegador local, não de dispositivo.

## Limites conhecidos

- Não houve Safari iOS físico, Chrome Android físico, teclado virtual físico nem PWA instalada nesta missão. Esses quatro itens continuam **NÃO VALIDADOS**.
- O E2E não usa dados remotos. Feed autenticado, comentário contra Supabase, upload, player externo, anúncio e fluxo real de microfone não foram usados como evidência.
- A falha do Supabase local no build não foi mascarada; as páginas de grupos dependentes desse serviço saem sem dados nesse ambiente.
- Este relatório não prova deploy, produção ou publicação.
