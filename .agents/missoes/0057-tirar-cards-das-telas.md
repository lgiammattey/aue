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

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Inventário de caixas por rota, com decisão `fica/sai/dúvida` | Rian | Navegador desktop e mobile | pendente |
| Lista aprovada pelo Luiz antes de qualquer código | Tiago | Registro nesta missão | pendente |
| Rota executada sem caixa em seção/lista/ranking/filtro/formulário e sem card dentro de card | Rian | Captura antes/depois, escuro e claro, 390px e 1440px | pendente |
| Itens que ficam card seguem card (post, X1, comunidade em grade, modal, sheet) | Rian | Captura | pendente |
| Alvos de toque >= 44px e foco visível preservados | Marcelo | Chrome Android / Safari iOS ou emulação | pendente |
| `scrollWidth === innerWidth` em 390px (trava lateral, `DESIGN.md` §6.1) | Marcelo | Navegador mobile | pendente |
| Tema, tipografia, moldura e layout de 3 colunas intactos | Rian + Marcelo | Contrato visual E2E | pendente |
| `typecheck`, `lint`, `test`, `build` | Marcelo | CI | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela").

## 6. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
- **Parecer do Marcelo:**
- **Veredito Final do Tiago:**
- **Pendências ou decisão necessária do Luiz:** aprovar a lista da Fase 1.
