# Cartão de Missão 0004 — Interações Sociais & Feed Vivo

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** As interações no feed (curtidas com coração, reposts e comentários em threads) ficavam salvas apenas no navegador local. Ao recarregar ou abrir em outro dispositivo, comentários e curtidas sumiam para os outros usuários. Além disso, o player de áudio em causos de texto puro simulava reprodução silenciosa sem avisar que era apenas um causo textual, e as denúncias não eram enviadas ao banco de moderação.
- **Comportamento esperado na tela:**
  1. Curtir e repostar sincronizam com a tabela `reacoes` do Supabase quando online (com fallback local transparente quando offline).
  2. Adicionar resposta a um causo grava na tabela `comentarios` do Supabase com autor e conteúdo, permitindo que outros membros visualizem a thread.
  3. No card de causo, se não houver áudio anexado (causo textual puro), o player de áudio não fica fingindo tocar no mudo — o card exibe honestamente o texto com a identificação do causo.
  4. Denúncias são enviadas de forma assíncrona para a tabela `denuncias` do Supabase, ocultando o post imediatamente na tela do denunciante com feedback ("Causo ocultado").
- **Fora de escopo (Não vira):** Chat em tempo real via websockets pesados, reações com emojis arbitrários de terceiros.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Integração de persistência no backend (Supabase) para o loop social do Bonde do Arroto.
- **Fonte de verdade afetada:** `VISAO.md`, `JORNADA.md`, `ADR 0001`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (Supabase & Portas de Dados) & Kayky (UI e Players)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado (operações assíncronas de banco isoladas na camada `plataforma/web/comunidade.ts`)
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop & Webapp Mobile
- **Estados obrigatórios:** Causo com áudio, Causo somente texto, Thread vazia, Thread com respostas, Estado de denúncia.
- **Maior risco de quebra ou mentira visual:** Perder curtidas ou comentários em caso de falha de conexão.
- **Limite da promessa:** Modo offline usa persistência local no navegador (`localStorage`) sem quebrar a tela.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Alternar curtida grava localmente e sincroniza na tabela de reações | Lucas | Código / Vitest | aprovado |
| Adicionar comentário na thread persiste na tabela `comentarios` | Lucas / Kayky | Código / Vitest | aprovado |
| Causo sem áudio não executa timer fake de 3s no player | Kayky | Código / Vitest | aprovado |
| Denúncia persiste na tabela `denuncias` com motivo e oculta o causo | Lucas / Kayky | Código / Vitest | aprovado |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/components/CardDeCauso.tsx`
  - `src/plataforma/web/comunidade.ts`
  - `src/plataforma/web/comunidade.test.ts`
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Sincronização limpa com o Supabase sem bloquear a UI, eliminação do falso áudio timer, moderação e testes passando com sucesso.
- **Veredito Final do Tiago:** `APROVADO`
- **Pendências ou decisão necessária do Luiz:** Nenhuma. Transição automática para a Fase 4 (Desafios X1 & Conexão com a Arena).
