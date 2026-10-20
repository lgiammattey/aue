# Cartão de Missão 0023 — Migração Visual e Unificação das Comunidades e Tópicos no OpenDesign

> Obrigatório antes de o Iury abrir execução na oficina. Aprovado pelo Tiago após escolha direta do Luiz pela opção 1 em 20/10/2026.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:**
  1. A tela de comunidade específica (`/c/:slug`) ainda apresentava visual incompleto, sem a fidelidade ao protótipo canônico [`docs/design/prototipo/Comunidades.dc.html`](../../docs/design/prototipo/Comunidades.dc.html) (faltavam abas `Causos` e `Sobre`, cabeçalho imersivo com monograma de 64px e compositor contextual).
  2. A rota de acesso direto ao tópico (`/c/:slug/t/:id`) ainda caía na casca legada de texto (`ShellDoForum` / `TelaTopico`), quebrando o padrão de 3 colunas e webapp mobile do OpenDesign.
  3. Na listagem de comunidades no mobile (`VersaoMobileOpenDesign`), clicar na comunidade apenas alternava a inscrição, sem permitir entrar na página da comunidade para ler os tópicos.
- **Comportamento esperado na tela:**
  1. **Página de Comunidade (`/c/:slug`) 1:1 com `Comunidades.dc.html`:**
     - Barra de topo com botão voltar (`←`), nome da comunidade e contagem de membros reais.
     - Hero com monograma de destaque (64px), botão ágil de "Entrar/Entrou" e descrição.
     - Abas `Causos` (stream de tópicos com `CardDoPost` e áudio/notas) e `Sobre` (regras da comunidade e moderação).
     - Compositor ágil de causo quando a pessoa é membro.
  2. **Acesso Direto ao Tópico (`/c/:slug/t/:id`):**
     - Integrado diretamente ao OpenDesign, abrindo a comunidade correspondente com o tópico em destaque na `ThreadDeComentarios` (stream de respostas, gravação de áudio em 1 clique e botão voltar para a comunidade).
  3. **Diretório e Mobile:**
     - No mobile e no diretório, clicar na linha da comunidade navega para a página `/c/:slug`.
- **Fora de escopo (Não vira):**
  - Alterar a Arena, o algoritmo YAMNet ou pontuação.
  - Criar chat privado ou notificações em tempo real.
  - Quebrar links legados de compartilhamento.
- **Pista (Lane):** Full flow comum (UX/UI de comunidades e rotas).
- **Por que esta pista:** Harmoniza telas centrais de navegação social, migra rota do fórum para o OpenDesign e exige auditoria visual do Rian e qualidade do Marcelo.
- **Fonte de verdade afetada:** `docs/design/prototipo/Comunidades.dc.html`, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`, `ADR 0010`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas e Rotas) e Camillo (Arquitetura do OpenDesign)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado (reutilização das portas de fórum e comunidades existentes sem alterações no schema)
- **Auditoria e Prova Real:** Marcelo
- **Decisão do Luiz:** Prioridade 1 confirmada pelo Luiz em 20/10/2026.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop (3 colunas) e Webapp Mobile.
- **Maior risco de quebra ou mentira visual:** Quebrar os testes de rotas do fórum (`/c/:slug/t/:id`) ou perder estado ao alternar abas da comunidade.
- **Limite da promessa:** Preserva a leitura das respostas e tópicos existentes através da porta do fórum.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Cabeçalho da comunidade com monograma, membros, abas `Causos`/`Sobre` e regras | Kayky / Rian | Código e visual (`InicioOpenDesign.tsx`) | APROVADO |
| Rota `/c/:slug/t/:id` carrega tópico em `ThreadDeComentarios` no OpenDesign | Kayky / Marcelo | Teste unitário e rota | APROVADO |
| Clicar em comunidade no mobile navega para `/c/:slug` | Kayky / Marcelo | `VersaoMobileOpenDesign.tsx` | APROVADO |
| `npm run typecheck`, `npm test` e `npm run build` 100% verdes | Marcelo | CI / Terminal (163 arquivos, 1879 testes) | APROVADO |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/novo-aue/InicioOpenDesign.tsx`: cabeçalho sticky com botão voltar, monograma Anton de 64px, abas canônicas `Causos` e `Sobre`, integração com carregamento direto de tópico por URL.
  - `src/features/novo-aue/TelaComunidadeOpenDesign.tsx`: suporte a `topicoIdInicial` via `:id` de rota.
  - `src/features/novo-aue/TelaComunidadeOpenDesign.test.tsx`: testes de alternância entre `Causos` e `Sobre` e de rota direta `/c/:slug/t/:id`.
  - `src/features/novo-aue/VersaoMobileOpenDesign.tsx`: navegação direta para `/c/:slug` ao tocar na linha da comunidade, com clique isolado no botão entrar.
  - `src/features/forum/rotas.tsx`: parametrização de `incluirTopico` para evitar rotas duplicadas.
  - `src/App.tsx`: roteamento de `/c/:slug/t/:id` direcionado para `TelaComunidadeOpenDesign`.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` (1879 testes passando em 163 arquivos, typecheck sem erros e build de produção gerado).
- **Veredito Final do Tiago:** `APROVADO` (experiência de comunidades e tópicos unificada no OpenDesign 1:1 com `Comunidades.dc.html`, eliminando cascas legadas e mantendo rotas fluidas).
- **Pendências ou decisão necessária do Luiz:** nenhuma. Entrega concluída.
