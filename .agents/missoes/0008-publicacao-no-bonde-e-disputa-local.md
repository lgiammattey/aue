# Cartão de Missão 0008 — Postar na Comunidade a partir da Arena & Loop Fechado

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** Quando a Arena é exibida dentro da aba do Bonde ou como rota dedicada, clicar em "POSTAR NO BONDE" na tela de resultado pós-arroto (RESULT) caía em um link estático `/feed` sem abrir o modal de publicação do causo preenchido com a nota, áudio e consentimento de publicação do arrotador.
- **Comportamento esperado na tela:**
  1. No estado `RESULT` da Arena, clicar em "POSTAR NO BONDE" aciona `onPostarNoBonde` passando nota, duração e áudio gravado.
  2. A `TelaComunidade` recebe o resultado, direciona o arrotador de volta para o Bonde (tab 'feed'), abre o composer/modal de publicação preenchido com a nota e contexto do arroto.
  3. O consentimento explícito de áudio público é respeitado antes de publicar o causo no feed.
  4. O causo publicado aparece imediatamente no topo do feed com a nota e tag correspondente.
- **Fora de escopo (Não vira):** Feed pago, NFTs ou postagem automática sem confirmação do arrotador.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Fecha o loop canônico da experiência: `ARENA → DEPOIS DA NOTA → BONDE (FEED)`.
- **Fonte de verdade afetada:** `ARENA.md`, `JORNADA.md`, `LOOP.md`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (UI e integração Arena-Bonde) & Lucas (Contratos de áudio e dados)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop & Webapp Mobile
- **Estados obrigatórios:** Arena RESULT, Transição para o Bonde, Composer pré-preenchido com a nota, Causo publicado no feed.
- **Maior risco de quebra ou mentira visual:** Perder a nota ou não gravar o consentimento do jogador.
- **Limite da promessa:** Postagem só é enviada após o toque de confirmação no Bonde.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Clicar em POSTAR NO BONDE na Arena abre o fluxo de publicação no Bonde com a nota | Kayky | Código / Vitest | aprovado (`onPostarNoBonde` passa nota e contexto) |
| Causo resultante aparece no feed com a nota obtida na Arena | Kayky | Código / Vitest | aprovado (`TelaComunidade.test.tsx`) |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado (13/13 testes e tsc limpo) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/TelaComunidade.tsx`: passagem de callback `onPostarNoBonde` na montagem da Arena que redireciona para o feed abrindo o modal com a nota pré-preenchida.
  - `src/features/comunidade/TelaComunidade.test.tsx`: teste cobrindo a transição de resultado da Arena para o Bonde via modal de causo.
- **Parecer do Marcelo:** SEM ACHADOS MATERIAIS. O loop `ARENA → DEPOIS DA NOTA → BONDE` agora é contínuo e fechado. A nota gravada não se perde no limbo e o consentimento explícito de publicação é mantido. Vitest e Typecheck limpos.
- **Veredito Final do Tiago:** APROVADO. A engrenagem social do jogo fecha seu ciclo de ponta a ponta.
- **Pendências ou decisão necessária do Luiz:** nenhuma

