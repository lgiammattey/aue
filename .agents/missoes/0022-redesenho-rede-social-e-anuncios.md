# Cartão de Missão 0022 — Redesenho de Rede Social (Estilo Twitter/X) & Ativação de Anúncios

> Obrigatório antes de o Iury abrir execução na oficina. Aprovado pelo Tiago após alinhamento direto com o Luiz.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** 
  1. A exibição atual do feed, postagens e comentários usa botões crus de texto (`[♡ Curtir]`, `[★ Salvar]`, emojis soltos) e um modal pop-up de 90vh para ver respostas, quebrando o ritmo do feed e a usabilidade em telas mobile/desktop.
  2. O envio de áudio e anexos possui etapas redundantes e botões de seleção estranhos que não conversam com o padrão de rede social ágil (Twitter/X).
  3. A monetização de anúncios (Adsterra) foi solicitada para ativação imediata no corte de produção.
  4. A Arena fica preservada no momento atual, focando 100% no Bonde do Arroto (feed), threads de comentários, compositor e comunidades.
- **Comportamento esperado na tela:**
  1. **Feed & Posts (CardDoPost):** Anatomia estilo Twitter — avatar de 44px à esquerda, coluna de conteúdo à direita, nota de arroto em badge de destaque Anton com `--accent`, e barra de ações com ícones SVG modernos (💬 responder, 🔁 repost, ❤️ curtir com micro-interação, 🔗 compartilhar e 🔖 salvar).
  2. **Comentários:** Fim do modal pop-up que trava a navegação. Expansão de thread inline ou focada com conexão visual entre comentários, mantendo o feed fluido e acessível, com campo ágil de resposta direta.
  3. **Compositor & Gravação de Áudio:** Gravação de áudio com 1 clique (ícone de microfone grava diretamente, exibe tempo e forma de onda compacta, permite descartar ou anexar com visual enxuto), sem modais encadeados ou seletores confusos.
  4. **Comunidades:** Cabeçalho imersivo alinhado com o OpenDesign (banner, avatar 64px, botão de participar limpo e abas `Causos` / `Sobre`).
  5. **Anúncios:** Ativação de `VITE_FEATURE_ADSTERRA=1` no corte de produção do workflow e do `.env.example`, garantindo paridade total nos testes.
- **Fora de escopo (Não vira):**
  - Alterações na mecânica do motor de áudio da Arena ou no algoritmo YAMNet.
  - Criar redes ou bibliotecas externas desnecessárias.
- **Pista (Lane):** Full flow comum (redesenho de UI/UX e ativação de flag)
- **Por que esta pista:** Toca componentes centrais da experiência de feed, comentários, compositor e corte de publicação de anúncios, exigindo auditoria visual do Rian e qualidade do Marcelo.
- **Fonte de verdade afetada:** `docs/design/prototipo/Bonde do Arroto.dc.html`, `docs/design/prototipo/Comunidades.dc.html`, `docs/escopo/ESCOPO_ATUAL.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas & Feed) e Camillo (Corte de Produção / Anúncios)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado (ativação via flag oficial já existente e refatoração de UI respeitando as portas)
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma (ordem explícita de seguir estilo Twitter/OpenDesign, tirar modais pesados e ativar anúncios).

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop (3 colunas) e Webapp Mobile.
- **Maior risco de quebra ou mentira visual:** Quebra nos testes de paridade de corte de produção ou regressão nos testes existentes de comentários e feed.
- **Limite da promessa:** Anúncios dependem da liberação do script externo da Adsterra no ambiente real; em ambiente de teste, o container e o banner mockam/carregam conforme configurado.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Card do Post com avatar 44px, badge de nota e ícones vetoriais modernos | Kayky / Rian | Código e visual (`CardDoPost.tsx`) | APROVADO |
| Comentários sem modal pop-up quebrado, com thread fluida e resposta direta | Kayky / Marcelo | `ModalComentarios.test.tsx` e visual | APROVADO |
| Compositor de áudio em 1 clique sem modais redundantes | Kayky / Marcelo | `ModalCompositor.tsx` | APROVADO |
| Flag de anúncios Adsterra ativada em produção com paridade testada | Camillo / Marcelo | `vitest run` e workflow | APROVADO |
| `npm run typecheck`, `npm test` e `npm run build` 100% verdes | Marcelo | CI / Terminal (162 arquivos, 1877 testes) | APROVADO |
| Ajuste visual dos botões de ação e cabeçalho da thread inline (sem textos soltos/duplicados) | Kayky / Rian | Visual e `CardDoPost.tsx` | APROVADO |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `.env.example` (corte de produção com `VITE_FEATURE_ADSTERRA=1`)
  - `.github/workflows/publicar-firebase.yml` (`VITE_FEATURE_ADSTERRA: '1'`)
  - `src/features/novo-aue/CardDoPost.tsx` (estilo Twitter com avatar, badge e SVG; ações limpas com contadores numéricos sem poluição de texto ou duplicidade)
  - `src/features/novo-aue/CardDoPost.test.tsx` (testes unitários do card)
  - `src/features/novo-aue/ModalComentarios.tsx` (thread de respostas fluida e áudio em 1 clique)
  - `src/features/novo-aue/ModalComentarios.test.tsx` (testes unitários da thread)
  - `src/features/novo-aue/ModalCompositor.tsx` (compositor enxuto com áudio sem burocracia)
  - `src/features/novo-aue/VersaoMobileOpenDesign.tsx` (unificação do feed com CardDoPost)
  - `src/features/novo-aue/InicioOpenDesign.css` (estilos Twitter, suavização do cabeçalho da thread inline e alinhamento das ações)
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` (1877 testes passando em 162 arquivos, 0 erros no typecheck, build de produção gerado com sucesso).
- **Veredito Final do Tiago:** `APROVADO` (experiência do feed, respostas e compositor alinhada à dinâmica do Twitter/OpenDesign; anúncios habilitados em paridade total; poluição visual de ações e títulos pesados corrigida).
- **Pendências ou decisão necessária do Luiz:** nenhuma. Entrega concluída na branch `feat/redesenho-rede-social-e-anuncios`.
