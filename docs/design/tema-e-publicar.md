# Tema novo e publicar depois da nota — desenho

**Autor:** Rian (UX/UI e guardião do protótipo)
**Para:** Tiago (aceite), Kayky e Camillo (implementação), Marcelo (prova)
**Data:** 19/10/2026
**Cartões:** [0019](../../.agents/missoes/0019-tema-padrao-novo-em-todo-o-app.md) (tema) e [0018](../../.agents/missoes/0018-arena-publica-em-comunidade-ou-no-perfil.md) (publicar)
**Natureza:** só desenho. Nenhum arquivo de `src/` foi tocado. A trava de ouro vale: nada disto está validado em tela implementada; o que está validado é o protótipo aberto no Chromium (claro e escuro, 320, 375, 768 e 1280, zero rolagem horizontal).

## 0. Decisões que este documento carrega

Do Luiz: a Arena publica em comunidade **ou** no próprio perfil; o padrão novo de tema vale (claro creme por padrão, DESIGN.md v5). Do Tiago, adotadas porque o Luiz mandou seguir: Arena **escura fixa** por enquanto; responder tópico de perfil = qualquer conta promovida; tópico de perfil **não** aparece no Explorar; escolha antiga de escuro vira claro uma vez (marcador `bda-theme-v` = `2`); curtir tópico (#235) fica parado.

Protótipos novos ou alterados, todos em `docs/design/prototipo/`:

| Arquivo | O que mudou |
|---|---|
| `_ds/…/tokens/colors.css` | Tokens definidos uma vez por tema. Claro é o `:root`; escuro vem de `data-theme="dark"` |
| `_ds/…/base.css` | Foco e link sem verde; camada "Arena no claro" (seção 3) |
| `_ds/…/_ds_bundle.js` | Só ganchos de classe (`au-botao`, `au-nota`, `au-cronometro`, `au-ouro`, `au-ouro-texto`) |
| `Design System.dc.html` | Os dois temas lado a lado e a seção "O verde nos dois fundos" |
| `Arena.dc.html` | Escura fixa; claro só como prova (`?tema=claro`); ação "Publicar" no `RESULT`; navegação de quatro itens |
| `Publicar.dc.html` (novo) | Formulário no `RESULT`, convite do visitante, perfil com "No perfil", tópico depois de publicar |
| `Versões Webapp.dc.html` | Quadros em 320, 375, 430, 768 e 1280, claro e escuro, das telas acima |
| `Comunidades`, `Bonde do Arroto`, `Login`, `Jornada` | Só o padrão claro e a regra do marcador. Conteúdo antigo intocado |

---

## 1. Tema

### 1.1 Tokens definitivos

Valores do DESIGN.md v5, sem mudança. Todos conferidos por cálculo (WCAG).

| Token | Claro (padrão) | Escuro | Observação medida |
|---|---|---|---|
| `--bg` | `#f5f3ea` | `#0a0a08` | `--fg` sobre `--bg`: 17,8:1 nos dois |
| `--surface` | `#ebe9de` | `#171712` | |
| `--surface-2` | `#dedcd0` | `#1f1f18` | |
| `--fg` | `#0a0a08` | `#f5f3ea` | |
| `--muted` | `#57554a` | `#93917f` | sobre `--bg`: 6,7:1 claro, 6,2:1 escuro. (A spec do fórum §3.2 diz 6,9 e 6,4; os números acima são os medidos) |
| `--border` | `#d6d4c6` | `#2b2a22` | só separador, 1,3:1 |
| `--border-strong` | `#85836f` | `#74725f` | contorno de campo e botão: 3,45:1 claro, 4,07:1 escuro |
| `--ind` | igual a `--fg` | igual a `--fg` | **muda no escuro** (era `#c6ff00`): indicador de aba sem verde, porque a spec do fórum já usa `--fg` e o verde é orçado |
| `--accent` | `#c6ff00` | `#c6ff00` | |
| `--accent-strong` | `#a8d900` | `#a8d900` | só hover e pressionado de placa |
| `--accent-on` | `#0a0a08` | `#0a0a08` | sobre `--accent`: 16,7:1 |
| `--accent-contorno` (novo) | `fg` a 50% | nenhum | contorno interno de placa verde |
| `--gold` | `#f4c430` | `#f4c430` | no claro só como placa (seção 1.3) |
| `--danger` | `#c4161a` | `#ff3d3f` | texto: 5,4:1 e 5,0:1 sobre `--bg` e `--surface` no claro; **4,4:1 sobre `--surface-2`, abaixo de 4,5: mensagem de erro nunca sobre `--surface-2` no claro** |
| `--danger-strong` | `#9e1013` | `#e11a1c` | hover |
| `--silver`, `--bronze` | `#c7cad1`, `#c98a4b` | iguais | só preenchimento |
| `--fg-soft`, `--fg-soft-forte` | 6% e 11% de `--fg` | idem | `color-mix` em `srgb` (o fórum já usa; o DS usava `oklch`, unificar em `srgb`) |
| `--overlay-scrim` | `bg` a 92% | `bg` a 94% | |
| `--scrim` (novo) | `rgba(0,0,0,.5)` | idem | fundo do dialog (hoje hex solto no `forum.css`) |
| `--sombra-dialog` (novo) | `0 8px 32px rgba(0,0,0,.2)` | `.5` | idem |

**Correção à spec do fórum §3.2.** O contorno interno do botão verde no claro estava em `--fg` a 30%: dá 2,14:1 contra o creme, abaixo dos 3:1 de componente. Vale **50% (3,86:1)**. Escuro continua sem contorno.

**Estrutura recomendada para `src/index.css`:** `:root, [data-theme='light']` = claro; `[data-theme='dark']` = escuro. Assim, sem atributo e até sem JavaScript, a página sai clara. É o que `colors.css` do protótipo já faz.

### 1.2 Tabela de uso por superfície

| Superfície | Fundo | Texto | Linha/contorno | Verde |
|---|---|---|---|---|
| Página, coluna, barra do topo, barra inferior | `--bg` | `--fg` | `--border` | nenhum |
| Faixa de aviso, pílula do player, monograma | `--surface` | `--fg` / `--muted` | nenhum | nenhum |
| Avatar sem foto, selo de nota neutro | `--surface-2` | `--fg` | `--border-strong` (selo) | nenhum |
| Campo, select, botão contorno | transparente | `--fg` | `--border-strong` | nenhum |
| Hover de linha | `--fg-soft` | | | nenhum |
| Botão primário | `--accent` | `--accent-on` | contorno interno `--accent-contorno` | **placa** |
| Selo de nota "vai junto" | `--accent` | `--accent-on` (Anton) | `--accent-contorno` | **placa** |
| Erro técnico | `--bg` ou `--surface` | `--danger` | `--danger` no campo | nunca |
| Dialog | `--bg` | `--fg` | sombra `--sombra-dialog` | nenhum |
| Foco visível | | | `outline: 2px solid var(--fg)` | **nunca verde** |

Hoje `src/index.css` linha 138 tem `outline: 3px solid var(--accent)`: no creme o foco some. Passa a `--fg`, como o fórum já faz.

### 1.3 Bolha, Score e verde: no escuro e no creme

Medido no Chromium, protótipo `Arena.dc.html` e seção 2 do `Design System.dc.html`.

| Peça | Escuro | Claro (o que falha) | Claro (regra) |
|---|---|---|---|
| Bolha `recording` | placa `--accent`, 16,7:1 | 1,07:1: some | contorno `--fg` de 2px em **todos** os modos |
| Bolha `idle`, `judging`, `checking`, `holding`, `playing` | preenchimento tingido, 1,5 a 3,3:1 + `--border` | 1,02 a 1,23:1, silhueta some | idem: contorno `--fg` carrega a silhueta; o preenchimento continua derivado de token |
| Auê Score (Anton) | número `--accent` | texto verde, 1,07:1 | **selo**: Anton `--accent-on` sobre placa `--accent` com `--accent-contorno` (o mesmo selo de nota do fórum) |
| Cronômetro | número `--accent`, `--gold` aos 8s | idem | número `--fg`; aviso dos 8s como placa `--gold` |
| Vencedor e "Líder" | número `--gold` | ouro como texto, 1,48:1 | número do vencedor em placa `--gold` com `--fg`; "Líder" e nota da linha em `--fg` 700 |
| Botão primário e gatilho do microfone | placa verde com anel verde | placa sem borda | contorno interno 50% e anel `--fg` |
| Pódio da roda (não está no protótipo) | inicial `--bg` sobre `--accent`, pontos em `--accent` | texto verde e inicial creme sobre verde | inicial `--accent-on`; pontos `--fg` |
| Ponto "X1 aberto" do HUD (não está no protótipo) | `--accent` | some | `--fg` |

**Orçamento (máximo 2 por estado), contado nos dois temas:** `IDLE` 1 (gatilho); `RECORDING` 1 (Bolha); `JUDGING` 0 a 1 (Bolha tingida); `RESULT` 2 (nota e CHAMAR PRO X1); `CHALLENGE` 1; `SCOREBOARD` e empate 1 (REVANCHE). Ouro não conta como verde.

**Veredito sobre a Arena seguir o tema.** Viável, com as regras acima e **sem cor nova**: provado nos estados `IDLE`, `RECORDING`, `JUDGING`, `RESULT`, `CHALLENGE`, `SCOREBOARD` e empate do protótipo, em 375 e 1280. Não provado: `ERROR`, `VERSUS`, `REMATCH` com o 3, 2, 1, o pódio da roda e o `ORIGIN` (o protótipo não os desenha; a prova deles exige tela implementada). O custo é identidade: a nota deixa de ser "verde sobre preto" e vira selo, e o Art Bible diz que "o preto também é elemento gráfico". Por isso a recomendação do Rian é **manter fixa no escuro agora** e só liberar o tema na Arena quando as regras da tabela estiverem em tela real e provadas em aparelho. A decisão de abrir depois é do Luiz.

**O que Arena escura fixa exige (para o Kayky, sem implementar agora):**
1. A fixação vale para a **rota inteira** `/arena` (barra inferior, lateral, área segura e `theme-color` incluídos), não só para a coluna central. Coluna escura dentro de página creme parece defeito.
2. Ela é **da rota, não preferência**: a porta de tema expõe uma fixação temporária que não grava nada e devolve a escolha da pessoa ao sair.
3. O botão de tema **não aparece** dentro da Arena (botão que não faz nada é mentira).
4. `X1 por link` (`/x1/:code`, `/d/:id`, `/b/:code`) são os estados `VERSUS` e `SCOREBOARD` da Arena. Proposta: ficam escuros fixos também, para o mesmo estado não ter dois visuais. **A linha de matriz do cartão 0019 para X1 pede claro e escuro; precisa ser ajustada pelo Tiago** (depende do dono confirmar).
5. Quem fica claro: formulário de publicar, perfil, tópico, convite. Vindo do escuro da Arena para o claro, a troca é de tela, não de tema.

### 1.4 Botão de tema e estados

- Dois estados: claro e escuro. Sem "automático".
- Sem preferência guardada: **claro**, ignorando `prefers-color-scheme`. Abrir tela nunca grava.
- O botão grava `bda-theme` **e** `bda-theme-v = 2`, e só ele grava.
- Leitura: `bda-theme-v === '2'` e `bda-theme === 'dark'` → escuro. Qualquer outra combinação → claro (inclui `dark` antigo sem marcador, que a porta apaga).
- Armazenamento barrado (aba privada do Safari): a troca vale na sessão, sem gravar; o botão funciona no primeiro toque.
- Ícone mostra a **ação** (lua no claro, sol no escuro) e o rótulo diz a ação: "Tema escuro" / "Tema claro". `aria-pressed` não se aplica; o rótulo muda.
- Alvo 44px. Desktop: rodapé da lateral; celular: barra do topo (à direita).
- Foco visível `--fg`. Sem animação de troca (`prefers-reduced-motion` já zera).
- Páginas públicas: claro fixo próprio (`.publico-site`), sem botão, ignoram o escuro guardado.

### 1.5 `theme-color` e barra de status do iOS

| Modo | Regra |
|---|---|
| Safari em aba, Chrome Android | um único `<meta name="theme-color">`, valor inicial `#f5f3ea`; o script de boot e a porta o trocam para `#0a0a08` quando o tema (ou a fixação da Arena) é escuro. Não usar `media="(prefers-color-scheme)"`: o tema é da pessoa, não do sistema |
| Páginas públicas e estáticas de grupos | `#f7f8f5` (paleta pública, claro fixo). Hoje as 10 entradas HTML na raiz e `paginaEstatica.ts` (l. 96) dizem `#0a0a08` |
| Manifest (`vite.config.ts` l. 131 e 132) | `theme_color` e `background_color` passam a `#f5f3ea`: é o que aparece na abertura do app instalado, e o padrão é claro |
| iPhone, app na tela de início | `apple-mobile-web-app-status-bar-style` é **estático** e hoje é `black` (faixa preta sobre creme). Valor proposto: **`default`** (texto escuro, legível no creme). `black-translucent` deixaria o texto branco sobre o creme. **Limite:** não troca com o tema; com o escuro escolhido haverá faixa clara no topo. Não consegui provar o comportamento do iOS neste ambiente: precisa de aparelho (Marcelo), e o aceite diz em que modo foi visto |
| Área segura | `--bg` pintado atrás da barra inferior (`padding-bottom: env(safe-area-inset-bottom)` com fundo `--bg`), do topo e das laterais; `viewport-fit=cover` já existe |
| Entradas HTML | script mínimo de boot lê `bda-theme-v`/`bda-theme`, escreve `data-theme` e o `theme-color` antes da primeira pintura, igual em todas as entradas que carregam o app |

### 1.6 Inventário de hex solto (para o Kayky varrer)

**`src/index.css`**
- l. 19 a 34 e 81 a 89: `:root` escuro `#000000`, `#121212`, `#1c1c1e`, `#ffffff`, `#8e8e93`, `#222222`, `--accent-on #000000`, `--page-bg #000000`; claro `#ffffff`, `#f7f7f8`, `#ededf0`, `#000000`, `#666666`, `#e5e5e8`, `--page-bg #ffffff`. Trocar pelos valores da seção 1.1. Falta `--border-strong`, `--accent-contorno`, `--scrim`, `--sombra-dialog`, `--fg-soft-forte`.
- l. 15 e 81: `:root` escuro e `[data-theme='light']`; inverter conforme 1.1.
- l. 138: foco `var(--accent)`.
- l. 185: `rgba(0,0,0,.65)` em sombra.

**`src/features/forum/forum.css`**
- l. 14 a 23: bloco escuro completo repetido (`#0a0a08`, `#171712`, `#1f1f18`, `#f5f3ea`, `#93917f`, `#2b2a22`, `#74725f`, `#c6ff00`, `#0a0a08`, `#ff3d3f`). l. 43 a 50: bloco claro repetido. Apagar: passa a ler o token global.
- l. 90 e 94: `background: #0a0a08` e `#f5f3ea` no `html:has(...)`. Vira `var(--bg)`.
- l. 1288, 1295, 1415: sombra `rgba(0,0,0,.2/.5)`. Vira `--sombra-dialog`. l. 1298: `rgba(0,0,0,.5)` vira `--scrim`.
- Dívida `.forum-embutido` (PR #280, ainda aberta, não está na main): redefine `--border-strong: #74725f` e, em claro, `#85836f`. Zera com o token global.

**`src/features/comunidade/Comunidade.css`** l. 9 a 22 e 26 a 39: dois blocos completos com valores antigos (`#000000`, `#121212`, `#8e8e93`, `--border-strong #3a3a3c`, `--accent-strong #a6d900`, `--danger #ff4d4f`, `--overlay-scrim` com `rgba`). Claro com `--border-strong #888888`. `--ind` aqui é verde no escuro. Apagar; `l. 5 a 7` ainda declaram `--bg: #000000` e `--surface: #121212` em `:root`.

**`src/App.css`** l. 198 a 200: fallbacks `#3a3a3c`, `#1c1c1e`, `#ffffff`.

**Componentes com fallback hex em `var()`** (viram `var(--x)` puro): `CardDeCauso.tsx` 317, 340, 373, 411; `AbaComunidades.tsx` 200, 201; `ComposerCauso.tsx` 243, 244; `HeaderSocial.tsx` 93, 94; `DetalheComunidade.tsx` 206, 207; `TelaHistoria.tsx` 279, 280, 406, 407, 443, 464, 555, 556; `TelaRedefinirSenha.tsx` 61, 62, 94, 96, 100; `TelaVersoesWebapp.tsx` 12 a 77; `TelaDeConfiguracaoAusente.tsx` 39 a 56. **`CardDeCauso.tsx` l. 373 e `TelaHistoria.tsx` l. 464 usam `--accent` como cor de texto**: some no creme (regra: verde nunca é texto). `TelaHistoria.tsx` 443 e `CardDeCauso` 317 e 340 usam `--danger` para estado "curtido" e ação, não para erro técnico.
- Sombras `rgba` soltas: `BottomNav.tsx` 115 (verde a 30%), `AbaComunidades.tsx` 209 (verde a 25%), `AvisoDeOffline.tsx` 100, `BarraInferiorMobile.tsx` 126, `CardDeCauso.tsx` 307, `TelaComunidade.tsx` 886, 909, 1151, `ModalCardCompartilhamento.tsx` 75, 100. Sombra verde sobre creme é halo, não existe no DS: remover.
- `CartaoDaNota.tsx` l. 194: `fill="#c6ff00"` na marca do cartão 9:12. Cartão tem fundo escuro próprio, pode ficar, mas como constante nomeada.
- `src/nucleo/grupos/paginaEstatica.ts` l. 121 e 123: paleta própria com `prefers-color-scheme`, `#f6f5ee` em vez de `#f7f8f5`. Alinhar à paleta pública.
- `src/shared/publico/tema-claro.css` l. 20 a 33 e 188 (`color: #c4161a`), `LayoutPublico.css` 13, 88, `LayoutLegal.css` 9: paleta pública, fica, mas o comentário "o tema claro do app redefine `--accent` pra preto" está desatualizado.
- `src/arena/arena.css`: só comentários citam hex; sem hex solto em regra.

### 1.7 O que muda nos documentos

Feito nesta PR: `DESIGN.md` §2, §2.3, §6 (nota de barra e área segura), tabela de referências; `docs/design/AUÊ!.md` (direção, paleta, fundo escuro). Não toquei em `ARENA.md` nem em `AGENTS.md`.

---

## 2. Publicar depois da nota

### 2.1 Princípios

1. **Nada novo na Arena.** Os dez estados ficam. "Publicar" é ação do `RESULT` que **sai** da Arena para `/novo-topico`. Nem o convite do visitante, nem o formulário, nem o erro são sobreposição ou estado da Arena (`ARENA.md` §1 lista só assinatura, compartilhar e menu).
2. **Um formulário.** O da spec do fórum §10 (textos exatos mantidos) mais o campo **Destino**.
3. **Gravou para jogar não é autorizou publicar.** Caixa desmarcada, citando o destino.
4. **A tela não promete o que não sabe**: a nota publicada é a do servidor; o áudio público não é revogável para quem já ouviu.

### 2.2 A ação no `RESULT`

Rótulo: **"Publicar"** (VOZ proíbe "causo"; a spec do fórum §19 proíbe "Postar" na tela). Ocupa o lugar do antigo "Postar no bonde": segunda célula da grade de duas colunas, botão contorno, sem verde. Geometria do protótipo mantida. O principal continua **CHAMAR PRO X1**. Verde do `RESULT`: nota e CHAMAR PRO X1 (2).

- Não aparece quando a pessoa responde a um desafio (principal = VER O ESTRAGO), como o cartão pediu.
- Toca em "Publicar": navega para `/novo-topico`, sem enviar nada.
- Linha proposta para o Tiago pôr no `ARENA.md`, no `RESULT`, em **Ações**: "PUBLICAR (secundária) · leva ao formulário de novo tópico, fora da Arena. Não é estado nem sobreposição. Volta ao `RESULT` pela recuperação de sessão (§3). Não aparece quando a pessoa responde a um desafio."
- Dependência do Gate (ponto 4 do cartão 0018): o `ARENA.md` §3 diz que o áudio **não** sobrevive à reabertura. Por isso o formulário tem o estado "sem áudio" (2.6).

### 2.3 Formulário (rota `/novo-topico`, só alcançável pela Arena)

**Celular (menos de 700px): tela cheia**, sem barra inferior. Cabeçalho de 53px mais área segura: "Cancelar" (texto, 44px) à esquerda, "Novo tópico" ao centro, **"Criar tópico"** (verde, 44px) à direita, nunca no rodapé por causa do teclado. Gutter 16. **Tablet e desktop:** `<dialog>` de 560px, raio 24, `--sombra-dialog`, `--scrim` por trás; título dentro; rodapé fixo com "Cancelar" (contorno) e "Criar tópico" (verde); o corpo rola, o rodapé não. Atrás do dialog fica a Arena em `RESULT`, de onde a pessoa veio.

Ordem dos campos:

| Campo | Detalhe |
|---|---|
| **Destino** | label "Destino"; `<select>` nativo de 16px, 48px de altura, raio 12, `--border-strong`. Opção inicial desabilitada "Escolhe onde publicar" (**sem seleção padrão**). Depois, as comunidades de que a pessoa participa (só o nome, sem emoji), e **"Meu perfil" por último**. Abaixo, linha de apoio de 13px que muda com a escolha (tabela abaixo) |
| Título | "Título", 16px, placeholder "Sobre o que é a conversa?", contador `0/120` |
| Mensagem | "Mensagem", 16px, mínimo 6 linhas, placeholder "Conta o que rolou ou o que você quer perguntar.", contador `0/1000` |
| Seu arroto desta rodada | bloco abaixo |
| Descartar rascunho | texto, 44px, só com texto digitado |

Linha de apoio do Destino:

| Estado | Texto |
|---|---|
| sem escolha | "Escolhe onde o tópico vai ficar." |
| comunidade | "Aparece em {nome} e na aba Tópicos do seu perfil." |
| Meu perfil | "Vai só pro seu perfil, na aba Tópicos. Não entra em comunidade nem no Explorar." |
| nenhuma comunidade | "Você ainda não participa de nenhuma comunidade. Dá pra publicar no perfil, ou entrar numa antes." + link "Ver comunidades". **Não bloqueia**: "Meu perfil" continua escolhível |

**Bloco "Seu arroto desta rodada"** (acima dele, linha fina `--border`; sem cartão):
- Título 16/700 e, à direita, o **selo de nota** (Anton 24px). **O selo é neutro** (`--surface-2`, texto `--fg`, contorno `--border-strong`) enquanto a caixa está desmarcada e vira **verde** quando marcada. Motivo: selo verde com a caixa vazia sugere que a nota vai junto, e não vai. `aria-label` fala "Só vai se você autorizar". Verde do formulário: botão "Criar tópico" (1) e, só com a caixa marcada, o selo (2).
- Player do DS (pílula, duração e progresso reais; sem forma de onda; se o navegador não informa a duração, traço, nunca `0:07` inventado: #239).
- **Caixa de autorização, desmarcada, alvo de 44px.** Marcador preenchido em `--fg` (sem verde). Texto cita o destino:
  - comunidade: "Autorizo publicar meu arroto neste tópico, em {nome}. Qualquer pessoa pode ouvir, e quem tiver o endereço do áudio ouve mesmo fora do tópico. Posso apagar depois."
  - perfil: "Autorizo publicar meu arroto neste tópico, no meu perfil. Qualquer pessoa pode ouvir, e quem tiver o endereço do áudio ouve mesmo fora do tópico. Posso apagar depois."
  - sem destino ainda: a caixa fica **desabilitada** com "Escolhe o destino acima pra poder autorizar o arroto."
- Linha de apoio de 13px (`role="status"`): desmarcada, "Sem marcar, o tópico sai só com texto e o arroto continua privado."; marcada, "Apagar tira o áudio do ar, mas não desfaz quem já ouviu."
- **Trocar o destino desmarca a caixa.** A autorização foi dada citando um lugar; mudar o lugar invalida.
- Desmarcada: vai sem `resultado_id`. Marcada: `resultado_id` e `consentimento_audio_publico = true`, enviado **uma vez**.

### 2.4 Estados do envio

| Estado | O que a tela faz |
|---|---|
| **repouso** | "Criar tópico" ativo. Com campo inválido o botão **não** fica mudo: ao acionar, escreve o erro por campo ("Falta escolher o destino.", "Falta o título.", "Falta a mensagem.", "Passou do limite em N caracteres.") e põe o foco no primeiro. Borda do campo em `--danger` |
| **enviando** | botão "Enviando…" (`aria-busy`, segundo toque ignorado), campos somente leitura, select e caixa travados, "Cancelar" a 40% e inerte (não há como abortar com segurança). Região de status: "Criando o tópico…" ou, com arroto autorizado, "Enviando o arroto e criando o tópico…" |
| **erro com certeza** (validação, permissão; não gravou) | faixa `--surface` no topo, `role="alert"`: **"Não deu pra enviar."** + "Seu texto continua aqui, tenta de novo." + botão contorno "Tentar de novo". Erros por HINT seguem a tabela §6.6 da spec do fórum |
| **sem confirmação** (rede, tempo esgotado, 5xx) | faixa igual: **"Não deu pra confirmar o envio."** Texto, versão A (**vale hoje, sem idempotência**): "Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu." sem botão de tentar de novo. Versão B (**só depois do pedido 5 aplicado e provado pelo Marcelo**): "Seu texto continua aqui. Pode tentar de novo: se o tópico já tiver saído, ele não é criado duas vezes." + "Tentar de novo". Offline: "Sem internet. Seu texto continua aqui." |
| **sem áudio** | no lugar do bloco: "O áudio desta rodada não ficou guardado neste aparelho. O tópico sai só com texto." Sem player, sem selo, sem caixa (nota sem áudio seria mentira). Existe por causa do `ARENA.md` §3; confirmar com o parecer do Gate |
| **sucesso** | não é estado do formulário: navega (`replace`) ao tópico; foco no H1, toast "Tópico criado." (3s), rascunho apagado |
| **cancelar** | volta ao `RESULT` com nota e player; rascunho guardado; nada publicado. Esc e gesto de voltar igual |

### 2.5 Visitante e conta sem participação

Visitante e sessão anônima jogam sem barreira. Ao tocar "Publicar", em `/novo-topico` veem o **convite**, não o formulário: título "Publicar precisa de conta.", linha "Jogar na Arena você faz sem conta. Pra publicar o arroto e a nota, precisa de uma.", botões "Criar conta" (verde), "Já tenho conta" (contorno) e "Agora não" (volta ao `RESULT`). Um verde. O que acontece com o resultado na ida e volta do cadastro depende do Gate (ponto 4): se sobrevive, acrescentar "Depois de entrar você volta pra cá com a nota."; se não, a tela diz "Se der problema na volta, o arroto precisa ser refeito." O protótipo não promete nenhuma das duas. Conta promovida sem comunidade **publica no perfil**; nenhuma mensagem de "entra numa comunidade" bloqueia.

### 2.6 A marca "No perfil" na aba Tópicos

Na linha do tópico (perfil `/perfil` e `/u/:handle`), no lugar do nome da comunidade: ícone de pessoa de 14px mais **"No perfil"**, 13px/600 em `--fg`, **sem link** (o endereço do espaço pessoal leva ao perfil e não é lista). Sem chip, sem borda. Comunidade continua link sublinhado em `--muted`. Meta: `No perfil · 8 respostas · atividade há 3 h`. A mudança no código da PR #280 é só o rótulo (conforme o cartão).

### 2.7 O que a pessoa vê depois de publicar

- **Em comunidade:** `/c/:slug/t/:id`. Barra do topo com voltar para a comunidade; migalha "{Comunidade} › Tópico"; H1; autoria; mensagem; se autorizou, player com o selo verde à direita; "Sem respostas", "Ninguém respondeu ainda. Manda a primeira." e composer com "Enviar" (verde). Verde: selo e Enviar (2), igual à §3.6 da spec.
- **No perfil:** mesma tela, com migalha "No perfil de @handle" (link ao perfil), voltar leva ao `/perfil`, centro da barra "No perfil", item "Perfil" ativo na navegação, aside vazio. **Qualquer conta promovida responde.** Aparece na aba Tópicos do autor com "No perfil", acima dos demais (mais recente). **Não** aparece no Explorar, no diretório, em contagens nem na busca.
- Voltar do navegador não reabre o formulário (`replace`).
- Aberto em outro aparelho: o tópico é do servidor; o que não existe lá (áudio não autorizado) não aparece.

### 2.8 Acessibilidade e alvos

`role="dialog"` com `aria-modal` e título ligado; foco inicial no select, devolvido ao "Publicar" ao fechar; Esc fecha (menos enviando); `aria-describedby` do select e da caixa para as linhas de apoio; erros `role="alert"`; contadores `aria-live="off"`; campos a 16px (Safari); todos os alvos de 44px; `prefers-reduced-motion` zera o fade. Nada de verde em texto, borda ou foco.

### 2.9 Fora do desenho (e por quê)

- "Arrotar para responder" no tópico (#258) e CTA contextual (#236): dependem do pedido 4 ao banco; ficam para a etapa 6.
- "Meus X1" (#237): depende do Gate.
- Curtir tópico (#235): parado por decisão.
- Aside da Arena do protótipo (`Ranking de hoje` e `X1 abertos`) mostra dado que não existe; não é desta passada.
- `Login.dc.html` ainda tem botão de tema e paleta creme do app; o produto é claro fixo na paleta pública. Divergência registrada, não corrigida aqui.

---

## 3. Como validar

Abrir `docs/design/prototipo/Publicar.dc.html` (painel de revisão no topo troca vista, estado e tema; `?painel=0` esconde) e `Versões Webapp.dc.html`. Por parâmetro: `?estado=vazio|comunidade|perfil|autorizado|autorizado-perfil|enviando|erro|rede|falha|semaudio|semcomunidade|estourado`, `?vista=novo|convite|perfil|topico`, `?tema=claro|escuro`, `?sim=ok|erro|rede` e `?idem=1`. `Arena.dc.html?estado=RESULT&nota=91&tema=claro`. Fluxo simulado conferido: dark sem marcador abre claro; com marcador abre escuro; enviar vazio mostra os três erros; trocar destino desmarca a caixa; enviar leva ao tópico com toast.

Falta, e só se fecha com tela implementada: Safari iOS e Chrome Android reais, teclado e safe area, barra de status, retry sem duplicar, áudio subindo uma vez, e o contraste das telas que ainda não têm protótipo (Diretório, Comunidade, Explorar, `ERROR`, `VERSUS`).
