# Cartão de Missão 0009 — Lançamento Faseado: Feed de Causos e Áudios de Arroto (Recorte Enxuto)

> Aberto pelo Tiago (PO & Braço Direito do Luiz) em 18/10/2026.
> Ajustado para **Recorte Enxuto** após feedback direto do Luiz ("Acho que o recorte ainda está muito grande").

---

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O Auê cresceu muito em complexidade de motor e regras. Para validar a tração real de audiência e compartilhamento sem atrito nem sobrecarga, o lançamento foi enxugado para o essencial:
  1. Cortados os vídeos embutidos (YouTube / TikTok) por enquanto.
  2. Cortados comentários aninhados (respostas de respostas); mantidos comentários em lista reta e simples.
- **Comportamento esperado na tela:**
  1. **Home (`/`) como Feed do Bonde:** Feed vertical contendo cards de histórias de arroto estilo Twitter.
  2. **Card no Feed e Leitura Completa:** O card mostra até 120 caracteres com condensamento (`...`). Ao clicar no card ("abrir história completa"), abre a página de leitura de conto dedicada (`/historia/:id` ou `/conto/:id`) com URL compartilhável própria, texto completo, áudio e comentários.
  3. **Envio de Causos e Áudio Sem Login:** Qualquer pessoa pode enviar áudio (gravado pelo mic ou enviado com até 2 minutos de duração) e/ou texto informando apenas seu nickname (apelido).
  4. **Curtidas (Likes):** 1 like por post por aparelho com contador de curtidas e descurtir.
  5. **Comentários Simples (Lista Reta):** Comentários diretos no causo, sem aninhamento complexo, com identificação por apelido e sem login.
  6. **Compartilhamento:** Botão de compartilhar em cada causo (Web Share API nativo no mobile ou cópia de link no desktop).
  7. **Preservação da Arena:** O jogo completo da Arena continua preservado e 100% funcional na rota `/arena`, com um botão discreto no topo do feed (*"Jogar o Auê"*) para quem quiser jogar o duelo/avaliação de arroto com a IA.
- **Fora de escopo neste recorte:**
  - Embeds de YouTube e TikTok (cortados para manter o produto leve e focado no arroto puro).
  - Respostas aninhadas em árvore (threads profundas).
  - Login obrigatório para postar ou comentar.
- **Pista (Lane):** **Full flow sistêmica** (Gate Arquitetural de Camillo / Lucas).
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md`, rotas, feed e componentes de causos.

---

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Gate Arquitetural:** Camillo e Lucas
- **Especificação UX/UI e Design System:** Rian
- **Implementação:** Kayky (Feed, Card com 120 caracteres + expansão, Tela de Conto, Comentários planos, Header) + Lucas / Camillo (Porta de comunidade e persistência)
- **Auditoria e Prova Real:** Marcelo (Testes unitários e de integração, typecheck, lint, build e checagem de regressão da Arena)

---

## 3. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Rota `/` exibe feed de causos com aparência estilo Twitter | Rian / Kayky | Visual / Navegador | aprovado |
| Card condensa texto em 120 caracteres com `...` e link para abrir história completa | Marcelo | Teste unitário & Visual | aprovado |
| Página de leitura dedicada (`/historia/:id`) exibe conto completo e URL compartilhável | Marcelo / Kayky | Teste unitário & Navegador | aprovado |
| Áudio de até 2 min pode ser gravado ou enviado sem login via nickname | Marcelo / Lucas | Navegador / Plataforma | aprovado |
| Curtidas com contador persistido por aparelho e opção de descurtir | Marcelo | Teste & Navegador | aprovado |
| Comentários exibidos em lista reta e simples (sem aninhamento confuso) | Marcelo / Kayky | Teste unitário & Visual | aprovado |
| Botão "Jogar o Auê" no topo leva à Arena `/arena` sem quebrar nada do jogo | Marcelo | Navegador | aprovado |
| Pipeline automatizado 100% verde (`typecheck`, `lint`, `test`, `build`) | Marcelo | Local / CI (1.141 testes em 103 arquivos) | aprovado |

---

## 4. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/components/CardDeCauso.tsx` e `src/features/comunidade/CardDeCausoRecorte.test.tsx` (120 caracteres com `...`, lista simples de comentários, player de áudio e ações)
  - `src/features/comunidade/TelaHistoria.tsx` e `src/features/comunidade/TelaHistoria.test.tsx` (página de conto dedicada, leitura fluida, comentários planos)
  - `src/features/comunidade/components/ComposerCauso.tsx` (gravação de áudio até 2min e texto com nickname sem login)
  - `src/features/comunidade/components/HeaderSocial.tsx` (botão 'Jogar o Auê' sempre acessível no topo do feed)
  - `src/features/comunidade/TelaComunidade.tsx` e `src/App.tsx` (roteamento `/`, `/historia/:id` e `/conto/:id`)
  - `src/nucleo/comunidade/causosPadrao.ts` (sementes de causos com áudios e histórias)
  - `src/portas/comunidade.ts` e `src/plataforma/web/comunidade.ts` (contrato limpo de comunidade)
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — 1.141 testes passando em 103 arquivos, typecheck 100% verde, build limpo em 188ms, zero erros de linter.
- **Veredito Final do Tiago:** `APROVADO`. O recorte ficou muito mais leve, direto ao ponto, focado nas histórias e áudios de arroto com viralização fácil no WhatsApp.
