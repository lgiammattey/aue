# Fórum de comunidades — especificação de UX/UI

**Autor:** Rian (UX/UI e guardião do protótipo)
**Para:** Kayky (implementação em React 19)
**Data:** 19/10/2026
**Branch de trabalho:** `feat/forum-frontend`
**Decisão de produto:** Luiz, 19/10/2026 ([#251](https://github.com/lgiammattey/aue/issues/251)). Desenho: [#253](https://github.com/lgiammattey/aue/issues/253). Telas: #256, #257, #258, #259. Transversais: #229, #247.
**Contrato de dados:** [ADR 0010](../technical/adr/0010-comunidades-topicos-e-respostas.md) + migrações `20261019000014` e `20261019000016`.

---

## 0. Como ler e o que este documento NÃO é

1. **Regra mãe: o que o banco não entrega não existe na tela.** A seção 2 lista o que cada RPC devolve. Se um campo não está lá, nenhuma tela o desenha. O que faltaria vai para a seção 18 (pedidos futuros) e não para o código.
2. **Este documento é texto. Não substitui o protótipo.** A trava de ouro vale: não existe fidelidade visual sem ver a tela aberta. Os protótipos em `docs/design/prototipo/` (`Comunidades.dc.html`, `Bonde do Arroto.dc.html`, `Jornada.dc.html`, `Versões Webapp.dc.html`, `Landing.dc.html`) **ainda descrevem o modelo antigo** (feed, curtidas, "Postar", contadores inventados). A issue #253 exige protótipo navegável validado antes de codar. Esta especificação é o insumo desse protótipo e o que o Kayky usa para começar a estrutura. **A validação 1:1 só acontece quando o protótipo novo estiver aberto ao lado da tela implementada.** A seção 17 lista o que muda nos protótipos.
3. Textos entre aspas são **exatos**. Kayky não reescreve copy. Se um texto não cabe, volta para mim.
4. Medidas em px para facilitar a leitura; no código, texto em `rem` (base 16px) para respeitar o tamanho de fonte que a pessoa escolheu no navegador. Alvos de toque e linhas finas ficam em px.
5. Nomes de componentes em PT-BR são sugestões. Os nomes de arquivo existentes na seção 16 são fatos.

---

## 1. Direção (do Luiz) em oito linhas

1. Visual **leve, limpo e adulto**. Fundo claro por padrão, tema escuro opcional.
2. **Menos cartões, bordas e decoração.** A separação é por linha fina de 1px e por espaço.
3. **Comunidade é a porta de entrada. Tópico (a conversa) é o centro.** O texto do tópico pesa mais que placa, contador ou ícone.
4. **Não existe post avulso.** Nenhuma tela cria conteúdo sem comunidade e tópico.
5. **Arena conserva identidade forte.** O fórum não herda o peso visual dela e ela não herda a leveza do fórum.
6. **Mobile primeiro**, atenção ao Safari do iPhone, alvos de toque >= 44px, safe-area.
7. **Archivo** para lista e texto. **Anton** só na marca `AUÊ!` e no Auê Score. **Verde `#c6ff00`** só em CTA e Arena, no máximo 2 por estado.
8. **Sem emoji como ícone. Sem contador inventado.** Número na tela é número que o servidor mandou.

---

## 2. Contrato de dados que a UI consome

A UI conversa com a porta (`listarComunidades`, `listarTopicos`, `obterTopico`, `listarRespostas`, `criarTopico`, `responderTopico` etc.). O adaptador em `src/plataforma/web/` chama as RPCs abaixo. Nenhuma tela fala com o Supabase.

### 2.1 Leituras (anon e authenticated)

| RPC | Entrada | O que devolve | Usada em |
|---|---|---|---|
| `listar_comunidades_do_forum()` | nada | por comunidade: `id, slug, nome, descricao, icone, membros_total, topicos_total, ultima_atividade_em (nulo se não há tópico), sou_membro` | Tela 1 |
| `obter_comunidade_do_forum(slug)` | slug | mesma linha. **Nenhuma linha** se o slug não existe | Tela 2 (cabeçalho) |
| `listar_topicos(slug, limite, cursor_valor, cursor_id, ordem, cursor_fixado)` | ordem `atividade` (padrão) ou `recentes` | por tópico: `id, comunidade_id, comunidade_slug, comunidade_nome, autor_id, apelido, handle, url_do_avatar, titulo, corpo, status, fixado, criado_em, editado_em, ultima_atividade_em, respostas_total, resultado_id, nota, duracao, subtipo_de_origem, caminho_do_audio, caminho_do_audio_da_casa, sou_autor`. Erro `comunidade_inexistente` se o slug não existe | Tela 2 |
| `obter_topico(id)` | id | mesma linha. **Nenhuma linha** se ausente, oculto, removido ou de autor sem conta promovida | Tela 3 |
| `listar_respostas_do_topico(id, limite, cursor_criado_em, cursor_id)` | ordem cronológica, padrão 50, máximo 200 | por resposta: `id, topico_id, pai_id, nivel (0 a 2), autor_id, apelido, handle, url_do_avatar, corpo, status, criado_em, editado_em, sou_autor`. Resposta apagada ou oculta que ainda tem filha visível volta como **casca**: `autor_*` e `corpo` nulos, `status` `oculto` ou `removido` | Tela 3 |
| `explorar_topicos(limite, cursor_valor, cursor_id, ordem)` | ordem `atividade` ou `recentes` | por tópico: `id, comunidade_id, comunidade_slug, comunidade_nome, autor_id, apelido, handle, url_do_avatar, titulo, status, fixado, criado_em, ultima_atividade_em, respostas_total`. **Sem corpo, sem áudio, sem nota** | Tela 5 |
| `listar_topicos_do_autor(handle, limite, cursor_criado_em, cursor_id)` | | `id, comunidade_id, comunidade_slug, comunidade_nome, titulo, corpo, status, fixado, criado_em, editado_em, ultima_atividade_em, respostas_total` | Tela 6, aba Tópicos |
| `listar_respostas_do_autor(handle, limite, cursor_criado_em, cursor_id)` | | `id, topico_id, topico_titulo, comunidade_id, comunidade_slug, comunidade_nome, pai_id, nivel, corpo, criado_em, editado_em` | Tela 6, aba Respostas |

Handle inexistente, conta sem promoção e conta promovida sem conteúdo devolvem **a mesma coisa** (zero linhas, sem erro). A UI **não pode** dizer "perfil não encontrado" a partir dessas duas listas. Quem decide isso é o cabeçalho do perfil (`obter_perfil_publico`).

### 2.2 Escritas (só authenticated, conta promovida)

| RPC | Limites | Observação |
|---|---|---|
| `criar_topico(slug, titulo, corpo, resultado_id?, consentimento_audio_publico)` | título 1 a 120, texto 1 a 1000 | exige participação. Com `resultado_id` sem consentimento dá `audio_sem_consentimento` |
| `responder_topico(topico_id, corpo, pai_id?)` | resposta 1 a 500 | profundidade máxima 2. Responder uma resposta de nível 2 cria outra de nível 2 com `pai_id` dela. **Não aceita áudio nem resultado** |
| `editar_topico`, `editar_resposta` | mesmos limites | só autor, só tópico aberto |
| `apagar_topico`, `apagar_resposta` | | só autor. Apagar é lógico |
| `denunciar_topico`, `denunciar_resposta` | motivo até 500 | 3 pessoas diferentes escondem |
| `entrar_na_comunidade(slug)`, `sair_da_comunidade(slug)`, `listar_minhas_comunidades()` | | `listar_minhas_comunidades` já entra a pessoa no `bonde-geral` |

Contagem de caracteres **como o Postgres**: por code point, nunca `string.length` nem `maxLength` do HTML. Usar `contarCaracteres`, `caracteresRestantes` e `cabeNoLimite` de `src/nucleo/comunidade/limites.ts` (hoje só tem `LIMITE_CAUSO` e `LIMITE_COMENTARIO`; acrescentar `LIMITE_TITULO_TOPICO = 120`, `LIMITE_TEXTO_TOPICO = 1000`, `LIMITE_RESPOSTA = 500`).

Cursor: devolver ao servidor **a string que ele mandou**, sem passar por `Date` (microssegundo). Em `listar_topicos` o cursor é `(valor, id, fixado)` da última linha, e o valor é `ultima_atividade_em` na ordem `atividade` e `criado_em` na ordem `recentes`.

### 2.3 O que NÃO existe (e por isso não é desenhado)

| Não existe | Consequência na tela |
|---|---|
| Curtida, reação, coração, contagem de curtidas | nada disso aparece |
| Visualizações, "em alta", ranking, "posts hoje", "membros ativos" | nada disso aparece |
| `regras` da comunidade, moderadores, data de criação, categoria | sem aba Ranking, sem "Moderação @fulano", sem "criada em", sem chips de categoria |
| Lista de membros (nomes e avatares) | "membros reais" = **contagem** `membros_total` |
| Áudio nas listas | listas mostram só texto. Player só na tela do tópico |
| Trecho do corpo no Explorar | linha do Explorar é título + comunidade + autor + respostas + atividade |
| Busca (global ou por comunidade) | sem campo de busca nesta versão |
| Resposta com áudio ou resultado | sem "Arrotar para responder" no tópico nesta versão |
| Idempotência de envio | ver seção 6.7 (falha ambígua) |
| Fechar, fixar, ocultar por moderador | os estados existem e estão desenhados, mas nada na UI os produz (moderação é a #260) |
| Distinção entre tópico removido, oculto e inexistente | tela única "Esse tópico não está disponível" |
| Link direto para uma resposta | links do perfil abrem o tópico, não a resposta |

### 2.4 Armadilhas de contrato para quem implementa

1. **`sou_membro` do `bonde-geral`.** A leitura é só leitura e não entra ninguém. A escrita entra sozinha. Chamar `listar_minhas_comunidades()` **antes** de ler a comunidade para conta promovida, ou tratar `bonde-geral` como "membro" na UI. Sem isso a pessoa vê "Participar" numa comunidade onde já consegue escrever.
2. **`listar_topicos` devolve `corpo` e caminhos de áudio** que a lista não usa. Não renderizar, não guardar em estado de lista. (Pedido de versão leve na seção 18.)
3. **Na ordem `recentes`, fixado não sobe.** Só na ordem `atividade`. O marcador "Fixado" aparece nas duas.
4. **`corpo` de tópico pode ter até 2000 caracteres** (acervo migrado). Mostrar inteiro, sem cortar.
5. **`membros_total` só conta conta promovida; `topicos_total` e `respostas_total` só contam o visível.** São os números a mostrar. Nenhuma tela soma, estima ou arredonda.
6. **Erro tem `HINT`.** A UI traduz pelo `HINT` (tabela 6.6). Exceção: "Ação social exige conta promovida" (`42501`) **não tem HINT** hoje.

---

## 3. Sistema visual do fórum

### 3.1 Princípios de superfície

- Fundo chapado `--bg`. Sem gradiente, sem sombra decorativa, sem blur.
- **Linha de 1px `--border`** entre itens de lista, de ponta a ponta da coluna. É o separador principal.
- **Sem borda nas laterais da coluna central** (o protótipo antigo tinha). Lateral e aside se distinguem por espaço.
- **`--surface` só onde há função:** avatar/monograma, faixa de aviso (offline, tópico fechado), pílula do player, campos. Nunca para "caixinha de conteúdo".
- Hover de linha: `--fg-soft`. Pressionado: `--fg-soft` um degrau mais forte, sem `transform: scale` nas linhas (escala só em botão).
- Sombra: só no dialog (`0 8px 32px rgba(0,0,0,.2)` no claro, `.5` no escuro) e no toast.

### 3.2 Tema

- **Padrão: claro.** Quem nunca escolheu ganha tema claro, mesmo que o sistema esteja escuro. A escolha da pessoa (`localStorage` `bda-theme`, via `useTema`) manda. Hoje `useTema` cai em `dark` quando não há valor guardado: **inverter o padrão**.
- Os dois temas usam os **tokens por nome** (`--bg`, `--surface`, `--surface-2`, `--fg`, `--muted`, `--border`, `--border-strong`, `--accent`, `--accent-strong`, `--accent-on`, `--danger`, `--fg-soft`). Nenhum hex solto em componente.
- **Atenção, divergência existente:** `src/index.css` hoje define dark `#000000` e light `#ffffff`, e `--border-strong` só existe em `Comunidade.css`. `DESIGN.md` v5 define dark `#0a0a08` e light `#f5f3ea`. As telas do fórum leem token; o alinhamento de valores é uma tarefa de base (seção 17) e a escolha da paleta clara é do Luiz (seção 20, item 1). **Padrão provisório: valores do DESIGN.md v5**, porque é a única fonte escrita.

| Token | Claro (DS v5) | Escuro (DS v5) | Uso no fórum |
|---|---|---|---|
| `--bg` | `#f5f3ea` | `#0a0a08` | fundo de tudo |
| `--surface` | `#ebe9de` | `#171712` | monograma, faixa de aviso, pílula do player |
| `--surface-2` | `#dedcd0` | `#1f1f18` | avatar sem foto |
| `--fg` | `#0a0a08` | `#f5f3ea` | título, texto, botão secundário cheio |
| `--muted` | `#57554a` | `#93917f` | metadados, descrição, contador |
| `--border` | `#d6d4c6` | `#2b2a22` | linha de lista |
| `--border-strong` | `#85836f` | `#74725f` | contorno de campo e botão contorno |
| `--accent` / `--accent-on` | `#c6ff00` / `#0a0a08` | igual | só botão CTA e selo de nota |
| `--danger` | `#c4161a` | `#ff3d3f` | só erro técnico e contador estourado |

Contraste conferido (texto normal exige 4,5:1): `--muted` sobre `--bg` dá cerca de 6,9:1 no claro e 6,4:1 no escuro; `--danger` sobre `--bg` fica acima de 5:1 nos dois; `--accent-on` sobre `--accent` passa de 15:1. **Verde nunca é cor de texto nem de borda** (no claro ele some no fundo).

Botão `--accent` no tema claro leva **borda interna de 1px `--fg` a 30%** (`box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fg) 30%, transparent)`) para o contorno existir sobre o creme. No escuro, sem borda.

### 3.3 Tipografia

| Papel | Fonte | Tamanho / peso / entrelinha |
|---|---|---|
| Marca `AUÊ!` (lateral, topo) | Anton | 26px, `letter-spacing: .02em`, sempre `--fg`, **nunca verde** |
| Título da barra do topo | Archivo | 20px / 700 / 1.2, 1 linha com reticências |
| H1 de comunidade e de tópico | Archivo | 22px (até 359px), 24px (360 a 699px), 28px (700px ou mais) / 800 / 1.15, `letter-spacing: -.01em` |
| H2 de seção ("Suas comunidades", "Respostas") | Archivo | 20px / 700 / 1.3 |
| Título de linha de lista | Archivo | 16px (até 374px), 17px (375px ou mais) / 600 / 1.3, máximo 2 linhas |
| Corpo do tópico | Archivo | 16px / 400 / 1.6 |
| Corpo de resposta | Archivo | 15px / 400 / 1.5 |
| Metadado | Archivo | 13px / 400 / 1.4, `--muted` |
| Botão | Archivo | 15px / 700 |
| Campo de texto (input, textarea, select) | Archivo | **16px** (menos que isso o Safari do iPhone dá zoom ao focar) |
| Selo de nota | Anton | 24px, fundo `--accent`, texto `--accent-on`, raio 12, padding 6 10 |
| Duração do áudio | `--font-mono` | 12px |

Não usar caixa-alta com tracking (o "Caption" do DS) no fórum. Tempo ("há 3 h") é frase, fica em Archivo. Mono só na duração do áudio.

### 3.4 Espaço, raio, alvo

- Grade de 8: `--space-1..8` do DS.
- Gutter lateral: **16px** até 699px, **24px** de 700px em diante.
- Linha de lista: `padding: 14px 16px` (24px de gutter em 700+), altura mínima 72px.
- Entre bloco de cabeçalho e lista: 24px. Entre respostas: 12px de padding vertical por item.
- Raios: botão pílula `999px`; campo e textarea `12px` (como no protótipo de criar comunidade); monograma `12px`; dialog desktop `24px`; tela cheia no celular `0`.
- **Alvo mínimo 44 x 44 CSS px em tudo que é tocável**, incluindo botão de texto ("Responder", "Sair da comunidade"): visual pode ser menor, a área de toque não. Entre dois alvos vizinhos, pelo menos 8px. Hoje há botões de 36px (voltar do `DetalheComunidade`) e campo de 40px (`ArvoreDeComentarios`): sobem para 44.

### 3.5 Identidade visual dos itens

- **Comunidade:** monograma de 2 letras em Archivo 800 sobre `--surface`, quadrado de raio 12. Tamanho: 44px na lista, 48px (até 359px), 56px (360 a 699px), 64px (700px ou mais) no cabeçalho. Letras: inicial das duas primeiras palavras, ignorando `a, o, e, da, de, do, na, no, em, um, uma` e sinais (`Refri & Cia` vira `RC`, `Na reunião da firma` vira `RF`, `Eu arroto, e daí?` vira `EA`). Uma palavra só: as duas primeiras letras. **O campo `icone` do banco é emoji e não é renderizado.**
- **Pessoa:** foto `url_do_avatar` em círculo (32px na conversa, 24px em meta de linha se houver) ou, sem foto, as duas primeiras letras do apelido em `--surface-2`. `alt=""` (o nome vem ao lado).
- Ícones: SVG de traço (`stroke="currentColor"`, 24px, traço 1.8, 2.4 no ativo), `aria-hidden`. Caminhos já usados em `BarraInferiorMobile`: Comunidades (pessoas), Arena (microfone), Perfil (pessoa). **Explorar** é novo: bússola (`M12 22a10 10 0 100-20 10 10 0 000 20zM16 8l-2 6-6 2 2-6z`). Não usar lupa, porque busca não existe. Mais: voltar (`M19 12H5M12 19l-7-7 7-7`), mais opções (três pontos), fixado (alfinete), fechado (cadeado), tocar/pausar.

### 3.6 Orçamento do verde, por estado de tela

| Tela / estado | Verde (máximo 2) |
|---|---|
| Diretório, visitante | "Criar conta" (1) |
| Diretório, conta | nenhum |
| Comunidade, visitante | "Criar conta para participar" (1) |
| Comunidade, conta não-membro | "Participar" (1) |
| Comunidade, membro | "Novo tópico" (1) |
| Tópico, com áudio com nota e composer visível | selo de nota (1) + "Enviar" (1) |
| Tópico, não-membro | selo de nota (se houver) + "Participar" |
| Tópico, visitante | selo de nota (se houver) + "Criar conta" |
| Criar tópico, com arroto da Arena | "Criar tópico" (1) + selo de nota (1) |
| Explorar, Perfil (abas), navegação, dialogs de confirmação | nenhum |

A **navegação não usa verde** (nem o item Arena). Verde na identidade da Arena vive dentro da Arena.

### 3.7 Movimento

Só os tokens `--duration-fast` (160ms) e `--duration-base` (240ms), `--easing-standard`. Hover e foco: cor e fundo. Dialog: fade de 160ms. Toast: sobe 8px em 200ms. **Nada de `--easing-emphasize` (quique), pulso ou animação de entrada de lista** (isso é da Arena). Esqueleto de carregamento: parado, sem brilho animado. `prefers-reduced-motion: reduce` zera tudo.

---

## 4. Layout e navegação (item 7 da lista do Luiz)

### 4.1 Quatro faixas

| Faixa | Largura | Estrutura |
|---|---|---|
| Celular | menor que 700px | uma coluna, barra do topo, **barra inferior** |
| Tablet | 700 a 999px | **lateral de 76px** (só ícone) + coluna central (máximo 680px, centralizada no espaço restante) |
| Desktop compacto | 1000 a 1199px | lateral 76px + coluna central (máximo 640px) + aside 320px |
| Desktop | 1200px ou mais | **lateral 275px** + coluna central 640px + aside 320px. Contêiner máximo de 1280px, centralizado |

Ajuste ao DS: `DESIGN.md` §6 manda a lateral larga a partir de 1060px, o que deixa a coluna de leitura em 465px. Aqui a lateral larga começa em 1200px para a coluna central nunca ficar abaixo de 560px. Os breakpoints 700 e 1000 já existem em `useLayoutDaConversa` (`LARGURA_CELULAR`, `LARGURA_COLUNA_DIREITA`); acrescentar o de 1200. Layout por **media query de CSS**, não por JS, para não haver troca de layout depois da primeira pintura.

A coluna central fica **no mesmo lugar em todas as telas**. O aside só tem conteúdo em `/c/:slug` e `/c/:slug/t/:id`; nas outras telas a coluna do aside fica vazia (a coluna central não se mexe ao navegar).

### 4.2 Navegação principal (fonte única, quatro itens, nesta ordem)

| Item | Rota | Ativo em |
|---|---|---|
| Comunidades | `/comunidades` (e `/` no corte) | `/comunidades`, `/c/*` |
| Explorar | `/explorar` | `/explorar` |
| Arena | `/arena` | `/arena` |
| Perfil | `/perfil` | `/perfil`, e `/u/:handle` **só se for o próprio** |

**Nunca** aparecem "Feed", "Início", "Desafios" nem "Postar". Não há botão flutuante `+` e não há botão "Postar/Arrotar" na lateral. Os X1 e o histórico de desafios continuam em `/desafios`, alcançáveis pela Arena e pelo Perfil (confirmar com Luiz, item 6 da seção 20).

Cada item: `<a>` real (não `<button>` com `navigate`), com `aria-current="page"` no ativo. Ativo: ícone com traço 2.4, rótulo 700 e `--fg`. Inativo: traço 1.8, rótulo 500 e `--muted`.

### 4.3 Barra inferior (celular)

- Posição fixa no rodapé, fundo `--bg` opaco, `border-top: 1px solid var(--border)`.
- Altura `56px + env(safe-area-inset-bottom)`; o excedente é `padding-bottom`. Quatro colunas iguais (80px cada em 320px), cada uma com área de toque de 56px de altura.
- **Ícone de 24px com rótulo embaixo** (11px / 600, uma linha). Hoje a barra é só ícone com `aria-label`; passa a ter rótulo visível (clareza e leitor de tela).
- O conteúdo da página ganha `padding-bottom: calc(56px + env(safe-area-inset-bottom) + 16px)`.
- **Esconde enquanto um campo de texto tem foco** (`focusin`/`focusout` tratados na camada `src/plataforma/`). No Safari do iPhone o teclado cobre a barra e uma barra fixa fica flutuando acima dele.
- Nas telas de tela cheia (criar tópico no celular), a barra não existe.

### 4.4 Lateral (tablet e desktop)

- `sticky`, `top: 0`, `height: 100svh` (`svh`, não `dvh` nem `vh`, pelo motivo documentado em `src/index.css`, #69). Largura 76px (só ícone, `aria-label` e `title`) ou 275px (ícone + rótulo, 20px).
- Topo: marca `AUÊ!` (Anton 26px) **como `<a href="/">`** (hoje é `div` clicável sem teclado, #247). Em 76px: `A!`.
- Itens com altura 52px, pílula de raio 999 no hover (`--fg-soft`).
- Rodapé: botão de tema (alvo 44px, rótulo "Tema escuro"/"Tema claro", como no protótipo) e, abaixo, bloco da pessoa: **visitante** vê botão `--fg` cheio "Entrar" (sem verde); **conta** vê foto/monograma + apelido + `@handle`, tudo um link para `/perfil`. Sair de conta mora no Perfil.
- "Pular para o conteúdo": primeiro elemento focável da página, visível só com foco, leva ao `<main>`.

### 4.5 Barra do topo (todas as faixas)

- `position: sticky; top: 0`, fundo `--bg`, `border-bottom: 1px solid var(--border)`, altura `53px + env(safe-area-inset-top)` (`padding-top` com o inset).
- Três encaixes: esquerda 44x44 (voltar, ou vazio), centro (título 20px/700), direita 44x44 (ações).
- Telas raiz (Comunidades, Explorar): título da tela. Direita: no celular, tema e, para visitante, "Entrar" (texto, 44px de altura) ao lado. Em tablet e desktop o tema está na lateral e a direita fica vazia.
- Telas aninhadas (`/c/:slug`, `/c/:slug/t/:id`): esquerda "voltar" como **link real**: de comunidade para `/comunidades`; de tópico para `/c/:slug`. Centro: nome da comunidade, com `aria-hidden="true"` (o H1 está no conteúdo). Direita: menu de ações na tela do tópico.
- Voltar do navegador e gesto de voltar do Safari devem restaurar a rolagem e a lista já carregada (estado de lista guardado em memória por rota).

### 4.6 Medidas por largura

| Item | 320 | 375 | 430 | 768 (tablet) | 1280 (desktop) |
|---|---|---|---|---|---|
| Navegação | barra inferior | barra inferior | barra inferior | lateral 76 | lateral 275 |
| Aside | nenhum | nenhum | nenhum | nenhum | 320 (só comunidade e tópico) |
| Gutter | 16 | 16 | 16 | 24 | 24 |
| Largura útil do conteúdo | 288 | 343 | 398 | cerca de 632 | 592 |
| H1 | 22 | 24 | 24 | 28 | 28 |
| Título de linha | 16 | 17 | 17 | 17 | 17 |
| Monograma do cabeçalho | 48 | 56 | 56 | 64 | 64 |
| Recuo por nível de resposta | 12 | 16 | 16 | 24 | 24 |

Regras duras: **zero rolagem horizontal de 320px a 1280px**, também com zoom de 200%. Todo filho flex tem `min-width: 0`. Todo texto de usuário tem `overflow-wrap: anywhere`.

### 4.7 Safari do iPhone (checklist de implementação)

1. `viewport-fit=cover` já existe em `index.html`. Usar `env(safe-area-inset-top/right/bottom/left)` em barra do topo, barra inferior, tela cheia e toast.
2. **Campos a 16px.** Menos que isso o Safari dá zoom ao focar.
3. **O documento rola**, não um contêiner interno, nas telas do fórum. Barra do Safari e gesto de tocar no topo para subir dependem disso. (A Arena tem outro shell, com `svh`; o fórum tem `ShellDoForum` próprio. Camillo confirma o encaixe.)
4. **Nenhum composer fixo no rodapé.** O de resposta fica no fim da conversa (ou embaixo da resposta que está sendo respondida) e, ao focar, rola até o campo ficar visível (`scrollIntoView({ block: 'center' })` depois do teclado abrir; a leitura de `visualViewport` fica na camada de plataforma).
5. **Criar tópico no celular: o botão "Criar tópico" vai no cabeçalho da tela cheia**, nunca no rodapé. Assim o teclado não esconde a ação.
6. Botões e links com `touch-action: manipulation` e `-webkit-tap-highlight-color: transparent` (o estado `:active` próprio substitui o realce).
7. `<audio playsinline preload="none">`, só toca por gesto, sem autoplay.
8. `<html lang="pt-BR">`; campo de texto com `autocapitalize="sentences"`, `autocomplete="off"`; título com `enterkeyhint="next"`.
9. `text-wrap: pretty/balance` é opcional (cai sem efeito em Safari antigo).
10. Teste em aparelho real, não só em emulador, de: teclado + composer, tela cheia de criar tópico, barra inferior escondendo, rotação.

---

## 5. Quem está vendo

| Papel | Como se reconhece | Pode |
|---|---|---|
| **Visitante** | sem sessão **ou** sessão de convidado (anônima) | ler tudo, ouvir áudio público, copiar link. Joga a Arena e responde X1 por link. **Não participa socialmente** |
| **Conta, não-membro** | conta promovida (não anônima, com e-mail), `sou_membro` falso | tudo do visitante + entrar na comunidade + denunciar |
| **Conta, membro** | `sou_membro` verdadeiro | tudo acima + criar tópico + responder (tópico aberto) |
| **Autor** | `sou_autor` verdadeiro no item | editar (tópico aberto) e apagar o que escreveu |

| Ação | Visitante | Conta não-membro | Membro | Autor |
|---|---|---|---|---|
| Ler, ouvir, copiar link | sim | sim | sim | sim |
| Participar | "Criar conta para participar" | **Participar** | "Você participa" + "Sair da comunidade" | |
| Novo tópico | "Criar conta para participar" | participar antes | **Novo tópico** | |
| Responder | bloco "Criar conta" | bloco "Participar" | composer | |
| Denunciar | não aparece | sim | sim | não no próprio |
| Editar / Apagar | | | | só o próprio (Editar só em tópico aberto) |

Visitante nunca "não vê nada": vê tudo e vê, no lugar da ação, **o convite**. O convite leva a `enderecoDoLoginComVolta(caminhoAtual)` (já existe em `src/nucleo/comunidade/caminhoDeVolta.ts`), para a pessoa voltar ao mesmo lugar depois de entrar. Dois botões: "Criar conta" (`modo=cadastro`) e "Já tenho conta" (`modo=entrar`).

Visitante que toca **Perfil** na navegação vai para `/login?modo=entrar&volta=/perfil`.

---

## 6. Padrões transversais

### 6.1 Carregando

- **Esqueleto, não spinner.** Formas de `--surface` (sem animação): linha de lista = barra de título (70 a 90% da largura) + barra de meta (40%). Seis linhas. Cabeçalho = monograma + duas barras. Tópico = título em 2 linhas + meta + 4 linhas de corpo.
- Container com `aria-busy="true"`; o esqueleto é `aria-hidden`. Uma região `role="status"` (polite, visualmente oculta) diz "Carregando comunidades", "Carregando tópicos", "Carregando respostas".
- Voltar para uma lista já vista mostra o que já estava carregado na hora e atualiza por baixo, sem esqueleto.
- Passou de 15s sem resposta: vira o estado de erro.

### 6.2 Vazio

Centralizado na coluna, sem ilustração e sem cartão: título em Archivo 800 24px, linha de apoio 15px `--muted`, padding vertical 48px. **Não repete o botão** que já está visível no cabeçalho da tela (evita dois verdes iguais). Textos exatos em cada tela.

### 6.3 Erro de leitura, com "Tentar de novo"

Mesmo molde do vazio. `role="alert"`. Título curto na voz do Auê (erro fala a verdade primeiro), linha "Nada foi perdido. Tenta de novo." e **botão contorno "Tentar de novo"** (44px). O botão refaz só a chamada que falhou, sem recarregar a página. Se a rede está fora (`conectividade` indica offline, ou falha de rede), o título vira "Sem internet." e a linha vira "Confere a conexão e tenta de novo."

Erro em pedaços: cabeçalho da comunidade carregou e a lista falhou? O cabeçalho fica e **só a área da lista** mostra o erro. Falha em "Ver mais" mantém o que já está na tela (6.5).

### 6.4 Offline

Detecção por porta de plataforma (`navigator.onLine` e eventos `online`/`offline` ficam em `src/plataforma/`, AGENTS §4). `onLine` mente em rede sem internet; por isso é uma pista, não uma garantia.

- Offline: **faixa** logo abaixo da barra do topo, não fixa, fundo `--surface`, texto 14px: "Sem internet. Dá pra ler o que já abriu, mas não dá pra enviar nem carregar mais." Quando volta: a faixa some e a região de status diz "A internet voltou."
- Botões de envio **continuam ativos**. Se a pessoa envia offline, nada é chamado: aparece o erro de envio do campo, "Sem internet. Seu texto continua aqui." Não existe fila de envio, então a copy não promete uma.
- Navegar para uma tela sem dado carregado e sem rede cai no erro de leitura em versão offline (6.3).

### 6.5 Paginação "Ver mais"

- **Sem rolagem infinita** (acessibilidade, rodapé alcançável, e timeline é o que descartamos).
- Tamanho de página: **30** para tópicos e abas do perfil, **100** para respostas.
- Se a página veio cheia, aparece botão contorno de largura total (44px) "Ver mais tópicos" / "Ver mais respostas". Se veio menor que o limite, não aparece botão e não aparece frase de "fim".
- Carregando: o botão vira "Carregando…" (`aria-busy`, desabilitado). Quando chega, **o foco vai para o primeiro item novo** e a região de status diz "Mais N tópicos carregados" (ou "respostas").
- Falha: o texto do botão vira "Não deu pra carregar mais. Tentar de novo" e os itens anteriores ficam.
- **Zero duplicidade:** juntar por `id`. Se o servidor devolver um id que já está na lista, a linha existente fica onde está.

### 6.6 Erros de envio, por HINT

Tabela única para criar tópico, responder, editar, apagar e denunciar. O texto aparece **junto do campo ou da ação**, com `role="alert"`, e **o texto que a pessoa escreveu nunca é apagado**.

| HINT / situação | Copy exata | Onde / o que mais |
|---|---|---|
| `titulo_invalido` | "O título precisa ter de 1 a 120 caracteres." | embaixo do campo Título |
| `corpo_invalido` | "A mensagem precisa ter de 1 a 1000 caracteres." | embaixo do campo Mensagem |
| `resposta_invalida` | "A resposta precisa ter de 1 a 500 caracteres." | embaixo do composer |
| `comunidade_inexistente` | "Essa comunidade não existe mais." | no topo do formulário, com link "Ver comunidades" |
| `nao_e_membro` | "Entre na comunidade antes de participar." | com botão "Participar" ao lado; entrou, o texto segue e a pessoa reenvia |
| `topico_fechado` | "Esse tópico foi fechado. Não aceita mais respostas." | composer vira a faixa de tópico fechado; o texto fica guardado |
| `topico_nao_encontrado` | "Esse tópico não está mais disponível." | depois do aviso, a tela vira "Esse tópico não está disponível" |
| `pai_invalido` | "A resposta que você queria responder não está mais aqui. Responde direto no tópico." | botão "Responder no tópico" move o texto para o composer principal |
| `resposta_nao_encontrada` | "Essa resposta não está mais disponível." | |
| `audio_sem_consentimento` | "O arroto não pôde ir junto. Marca a autorização e tenta de novo, ou cria só com texto." | no bloco do arroto |
| `nao_e_autor` | "Só quem escreveu pode mexer nisso." | |
| `nada_para_editar` | "Você não mudou nada." | |
| `42501` sem HINT (conta) | "Sua sessão acabou ou essa conta não pode participar. Entra de novo, seu texto fica aqui." | link "Entrar" com `volta` |
| `cursor_invalido`, `ordem_invalida` | erro de leitura genérico (6.3). É bug nosso: registrar em telemetria, não explicar | |
| **Rede, tempo esgotado, 5xx, resposta desconhecida em escrita** | "Não deu pra confirmar o envio. Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu." | falha **ambígua**: pode ter gravado. Ver 6.7 |
| Falha de rede ao denunciar | "Não deu pra enviar a denúncia. Tenta de novo." | |
| Falha ao apagar | "Não deu pra apagar. Tenta de novo." | |

### 6.7 Envio: estados e duplo toque

Estados do botão de envio: **repouso** ("Enviar", "Criar tópico", "Salvar") → **enviando** (rótulo "Enviando…", `aria-busy`, campo `readOnly`, segundo toque ignorado) → **sucesso** (campo limpo, anúncio na região de status) ou **erro** (alerta, campo editável de novo, botão volta ao repouso).

Reaproveitar `useEnvioDeResposta` (já tem trava de duplo envio e só limpa o campo quando devolve `true`) e `MENSAGEM_DE_ERRO_DE_RESPOSTA` ("Não deu para enviar. Seu texto continua aqui, tenta de novo."), **só para erro com certeza de que não gravou** (validação, permissão). Para falha ambígua usar a copy da tabela acima, porque o servidor não tem chave de idempotência e o "tentar de novo" pode duplicar. Pedido de idempotência na seção 18.

### 6.8 Rascunho

- **Fechar nunca apaga o texto.** Esc, botão fechar e voltar fecham o formulário **mantendo** o rascunho; não há confirmação de "descartar".
- Rascunho de novo tópico: chave por comunidade. Rascunho de resposta: chave por tópico e pai. Em memória durante a sessão e na porta de armazenamento (`src/portas/armazenamento.ts`) entre recargas. Limpa só no sucesso do envio ou no botão explícito "Descartar rascunho" (texto, 44px, aparece no formulário de tópico quando há texto).

### 6.9 Contador por caractere

Sempre visível, alinhado à direita embaixo do campo, 13px: `87/120`. A partir de 90% do limite o número passa a `--fg`. Passou do limite: `--danger` e o texto "10 caracteres a mais" (o número do contador continua, ex. `130/120`). **Não usar `maxLength` do HTML** (conta UTF-16): a pessoa pode digitar além e o envio fica bloqueado com mensagem. O contador tem `aria-live="off"`; um aviso `role="status"` separado fala só "Faltam 20 caracteres" ao cruzar 20 restantes e "Passou do limite em N caracteres" ao estourar (sem falar a cada tecla).

Envio com campo inválido: o botão **não** fica `disabled` mudo. Ele continua ativo e, ao ser acionado, leva o foco ao primeiro campo com erro e escreve o erro ("Falta o título.", "Falta a mensagem.", "Passou do limite em N caracteres.").

### 6.10 Tempo e número

| Situação | Texto |
|---|---|
| menos de 1 minuto | "agora" |
| 1 a 59 minutos | "há 5 min" |
| 1 a 23 horas | "há 3 h" |
| 1 a 6 dias | "há 2 d" |
| 7 dias ou mais, mesmo ano | "12 out" |
| outro ano | "12 out 2025" |

Sempre dentro de `<time datetime="ISO">`, com `title` no horário completo (`19/10/2026 14:32`). Número: `toLocaleString('pt-BR')` (milhar com ponto), **nunca abreviar** ("1,2 mil" não existe). Plurais:

| Dado | 0 | 1 | N |
|---|---|---|---|
| tópicos | "Nenhum tópico ainda" | "1 tópico" | "N tópicos" |
| membros | "Nenhum membro ainda" | "1 membro" | "N membros" |
| respostas | "Sem respostas" | "1 resposta" | "N respostas" |

Meta de um tópico (lista, Explorar, perfil), nesta ordem: `[Fixado] [Fechado] · {apelido} · {respostas} · {tempo}`:

- com respostas: "Ana Souza · 8 respostas · atividade há 3 h" (tempo = `ultima_atividade_em`)
- sem respostas: "Ana Souza · Sem respostas · há 3 d" (tempo = `criado_em`)

### 6.11 Conteúdo longo

- **Título de 120 caracteres:** na lista, máximo 2 linhas com reticências (`-webkit-line-clamp: 2`). Na tela do tópico, quebra livre.
- **Mensagem de até 1000 (acervo 2000):** inteira na tela do tópico, `white-space: pre-wrap`, largura de leitura máxima de 65ch, no máximo uma linha em branco seguida (normalizar 3 ou mais quebras para 2 só na exibição).
- **Resposta de até 500:** inteira na conversa. Nas abas do perfil, máximo 3 linhas.
- **Sem link clicável, sem markdown, sem HTML** nesta versão. URL colada é texto e quebra em qualquer ponto.
- **Palavra gigante** ("aaaaaaaa…"): `overflow-wrap: anywhere`, nunca estoura a coluna.
- **Apelido longo:** reticências em linha de meta; quebra livre no cabeçalho do tópico.
- **Thread longa:** recuo travado no nível 2, página de 100 respostas, "Ver mais respostas".

### 6.12 Toast

Para confirmações curtas ("Você entrou em {comunidade}.", "Link copiado.", "Tópico apagado."). Fundo `--fg`, texto `--bg`, raio 12, 14px / 600. No celular: `bottom: calc(56px + env(safe-area-inset-bottom) + 12px)`. 3 segundos, `role="status"`. **Erro não vira toast**: erro fica na tela até ser resolvido.

---

## 7. Tela 1 — Diretório de comunidades

**Rota:** `/comunidades` agora; `/` no corte (ver 14.1). **Dados:** `listar_comunidades_do_forum()`, mais `listar_minhas_comunidades()` para conta promovida (2.4, item 1).

### 7.1 Hierarquia (celular, 375px)

```
+------------------------------------------+
| Comunidades               [Entrar] [tema]|  barra do topo, 53px
+------------------------------------------+
| (visitante) Encontre sua turma...        |  lead + [Criar conta]  Já tenho conta
|                                          |
| Suas comunidades                         |  H2 (só conta)
| ---------------------------------------- |
| [BG] Bonde Geral                         |  linha: monograma 44 + nome
|      A praça central da zoeira...        |  descrição, 2 linhas no máximo
|      12 tópicos · 34 membros · atividade há 2 h
| ---------------------------------------- |
| [CG] Cerveja Gelada                      |
|      ...                                 |
|                                          |
| Para conhecer                            |  H2 (só conta; visitante vê "Comunidades")
| ---------------------------------------- |
| ...                                      |
|                                          |
| Procurando grupo de WhatsApp ou Telegram?|
| Eles ficam fora do Auê.  Ver grupos externos
+------------------------------------------+
| [Comunidades][Explorar][Arena][Perfil]   |  barra inferior 56 + safe-area
+------------------------------------------+
```

### 7.2 Regras

- **Visitante:** bloco de abertura no topo e **uma só lista** com H2 "Comunidades" (todas). Sem "Suas comunidades".
- **Conta:** "Suas comunidades" (onde `sou_membro`) e "Para conhecer" (as demais). Se não falta nenhuma, "Para conhecer" some.
- **Ordem** dentro de cada lista: `ultima_atividade_em` mais recente primeiro; comunidades sem tópico por último; desempate por nome. (Reordenação no cliente: o RPC devolve por nome.) Isto é conteúdo mais vivo primeiro, **não** ranking.
- Cada linha é **um link só** para `/c/:slug`: monograma + nome (17/600, `<h3>` dentro do link) + descrição (15px, `--muted`, máximo 2 linhas) + meta (13px, `--muted`): "{tópicos} · {membros} · atividade há {tempo}". Comunidade sem tópico: "Nenhum tópico ainda · {membros}" (sem "atividade").
- **Sem botão "Participar" na linha.** Participar acontece na comunidade (menos alvo aninhado, menos ruído).
- Sem busca, sem categoria, sem "criar comunidade", sem "em alta", sem número abreviado.
- Rodapé: "Procurando grupo de WhatsApp ou Telegram? Eles ficam fora do Auê." + link "Ver grupos externos" para `/grupos` (a VOZ manda dizer que são coisas diferentes).
- **Bloco de abertura do visitante** (texto da VOZ, "Direção editorial"): "Encontre sua turma. Entre nas comunidades e participe da resenha." + linha "Só quer ouvir? Fica à vontade. Dá pra ler tudo sem conta." + botão **"Criar conta"** (verde, 44px) + link "Já tenho conta". Na raiz `/` do corte, o visitante ganha em cima uma apresentação maior com os textos da Landing aprovada (sem "causo") e o atalho "Arrotar sem conta" (para `/arena`). Esse bloco é decisão do Luiz com Rodrigo (SEO), item 3 da seção 20.

### 7.3 Tablet e desktop

Mesma hierarquia, mesma linha. Coluna central de 680px (tablet) ou 640px (desktop), gutter de 24px, monograma 48px. Sem aside nesta tela. A linha ganha hover `--fg-soft`.

### 7.4 Estados

| Estado | O que aparece | Copy exata |
|---|---|---|
| Carregando | 6 linhas de esqueleto | status: "Carregando comunidades" |
| Vazio (zero comunidades) | molde de vazio | título "Nenhuma comunidade aberta ainda." linha "Volta daqui a pouco." |
| Conta sem nenhuma entrada | só em "Suas comunidades" | "Você ainda não participa de nenhuma comunidade. Escolhe uma turma aqui embaixo." |
| Erro | molde de erro | título "Deu ruim pra carregar as comunidades." linha "Nada foi perdido. Tenta de novo." botão "Tentar de novo" |
| Offline | faixa (6.4) ou erro offline (6.3) | "Sem internet." |
| Visitante | bloco de abertura + lista única | ver 7.2 |

### 7.5 Reaproveitar e novo

Reaproveita: `useLarguraJanela`, `useTema` (com padrão claro), shell de navegação evoluído (seção 16). **Substitui** `AbaComunidades` e `DetalheComunidade` (hoje com `COMUNIDADE_RAIZ` com "ano 2004" e `REGRAS_PADRAO` por slug, tudo fabricado). Novo: `LinhaDeComunidade`, `Esqueleto`, `EstadoVazio`, `EstadoDeErro`, `FaixaOffline`.

---

## 8. Tela 2 — Comunidade e lista de tópicos

**Rota:** `/c/:slug`. **Dados:** `obter_comunidade_do_forum(slug)` + `listar_topicos(slug, ...)`. **A URL manda:** `/c/reuniao-da-firma` nunca abre outra comunidade. Slug sem linha em `obter_comunidade_do_forum` = "não encontrada", sem mural substituto.

### 8.1 Hierarquia (celular)

```
+------------------------------------------+
| <   Na reunião da firma                  |  barra do topo (voltar = link /comunidades)
+------------------------------------------+
| [RF]  Na reunião da firma     (H1)       |  monograma 56 + H1
| A culpa jogada no ar condicionado.       |  descrição 16px
| 12 tópicos · 34 membros                  |  meta 13px
| [ Novo tópico ]   Você participa · Sair da comunidade
| > Regras da casa                         |  <details>
| ---------------------------------------- |
| Atividade recente | Novos                |  alternância de ordem
| ---------------------------------------- |
| Fixado · Ana Souza · 8 respostas · atividade há 3 h
| Título do tópico, até 2 linhas           |  (título acima da meta na linha)
| ---------------------------------------- |
| ... mais linhas ...                      |
| [        Ver mais tópicos        ]       |
+------------------------------------------+
```

Dentro de cada linha, a ordem visual é: **título** (17/600), depois **meta** (13px). Marcadores "Fixado" e "Fechado" abrem a meta, com ícone de 14px e texto (nunca só ícone).

### 8.2 Cabeçalho da comunidade

- Monograma, H1 (nome), descrição, meta "{tópicos} · {membros}".
- **Ação por papel** (uma só ação primária, 44px, pílula):

| Papel | Ação | Texto exato |
|---|---|---|
| Visitante | botão verde + link | "Criar conta para participar" e "Já tenho conta" |
| Conta, não-membro | botão verde | "Participar" |
| Membro | botão verde + texto discreto | "Novo tópico" e, na linha de baixo, "Você participa · Sair da comunidade" (a parte "Sair da comunidade" é botão de texto, 44px) |

- Participar: chama `entrar_na_comunidade`, e ao dar certo o botão **vira** "Novo tópico", o foco vai para ele e a região de status diz "Você entrou em {nome}." Sair: sem confirmação (é reversível), e o toast diz "Você saiu de {nome}." Falha: "Não deu pra entrar agora. Tenta de novo." / "Não deu pra sair agora. Tenta de novo." sob o botão.
- **No celular, enquanto o cabeçalho sai da tela**, a barra do topo mostra, à direita, "Novo tópico" como botão de texto `--fg` (sem verde), para o membro não precisar voltar ao topo numa lista longa. (Observador de interseção. Um verde por vez.)
- **Regras da casa** em `<details>` (colapsado no celular e no tablet; expandido no aside do desktop). Resumo: "Regras da casa". Texto provisório, **igual em todas as comunidades**, rotulado como regras da casa e não da comunidade, porque `regras` não existe no banco:
  1. "A piada é com o arroto, nunca com a pessoa."
  2. "Arroto de verdade. Sem áudio dublado."
  3. "Sem spam de link."

  (Conteúdo definitivo e regras por comunidade são decisão do Luiz, itens 4 da seção 20.)
- **Sem** "Moderação @fulano", sem ranking, sem "criada em", sem categoria, sem emoji.

### 8.3 Lista de tópicos

- **Ordem:** alternância "Atividade recente" (`atividade`, padrão; fixados primeiro) e "Novos" (`recentes`). Dois botões lado a lado, 44px de altura, `aria-pressed`; ativo com sublinhado de 2px `--fg` e peso 700 (não é aba de conteúdo, é a mesma lista em outra ordem). A escolha vai na URL (`?ordem=novos`), então voltar e compartilhar preservam. Mudar a ordem recarrega do começo e leva o foco ao primeiro item.
- **Linha:** inteira é um link para `/c/:slug/t/:id` (alvo de pelo menos 72px de altura). Conteúdo: título, meta (6.10). **Sem avatar, sem trecho do corpo, sem player, sem nota, sem selo "com áudio"** (decisão: selo de áudio só quando o banco der `tem_audio` nas duas listas; seção 18).
- Tópico fechado mantém a linha normal com o marcador "Fechado".
- Oculto e removido **nunca** aparecem na lista.
- Paginação "Ver mais tópicos" (6.5).

### 8.4 Estados

| Estado | O que aparece | Copy exata |
|---|---|---|
| Carregando cabeçalho | monograma e barras de esqueleto | status "Carregando comunidade" |
| Carregando lista | 6 linhas de esqueleto sob o cabeçalho real | status "Carregando tópicos" |
| Comunidade sem tópicos, membro | molde de vazio (sem botão extra) | título "Nenhum tópico ainda." linha "Abre o primeiro. O botão Novo tópico está aí em cima." |
| Sem tópicos, não-membro | idem | título "Nenhum tópico ainda." linha "Participa da comunidade pra abrir o primeiro." |
| Sem tópicos, visitante | idem | título "Nenhum tópico ainda." linha "Cria sua conta pra abrir o primeiro." |
| Erro na lista | molde de erro **só na área da lista** | título "Deu ruim pra carregar os tópicos." linha "Nada foi perdido. Tenta de novo." botão "Tentar de novo" |
| Erro no cabeçalho (falha de rede) | molde de erro de tela | título "Deu ruim pra carregar a comunidade." |
| **Comunidade inexistente** | molde de erro de tela, **sem lista** | título "Essa comunidade não existe." linha "Confere o endereço ou procura outra turma." botão "Ver comunidades" |
| Offline | faixa 6.4 | |
| Ver mais falhou | botão em erro (6.5) | "Não deu pra carregar mais. Tentar de novo" |

Tópico fixado e fechado são estados de dado. Hoje ninguém consegue produzi-los pela UI (moderação é a #260), mas a linha já nasce preparada.

### 8.5 Tablet e desktop

- Tablet: igual ao celular, gutter 24, H1 28, monograma 64, regras em `<details>`.
- Desktop: mesma coluna central; **aside de 320px** com "Regras da casa" (expandida, texto 15px). Header da comunidade igual ao do celular.

### 8.6 Reaproveitar e novo

Reaproveita o padrão de botão voltar do `DetalheComunidade` (agora 44px e como `<a>`). Novo: `CabecalhoDaComunidade`, `LinhaDeTopico`, `AlternarOrdem`, `BotaoVerMais`, `SobreAComunidade` (aside). **Remove** a aba "Posts" com `ComposerCauso` embutido, a aba "Ranking" e a aba "Sobre" fabricadas.

---

## 9. Tela 3 — Conversa (tópico)

**Rota:** `/c/:slug/t/:id`. **Dados:** `obter_topico(id)` + `listar_respostas_do_topico(id, ...)`. O `id` é global. Se o `slug` da URL não for o da comunidade do tópico, **troca a URL para o slug certo** (`replace`) e mostra o tópico; nunca mostra um tópico debaixo de outra comunidade.

### 9.1 Hierarquia (celular)

```
+------------------------------------------+
| <  Na reunião da firma              [...]|  voltar = link /c/:slug ; menu de ações
+------------------------------------------+
| Título do tópico, quebra livre (H1)      |
| [foto] Ana Souza · @ana · há 3 h · editado
| Fixado · Fechado                         |  só quando valem
| ---------------------------------------- |
| Mensagem inicial, 16px, linhas e         |
| parágrafos como a pessoa escreveu.       |
|                                          |
| [>]  ------o-----  0:07        [ 87,4 ]  |  player: SÓ se há áudio; selo SÓ se há nota
| ---------------------------------------- |
| [ Responder ]                            |  ação (contorno); rola até o composer
| ---------------------------------------- |
| 8 respostas  (H2)                        |
| (foto) Bia Lima  @bia · há 2 h           |
|   Texto da resposta                      |
|   Responder                              |
|   | (foto) Caio ...  (nível 1, recuado)  |
|   |   | (nível 2)                        |
| ...                                      |
| [      Ver mais respostas       ]        |
| ---------------------------------------- |
| Sua resposta                  0/500      |  composer no fim da conversa
| [ textarea, 2 linhas, cresce até 8 ]     |
|                          [ Enviar ]      |
+------------------------------------------+
```

### 9.2 Cabeçalho do tópico

- **H1** com o título (nunca cortado). Linha de autoria: foto 32px (link para `/u/:handle`), apelido (600, link), `@handle`, tempo, e "editado" quando há `editado_em`.
- Marcadores: "Fixado" (alfinete) e "Fechado" (cadeado), texto 13px/600 `--muted`, ícone 14px.
- **Mensagem inicial** logo abaixo, sem moldura. Se vazia (tópico migrado sem texto), o bloco não aparece.
- **Link de volta** para a comunidade na barra do topo e, no desktop, também como migalha acima do H1: "{Comunidade} › Tópico" (o nome da comunidade é link).

### 9.3 Áudio e nota (só se existem de verdade)

- Existe áudio quando `caminho_do_audio` ou `caminho_do_audio_da_casa` não é nulo. Existe nota quando `nota` não é nulo. Áudio sem nota mostra o player **sem selo**. Nunca inventar nota para áudio da casa. Sem áudio, o bloco inteiro não existe.
- Pílula de `--surface`, raio 999, altura 52px: botão tocar/pausar de **44px** (círculo `--fg`, ícone `--bg`), barra de progresso real (não é forma de onda: o banco não entrega forma de onda e não vamos fabricar uma), duração em mono 12px (`0:07`), e à direita o **selo de nota** (Anton 24px sobre `--accent`) quando há nota, com o valor como o servidor mandou (vírgula decimal).
- `aria-label` do botão: "Tocar arroto de {apelido}" / "Pausar arroto de {apelido}". Sem autoplay. Um áudio por vez (`tocarExclusivo` de `src/plataforma/web/audioUnico.ts`, já existe). Ao sair da tela o áudio para (`soltar`).
- Falha ao tocar: linha 13px abaixo do player, "Não deu pra tocar esse áudio. Tenta de novo." (o botão volta ao estado de tocar).

### 9.4 Respostas

- **H2** "{N respostas}" (6.10; zero: "Sem respostas"). Ordem **cronológica fixa**, mais antigas primeiro, sem controle de ordenação. Texto de apoio fixo, 13px `--muted`, ao lado do H2: "Mais antigas primeiro".
- Cada resposta: foto 32px (28px no nível 2), apelido (600, 14px), `@handle` e tempo (13px `--muted`), "editado" quando há; corpo 15px/1.5; ação "Responder" (botão de texto, 44px de altura de toque, 13px visual, `aria-label` "Responder a {apelido}"); menu de ações (três pontos, 44px).
- **Estrutura:** árvore por `pai_id` (`ordenarEmNiveis` de `src/nucleo/comunidade/comentarios.ts` já faz isso e trava no nível 2). Marcação **de lista aninhada**: cada resposta é um `<li>` e as filhas ficam num `<ul>` dentro dela, para o leitor de tela dizer "lista com N itens".
- **Recuo** por nível (seção 4.6) com **linha guia** de 1px `--border` à esquerda das filhas. No nível 2 não recua mais. Resposta de nível 2 que responde outra de nível 2 mostra, acima do corpo, a referência "Respondendo a @{handle}" (13px `--muted`), porque o recuo não distingue.
- **Casca:** resposta apagada ou oculta que ainda tem filha. Sem autor, sem corpo, sem ações. Uma linha 14px `--muted` com a linha guia: "Resposta removida." (`status` `removido`) ou "Resposta oculta." (`status` `oculto`). As filhas continuam embaixo.
- Sem curtida, sem contagem por resposta, sem ranking de resposta.
- **Paginação:** 100 por página, "Ver mais respostas" (6.5). Como a ordem é cronológica e o composer fica no fim, o botão "Responder" do cabeçalho, se ainda há páginas por carregar, **carrega o resto** (status "Carregando respostas") e só então leva ao composer.

### 9.5 Composer (responder o tópico)

Fica **no fim da conversa**, nunca fixo na tela. Conteúdo por papel:

| Papel / estado | O que aparece | Copy exata |
|---|---|---|
| Membro, tópico aberto | foto própria + textarea + contador + botão | label (oculto) "Sua resposta", placeholder "Escreve sua resposta", botão verde "Enviar", enviando "Enviando…" |
| Conta, não-membro | faixa + botão | "Entre em {Comunidade} para responder." botão "Participar" (entrou, o composer aparece e o foco vai nele) |
| Visitante | faixa + botões | "Quer responder? Crie sua conta ou entre. Ler e ouvir continua liberado." botões "Criar conta" (verde) e "Já tenho conta" |
| Tópico fechado | faixa `--surface` | "Tópico fechado. Dá pra ler tudo, mas não aceita novas respostas." |

Textarea: 16px, mínimo 2 linhas, **cresce até 8 e depois rola por dentro**, borda `--border-strong`, raio 12, padding 12. Contador 6.9. Após sucesso: campo limpo, a conversa mostra a nova resposta **na posição certa**, o foco vai para ela (`tabindex="-1"`) e a região de status diz "Resposta enviada." Falha: 6.6 e 6.7, texto preservado.

**Responder uma resposta:** o toque em "Responder" abre, **logo abaixo daquela resposta**, o mesmo composer (textarea, contador, "Enviar" e "Cancelar"), com a linha "Respondendo a @{handle}" acima. O foco vai para o campo. Esc ou "Cancelar" fecham e devolvem o foco ao botão "Responder" daquela resposta, mantendo o rascunho. Só um composer aberto por vez; abrir outro fecha o anterior (rascunho guardado).

**Fora desta versão:** "Arrotar para responder" com áudio. `responder_topico` não recebe áudio nem resultado (seção 18). O botão **não aparece** (não é botão desabilitado nem "em breve": a VOZ proíbe prometer o que não existe). A Arena continua levando a um **novo tópico** com o arroto (Tela 4).

### 9.6 Menu de ações (três pontos)

Botão 44px com `aria-haspopup="menu"` e `aria-expanded`. Itens:

| Item | Quem vê | O que faz |
|---|---|---|
| "Copiar link" | todos | copia a URL do tópico. Toast "Link copiado." Falha: "Não deu pra copiar. Segura o endereço na barra do navegador." |
| "Editar" | autor, tópico aberto | abre o formulário (Tela 4) preenchido, botão "Salvar". No composer de resposta, edição inline com "Salvar" e "Cancelar" |
| "Apagar" | autor | abre confirmação (abaixo) |
| "Denunciar" | conta, conteúdo dos outros | abre dialog de denúncia (abaixo) |

Visitante vê só "Copiar link". As mesmas ações, no menu de cada resposta (sem "Copiar link").

**Confirmação de apagar** (dialog pequeno; foco inicial em "Cancelar"; vermelho não é usado, o DS reserva para erro técnico):

- Tópico: título "Apagar este tópico?" corpo "Ele sai da comunidade e as respostas deixam de aparecer. Não dá pra desfazer." botões "Cancelar" e "Apagar tópico" (`--fg` cheio).
- Resposta: título "Apagar esta resposta?" corpo "Se tiver respostas embaixo dela, elas continuam e a sua vira Resposta removida." botões "Cancelar" e "Apagar resposta".
- Sucesso: tópico leva para `/c/:slug` com toast "Tópico apagado."; resposta vira casca no lugar, com foco na próxima resposta (ou no composer). Falha: "Não deu pra apagar. Tenta de novo." dentro do dialog.

**Denunciar** (dialog): título "Denunciar tópico" (ou "Denunciar resposta"), campo "O que está errado? (opcional)" (textarea 16px, até 500), botões "Cancelar" e "Denunciar" (`--fg` cheio). Sucesso: fecha e toast "Denúncia enviada. Valeu." Falha: "Não deu pra enviar a denúncia. Tenta de novo." A tela **não** promete que o conteúdo some.

### 9.7 Estados

| Estado | O que aparece | Copy exata |
|---|---|---|
| Carregando | esqueleto do tópico | status "Carregando tópico" |
| **Tópico indisponível** (ausente, oculto, removido, autor sem promoção, id errado) | molde de erro de tela, mesma tela para todos os casos | título "Esse tópico não está disponível." linha "Ele pode ter sido apagado, estar oculto, ou o endereço está errado." botão "Voltar para a comunidade" (link para `/c/:slug`) |
| Tópico carregou, respostas falharam | cabeçalho fica, erro só na área das respostas | título "Deu ruim pra carregar as respostas." linha "Nada foi perdido. Tenta de novo." botão "Tentar de novo" |
| Erro de rede ao abrir | molde de erro de tela | "Deu ruim pra carregar o tópico." |
| Sem respostas, membro | linha no lugar da lista, composer logo abaixo | "Ninguém respondeu ainda. Manda a primeira." |
| Sem respostas, não-membro e visitante | idem, sem o convite repetido (o bloco do composer já convida) | "Ninguém respondeu ainda." |
| Tópico fechado | faixa `--surface` entre a mensagem e a conversa | "Este tópico está fechado. Dá pra ler tudo, mas não aceita novas respostas." |
| Casca de resposta | ver 9.4 | "Resposta removida." / "Resposta oculta." |
| Áudio com falha | ver 9.3 | |
| Offline | faixa 6.4 | |

**Tópico removido ou oculto como "casca"**: para **tópico** isso **não é possível hoje**, porque `obter_topico` não devolve linha para esses estados e a UI não consegue diferenciá-los de endereço errado. A casca vale para **resposta**. A casca de tópico (com nome da comunidade e "Tópico removido") depende do pedido 7 da seção 18.

### 9.8 Tablet e desktop

- Tablet: coluna única de 680px, lateral de 76px, tudo da hierarquia 9.1.
- Desktop: o **aside de 320px** mostra "Sobre a comunidade" (monograma 44, nome em link, descrição, meta, "Participar" ou "Você participa · Sair da comunidade") e abaixo "Regras da casa". Migalha acima do H1. Composer igual.
- Corpo com largura máxima de 65ch dentro da coluna.

### 9.9 Reaproveitar e novo

Reaproveita e **evolui** `ArvoreDeComentarios` (árvore com `ordenarEmNiveis`, `useEnvioDeResposta`, composer inline): troca o `input` de uma linha de 14px por `textarea` de 16px, contador por code point, alvo de 44px, casca, referência "Respondendo a", lista aninhada. Reaproveita o tratamento de `tocarExclusivo`/`soltar` e o estado de erro de áudio de `CardDeCauso`, **extraído** num `PlayerDeAudio` (sem a forma de onda de 28 barras sorteada pelo id, que é visual fabricado). Reaproveita o fluxo de denúncia de `CardDeCauso`. Reaproveita `useLayoutDaConversa`. **`TelaHistoria` (617 linhas) é substituída** e `/historia/:id` vira só redirecionamento. Novo: `CabecalhoDoTopico`, `PlayerDeAudio`, `ArvoreDeRespostas`, `CompositorDeResposta`, `MenuDeAcoes`, `DialogoDeConfirmacao`, `DialogoDeDenuncia`.

---

## 10. Tela 4 — Criar tópico

**Rota:** `/c/:slug/novo` (comunidade fixa). Há também `/novo-topico`, **só** alcançável pela Arena depois da nota, com a comunidade escolhida no formulário (10.3); sem a Arena, `/novo-topico` redireciona para `/comunidades`, porque criar sem origem seria post avulso. **Dados:** `criar_topico(...)`.

### 10.1 Como abre

- **Desktop e tablet:** `<dialog>` modal (`showModal()`), 560px de largura máxima, raio 24, sombra do dialog, sobre a lista da comunidade.
- **Celular (menor que 700px): tela cheia**, `min-height: 100svh`, sem raio, sem barra inferior. Cabeçalho próprio de 53px (mais safe-area): **"Cancelar"** (texto, 44px) à esquerda, título "Novo tópico" ao centro, **"Criar tópico"** (verde, 44px) à direita. O conteúdo rola por dentro e a ação principal nunca fica embaixo do teclado.
- A rota entra no histórico: voltar (botão do navegador, gesto do Safari) fecha. Aberta por URL direta, fechar leva a `/c/:slug`.

### 10.2 Campos (de cima para baixo)

| Campo | Detalhe |
|---|---|
| Comunidade | linha fixa 15px: "Em {nome da comunidade}" com monograma de 24px. Não é campo |
| Título | label "Título", `<input>` 16px, placeholder "Sobre o que é a conversa?", contador `0/120`, `enterkeyhint="next"` |
| Mensagem | label "Mensagem", `<textarea>` 16px, mínimo 6 linhas, placeholder "Conta o que rolou ou o que você quer perguntar.", contador `0/1000` |
| Arroto da Arena | **só quando vem da Arena com resultado** (10.3) |
| Ação | desktop: rodapé com "Cancelar" (contorno) e "Criar tópico" (verde). Celular: no cabeçalho (10.1) |
| Descartar | botão de texto "Descartar rascunho", aparece quando há texto |

Contadores e erro por campo (6.9). Erros do servidor por HINT (6.6): `titulo_invalido` embaixo do título, `corpo_invalido` embaixo da mensagem, `nao_e_membro` com botão "Participar", `comunidade_inexistente` no topo. **Rascunho intacto** em qualquer falha. Duplo toque ignorado (6.7).

### 10.3 Com o arroto da Arena

Bloco entre Mensagem e ação:

- Título do bloco "Seu arroto desta rodada" e, ao lado, o selo de nota (Anton, verde) com o valor que a Arena mostrou. **A nota publicada é a que o servidor calcula**; a tela do formulário não promete o número.
- Caixa de seleção **desmarcada por padrão**, alvo de 44px: "Autorizo publicar meu arroto neste tópico. Qualquer pessoa pode ouvir, e quem tiver o endereço do áudio ouve mesmo fora do tópico. Posso apagar depois."
- Linha de apoio 13px: "Sem marcar, o tópico sai só com texto e o arroto continua privado."
- Desmarcada: a chamada vai **sem** `resultado_id`. Marcada: vai com `resultado_id` e `consentimento_audio_publico = true`.
- No modo `/novo-topico` (vindo da Arena), no lugar da linha "Em {comunidade}" entra o campo **Comunidade**: `<select>` nativo 16px com as comunidades de que a pessoa participa, **sem emoji**, nome apenas. A pessoa precisa escolher antes de criar (sem seleção padrão). Sem nenhuma comunidade: "Você ainda não participa de nenhuma comunidade. Entra numa antes de criar um tópico." com link "Ver comunidades".
- Cancelar volta ao resultado da Arena com o rascunho preservado. **Gravar para jogar não autoriza publicar:** nada sobe sem a caixa marcada.

### 10.4 Sucesso e falha

- Sucesso: navega para `/c/:slug/t/:id` do tópico criado (`replace`, para voltar não reabrir o formulário), foco no H1, toast e região de status "Tópico criado." O rascunho é apagado.
- Visitante e conta sem participação **nunca abrem** este formulário: veem o convite (seção 5). Se a sessão cair no meio, vale a linha `42501` da 6.6.

### 10.5 Reaproveitar e novo

Reaproveita o que existe em `ModalNovoCauso`: contador por `caracteresRestantes`, padrão `falhou` + `role="alert"`, texto de consentimento (reescrito para tópico) e a ideia de bloquear o envio sem aceite. **Descarta** o título "Soltar Resenha no Mural", o `<select>` com emoji do `icone` e a regra "sem consentimento não publica" (agora consentimento é opcional: sem ele sai só texto). `ModalNovoCauso` e `ComposerCauso` são removidos no corte. Novo: `FormularioDeTopico` (usado também para editar), `CampoComContador`.

---

## 11. Tela 5 — Explorar

**Rota:** `/explorar`. **Dados:** `explorar_topicos(...)`. Mostra **tópicos**, sempre com a comunidade à vista. Não é timeline: sem composer, sem "Para você/Seguindo", sem corpo.

### 11.1 Hierarquia

```
+------------------------------------------+
| Explorar                          [tema] |  barra do topo (raiz)
+------------------------------------------+
| Procurando uma turma? Ver comunidades    |  uma linha de apoio, link para /comunidades
| Atividade recente | Novos                |
| ---------------------------------------- |
| Cerveja Gelada                           |  comunidade (link, 13px/600 --muted)
| Título do tópico, até 2 linhas           |  título (link, 17/600) — linha toda clicável
| Ana Souza · 8 respostas · atividade há 3 h
| ---------------------------------------- |
| ...                                      |
| [      Ver mais tópicos      ]           |
+------------------------------------------+
```

### 11.2 Regras

- A **comunidade aparece sempre**, acima do título, como **link próprio** para `/c/:slug`. O título é o link principal para `/c/:slug/t/:id` e a linha toda é clicável (padrão "link esticado": o `<a>` do título cobre a linha e o link da comunidade fica por cima, cada um com alvo de 44px de altura).
- Ordem: **"Atividade recente"** (`atividade`, padrão) e **"Novos"** (`recentes`). **Não** usar "Em alta" nem "Movimentados": a ordem é por tempo da última atividade, não por volume. `?ordem=novos` na URL. Sem fixados (o RPC não traz fixado do jeito da comunidade).
- Linha sem trecho do corpo, sem áudio, sem nota, sem avatar. Marcador "Fechado" quando for o caso.
- Sem busca nesta versão (não existe RPC de busca).
- Paginação "Ver mais tópicos" (6.5).

### 11.3 Estados

| Estado | Copy exata |
|---|---|
| Carregando | 6 linhas de esqueleto, status "Carregando tópicos" |
| Vazio | título "Nada rolando por aí ainda." linha "Entra numa comunidade e abre o primeiro tópico." botão contorno "Ver comunidades" |
| Erro | título "Deu ruim pra carregar os tópicos." linha "Nada foi perdido. Tenta de novo." botão "Tentar de novo" |
| Offline | faixa 6.4 / erro offline |
| Visitante | igual. Lê tudo; sem convite fixo |

Tablet e desktop: mesma coluna, mesma linha. Sem aside.

### 11.4 Reaproveitar e novo

Reusa `LinhaDeTopico` da Tela 2 com a variante "com comunidade em cima". Substitui `ColunaTendencias` (busca no bonde, card de Telegram, tendências) e o feed de `TelaComunidade` (`EntradaPrincipal`).

---

## 12. Tela 6 — Perfil: abas Tópicos e Respostas

**Rotas:** `/u/:handle` e `/perfil` (o próprio). O **cabeçalho do perfil** (foto, nome, handle, bio, melhor nota, edição) é o de `src/features/perfil/TelaPerfil.tsx` e **não muda aqui**. Mudam as abas.

### 12.1 Abas

Hoje: "Resenhas", "Com áudio", "Curtidos" (só no próprio). **Passam a ser duas: "Tópicos" e "Respostas".** Curtidas não existem mais e "Com áudio" sai do perfil (confirmar com Luiz, item 6 da seção 20).

- Semântica de abas (APG): `role="tablist"`, `role="tab"`, `role="tabpanel"`, foco rodando com setas, Home e End. Cada aba com altura 52px (alvo grande). Ativa: sublinhado de 3px `--fg` e peso 700. A aba ativa vai na URL (`?aba=respostas`).
- O botão "Seguir" e as contagens de seguidor já existentes ficam como estão **até o Luiz decidir** (item 6 da seção 20): o feed de seguidores não faz parte do núcleo.

### 12.2 Aba "Tópicos" (`listar_topicos_do_autor`)

Linha (um bloco, linha fina embaixo):

```
Título do tópico (link para /c/:slug/t/:id, 17/600, 2 linhas)
Cerveja Gelada · 8 respostas · há 3 d          <- comunidade é link próprio para /c/:slug
```

Marcador "Fechado" quando for o caso. Sem trecho do corpo. Paginação "Ver mais tópicos".

### 12.3 Aba "Respostas" (`listar_respostas_do_autor`)

```
Em: Arrotos em lugares proibidos               <- título do tópico (link para /c/:slug/t/:id, 15/600, 1 linha)
Já arrotei no banheiro do shopping e achar...  <- corpo da resposta, 15px, máximo 3 linhas
Eu Arroto, e daí? · há 2 d                     <- comunidade (link) · tempo
```

O link abre **o tópico** no topo (sem âncora de resposta: o banco não entrega, seção 18). A linha mostra a comunidade e o tópico, que era o ponto da issue. Paginação "Ver mais respostas".

### 12.4 Estados

| Estado | Copy exata |
|---|---|
| Carregando | 5 linhas de esqueleto, status "Carregando tópicos" / "Carregando respostas" |
| Vazio, aba Tópicos, o próprio | título "Você ainda não abriu nenhum tópico." linha "Entra numa comunidade e começa uma conversa." botão contorno "Ver comunidades" |
| Vazio, aba Tópicos, outra pessoa | título "@{handle} ainda não abriu nenhum tópico." |
| Vazio, aba Respostas, o próprio | título "Você ainda não respondeu em nenhum tópico." linha "Abre um tópico e entra na conversa." botão contorno "Ver comunidades" |
| Vazio, aba Respostas, outra pessoa | título "@{handle} ainda não respondeu em nenhum tópico." |
| Erro | título "Deu ruim pra carregar." linha "Nada foi perdido. Tenta de novo." botão "Tentar de novo" |
| Offline | faixa 6.4 |

O perfil de outra pessoa não existente é decidido pelo cabeçalho, não por estas listas (seção 2.1).

### 12.5 Reaproveitar e novo

Reaproveita `TelaPerfil` e a estrutura de abas já ali (`abas` em `useMemo`), trocando o conjunto. Novo: `AbasDoPerfil` com semântica de `tablist`, `LinhaDeResposta`, e `LinhaDeTopico` na variante do perfil.

---

## 13. Tela 7 — O que muda na navegação (resumo para o código)

| Hoje | Passa a ser |
|---|---|
| Abas "Feed", "Auê", "Comunidade", "Desafios" (+ Perfil separado) | **Comunidades, Explorar, Arena, Perfil** |
| Botão flutuante `+` ("Novo post") na barra inferior | **removido**. "Novo tópico" só dentro da comunidade, e "Iniciar tópico" saindo da Arena |
| Botão "Postar" na lateral | **removido** |
| Barra inferior só com ícone | **ícone + rótulo**, 56px + safe-area, esconde com teclado |
| Logo `AUÊ!` como `div` com `onClick` | `<a href="/">` |
| `useTema` com padrão escuro | **padrão claro** |
| Lateral larga a partir de 1060px | **a partir de 1200px** (1000 a 1199 usa lateral de 76px com aside) |
| Coluna direita com tendências, ranking, Telegram | **aside contextual** (regras e sobre a comunidade) só em `/c/*` |
| Bordas laterais na coluna central | **sem** |

---

## 14. Mapa de rotas, legado e o que não viaja

### 14.1 Mapa de rotas

| Rota | Tela | Observação |
|---|---|---|
| `/` | hoje Landing (`EntradaInicial`). No corte: diretório (Tela 1), com apresentação para visitante | decisão do Luiz, seção 20 item 3 |
| `/comunidades` | Tela 1 | |
| `/c/:slug` | Tela 2 | `?ordem=novos` |
| `/c/:slug/novo` | Tela 4, comunidade fixa | modal no desktop, tela cheia no celular |
| `/c/:slug/t/:id` | Tela 3 | slug errado: `replace` para o certo |
| `/novo-topico` | Tela 4, comunidade escolhida | só vindo da Arena; senão redireciona para `/comunidades` |
| `/explorar` | Tela 5 | `?ordem=novos` |
| `/u/:handle`, `/perfil` | Tela 6 | `?aba=respostas` |
| `/arena` | Arena | inalterada nesta spec |
| `/grupos` | diretório de grupos externos | separado; link no rodapé da Tela 1 |
| `/desafios`, `/x1/:code`, `/d/:id`, `/b/:code` | X1 | inalterados; fora da navegação principal |
| `/historia/:id`, `/resenha/:id`, `/conto/:id` | **resolvedor**: chama `obter_topico(id)` (o id do tópico é o do post antigo) e faz `replace` para `/c/{slug}/t/{id}`. Sem linha: "Esse tópico não está disponível." | substitui `TelaHistoria` |
| `/feed` | **redireciona (`replace`) para `/comunidades`** no corte | #259 |
| `/comm`, `/comunidade`, `/bondes` | redirecionam para `/comunidades` | |
| `/comunidade/:slug`, `/comunidades/:slug` | redirecionam para `/c/:slug` | |
| `/perfil/:handle` | redireciona para `/u/:handle` | |
| Páginas públicas (`/como-jogar`, `/privacidade`, etc.) | inalteradas | tema claro fixo próprio (AGENTS §5) |

Nenhum link compartilhado quebra: toda rota antiga cai em algo útil.

### 14.2 O que fica do legado até o corte

O corte só acontece depois de #254 + #255 + #256 + #257 + #258 + #259 + #248 provarem a jornada (#251). Até lá:

- `/feed` e o feed antigo (`EntradaPrincipal`, `CardDeCauso`, `ComposerCauso`, `ModalNovoCauso`, `TelaHistoria`, `ColunaTendencias`, `AbaComunidades`, `DetalheComunidade`, `HeaderSocial`) continuam no ar e **não são editados** para esconder coisa.
- As telas novas do fórum entram **atrás do corte**, com a navegação nova (4 itens). A navegação antiga continua nas telas antigas. Camillo e Kayky decidem o mecanismo (flag de rota, prefixo temporário); o comportamento final de cada rota é o da tabela 14.1.
- `BarraInferiorMobile` e `BarraLateralNavegacao` **evoluem no lugar**: o conjunto de itens vira dado (os quatro do fórum), mais a remoção do `+` e do "Postar", rótulo visível e safe-area. O conjunto antigo some junto com o `/feed`. Não criar uma segunda navegação paralela.
- Código legado só sai em PR posterior ao corte (ADR 0010, item 6 da migração).

### 14.3 O que NÃO viaja (do protótipo antigo e do código atual)

- Feed, timeline, abas "Para você" / "Seguindo", filtro local de assunto (`includes('arroto')`).
- Qualquer composer de post avulso, botão "Postar", botão flutuante `+`.
- Curtida, coração, reação, repost, "duvidar", contagem de curtidas.
- Card de causo empilhado. (E a palavra "causo": a VOZ manda falar resenha, história, conversa; na tela usamos "tópico" e "resposta".)
- Aba "Ranking" da comunidade, "Comunidades em alta", "+340 posts hoje", "48,2 mil membros", "criada em 2026", "Moderação @fulano".
- Chips de categoria (Cerveja, Refri, Comida), botão e modal "Criar comunidade".
- Forma de onda de 28 barras sorteada pelo id (visual fabricado).
- Emoji como ícone, emoji do campo `icone`.
- Busca "no bonde", coluna de tendências, card de Telegram no aside (o diretório externo vive em `/grupos`).
- Chat, DM, notificação, silenciar, bloquear, recomendação, ranking de resposta, algoritmo de ordem invisível.
- Repost em feed global (#243), paginação de feed (#242), filtro de feed (#233).
- Marca em verde, verde em texto, verde em borda.

---

## 15. Acessibilidade (global)

**Estrutura**
- `<html lang="pt-BR">`. Marcos: `<nav aria-label="Principal">`, `<main id="conteudo">`, `<aside aria-label="Sobre a comunidade">`.
- **Um H1 por tela** (nome da tela, da comunidade ou título do tópico). Título de linha de lista é `<h2>`; seção dentro da tela é `<h2>`; a barra do topo nas telas aninhadas é `aria-hidden` para não duplicar o H1.
- Lista de tópicos e de comunidades: `<ul>`; respostas: `<ul>` aninhadas (9.4). Tempo em `<time datetime>`.
- Link é `<a>` com `href`; ação é `<button>`. Nunca `div` com `onClick` nem `tabIndex` remendando semântica (#247).
- Pular para o conteúdo: primeiro item focável.

**Teclado**
- Tab e Shift+Tab percorrem, nesta ordem: pular, navegação, barra do topo, conteúdo, aside. Nada que só funcione com mouse ou toque.
- **Foco sempre visível:** `:focus-visible` com anel de 2px `--fg` e 2px de afastamento (em botão verde também `--fg`). Nunca `outline: none` sem substituto. Contraste do anel de pelo menos 3:1.
- Menu de três pontos: padrão APG de menu (`aria-haspopup`, `aria-expanded`, setas, Esc devolve o foco ao botão). Abas do perfil: setas, Home, End. Alternância de ordem: dois botões com `aria-pressed`.

**Foco ao navegar, abrir e fechar**
- Mudou de rota: foco vai ao H1 da nova tela (`tabindex="-1"`) e o título do documento muda: "{Título do tópico} · {Comunidade} · Auê!", "{Comunidade} · Auê!", "Comunidades · Auê!", "Explorar · Auê!". (`document.title` e foco programático passam pela camada de plataforma.)
- Voltar do navegador devolve a rolagem e, quando possível, o foco ao link de onde a pessoa saiu.
- **Dialog (criar/editar tópico, apagar, denunciar):** usar `<dialog>` com `showModal()`; foco inicial no primeiro campo (formulário) ou em "Cancelar" (confirmação); Tab fica preso dentro; Esc fecha; ao fechar, **foco volta ao gatilho** (se o gatilho sumiu, ao H1). Esc num formulário com texto fecha e guarda o rascunho (6.8).
- Composer inline: abrir leva o foco ao campo; Cancelar ou Esc devolve ao botão "Responder"; enviar leva o foco à nova resposta.
- "Ver mais": foco no primeiro item novo.
- Participar com sucesso: foco no botão que o substituiu.

**Leitor de tela**
- Cada linha de lista lê **título primeiro**, depois autor, respostas e atividade, na ordem do DOM. Marcador "Fixado"/"Fechado" é texto, não só ícone.
- Regiões de status polidas e únicas por tela (`role="status"`): carregando, "Mais N tópicos carregados", "Resposta enviada.", "Tópico criado.", "Você entrou em {nome}.", "A internet voltou." Erros em `role="alert"`.
- Campo com erro: `aria-invalid="true"` e `aria-describedby` apontando para a mensagem e o contador.
- Player: botão com rótulo que troca entre "Tocar" e "Pausar", duração em texto; a barra de progresso é decorativa (`aria-hidden`).
- Casca de resposta lida como texto normal ("Resposta removida."), mantendo a estrutura da lista.
- Esqueleto `aria-hidden`; container com `aria-busy`.

**Cor, contraste, movimento, zoom**
- Tema claro e escuro com texto a pelo menos 4,5:1 (3.2). Estado nunca só por cor: "Fechado", "Fixado", erro e contador estourado têm texto.
- `prefers-reduced-motion` zera animação e transição. Sem autoplay de áudio.
- Reflow sem rolagem horizontal em 320px com zoom de 200%. Texto em `rem`.
- Alvos de toque de 44px (3.4) e espaçamento de 8px entre vizinhos.

---

## 16. Componentes: reaproveitar, evoluir, substituir

| Peça | Arquivo hoje | Destino |
|---|---|---|
| Navegação inferior | `components/BarraInferiorMobile.tsx` | **evolui**: itens como dado, rótulo visível, safe-area, sem `+`, esconde com teclado |
| Navegação lateral | `components/BarraLateralNavegacao.tsx` | **evolui**: 4 itens, logo como `<a>`, sem "Postar", bloco da pessoa, 76/275px |
| Barra do topo | `components/HeaderSocial.tsx` | **evolui** para o molde de 3 encaixes (4.5) |
| Larguras e tema | `useLayoutDaConversa.ts` | **reusa**; padrão de tema vira claro; acrescenta 1200px |
| Árvore de respostas | `components/ArvoreDeComentarios.tsx` + `nucleo/comunidade/comentarios.ts` | **evolui** (9.9) |
| Envio sem perder texto | `components/useEnvioDeResposta.ts` | **reusa** como está |
| Limites de texto | `nucleo/comunidade/limites.ts` | **reusa** e acrescenta os 3 limites novos |
| Volta do login | `nucleo/comunidade/caminhoDeVolta.ts` | **reusa** |
| Player e exclusividade de áudio | `CardDeCauso.tsx`, `plataforma/web/audioUnico.ts` | **extrai** para `PlayerDeAudio` (sem forma de onda fabricada) |
| Formulário | `ModalNovoCauso.tsx` | **evolui** para `FormularioDeTopico` (10.5) |
| Perfil | `features/perfil/TelaPerfil.tsx` | **reusa**; troca as abas |
| Card de causo, composer avulso, tendências, abas de comunidade, detalhe, história | `CardDeCauso`, `ComposerCauso`, `ColunaTendencias`, `AbaComunidades`, `DetalheComunidade`, `TelaHistoria` | **substituídos**; saem no PR posterior ao corte |
| Novos | | `ShellDoForum`, `TopoDaTela`, `LinhaDeComunidade`, `LinhaDeTopico`, `CabecalhoDaComunidade`, `CabecalhoDoTopico`, `AlternarOrdem`, `BotaoVerMais`, `PlayerDeAudio`, `CompositorDeResposta`, `FormularioDeTopico`, `CampoComContador`, `MenuDeAcoes`, `DialogoDeConfirmacao`, `DialogoDeDenuncia`, `SobreAComunidade`, `AbasDoPerfil`, `LinhaDeResposta`, `Esqueleto`, `EstadoVazio`, `EstadoDeErro`, `FaixaOffline`, `ResolvedorDeHistoria` |

Regra de camadas (AGENTS §4): `navigator`, `window`, `document`, `localStorage`, `visualViewport`, `Intl` de tempo no relógio e o cliente do Supabase só em `src/plataforma/`. As telas pedem por porta: conectividade, título do documento, armazenamento do rascunho, foco do teclado.

---

## 17. O que muda nos protótipos e no Design System (trabalho do Rian, antes do código)

Nada abaixo está feito. É o que falta para a trava de ouro fechar.

**Protótipos (`docs/design/prototipo/`)**
- `Comunidades.dc.html`: vira diretório + capa + lista de tópicos + **nova tela de tópico** + formulário de criar tópico. Remove categorias, "Criar comunidade", Ranking, "Moderação", contadores, "em alta".
- `Bonde do Arroto.dc.html`: **substituído** (hoje é o feed). Fica o perfil com as abas Tópicos e Respostas.
- `Jornada.dc.html`: fase "Bonde" vira "Comunidades"; "Postar no Bonde" vira "Responder ou iniciar tópico"; sai "Feed" e "Filtros: todos e seguindo".
- `Versões Webapp.dc.html`: quadros passam a ser Diretório, Comunidade, Tópico e Explorar em 320, 375, 430, 768 e 1280, claro e escuro (hoje: 1280, 820 e 390 só do feed).
- `Landing.dc.html`: o texto "Encontre sua turma. Conte o causo. Arrote." usa "causo" (VOZ proíbe). Revisar junto com o item 3 da seção 20.
- `Design System.dc.html`: acrescentar linha de lista, campo com contador, player sem forma de onda, faixa de aviso, casca de resposta.

**`DESIGN.md`**
- §6: navegação (Comunidades, Explorar, Arena, Perfil), fim do FAB e do "Postar", aside contextual, lateral larga a partir de 1200px, sem borda lateral na coluna central.
- §2.3: a "Prioridade 3" do verde ("Postar") some; a tabela da seção 3.6 passa a valer.
- §2: tema padrão claro.
- §5.3: player sem forma de onda quando o dado não existe.
- Citações de "Bonde do Arroto" como feed.

**Tokens no código**
- `src/index.css` não bate com o DESIGN.md v5 (cores base e `--border-strong`, que só existe em `Comunidade.css`). Alinhar antes das telas, na decisão do item 1 da seção 20.

---

## 18. Pedidos futuros ao banco (nada disto é desenhado hoje)

| # | Pedido | Por que |
|---|---|---|
| 1 | `regras` (e, se o Luiz quiser, `criada_em`) em `grupos`, com RPC de leitura | regras por comunidade em vez das regras da casa |
| 2 | Versão leve de `listar_topicos` **sem** `corpo` e sem caminho de áudio, com `tem_audio` (e `tem_nota`) também em `explorar_topicos` | lista não usa esse payload; permite o selo "com áudio" igual nas duas listas |
| 3 | `corpo_resumo` (primeira linha) em `explorar_topicos` | só se o Luiz quiser trecho no Explorar |
| 4 | `responder_topico` com `resultado_id` e `consentimento_audio_publico` | liberar "Arrotar para responder" (#258) |
| 5 | Chave de idempotência em `criar_topico` e `responder_topico` | tirar a ambiguidade do "tentar de novo" (6.7) |
| 6 | `HINT` no erro "Ação social exige conta promovida" | traduzir sem adivinhar por SQLSTATE |
| 7 | `obter_topico` devolver `status` e `comunidade_slug` para tópico oculto ou removido | casca de tópico e mensagem certa |
| 8 | Fixar, fechar e ocultar por moderador | #260; a UI já nasce preparada |
| 9 | Busca por título, global e por comunidade | #241 |
| 10 | Leitura de respostas "a partir do id" | link do perfil abrir direto a resposta |
| 11 | Ordem `recentes` com fixados primeiro (opcional) | comportamento igual nas duas ordens |
| 12 | Lista de membros (primeiros N, com avatar) | se o Luiz quiser mais que a contagem; envolve privacidade |
| 13 | `sou_membro` verdadeiro para conta promovida no `bonde-geral` | evitar o "Participar" falso (2.4, item 1) |
| 14 | Paginação em `listar_comunidades_do_forum` | quando passar de uns 100 |
| 15 | Prévia de link (ADR 0003) para `/c/:slug/t/:id`, e indexação dos tópicos públicos | compartilhar no zap; SEO (Rodrigo) |

---

## 19. Como o Rian vai validar (e o que o Kayky precisa mostrar)

Nada passa pelo desenho sem **a tela aberta**. Para cada tela (1 a 6) e cada estado da seção correspondente, o Kayky entrega captura ou preview em:

- **Larguras:** 320, 375, 430, 768, 1280.
- **Temas:** claro e escuro.
- **Papéis:** visitante, conta não-membro, membro, autor.
- **Estados:** carregando, vazio, erro, offline, tópico fechado, resposta casca, conteúdo longo (título de 120, mensagem de 1000, palavra gigante), "Ver mais" com falha.
- **Aparelho:** Safari de iPhone real (teclado + composer, tela cheia de criar tópico, barra inferior escondendo com teclado, safe-area), Chrome de Android, desktop.
- **Checagens duras:** zero rolagem horizontal, alvo de 44px, verde dentro do orçamento da 3.6, nenhum número que o servidor não mandou, nenhuma palavra "causo", "Feed" ou "Postar" na tela, foco visível e volta do foco ao fechar dialog.

Divergência de 1px que não tem motivo volta para a prancheta.

---

## 20. Decisões que são do Luiz (não decidi)

1. **Paleta clara.** (a) DESIGN.md v5, creme `#f5f3ea` (padrão provisório); (b) a das páginas públicas e da Landing, off-white `#f7f8f5` com superfícies esverdeadas; (c) o branco atual do código. Hoje existem duas famílias claras no produto (público e app) e o código tem uma terceira.
2. **Tema padrão claro** para todo mundo, ignorando o tema do sistema? E a **Arena**: fica escura fixa (impacto, verde sobre escuro) ou segue o tema da pessoa?
3. **A raiz `/` no corte.** Visitante vê a Landing (SEO, texto de venda) ou cai direto no diretório com apresentação? Decidir com Rodrigo.
4. **Regras da casa:** o texto provisório da seção 8.2 serve? Haverá regra por comunidade (exige campo no banco, pedido 1)?
5. **Membros:** só a contagem agora, ou lista com nome e avatar (privacidade de quem participa)?
6. **Perfil e navegação:** "Seguir" e seguidores ficam? "Com áudio" e "Curtidos" saem mesmo? O histórico de X1 em `/desafios` fica alcançável só por Arena e Perfil, já que Desafios sai da navegação principal?
7. **Explorar:** os rótulos "Atividade recente" e "Novos" servem? Terá busca na primeira versão (pedido 9) ou só depois? Terá também uma faixa de comunidades?
8. **Responder com áudio.** Aceitar a primeira versão **sem** "Arrotar para responder" no tópico (a #258 pede o botão, mas o banco ainda não suporta, pedido 4)?
9. **Emoji das comunidades.** Trocar por monograma em toda a UI e limpar o campo `icone` do banco, ou manter o campo sem exibi-lo?
10. **Criar comunidade.** O protótipo antigo tinha; o banco não tem RPC. Confirmar que só você abre comunidade por enquanto.
11. **Contagem pequena à mostra.** "1 membro" e "Nenhum tópico ainda" são reais e podem deixar a comunidade com cara de vazia. Mostrar sempre, ou esconder o número abaixo de um mínimo?
12. **Ordem do diretório.** Atividade recente primeiro (como está na spec) ou ordem alfabética estável?
13. **Vocabulário.** "Tópico", "Novo tópico" e "Responder" são as palavras do produto? A VOZ pede "resenha, história, conversa" e proíbe "causo".
14. **Denúncia.** Motivo em texto livre opcional (como está) ou lista fixa? Comunicar à pessoa o limiar de 3 denúncias, ou não?
15. **Acervo.** Nome e texto público da comunidade de acervo (ADR 0010, ainda aberto), e se os tópicos migrados aparecem no Explorar.
16. **Indexação.** Tópicos públicos entram no sitemap e viram página indexável? (muda a infraestrutura; com Rodrigo e Camillo.)
17. **Fixado e fechado.** Quem pode fixar e fechar, e quando entra a moderação (#260), já que a UI nasce preparada mas ninguém consegue produzir esses estados.
