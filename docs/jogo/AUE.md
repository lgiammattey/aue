# Auê: a definição

> Direção estabelecida pelo Product Owner para a M01 em 27/11/2026. Esta página define o produto; não autoriza implementação, redesenho nem release por si só.

## O que é

Auê é uma plataforma web competitiva de arrotos, com comunidade em torno da competição. A pessoa grava um arroto, manda o áudio e recebe o laudo experimental do juiz. A Arena é o núcleo competitivo; o Mural reúne interação e resenha; o Perfil representa identidade e reputação. O gravador atende aos fluxos que precisam dele. O produto atende competidores, espectadores e visitantes no celular e no desktop.

O jogo continua no centro. O Mural e o Perfil dão contexto à competição; Auê não é uma rede social genérica. O primeiro minuto deve permitir encontrar o jogo sem exigir conta para apenas jogar, conforme o fluxo existente e as regras aplicáveis.

```text
GRAVAR → MANDAR → RECEBER A NOTA → (DESAFIAR NO X1 | TENTAR DE NOVO | IR AO MURAL)
```

A nota avalia o som recebido como experimento e não prova a origem do áudio. A M00 demonstrou em laboratório que métricas enviadas pelo cliente podem ser manipuladas; não atribuir nova consequência competitiva ao resultado antes de resolver e validar sua integridade.

## O que preservar

Arena V2, captura e reprodução, X1 assíncrono, Mural e infraestrutura social, Perfil, acervo, dados, histórico de migrations e URLs públicas. A existência de código não comprova sua operação em produção. Não transformar gravação em autorização para publicação: o consentimento de publicar é explícito.

Comunidade em torno da competição não reativa por si só comunidades temáticas, tópicos, fórum, votos, ranking novo ou outra funcionalidade. Essas decisões, regras e UX dependem de missão própria. Código e links históricos ficam preservados até análise e autorização específicas. Lojas nativas continuam fora do escopo: o produto é web.

## Horizonte e prova

A direção futura inclui Arena, Mural e Perfil conectados, mas detalhes de competição, moderação, voto, progressão e home permanecem sujeitos a decisão e validação. O que prova valor é comportamento real: gravar, receber resultado, ouvir, publicar com consentimento ou chamar alguém para um X1; visitas não equivalem a jogadores.

M00 foi aceita para planejamento com ressalvas, sem homologação operacional integral. Para o estado observado e seus limites, veja [Produção atual](../PRODUCAO_ATUAL.md), [roadmap](../escopo/ROADMAP.md) e [backlog](../escopo/BACKLOG.md).
