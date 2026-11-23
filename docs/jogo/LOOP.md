# Loop Principal do Auê!

## Fluxo publicado, 23/11/2026

Base: commit `dc83657589294fb45e28f7b5753712044e709b08`, deploy do Firebase e código. Conferência em 23/11/2026; detalhes e limites em [Produção atual](../PRODUCAO_ATUAL.md).

1. A home oferece gravação e navegação para mural, ranking e grupos.
2. A pessoa pede o microfone, calibra o ambiente, grava e revisa a tentativa. A análise pode ser inconclusiva; uma gravação sem laudo não recebe nota.
3. Quando o laudo medido está disponível, o código oferece usar a tentativa no desafio. Publicação no mural é uma ação separada e depende do fluxo e permissões.
4. No duelo v2, a resposta usa sua própria gravação; o resultado compara durações informadas pelo cliente e é provisório. Convites e resultados dependem do servidor.

Esta descrição não valida o fluxo completo em aparelhos ou a entrega de cada áudio. O ciclo de revanche e a audição prévia descritos abaixo pertencem ao contrato antigo e não devem ser atribuídos automaticamente ao duelo v2.

## Registro anterior preservado

O texto a seguir registra decisões, contratos e referências anteriores. Em conflito com o retrato acima, não descreve o comportamento atual; contratos legados continuam relevantes para links e dados antigos.

A jornada completa e suas decisões estão em [`JORNADA.md`](JORNADA.md). Este documento consolida a mecânica do loop operacional entre o feed social e a máquina da Arena.

---

## O Ciclo Viral e Social

```text
ARROTAR NA ARENA → RECEBER NOTA → PUBLICAR NUMA RODA / DESAFIAR X1 → DEBATER NA TROPA → COMUNIDADE
        ▲                                                                                │
        └────────────────────────── REVANCHE OU NOVO DUELO ──────────────────────────────┘
```

---

## Os Momentos do Loop

### 1. Descoberta & Entrada Rápida
- **Landing (`Landing.dc.html`):** Headline provocativa *"Tá rolando agora / Entra na Tropa hoje"*. Login social em 1 clique (Google/Apple) ou criação direta com apelido.
- **Arrotar sem conta:** Permite jogar na Arena imediatamente antes de criar conta. A conta só é pedida para participar e salvar o histórico.

### 2. Arrotar na Arena
- **IDLE:** Bolha viva aguardando a iniciativa do jogador.
- **RECORDING:** Captura do áudio no navegador com visualização áudio-reativa (até 9 segundos).
- **VALIDATING & JUDGING:** YAMNet analisa se o som é arroto genuíno; juiz faz o suspense cômico (*"Tô julgando essa porra."*).
- **RESULT_REVEAL & RESULT:** Revelação brutal do Auê Score (0 a 100), fala do juiz, métricas acústicas (Força, Fôlego, Grave) e player para ouvir a própria gravação.

### 3. Publicar Resenha ou Chamar pro X1
- **Publicar na comunidade:** Exige consentimento explícito. A integração direta da Arena ainda precisa de prova de ponta a ponta antes de ser prometida como entrega.
- **Chamar pro X1:** Gera link exclusivo do desafio (ex: `aue.gg/x1/9f2a`) para humilhar o oponente pelo WhatsApp ou rede.
- **Compartilhar Card (9:12):** Exporta card gráfico estilizado com a nota, fala do juiz e link do confronto.

### 4. Duelo X1 & Placar
- O oponente abre o link no celular sem instalar aplicativo.
- Ouve o arroto desafiante e grava a própria resposta.
- **Placar Versus:** Comparação lado a lado das duas notas com player de áudio para os dois competidores.

### 5. Revanche Contínua (O Loop Nunca Termina)
- Vitória, derrota ou empate (`DRAW`).
- **Nunca usa vermelho** para a nota do perdedor; vermelho é reservado para falha técnica.
- Botão **Revanche** engatilha contagem regressiva `3, 2, 1` e joga ambos de volta para a Arena `IDLE`, perpetuando a rivalidade.
