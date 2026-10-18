# Cartão de Missão 0005 — Desafios X1 & Conexão com a Arena

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** A aba de desafios no Bonde exibia 3 cards com dados fixos mockados. Criar um desafio gerava um modal sem link real, o botão "Duvidar" nos causos não conectava à Arena e o botão "Revanche" não abria a disputa de verdade.
- **Comportamento esperado na tela:**
  1. A lista de desafios na aba `Desafios` passa a carregar os desafios reais persistidos do jogador (com histórico de status: Ganhou, Perdeu, Esperando).
  2. "Chamar pro X1" gera um desafio real com código válido e link (`/b/:code`), pronto para ser enviado via card 9:12 ou copiado.
  3. Clicar em "Duvidar" em qualquer causo do feed cria ou direciona para o desafio direto contra aquele arrotador na Arena.
  4. Clicar em "Revanche" em qualquer card da aba de Desafios abre a disputa diretamente na Arena para gravação do round de resposta.
- **Fora de escopo (Não vira):** Ligas formais, apostas ou monetização de duelos.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Conecta o Bonde do Arroto ao motor central de batalhas da Arena.
- **Fonte de verdade afetada:** `ARENA.md`, `JORNADA.md`, `ADR 0001`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (Contratos de Desafios) & Kayky (UI e Conexão com Arena)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop & Webapp Mobile
- **Estados obrigatórios:** Criando desafio, Desafio criado com link, Respondendo na Arena, Placar do duelo.
- **Maior risco de quebra ou mentira visual:** Gerar link que não abre na Arena.
- **Limite da promessa:** Desafios sem resposta do oponente ficam no estado honesto "Esperando".

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Chamar pro X1 persiste o duelo e gera link com código da Arena | Lucas / Kayky | Código / Vitest | aprovado (`TelaComunidade.test.tsx`) |
| Clicar em Revanche direciona para a disputa correspondente na Arena | Kayky | Código / Vitest | aprovado (`Arena codigoDoDesafio={desafioAtivoCodigo}`) |
| Botão Duvidar no causo inicia o fluxo de desafio contra o autor | Kayky | Código / Vitest | aprovado (preenche oponente e abre modal) |
| Lista de desafios exibe dados dinâmicos salvos | Lucas / Kayky | Código / Vitest | aprovado (`salvarDesafioSocialLocal` & `obterDesafiosSociaisLocais`) |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado (11/11 testes e tsc limpo) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/plataforma/web/desafios.ts`: contratos de persistência `obterDesafiosSociaisLocais()` e `salvarDesafioSocialLocal()`.
  - `src/features/comunidade/components/AbaDesafios.tsx`: consome desafios locais persistidos por padrão.
  - `src/features/comunidade/TelaComunidade.tsx`: persistência no fluxo de criação de desafios, passagem de `desafioAtivoCodigo` para `<Arena />` na aba Arena, e acionamento de `aoRevanche`.
  - `src/features/comunidade/TelaComunidade.test.tsx`: teste de ponta a ponta cobrindo criação, persistência e revanche com volta ao Bonde.
- **Parecer do Marcelo:** SEM ACHADOS MATERIAIS. Os desafios persistem no armazenamento local de forma honesta, o modal gera o código e o card de compartilhamento correspondente, e clicar em Revanche monta a Arena com o `codigoDoDesafio` apropriado. Vitest (11/11) e TypeScript checados sem erro.
- **Veredito Final do Tiago:** APROVADO. A conexão do Bonde com a Arena no fluxo de duelos X1 está de pé, respeitando o loop do jogo e sem dados engessados.
- **Pendências ou decisão necessária do Luiz:** nenhuma

