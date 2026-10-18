# Cartão de Missão 0002 — Perfis de Usuário & Identidade Social

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O usuário não consegue ver o perfil de outro arrotador. Ao clicar na foto ou no `@handle` de quem postou um causo, comentou ou apareceu na barra lateral, nada acontece. Além disso, a aba de perfil atual só lê dados locais do navegador com cartel e contagens estáticas, sem permitir inspecionar o histórico ou áudios de outros membros do Bonde.
- **Comportamento esperado na tela:**
  1. Clicar no avatar ou `@handle` de qualquer autor de causo, comentário ou sugestão abre o perfil completo daquele usuário na coluna central (mantendo o layout desktop 3 colunas e webapp mobile).
  2. Suporte a rota `/perfil/:handle` (e `/perfil` para o próprio perfil).
  3. O perfil exibe: capa/banner, avatar com iniciais ou foto, nome, `@handle`, bio, cidade, melhor nota de arroto, cartel no X1, contagem de comunidades e abas internas (Posts, Áudios com nota, Curtidas).
  4. Se for o próprio perfil, exibe o botão "Editar perfil" com formulário; se for perfil de outro arrotador, exibe botão de "Seguir / Seguindo" funcional e botão de "Chamar pro X1".
  5. Fallback honesto para arrotadores pré-existentes ou anônimos, listando os causos reais filtrados por aquele autor.
- **Fora de escopo (Não vira):** Chat privado (DM), feed algorítmico personalizado, sistema de seguidores obrigatório para arrotar.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Nova funcionalidade de navegação e visualização de perfil no Bonde do Arroto, conectando componentes existentes sem quebrar contratos de persistência.
- **Fonte de verdade afetada:** `VISAO.md`, `JORNADA.md`, `docs/design/prototipo/Bonde do Arroto.dc.html`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas/UI) & Lucas (Modelos de dados/Perfil)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado (leituras e escritas através da porta de dados e plataforma web, sem chamadas diretas de window/localstorage fora de `plataforma/`)
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma (decisão de implementação de todas as pendências fase a fase aprovada)

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop (3 colunas) & Webapp Mobile (iPhone Safari / Android Chrome)
- **Estados obrigatórios:** Perfil próprio (com edição), Perfil de terceiros (com seguir/X1), Perfil não encontrado / vazio.
- **Maior risco de quebra ou mentira visual:** Mostrar números falsos de seguidores ou quebrar navegação ao voltar pro feed.
- **Limite da promessa:** Perfis que não postaram áudios mostram estado vazio honesto ("Nada por aqui ainda").

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Clicar no autor de um causo abre o perfil daquela pessoa | Kayky / Rian | Código / Vitest / Navegador | aprovado |
| Clicar em "Perfil" na barra lateral/inferior abre o meu perfil com edição | Kayky | Código / Vitest / Navegador | aprovado |
| Perfil de terceiros tem botão de Seguir e Chamar pro X1 em vez de Editar | Rian / Kayky | Código / Vitest | aprovado |
| Abas de Posts e Áudios filtram os causos reais daquele arrotador | Lucas / Kayky | Código / Vitest | aprovado |
| Rota `/perfil/:handle` renderiza o perfil correspondente | Kayky | Código / Vitest | aprovado |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado (1123 testes) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/nucleo/usuario/perfil.ts`
  - `src/plataforma/web/perfil.ts`
  - `src/features/comunidade/components/CardDeCauso.tsx`
  - `src/features/comunidade/components/ColunaTendencias.tsx`
  - `src/features/comunidade/components/AbaPerfil.tsx`
  - `src/features/comunidade/TelaComunidade.tsx`
  - `src/App.tsx`
  - `src/features/comunidade/TelaComunidade.test.tsx`
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Navegação fluida sem loops, 1123 testes passando em 99 arquivos, typecheck limpo, zero mocks inventados.
- **Veredito Final do Tiago:** `APROVADO`
- **Pendências ou decisão necessária do Luiz:** Nenhuma. Transição automática para a Fase 2 (Comunidades Temáticas).
