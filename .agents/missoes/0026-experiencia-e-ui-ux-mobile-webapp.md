# Cartão de Missão 0026 — Experiência, UI e UX do Webapp Mobile (Auê Mobile 1ª Classe)

> Aberto pelo Tiago com aprovação do Luiz em 20/10/2026.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:**
  No celular, o Auê estava renderizando uma casca que espremia a sidebar desktop no rodapé. Como resultado, o botão de postar/arrotar sumia, o atalho para a Arena desaparecia, Comunidades e Desafios (X1) ficavam inacessíveis na barra de navegação, e os botões de ação nos posts tinham alvos de toque muito pequenos (< 26px), gerando cliques acidentais e sensação de site desktop encolhido.

- **Comportamento esperado na tela:**
  1. **Navegação Inferior na Zona do Polegar (Bottom Bar com 5 alvos):**
     - `Feed` (Bonde / Início)
     - `Comunidades` (Diretório r/...)
     - `[ARROTAR]` (Botão central de ouro, destacado em verde elétrico `--aue-accent`, levando direto à Arena `/arena`)
     - `X1` (Central de Desafios e Duelos `/desafios`)
     - `Perfil` (Meu perfil e notas `/perfil`)
  2. **Ergonomia e Toque (Tap Targets >= 44px):**
     - Botões de ação dos cards (ouvir, curtir, resenhar, salvar, compartilhar) com altura e área de clique de pelo menos 44px.
  3. **Sensação Nativa de Webapp (PWA):**
     - `overscroll-behavior-y: contain` para travar o efeito elástico do navegador.
     - `-webkit-tap-highlight-color: transparent` e `user-select: none` em controles para evitar flashes e seleção de texto indevida.
     - Respeito integral a `env(safe-area-inset-bottom)`.
  4. **Topbar Mobile Ágil:**
     - Identidade e avatar acessíveis sem espremer o topo.

- **Fora de escopo (Não vira):**
  - Não alterar regras de negócio ou contratos do Supabase.
  - Não mexer na lógica interna da Arena de 10 estados (`Arena.tsx`).
  - Não criar aplicativo de loja (reiterado pelo Luiz: produto 100% web).

- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** Melhora de usabilidade e arquitetura de componentes visuais do mobile sem quebra de contratos de banco.
- **Fonte de verdade afetada:** `casca.css`, `BarraLateral.tsx`, `InicioOpenDesign.css`, `CardDoPost.tsx`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Frontend/UI) e Camillo (Plataforma/PWA)
- **Especificação e Auditoria Visual:** Rian
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma (formato de navegação 5 abas aprovado pelo Luiz).

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS e Chrome Android) e Desktop (que deve permanecer 100% intacto no layout de 3 colunas).
- **Maior risco de quebra ou mentira visual:** Quebrar a renderização desktop ou quebrar suíte de testes existente do `InicioOpenDesign` e `BarraLateral`.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Barra inferior com as 5 abas canônicas (Feed, Comunidades, Arrotar, X1, Perfil) no mobile (< 700px) | Kayky / Rian | Código / Testes | aprovado |
| Botão central de arrotar leva para `/arena` com destaque verde elétrico | Kayky / Marcelo | Código / Testes | aprovado |
| Desktop (>= 700px) continua com a barra lateral esquerda completa e sem regressão | Marcelo | Testes automatizados | aprovado |
| Alvos de toque (`.action-btn`) nos cards com mínimo 44px de área tocável no mobile | Kayky / Rian | CSS / Mobile viewport | aprovado |
| Banners de anúncio patrocinados (`AdsterraNativeBanner`) compactos e contidos no mobile (máx 72px de altura) | Kayky / Rian | CSS / Mobile viewport | aprovado |
| Suíte de testes (`npm test`) 100% verde sem quebras (1904 testes) | Marcelo | Vitest | aprovado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/novo-aue/BarraLateral.tsx` (Bottom bar mobile de 5 abas dedicada na zona do polegar + desktop nav preservada)
  - `src/features/novo-aue/BarraSuperior.tsx` (Topbar mobile com wordmark `AUÊ!`)
  - `src/features/novo-aue/AdsterraNativeBanner.tsx` (Estrutura semântica limpa e classes CSS para anúncios)
  - `src/features/novo-aue/casca.css` (Regras de layout mobile, bottom navigation 5 colunas com botão central de ouro elevado, safe-area, overscroll-behavior e limite compacto para anúncios patrocinados no mobile: máx 72px)
  - `src/features/novo-aue/InicioOpenDesign.css` (Ergonomia mobile dos cards, tap targets >= 44px, player de áudio com botão play de 40px)
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Testes 100% verdes (167 arquivos / 1904 testes), build de produção e PWA concluído com zero erros de compilação/tipos.
- **Veredito Final do Tiago:** `APROVADO` — A navegação na palma da mão atende integralmente à diretriz do Luiz, colocando o arroto no centro do webapp e os alvos de toque na zona ergonômica do polegar.

