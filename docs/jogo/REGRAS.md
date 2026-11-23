# Regras de gameplay — Auê

## Regras do laudo e duelo v2 no código, 23/11/2026

Base: commit `dc83657589294fb45e28f7b5753712044e709b08`, deploy do Firebase e código. Conferência em 23/11/2026; detalhes e limites em [Produção atual](../PRODUCAO_ATUAL.md).

A régua `experimental-2` calcula a duração do maior trecho ativo e a potência relativa ao ruído captado na calibração. A nota é a média ponderada de fôlego relativo (45%) e potência relativa (55%), limitada a 0–100. É uma medição experimental em dBFS relativo, não dB SPL, nem uma régua validada entre aparelhos. Sinal insuficiente, ambiente inadequado ou saturação podem resultar em laudo inconclusivo sem nota. O cálculo não comprova que o som é um arroto nem que foi produzido ao vivo.

No duelo v2 o código envia duração medida pelo cliente e exibe comparação provisória depois da resposta; o resultado identifica a origem como medição não verificada no cliente. Não confundir esta comparação com o score individual nem com a fórmula antiga de `enviar_resultado`. O prazo, acesso, exclusão e entrega de áudio devem ser verificados nas migrações e no ADR 0011: não transferir automaticamente regras de retenção de batalhas antigas para a v2.

Fontes: `src/nucleo/julgamento/laudoExperimental.ts`, `src/arena/v2/ArenaV2.tsx`, `src/arena/v2/duelo/DueloV2.tsx`, `src/portas/dueloV2.ts` e migrações `duelo_v2`.
