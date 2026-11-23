# Missão 0057: tirar os cards das telas

> Aberta a pedido do Luiz em 23/11/2026. Regra de origem: [`DESIGN.md` §4.1](../../docs/design/design-system/system/DESIGN.md#41-card-é-exceção) (PR #373). Esta missão é a autorização explícita de mudança visual que o §4.1 exige para telas já aprovadas, **limitada ao que o Luiz aprovar na Fase 1**.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** as telas estão cheias de caixa com borda, fundo e raio em tudo que é canto. Parece painel de admin, não rede social. O Auê tem que ler como timeline: conteúdo direto na superfície, separado por espaço e filete.
- **Comportamento esperado na tela:** seção, ranking, filtro, métrica, formulário, cabeçalho e widget lateral viram bloco chapado (título, conteúdo, filete de 1px `--border`). Continua card: post/resenha, resultado de X1, comunidade em grade, modal, sheet, card 9:12.
- **Fora de escopo (Não vira):** trocar tema, paleta, tipografia (Anton + Archivo), layout de 3 colunas, bottom nav ou rotas. Não mexe em `CardDoPost` além do que for card dentro de card. Nada de componente legado/zumbi (`CardDeCauso`, `ComposerCauso`). Não cria tela nem estado novo. `/landing` **entra no inventário** por pedido do Luiz (23/11/2026), mas mantém a família visual clara e as fontes próprias; só as caixas são avaliadas.
- **Pista (Lane):** Full flow comum, **em fatias por rota**. A Fase 1 é Exploração (zero código).
- **Por que esta pista:** é só CSS e marcação dentro dos componentes canônicos, sem contrato, banco ou áudio. Mas muda aparência de tela aprovada, então precisa de lista aprovada e comparação antes/depois por rota.
- **Fonte de verdade afetada:** `DESIGN.md` (§4.1 já escrito), `MAPA_DE_PAGINAS_E_FLUXOS.md`. Protótipos em `docs/design/prototipo/` seguem como referência de geometria.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. **Uma rota por vez**, uma entrega fechada antes de abrir a próxima.
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian (faz o inventário da Fase 1 e especifica o "como fica" de cada rota)
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** aprovar a lista da Fase 1 (quais telas e blocos perdem a caixa, e em que ordem). Sem essa aprovação, Kayky não abre código.

## 2b. Decisões do Luiz (23/11/2026, após o inventário do Rian)

Inventário em [`docs/escopo/inventario-cards-0057.md`](../../docs/escopo/inventario-cards-0057.md).

1. **Anúncios** viram widget chapado. O rótulo "Anúncio"/"Patrocinado" continua visível (rotulagem não se perde).
2. **Resposta em thread**: filete, como no X.
3. **`/como-arrotar` e `/tipos-de-arroto`**: o Luiz acha que não precisam existir agora (conteúdo já está na home, rotas não indexadas). **Não removidas aqui.** Ambas estão no `sitemap.xml` e na `/en` e remover rota mexe em SEO, redirecionamento e testes. Ficam **congeladas** nesta missão (sem trabalho de card) até decisão de missão própria com Rodrigo.
4. **Moldura da Arena em `/x1`** (440px, raio 32px, só desktop): Luiz delegou. Decisão do Tiago: **sai**. Desktop usa coluna central sem moldura de celular; mobile ocupa a largura da tela. Tem que funcionar nos dois.
5. **Tiles de origem e linha do link do desafio**: são controles (escolher origem do áudio, copiar o link), como botão e campo. **Ficam.**
6. **Post no perfil**: **filete** (não card). Vale remover o conflito `perfilArena.css:38` x `:50`.
7. **Tema claro**: não é requisito agora. Risco removido da missão.
8. **Login**: a tela continua existindo e funcionando. Só sai a caixa do formulário e da `/landing`. Autorizado ajustar `contrato-visual.spec.ts:46`.
9. **`/desafios` e `/resenha/:id` (legadas)**: sem resposta do Luiz. Ficam **fora** da missão até ele decidir.
10. **Mapa de telas**: autorizado corrigir (rotas que redirecionam, perfil morto, landing escura). Feito.

**Execução (23/11/2026):** fatia 1 coluna direita da casca; fatia 2 informativas, ranking e grupos; fatia 3 `/admin`; fatia 4 `/feed` e `/seguindo` (palco da Arena, filtros em abas de 44px, hero, estados, anúncio nativo), mais o envio dos eventos de funil ao GA4; fatia 5 perfil (painel de placar, estados, post em filete) e conexão do admin com o GA4 preparada e **pendente** (`docs/technical/ga4-no-admin.md`); fatia 6 comunidades e conversa (lista de tópicos, resposta em filete, formulário de resposta, faixa de áudio do compositor, estados). `.gravador-direto` ficou de fora: precisa de microfone para conferir; fatia 7 `/landing` (formulário, abas com sublinhado, faixas), login (formulário sem caixa, `contrato-visual.spec.ts:46` ajustado como o Luiz autorizou), moldura de celular da Arena no desktop removida e `fieldset` do duelo chapado. A prévia de post da landing e o placar `dl` do duelo continuam como card (item de post e resultado de X1). Ordem das próximas segue o inventário: informativas, ranking, admin, feed/seguindo, perfil, comunidades/compositor, landing, login, Arena/X1.

## 3. Fases

1. **Inventário (Rian, Exploração).** Por rota, em desktop e mobile: listar cada caixa (borda + `--surface` + raio) e classificar `fica` (item repetível ou moldura funcional), `sai` (vira chapado) ou `dúvida`. Candidatos de partida, pelos CSS com mais superfícies: `InicioOpenDesign.css`, `casca.css` (rightbar, widgets), `arena.css`, `forum.css`, `TelaAdministracao.css`, `LayoutPublico.css`, `perfilArena.css`, `TopArrotadores.css` (Liga/ranking em painel), `conteudoDaHome.css`. Entrega: tabela rota → caixa → decisão, com captura atual. Rian leva ao Luiz.
2. **Aprovação do Luiz.** Ele marca o que sai e a ordem das rotas.
3. **Execução por rota (Kayky).** Remove borda/fundo/raio da superfície e troca por espaço e filete. Sem mudar token, fonte, tema ou grid. Cada rota fecha com Marcelo e Rian antes da próxima.
4. **Encerramento.** Mapa de telas atualizado e Tiago emite veredito.

## 4. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS / Chrome Android) e Desktop.
- **Estados obrigatórios da Arena:** inicial, gravando, analisando áudio, resultado, erro, microfone negado. A Arena não perde estado nem muda de fluxo.
- **Maior risco de quebra ou mentira visual:** (1) tema claro, onde a caixa às vezes era o único contraste, e o texto passa a ficar solto sobre `--bg`; (2) agrupamento perdido, com blocos colados sem separação; (3) tirar a caixa de algo que era clicável e perder a área de toque de 44px; (4) regressão em teste que asserta classe ou estilo de card (ex.: `estilosDoPerfil.test.ts`, `casca.layout.test.ts`, `contrato-visual.spec.ts`). Teste verde não aprova aparência: ajustar expectativa só com o visual aprovado pelo Luiz.
- **Limite da promessa:** a missão tira caixas. Não promete redesenhar hierarquia nem copy das telas.

## 5. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

Estado em 23/11/2026, ao fim da fatia 7. "Evidência de execução" é o que foi medido por quem implementou; não substitui a auditoria do Marcelo.

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Inventário de caixas por rota, com decisão `fica/sai/dúvida` | Rian | Navegador desktop e mobile | **feito** (`docs/escopo/inventario-cards-0057.md`; rotas sem sessão só pelo código, marcadas [C]) |
| Lista aprovada pelo Luiz antes de qualquer código | Tiago | Registro nesta missão | **feito**, §2b. Item 9 (`/desafios`, `/resenha/:id`) ficou sem resposta e foi tratado como fora de escopo |
| Rota executada sem caixa em seção/lista/ranking/filtro/formulário e sem card dentro de card | Rian | Captura antes/depois, 390px e 1440px | **parcial**. Medido por script (nenhuma caixa de conteúdo sobrando) e capturas "depois" em 390px e 1440px, tema escuro. Sem comparação antes/depois salva. Tema claro fora do escopo (decisão do Luiz). Perfil com posts, comunidades, thread, compositor e `/x1` com desafio real: só por código |
| Itens que ficam card seguem card (post, X1, comunidade em grade, modal, sheet) | Rian | Captura | **parcial**. Confirmado por código e nas rotas abertas; modais e sheets não foram abertos |
| Alvos de toque >= 44px e foco visível preservados | Marcelo | Chrome Android / Safari iOS ou emulação | **parcial**. Filtros do feed subiram de 38px para 44px (medido). O resto não foi remedido; foco visível não foi alterado |
| `scrollWidth === innerWidth` em 390px (`DESIGN.md` §6.1) | Marcelo | Navegador mobile | **feito nas rotas abertas** (home, feed, seguindo, grupos, ranking, como-jogar, privacidade, landing, login, admin, `/x1`, perfil sem dados). Não medido em rota com sessão e dados |
| Tema, tipografia, moldura e layout de 3 colunas intactos | Rian + Marcelo | Contrato visual E2E | **pendente do CI** (run 512). `contrato-visual.spec.ts:46` foi ajustado com autorização do Luiz; a moldura de celular da Arena no desktop saiu por decisão do Tiago |
| `typecheck`, `lint`, `test`, `build` | Marcelo | CI | `typecheck` e `test` locais verdes até a fatia 6 (2572 testes); fatia 7 em verificação. CI verde nas runs 506, 509 e 511. `lint` rodado só nos arquivos tocados, não no repositório inteiro. **`build` e E2E: só pelo CI** |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela").

## 6. Encerramento e Parecer Final

- **Arquivos/módulos alterados** (PR #373):
  - Regras: `AGENTS.md`, `DESIGN.md` §4.1 e §6.1, `MAPA_DE_PAGINAS_E_FLUXOS.md` (corrigido contra `App.tsx`), skills `design-ui`, `construir-interface` e `garantir-web`.
  - Trava lateral mobile: `index.css`, `TopArrotadores.css`, `arenaV2.css`.
  - Fatia 1 (coluna direita): `appShell.css`, `casca.css`.
  - Fatia 2 (informativas, ranking, grupos): `LayoutArenaPublica.css`, `LayoutPublico.css`, `TopArrotadores.css`, `ListaDeGrupos.tsx`.
  - Fatia 3 (`/admin`): `TelaAdministracao.css`.
  - Fatia 4 (feed e seguindo): `casca.css`, `appShell.css`, `arenaV2.css`, `conteudoDaHome.css`, `perfilArena.css`.
  - Fatia 5 (perfil): `perfilArena.css`.
  - Fatia 6 (comunidades e conversa): `InicioOpenDesign.css`, `InicioOpenDesign.tsx`.
  - Fatia 7 (landing, login, Arena): `TelaLanding.css`, `authArena.css`, `arena.css`, `dueloV2.css`, `e2e/contrato-visual.spec.ts`.
  - GA4: `analyticsArenaV2.ts` (espelha eventos de funil), `telemetria.ts`, porta e adaptador pendentes do admin (`analyticsAdministrativo.ts`), bloco no `TelaAdministracao.tsx`, `docs/technical/ga4-no-admin.md`.
- **Parecer do Marcelo:** **não emitido.** O Marcelo não foi acionado nesta missão. A evidência acima é de quem implementou e não vale como auditoria independente. Antes do aceite: auditar contrato visual, toque de 44px e overflow em rota com sessão e dados.
- **Veredito Final do Tiago:** **não emitido.** Proposta para o Tiago: `APROVADO COM RESSALVAS`, condicionada a CI verde na run 512 e a o Luiz olhar as telas com sessão em produção.
- **Ressalvas conhecidas:**
  1. Cards que ainda existem e deveriam seguir a regra: `.vitrine-apps--feed` (anúncio da vitrine dentro do feed, o Luiz decidiu "anúncio é widget"), `.guia-arena` da `/como-arrotar` e do `/tipos-de-arroto` (congeladas), `.gravador-direto` (precisa de microfone) e `.od-groups__card` (regra base e override divergem em raio e sombra).
  2. Código morto que não foi tocado: `PerfilConectado.css`, `PerfilDoUsuario.css`, `forum.css`, `TelaLogin.css`.
  3. Telas legadas `/desafios` e `/resenha/:id`: fora da missão até decisão.
  4. Onde ficou chapado só pelo código, sem ver renderizado: perfil com posts, comunidades, thread, compositor, Arena com desafio real, admin com sessão real.
- **Pendências ou decisão necessária do Luiz:**
  1. ~~Remover ou manter `/como-arrotar` e `/tipos-de-arroto`~~ **Decidido em 23/11/2026: ficam.** O Luiz quer um guia especializado novo, com passo a passo por tipo, referenciado pela página principal. Missão [0058](0058-guia-de-arroto-por-tipo.md).
  2. Decidir `/desafios` e `/resenha/:id`.
  3. Medições do admin (funil completo, CTR/CPM, falha de áudio, dispositivo) e o que o admin do Signal Key lê no Firebase, para destravar a conexão com o GA4 (`docs/technical/ga4-no-admin.md`).
  4. Olhar um perfil, uma comunidade e uma Arena reais depois do deploy.
