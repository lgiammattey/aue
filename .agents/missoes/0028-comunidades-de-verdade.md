# Cartão de Missão 0028 — Comunidades de verdade, sem placar de mentirinha

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a estrutura de roda, tópico e resposta já existe, mas a entrada ainda mistura o fórum novo com o feed antigo. As abas “Quentes” e “Top” passam a impressão de relevância social sem uma regra que o servidor confirme; a busca na tela só vasculha o que já chegou nela.
- **Comportamento esperado na tela:** quem chega encontra conversas de rodas com atividade recente, sem prometer ranking. A busca procura pessoas, rodas e tópicos no servidor. Dentro de cada roda, as listas oferecem apenas **Ativos** (última conversa primeiro) e **Recentes** (criação primeiro), os dois critérios que o servidor já entrega. Reações continuam sendo recepção social; nota da Arena não organiza conversa.
- **Fora de escopo (Não vira):** fórmula “Quentes” ou “Top”, downvote, ranking global, sugestão algorítmica, notificação, bloqueio, moderação distribuída, criar comunidades, nem alteração da Arena/X1. A reputação social futura chama-se **Moral**, é separada do Histórico da Arena e não trava participação; ela não entra nesta missão.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** a mudança atravessa a porta de fórum, consulta de busca, home, dados já publicados e testes. O gate decide se a entrega usa apenas contratos/RPCs aplicados ou precisa de uma migração aditiva própria.
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md`, ADR 0001, ADR 0010, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md` e protótipos de comunidades.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky na tela; Camillo revisa a fronteira e Lucas entra somente se uma migração/RPC for necessária.
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado sem migração nem RPC nova: reutilizar `buscar_no_aue`, `listar_topicos` e `explorar_topicos` já aplicadas. A home usa atividade recente por padrão; somente a roda expõe Ativos/Recentes, porque são as duas ordens já contratadas.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma para este corte. A fórmula futura de “Quentes”/“Top” e os detalhes da Moral são cartões próprios.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e webapp mobile.
- **Estados obrigatórios da Arena:** nenhum; a Arena não muda.
- **Maior risco de quebra ou mentira visual:** usar nota, resposta, fallback local ou contagem improvisada como relevância; fazer falha de busca parecer “nenhum resultado”; tirar a comunidade da URL do tópico.
- **Limite da promessa:** o resultado desta missão não recomenda conteúdo, não mede popularidade e não notifica. “Ativos” e “Recentes” descrevem exatamente a ordem devolvida pelo servidor.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Busca encontra pessoa, roda e tópico fora da página já carregada; termo curto, vazio, erro e nenhum resultado são estados distintos | Marcelo | Teste + navegador | já coberto pelos testes existentes de BuscaDoForum; navegador local bloqueado sem configuração Supabase |
| Home não exibe Quentes/Top nem ordena tópico por nota da Arena, contagem derivada ou número local inventado | Marcelo | Código + teste | coberto em teste focal e busca estática |
| Ativos e Recentes usam somente as ordens já aceitas pelo servidor e preservam comunidade/URL do resultado | Marcelo | Teste + navegador | coberto em teste focal; navegador local bloqueado sem configuração Supabase |
| Reação não altera o Auê Score nem vira um placar de voto do Reddit | Marcelo | Código + teste | coberto por remoção do campo local e pelos testes de engajamento |
| Busca e listas permanecem legíveis, navegáveis por teclado e tocáveis no desktop e mobile | Rian / Marcelo | navegador desktop + webapp mobile | pendente de navegador configurado |
| `typecheck`, `lint`, `test` e `build` passam | Marcelo | CI local | passou: lint com avisos preexistentes, 2.121 testes e build |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `InicioOpenDesign`, navegação, painel lateral, contrato de item de feed e testes focais.
- **Parecer do Marcelo:** código e bateria local aprovados; validação visual em desktop/mobile depende de um ambiente com `VITE_SUPABASE_URL`.
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** fórmula de relevância e Moral ficam para missões futuras.
