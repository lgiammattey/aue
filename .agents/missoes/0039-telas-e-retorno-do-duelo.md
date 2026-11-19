# Missão 0039 — Telas e retorno do desafio

- **Dor:** depois da Arena, convite, resposta e placar ficam no visual antigo e não oferecem caminho claro para continuar jogando.
- **Pedido:** levar a direção clara da Arena para criação, convite, resposta, Meus desafios e placar; permitir compartilhar um texto de resultado pré-visualizado e começar outro desafio para pedir revanche.
- **Limite da revanche:** é um novo desafio independente, enviado manualmente a quem a pessoa escolher. Não há rounds, identidade automática do adversário ou placar acumulado.
- **Segurança:** preservar consentimento explícito, acesso ao áudio só depois da resposta, denúncias, exclusão, tratamento de falhas e caráter provisório da medição; não expor token do convite no compartilhamento de placar.
- **Pista:** full flow comum, sem alteração de banco ou contrato de armazenamento. Tiago enquadra; Iury coordena; Rian desenha; Kayky implementa; Marcelo verifica.
- **Desenho:** papel claro e tipografia esportiva; navegação visível; campos legíveis em 320 px; botões de ação com foco; placar comparável sem dourado ou recorde inventado; opções e explicações abertas após conclusão.
- **Evidência:** typecheck, lint e build passaram; 2.503 testes passaram, 9 ignorados. Seis cenários de navegador verificaram a Arena e as telas simuladas de convite, resposta e placar em 320, 390 e 1.440 px, inclusive o player. No staging, duas sessões criaram e responderam um desafio com áudio sintético: o convite não mostrou o áudio antes da resposta, o placar abriu e o áudio do adversário carregou depois. Os áudios sintéticos foram removidos. Um teste anterior revelou que as portas 5174 e 5175 são bloqueadas pela origem permitida da função de áudio; a prévia funcional usa 127.0.0.1:5173. O link local não funciona em outro aparelho.
- **Aceite:** com ressalvas para revisão local. Não há teste em iPhone ou Android físicos, WhatsApp real nem publicação. A revanche é uma nova disputa independente, sem placar acumulado.
