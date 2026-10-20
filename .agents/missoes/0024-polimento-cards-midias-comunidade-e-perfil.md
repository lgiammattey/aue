# Cartão de Missão 0024 — Polimento de Posts, Player Compacto, Mídias de Comunidade e Perfil em Colunas

> Aprovado pelo Tiago após direcionamento direto do Luiz em 20/10/2026.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:**
  1. Posts exibiam títulos destacados em `<h3>` como se fossem artigos/manchetes de blog, poluindo o feed de rede social ágil (Twitter/X).
  2. O widget de áudio (`PlayerDoArroto`) esticava em 100% da largura, consumindo espaço excessivo e parecendo um bloco pesado.
  3. Faltava a opção de personalizar a foto de perfil (avatar) e o thumbnail/capa (banner) da comunidade na gestão da comunidade.
  4. O perfil do usuário empilhava seções sem abas/colunas limpas de navegação.
  5. Os termos "Causo" e "Bonde" causavam estranheza e desconforto na experiência de uso.
- **Comportamento esperado na tela:**
  1. **Posts sem Título Duplicado:** Renderização fluida do texto do post (estilo tweet), sem bloco `<h3>` de título forçado.
  2. **Player Compacto:** O tocador de áudio vira uma pílula compacta e elegante (`inline-flex`, max-width ~360px), com botão play, onda sonora compacta e minutagem.
  3. **Fotos e Capas da Comunidade:** Modal de gestão de comunidade permite alterar a foto de perfil e a thumbnail/capa com upload e preview instantâneo.
  4. **Perfil em Colunas/Abas:** Aba `Posts`, `Arrotos` e `Salvos` organizadas em colunas limpas de navegação.
  5. **Vocabulário Refinado:** Substituição de "Causo" por "Post" / "Publicação" e "Bonde" por "Feed" / "Início" / "Roda".
- **Fora de escopo (Não vira):**
  - Alterar o algoritmo de notas ou a lógica interna de RLS.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** Ajuste visual e estrutural transversal em componentes de feed, perfil, comunidade e vocabulário.
- **Fonte de verdade afetada:** `docs/design/prototipo/Bonde do Arroto.dc.html`, `docs/design/prototipo/Comunidades.dc.html`, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (UI, CardDoPost, Player, Comunidade e Perfil)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão do Luiz:** 4 ajustes solicitados diretamente em 20/10/2026.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop e Webapp Mobile.
- **Maior risco de quebra ou mentira visual:** Quebra de seletores de teste existentes que busquem textos antigos ("Causos", "Bonde").
- **Limite da promessa:** Manter todos os testes e builds 100% verdes adaptando seletores onde necessário.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| CardDoPost sem h3 de título forçado, com texto fluido | Kayky / Rian | Código e visual | APROVADO |
| Player de áudio compacto em pílula inline (não ocupa toda a largura) | Kayky / Rian | CSS e visual | APROVADO |
| Modal de gerir comunidade com foto de perfil e thumbnail/capa com preview | Kayky / Marcelo | Componente e modal | APROVADO |
| Perfil com abas/colunas limpas (Posts, Arrotos, Salvos) | Kayky / Rian | Visual do perfil | APROVADO |
| Vocabulário "Causo" e "Bonde" substituído por "Post", "Feed" e "Roda" | Kayky / Rian | Telas e testes | APROVADO |
| `npm run typecheck`, `npm test` e `npm run build` 100% verdes | Marcelo | CI / Terminal | APROVADO |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/novo-aue/CardDoPost.tsx`: Título `<h3>` removido do card comum; texto flui como parágrafo social natural. Tag de tópico (`post-topic-tag`) só aparece quando o post tem corpo e o título for um marcador distinto.
  - `src/features/novo-aue/casca.css` e `InicioOpenDesign.css`: `.burp-player` transformado em pílula inline-flex compacta (`max-width: 360px`, `border-radius: 999px`) que não toma a tela inteira.
  - `src/portas/forum.ts`: Modelo `ComunidadeDoForum` enriquecido com `capaUrl?: string | null`.
  - `src/features/novo-aue/ModalGerirComunidade.tsx`: Inclusão de upload e troca de foto de perfil (avatar) e thumbnail/capa (banner) com pré-visualização instantânea e remoção.
  - `src/features/novo-aue/InicioOpenDesign.tsx`: Conexão do modal de comunidade com atualização imediata de mídias; perfil remodelado com abas/colunas navegáveis (`Posts`, `Arrotos`, `Salvos`); substituição de termos desconfortáveis ("Causos" -> "Posts", "Bonde" -> "Feed" / "Roda" / "Início").
  - `src/features/novo-aue/BarraSuperior.tsx`, `PainelDireito.tsx`, `ModalCompositor.tsx`, `VersaoMobileOpenDesign.tsx`: Ajustes de vocabulário alinhados à nova experiência.
  - `src/features/novo-aue/InicioOpenDesign.test.tsx`, `TelaComunidadeOpenDesign.test.tsx`, `TelaPerfilOpenDesign.test.tsx`: Seletores alinhados aos novos rótulos.
- **Parecer do Marcelo:**
  - `npm run typecheck` passou com 0 erros (TypeScript rigoroso).
  - Vitest executou toda a suíte com **1879 testes aprovados** (163 arquivos de teste verdes).
  - `npm run build` gerou a distribuição de produção Vite com PWA v1.3.0 sem advertências.
- **Veredito Final do Tiago:** `APROVADO`.
- **Pendências ou decisão necessária do Luiz:** Nenhuma pendência restante. As quatro dores foram resolvidas na raiz.
