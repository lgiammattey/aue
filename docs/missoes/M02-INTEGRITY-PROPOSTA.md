# M02 · Integridade

O PO aceitou M00, M01 e M01.1 com as ressalvas registradas e autorizou a execução em branch isolada da Foundation, até o PR em rascunho. A autorização de banco cobre apenas ambiente descartável.

As decisões e os testes de encerramento estão no [relatório da M02](M02-RELATORIO.md).

## Enquadramento original

- **Problema:** a nota pode usar métricas manipuláveis e o limite de cadastro de grupos falhou sob concorrência em laboratório. Políticas efetivas, Auth, Storage e worker implantados não foram comprovados.
- **Pessoas e impacto:** jogadores precisam confiar no resultado e na privacidade de seus áudios; moderadores e visitantes precisam de limites e erros honestos.
- **Objetivo proposto:** tornar verificáveis os contratos e as consequências competitivas autorizadas, reduzir o risco demonstrado em laboratório e provar segurança em ambiente fiel e autorizado.
- **Invariante candidato:** o navegador pode capturar e apresentar análise, mas não ganha autoridade para transformar métricas declaradas em consequência competitiva. Quando houver consequência autorizada, a decisão precisa de contrato de servidor, vínculo verificável entre áudio, autoria e resultado, e falha explícita quando essa verificação não puder ocorrer. A proposta não escolhe agora algoritmo, serviço, schema nem política de retenção.
- **Escopo candidato:** AUE-T01 e AUE-T02; autoridade de servidor e vínculo áudio/nota; worker, RPC, RLS, Auth e Storage relacionados; limites e moderação do fluxo; AUE-T05, T10, T11 e T14 como dependências potenciais. A seleção final é decisão de missão, não promessa de executar todos juntos.
- **Fora:** redesign, nova votação/ranking, limpeza de legado, mudança de produto, migration real, grant de produção, release ou deploy sem autorização própria.
- **Dependências:** aceite da M01; decisão de início do PO; Gate Arquitetural de Camillo; ambiente descartável e, quando a conclusão depender do serviço, staging fiel autorizado; contas e dispositivos de teste autorizados; confirmação de contrato e política de áudio. PGlite, mocks e mídia sintética não presumem grants ou comportamento de produção.
- **Reaproveitamento:** contratos, migrations, RPCs, worker, testes SQL, harnesses de concorrência e fluxos de áudio já versionados. Manter URLs, dados e compatibilidade; avaliar alternativas antes de dependência nova.
- **Riscos:** falso positivo de fraude, vazamento de áudio, bloqueio de usuário legítimo, compatibilidade de resultados antigos, concorrência, custo de processamento e uma migração parcial fabricar sucesso aparente.

## Evidência da Foundation, anterior à M02

Em 27/11/2026, em PostgreSQL local sem conexão a serviço Supabase, os stubs canônicos permitiram aplicar 98 de 117 migrations. A cadeia parou na migration do duelo privado por falta de pré-requisito de Storage. Com a fixture local do bucket, a mesma migration parou na ausência de um helper. Com fixture, helper, superfícies e grants sintéticos, aplicaram-se 117 de 117. Das sete suítes sem macro psql, duas passaram e cinco falharam. As duas suítes sociais adaptadas também pararam na primeira asserção. As asserções posteriores dessas duas suítes seguem sem execução. O ambiente não comprova Auth, Storage, RLS, worker ou privilégios implantados.

No mesmo schema simulado, duas transações do mesmo usuário contra o wrapper de gravação V2 partiram de 99 registros. A segunda aguardou a primeira e falhou no limite, deixando 100. Esse resultado é do wrapper V2. O recorte concorrente do cadastro de grupos tem prova separada no handler com dublê e segue candidato para validação fiel. Para jornadas de visitante que dependam de sessão, o [runbook de ambientes](../technical/operacao/ambientes.md#sessão-anônima-no-ambiente-de-teste) registra o pré-requisito de Auth.

## Subentregas candidatas, pequenas e reversíveis

O PO autorizou A, D, B, C, E quando necessária e F nesta missão.

| Etapa candidata | Recorte, dependências e reaproveitamento | Critério verificável e reversão |
|---|---|---|
| **M02-A — contrato de integridade** | Antes de código, Camillo fecha o Gate: mapa de quem produz, valida, persiste e consome áudio, nota, autoria e consequência; consumidores de RPC/worker e compatibilidade de dados existentes. Reaproveita migrations, `enviar_resultado`, contratos e testes atuais. | Ameaças, alternativas e invariantes documentados; nenhum cliente recebe nova autoridade por suposição. Se não houver alternativa segura/compatível, não avançar para mudança. Reversão: não há runtime alterado. |
| **M02-B — resultado sob autoridade do servidor** | Recorte eventual de AUE-T01/AUE-T05: contrato entre áudio aceito, autoria/sessão, nota e worker/RPC. Exige ambiente descartável fiel e, se o resultado depender de serviço implantado, staging autorizado. Não presume que o servidor já reprocessa, vincula ou autentica o áudio. | Casos de entrada adulterada, repetição, autoria trocada, áudio ausente e falha do worker/RPC não podem gerar confirmação competitiva inventada. Prova registra idempotência, erro e estado persistido. Reversão definida no Gate antes de migration/contrato; migration real continua fora até autorização específica. |
| **M02-C — limite concorrente de grupos** | Recorte eventual de AUE-T02: limite, contador e tamanho de corpo antes de parse no handler e persistência reais, com rajadas concorrentes e falha simulada do contador. Reaproveita harness M00 e handler versionado. | Para um limite declarado, testes concorrentes não excedem o limite e erro de persistência não retorna sucesso. A prova separa dublê, banco descartável e staging. Reversão restaura contrato/contador anterior somente se isso não reabrir o defeito; decisão registrada antes da mudança. |
| **M02-D — acesso e runner confiáveis** | Recorte eventual de AUE-T10/T11/T14 e AUE-OPS-RLS: inventory de RLS, Auth, Storage, helpers, RPCs e worker; correção do runner SQL que usa `|| true`; suítes em banco descartável compatível. Não sugere `GRANT`, policy ou segredo de produção. | Runner falha na primeira migration inválida e não emite falso sucesso; identidades sintéticas cobrem negação e permissão esperada para áudio/dados. Somente staging autorizado pode sustentar afirmação sobre serviço implantado. Reversão de schema/policy exige plano testado no ambiente descartável. |
| **M02-E — adaptação de UX, somente se necessária** | Felipe decide se contrato novo exige estado visível. Reaproveita rotas e componentes canônicos do mapa; não cria rota, tela, tema ou regra competitiva sem autorização de produto. | Se tocar UI: estados de erro, indisponibilidade e retorno seguro têm rota e estado definidos; revisão desktop/webapp verifica teclado, alvos, contraste e `document.documentElement.scrollWidth === window.innerWidth` em 390px. Capturas antes/depois e E2E só entram se houver mudança visual/fluxo. Reversão preserva o estado anterior sem mascarar falha como sucesso. |
| **M02-F — Prova de Fogo e handoff** | Renan organiza a matriz de provas por ambiente; Marcelo consolida. Reaproveita CI, testes unitários/integração, suites SQL e E2E existentes, sem chamá-los de produção. | Evidência liga SHA, ambiente, identidades sintéticas, comandos, falhas/retries e limites a cada critério. Sem prova suficiente, o parecer é `BLOQUEIA` ou `NÃO VALIDADO`; não há merge, deploy ou M03 automático. |

## Critérios candidatos e níveis de prova

| Critério | Prova necessária |
|---|---|
| Consequência competitiva não nasce de métrica de cliente sem verificação proporcional | Plano de ameaça e testes de entrada, repetição, autoria, vínculo áudio/nota e consistência; a técnica final só é escolhida no Gate autorizado. |
| Worker, RPC e persistência não confirmam resultado ausente, duplicado ou inconclusivo | Testes de contrato, erro, timeout, retry e idempotência em ambiente declarado, com estado rastreável em vez de sucesso por copy. |
| Limite de grupos resiste a rajadas e a erro de persistência | Testes concorrentes sobre a implementação escolhida, falha do contador e limite de corpo antes de parse. |
| Acesso a áudio e dados respeita papéis e consentimento | Testes de RLS, Auth e Storage com identidades sintéticas em ambiente autorizado; nenhum grant inferido de PGlite. |
| Runner SQL não certifica migration que falhou | Falha proposital em banco descartável compatível, saída não mascarada e suites sociais executadas até o ponto aplicável. |
| Compatibilidade, UX e rollback são definidos antes de alterar contrato/dados | Consumidores, dados, links e estados de erro revisados; plano de reversão proporcional. Mudança visual só recebe revisão de rota/capturas/E2E quando ela realmente existir. |

**Testes:** typecheck, lint, unitários e integração, build, segurança e SQL em banco descartável sem runner que mascare falha. E2E, aparelhos reais, captura visual e revisão de não-overflow são aplicáveis apenas quando o recorte toca fluxo ou interface; staging não é produção. Registrar ambiente, falhas, retries e ignorados. **Rollback:** cada subentrega que altere contrato ou dado define e exercita seu plano antes da mudança; migrations reais dependem de autorização separada. O relatório final identifica quem executou cada papel e os limites da prova.

## Gate de engenharia

### Decisão

O laudo da Arena continua disponível para quem acabou de gravar. As quatro métricas recebidas pela RPC são declaradas pelo navegador e a fórmula executada no banco não prova que elas vieram do áudio. Por isso, um resultado novo nasce como `nao_verificado` e não pode gerar XP, conquista, ranking público, desafio legado ou vitória de round.

O estado `verificado_servidor` fica reservado para um contrato posterior que vincule sessão ou autoria, objeto de áudio aceito, versão do avaliador e resultado. A migração não cria esse carimbo por inferência. Sem essa confirmação, a consequência competitiva fica bloqueada.

### Mapa e reaproveitamento

- `enviar_resultado` cria o laudo e recebe as métricas. `definir_audio_do_resultado` anexa o objeto depois, em outra chamada. A separação existente impede afirmar vínculo atômico entre áudio e nota.
- `calcular_xp_do_resultado`, `conceder_conquistas_do_resultado`, `pode_usar_como_desafiante`, `pode_usar_como_desafiado`, `aue_compare_results_v1` e `vencedor_do_round` são as portas de consequência do resultado da Arena.
- As portas de posse seguem acessíveis apenas a `anon` e `authenticated`, pois são predicados das policies de INSERT/UPDATE de `desafios`; o trigger chama o comparador durante a execução de RPCs privilegiadas. O cliente não tem execução direta do comparador. Os três perdem o grant implícito de `PUBLIC`. `vencedor_do_round` não participa desse caminho e continua sem EXECUTE desses papéis.
- `top_cinco_arrotadores` reaproveita a fila e o worker de notas para áudio publicado com consentimento. Para a Arena, a entrada exige tópico público ativo, mesmo autor do tópico e do resultado, caminho do objeto, e proprietário do objeto em `storage.objects`; eTag, token de trabalho, lock e conclusão idempotente vinculam a nota ao objeto efetivamente medido. A nota do worker pode ranquear a publicação, mas não muda a integridade, XP, X1 ou desempate das métricas declaradas pelo navegador.
- Consequência competitiva exige sessão autenticada, inclusive conta anônima, correspondente a `resultados.usuario_id`. A janela de visitante continua servindo para o laudo, nunca como prova de posse para desafio ou batalha.
- Duelo V2 também recebe uma restrição na resposta pública. Revelar e recuperar preservam somente as durações e `origem_medicao=cliente_nao_verificada`, declaram `efeito_competitivo=false` e não entregam `resultado_provisorio`, vencedor, XP, ranking ou vitória competitiva persistida.

### Dados, falhas e reversão

Linhas antigas recebem `legado` sem alteração de nota, áudio, autoria ou resultado histórico. Elas não servem de entrada para uma nova consequência competitiva. A reversão da contenção exige uma migration nova que mantenha a restrição enquanto não houver avaliador de servidor. Remover a barreira restauraria o defeito e não é rollback aceitável.

O banco descartável PostgreSQL aplicou as migrations da M02 sobre o schema da Foundation. Por RPC normal, um laudo novo ficou `nao_verificado`, com XP zero e sem elegibilidade; a role `authenticated` não tinha inserção direta em `resultados`. Uma fixture sintética de tópico pessoal consentido, resultado, objeto `audio_records` e mesma autoria foi reivindicada pelo worker, concluída uma vez e reavaliada só após troca de eTag. A nota do worker entrou no top de publicações sem entrar no ranking global do laudo. Isso não comprova Auth, Storage ou Edge Functions implantados.
