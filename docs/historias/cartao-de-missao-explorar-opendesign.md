# Cartão de Missão — Explorar na casca OpenDesign

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem abre `/explorar` cai numa casca visual do fórum, diferente da Tropa, embora esteja procurando justamente pessoas, rodas e conversas do Auê.
- **Comportamento esperado na tela:** a descoberta mantém busca, ordem e acesso aos tópicos e comunidades reais, mas aparece dentro da casca canônica da Tropa: três colunas no desktop, navegação mobile e os mesmos temas e tokens da experiência principal.
- **Fora de escopo:** não mudar contrato de busca ou de listagem, não alterar banco/RLS, não duplicar tópicos no feed, não redesenhar a conversa por tópico nem publicar/deployar.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** é uma rota publicada e uma superfície nova de descoberta, mas usa contratos de leitura existentes; o trabalho é de UX/UI e encaixe de frontend.
- **Fonte de verdade afetada:** `VISAO.md`, `JORNADA.md`, `MAPA_DE_PAGINAS_E_FLUXOS.md`, `Comunidades.dc.html`, `Tropa do Arroto.dc.html`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky — tela e rota.
- **Especificação e Auditoria Visual:** Rian.
- **Gate Arquitetural (Camillo / Lucas):** não aplicável; contrato do fórum é preservado.
- **Auditoria e Prova Real:** Marcelo.
- **Decisão pendente do Luiz:** nenhuma. Luiz decidiu adequar `/explorar`, em vez de escondê-la.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop, tablet e webapp mobile.
- **Maior risco de quebra ou mentira visual:** trocar a casca e perder busca, paginação, ordem ou a distinção entre resultado vazio e falha de leitura.
- **Limite da promessa:** a tela descobre conteúdo já retornado pelo contrato de fórum; não promete ranking, recomendação personalizada nem interação que o backend não confirma.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/explorar` usa a casca e os tokens canônicos da Tropa | Rian | código + navegador desktop | conferido localmente |
| busca, troca de ordem e paginação seguem usando dados reais do fórum | Marcelo | testes | conferido localmente |
| mobile não tem overflow, respeita navegação inferior e alvos de toque | Rian e Marcelo | navegador em 375px e 430px | conferido localmente |
| desktop mantém três colunas e a coluna central legível | Rian e Marcelo | navegador em 1200px | conferido localmente |
| typecheck, lint, testes e build passam | Marcelo | CI local | conferido localmente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** rota em `App.tsx`, casca OpenDesign, nova `TelaExplorarOpenDesign`, painel complementar e testes de descoberta.
- **Parecer do Marcelo:** sem achados materiais no diff local; desktop a 1200px e mobile a 390px sem overflow, navegação mobile com alvo de 56px e estado honesto para falha de leitura.
- **Veredito Final do Tiago:** APROVADO COM RESSALVAS — entrega local validada; produção continua igual até merge e deploy.
- **Pendências ou decisão necessária do Luiz:** nenhuma para abrir a PR. A publicação continua sendo uma ação separada.
