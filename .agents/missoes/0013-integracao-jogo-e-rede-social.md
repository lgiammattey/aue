# Cartão de Missão 0013 — Integração do Jogo (Arena) ao Restante do Site

> Autorizado pelo Luiz em 18/10/2026 com "Sinal verde".

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O jogo (Arena) e o site/rede social (Bonde do Arroto, Comunidades) pareciam dois produtos desconexos e paralelos. Ao clicar em arrotar, a casca do site sumia e o jogador caía numa tela preta vazia com botão improvisado "Voltar pro Feed", perdendo menu lateral, ranking, perfil e barra inferior no mobile.
- **Comportamento esperado na tela:**
  - A Arena passa a viver dentro da mesma casca unificada: 3 colunas no Desktop (menu 275px + Arena 600px + tendências/ranking 320px) e Webapp Mobile com header de status ("Auê" + estado em mono) e barra inferior de 56px com safe-area.
  - A guia **Auê** (com ícone do microfone) passa a fazer parte da `BarraLateralNavegacao` e da `BarraInferiorMobile`.
  - Clicar em "Arrotar" no composer, no FAB mobile ou no menu navega para a aba da Arena dentro do layout integrado, sem recarregar tela nem abrir tela preta.
  - Na finalização do arroto, o botão "Postar no bonde" devolve o jogador direto ao feed com o arroto pronto para publicação sem descontinuidade.
- **Fora de escopo (Não vira):**
  - Não mexe em regras acústicas de pontuação nem em fórmulas do motor de áudio.
  - Não cria novas rotas desnecessárias nem altera os 10 estados canônicos da Arena.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Ajuste em múltiplos componentes de navegação (`BarraLateralNavegacao`, `BarraInferiorMobile`, `TelaComunidade`, `App.tsx` e estilos de responsividade da Arena).
- **Fonte de verdade afetada:** `docs/design/prototipo/Arena.dc.html`, `docs/design/prototipo/Bonde do Arroto.dc.html`, `docs/jogo/JORNADA.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas/Arena/Navegação)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Não aplicável (sem alteração de backend/banco/áudio engine)
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma (sinal verde concedido)

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop (3 colunas >= 1060px) e Webapp Mobile (Safari iOS / Chrome Android < 700px).
- **Estados obrigatórios da Arena:** Mantidos íntegros dentro da coluna central de 600px.
- **Maior risco de quebra ou mentira visual:** A Arena ter elementos com largura fixa ou scroll duplo que quebrem a coluna central de 600px.
- **Limite da promessa:** Microfone segue pedindo permissão de navegador e respeitando política de privacidade.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Aba "Auê" presente na barra lateral desktop com ícone de microfone | Rian | Código / Visual | Validado |
| Aba "Auê" presente na barra inferior mobile com ícone de microfone | Rian | Código / Visual | Validado |
| Arena renderiza dentro da coluna central (600px) com menu e tendências no desktop | Rian / Marcelo | Desktop >= 1060px | Validado |
| Arena renderiza no mobile mantendo header com status e bottom nav fixa | Rian / Marcelo | Mobile < 700px | Validado |
| Botão "Arrotar" alterna para a Arena sem tela preta isolada | Marcelo | Fluxo real | Validado |
| Botão "Postar no bonde" após nota leva ao feed com dados do arroto | Marcelo | Fluxo real | Validado |
| `typecheck`, `lint` e `test` passam 100% | Marcelo | Terminal / CI | Validado (117 arquivos, 1301 testes) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/arena/arena.css`
  - `src/features/comunidade/components/BarraLateralNavegacao.tsx`
  - `src/features/comunidade/components/BarraInferiorMobile.tsx`
  - `src/features/comunidade/components/HeaderSocial.tsx`
  - `src/features/comunidade/TelaComunidade.tsx`
  - `src/features/comunidade/TelaHistoria.tsx`
  - `src/features/perfil/TelaPerfil.tsx`
  - `src/App.tsx`
  - `src/App.test.tsx`
  - `src/features/comunidade/TelaComunidade.test.tsx`
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Arena perfeitamente contida na coluna central de 600px no Desktop e no Webapp Mobile com barra inferior mantida. Nenhum scroll horizontal ou vazamento de trilha. 1301 testes verdes, lint limpo e build gerado com sucesso.
- **Veredito Final do Tiago:** `APROVADO` — A Arena deixou de ser um app à parte jogado num fundo preto deserto e passou a ser o coração do Bonde do Arroto, como desenhado nos protótipos canônicos.
- **Pendências ou decisão necessária do Luiz:** Nenhuma.
