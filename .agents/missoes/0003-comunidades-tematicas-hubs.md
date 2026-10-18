# Cartão de Missão 0003 — Comunidades Temáticas (Hubs Completos & Detalhe)

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** Clicar em uma comunidade na lista de comunidades apenas aplicava um filtro básico na timeline geral. Não existia o Hub da comunidade como desenhado no protótipo canônico (`Comunidades.dc.html`), com capa, regras, moderação, aba de ranking dos maiores arrotos daquele tema e composer direto na comunidade.
- **Comportamento esperado na tela:**
  1. Lista de comunidades (`AbaComunidades`) ganha filtro de categorias no topo ("Todas", "Bebidas", "Histórias", "Competição", "Vexame").
  2. Clicar em qualquer comunidade abre a visão de Detalhe da Comunidade (`DetalheComunidade`) 1:1 com o protótipo:
     - Header sticky com botão `← Voltar`, nome e total de membros.
     - Capa de 140px com iniciais gigantes Anton e resumo (ano de fundação, descrição, botão Entrar / Participando).
     - 3 Abas internas:
       - **Posts**: Composer inline se participante + causos postados naquela comunidade com reprodução de áudio, nota Anton e interações.
       - **Ranking**: Lista ordenada dos melhores scores obtidos naquela comunidade com posições (1º, 2º, 3º...), avatar, `@handle` e nota.
       - **Sobre**: Bloco de Regras oficiais da comunidade e nomes dos moderadores.
  3. Rota `/c/:slug` ou `/comunidade/:slug` suportada para acesso direto a qualquer comunidade.
- **Fora de escopo (Não vira):** Chat privado em grupo, moderação automatizada por IA, permissões complexas de cargos no grupo.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Nova tela de detalhe de comunidade integrando componentes existentes com fidelidade 1:1 ao protótipo `Comunidades.dc.html`.
- **Fonte de verdade afetada:** `VISAO.md`, `JORNADA.md`, `docs/design/prototipo/Comunidades.dc.html`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas/UI) & Lucas (Estrutura de dados da comunidade)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop (3 colunas) & Webapp Mobile (iPhone Safari / Android Chrome)
- **Estados obrigatórios:** Lista de comunidades com categorias, Detalhe com abas (Posts, Ranking, Sobre), Estado de membro vs não membro.
- **Maior risco de quebra ou mentira visual:** Perder o contexto de navegação ou quebrar o player de áudio dentro do feed da comunidade.
- **Limite da promessa:** Comunidades sem arrotos gravados ainda exibem estado vazio honesto ("Nenhum arroto registrado neste ranking ainda").

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Filtro de categorias filtra a lista de comunidades | Kayky / Rian | Código / Vitest | aprovado |
| Clicar em uma comunidade abre o detalhe com capa, membros e botão entrar | Kayky / Rian | Código / Vitest / Navegador | aprovado |
| Aba Ranking lista os maiores scores da comunidade em ordem decrescente | Lucas / Kayky | Código / Vitest | aprovado |
| Aba Sobre exibe as regras oficiais e moderação do grupo | Rian / Kayky | Código / Vitest | aprovado |
| Clicar em Voltar retorna para a lista de comunidades | Kayky | Código / Vitest | aprovado |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/components/DetalheComunidade.tsx`
  - `src/features/comunidade/components/AbaComunidades.tsx`
  - `src/features/comunidade/TelaComunidade.tsx`
  - `src/App.tsx`
  - `src/features/comunidade/TelaComunidade.test.tsx`
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Detalhe da comunidade 1:1 com o protótipo canônico, rotas `/c/:slug` ativas, testes vitest e typecheck passando.
- **Veredito Final do Tiago:** `APROVADO`
- **Pendências ou decisão necessária do Luiz:** Nenhuma. Transição automática para a Fase 3 (Interações Sociais & Feed Vivo).
