# GA4 no painel admin: conexão preparada, PENDENTE

> Status em 23/11/2026: **pendente**. Existe o contrato e um adaptador que declara "pendente". Nenhum dado do GA4 chega ao painel, e o painel não estima nada no lugar. Missão de origem: 0057 (fatia 3 e 5).

## O que já está pronto

- **Envio:** os eventos de funil de `eventos_de_telemetria` e os da Arena V2 já vão para o GA4 `G-43GWYNCCMD` (`src/plataforma/web/analyticsArenaV2.ts`), só com o nome do evento, em rotas seguras e respeitando a exclusão de telemetria. Em `/x1/:code` nada é enviado de propósito, porque o código aparece no endereço.
- **Contrato de leitura:** `src/portas/analyticsAdministrativo.ts` (`PortaDeAnalyticsAdministrativo`, `ResumoDoAnalytics`, `ConexaoComOAnalyticsPendente`).
- **Adaptador pendente:** `src/plataforma/web/analyticsAdministrativo.ts`. Lança `ConexaoComOAnalyticsPendente`.
- **Painel:** o bloco "GA4" de `TelaAdministracao` mostra "Conexão com o GA4 pendente" e já sabe desenhar origem, dispositivo e retorno quando a porta devolver dados.

## O que falta para conectar

1. **Decisão do Luiz:** confirmar o que o admin do Signal Key lê no Firebase (analytics, auth ou banco) e se a conta Google é a mesma. Recomendação: mesma conta Google, **propriedade GA4 e projeto separados**. Misturar dados, cobrança e privacidade de dois produtos num projeto só não compensa.
2. **Gate Arquitetural (Camillo e Lucas):** backend novo, segredo e dependência externa (ADR 0001 §8). Sem o gate aprovado, não há código real.
3. **Função no servidor** (Edge Function do Supabase ou Cloud Function) que chama a Data API do GA4 e devolve só o agregado. A chave **nunca** vai para o navegador nem para variável `VITE_*`.
4. **Acesso:** conta de serviço com papel de leitor na propriedade GA4, o ID da propriedade e a chave guardada como segredo do servidor. Se o Luiz tiver de colar credencial, usar o fluxo seguro de segredo, nunca chat.
5. **Autorização:** a função só responde para o administrador autenticado, igual às RPCs do painel.
6. **Adaptador real** trocando o pendente, com teste de contrato, e remoção do texto "pendente" do bloco.

## Métricas previstas (Data API)

| Painel | Dimensão ou métrica do GA4 |
|---|---|
| Origem do tráfego | `sessionDefaultChannelGroup` ou `sessionSource`, métrica `sessions`. Agrupar em zap, busca, direto e outros. |
| Dispositivo | `deviceCategory`, métrica `sessions`. |
| Retorno em 1 e 7 dias | Relatório de coorte (`cohortSpec`) ou `newVsReturning`. Só mostrar quando houver base mínima, senão `null`. |

## Limites honestos

- O GA4 só vê o que passa pelas travas de privacidade (rota segura, sem exclusão). Funil de X1 por link fica incompleto no GA4; o Supabase continua sendo a fonte do funil completo.
- GA4 amostra e atrasa. Os números dele não substituem os do Supabase, complementam.
- Não mede pessoas únicas com precisão sem identificador de usuário. Isso segue sendo decisão de privacidade do Luiz.
