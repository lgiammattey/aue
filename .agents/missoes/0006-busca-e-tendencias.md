# Cartão de Missão 0006 — Busca no Bonde, Filtragem de Tendências e Hashtags

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O campo "Buscar no bonde" na coluna direita de tendências mantinha o termo digitado em estado isolado sem filtrar nada. Clicar em uma hashtag dos assuntos em alta (#LongNeckChallenge, #TremeuAJanela, etc.) não realizava nenhuma busca nem filtrava os causos correspondentes no feed.
- **Comportamento esperado na tela:**
  1. Digitar no campo "Buscar no bonde" filtra em tempo real os causos do feed (por conteúdo, nome de autor ou handle).
  2. Clicar em qualquer tag de tendência ("Em alta no Bonde") preenche a busca e filtra o feed pelos causos que contêm aquela tag ou categoria.
  3. Quando uma busca está ativa no feed, exibe um chip indicador com opção de limpar a busca ("Limpar busca") e retornar ao feed completo.
  4. Se nenhum causo coincidir com a busca, exibe mensagem honesta sem travar a interface.
- **Fora de escopo (Não vira):** Motor externo elástico de busca (ElasticSearch/Algolia) ou scraping em tempo real.
- **Pista (Lane):** Full flow comum
- **Por que esta pista:** Refina a experiência de descoberta e navegação social no Bonde do Arroto.
- **Fonte de verdade afetada:** `Bonde do Arroto.dc.html`, `JORNADA.md`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (UI e Filtro no Feed)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop & Webapp Mobile
- **Estados obrigatórios:** Sem busca ativa, Busca com resultados, Busca vazia (zero causos encontrados).
- **Maior risco de quebra ou mentira visual:** Filtrar e não atualizar o feed ou quebrar a contagem de curtidas/respostas.
- **Limite da promessa:** Busca client-side imediata sobre os causos carregados do feed.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Digitar na busca filtra a lista de causos por texto, autor ou tag | Kayky | Código / Vitest | aprovado (`TelaComunidade.test.tsx`) |
| Clicar em uma tendência em alta ativa o filtro pelo termo/hashtag | Kayky | Código / Vitest | aprovado (`aoSelecionarTrend`) |
| Botão/chip de limpar busca restaura a visualização normal do feed | Kayky | Código / Vitest | aprovado (`Limpar busca`) |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado (12/12 testes e tsc limpo) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/components/ColunaTendencias.tsx`: props `termoBusca`, `aoMudarBusca`, `aoSelecionarTrend` e acionamento no clique das tags.
  - `src/features/comunidade/TelaComunidade.tsx`: estado `termoBusca`, filtragem composta de causos por texto/autor/tag, chip de busca ativa com botão "Limpar busca".
  - `src/features/comunidade/TelaComunidade.test.tsx`: teste cobrindo digitação na busca, exibição da barra de busca ativa e limpeza do filtro.
- **Parecer do Marcelo:** SEM ACHADOS MATERIAIS. A busca agora age diretamente sobre o feed em tempo real, clicar em tendências preenche o filtro instantaneamente e o botão de limpar busca funciona conforme esperado. Vitest e Typecheck limpos.
- **Veredito Final do Tiago:** APROVADO. A descoberta no Bonde do Arroto agora é funcional e viva, sem inputs mortos na lateral.
- **Pendências ou decisão necessária do Luiz:** nenhuma

