# ADR 0011 — Entrega do áudio privado do duelo

**Status:** aceito; ensaiado em staging, ativação condicionada às verificações abaixo
**Data:** 2026-11-18
**Decisão:** Giam, com validação da squad Auê
**Altera:** ADR 0001 §8 item 2, somente para a função descrita abaixo
**Relação:** ADR 0003 continua válido para prévias de links legados; esta função
não serve HTML, não substitui a prévia e não calcula pontuação.

## Problema

Ao recuperar um objeto privado do Storage pela URL autenticada, a CDN pode
continuar servindo conteúdo previamente armazenado após a mudança da policy,
até a expiração do JWT. Exclusão e denúncia precisam impedir acesso futuro sem
depender apenas da policy consultada no primeiro download. Um áudio já entregue
ou copiado não pode ser retirado do aparelho de quem o recebeu.

## Decisão

Manter o app como SPA em Firebase e Storage privado no Supabase. Para o bucket
`duelos_v2`, fechar GET direto aos usuários. A operação de exclusão mantém apenas
a permissão de seleção necessária ao `Storage.remove`. A reprodução passa pela
Edge Function `duelo-audio-v2`, com resposta `private, no-store`. Ela não concede
URLs assinadas nem altera conteúdo ou resultado.

O cliente autenticado envia por POST somente ID do duelo e lado. A função valida
JWT no Auth, confirma que a sessão do JWT existe em `auth.sessions` para aquele
usuário e consulta `aue_v2_recuperar_duelo` no contexto do participante. Só há
áudio se o duelo foi respondido e ambas as gravações permanecem disponíveis. O
servidor usa chave privilegiada unicamente para obter o caminho autorizado e
revalida sessão e autorização depois da busca e antes da entrega. Não há fallback
ao endpoint de Storage se a função falhar. O token do convite não entra no URL
ou corpo da função; o ID é obtido após a revelação autorizada.

A revisão de denúncia usa a mesma função com ID da denúncia, sem caminho
fornecido pelo cliente. A RPC exige administrador real, sessão ativa, denúncia
pendente ou mantida, objeto existente e gravação sem exclusão solicitada. A mesma
revalidação ocorre antes da entrega. A fila v2 está integrada localmente ao painel; ouvir não registra decisão de
moderação. A chave de serviço nunca
vai ao navegador. A prévia do convite é HTML genérico e não contém áudio, token,
medição ou dados pessoais.

## Alternativas

- **RLS e GET direto:** insuficiente após resposta cacheada; a decisão de acesso
  pode não ser reavaliada em cada pedido.
- **URL assinada:** expiração e cache são independentes; não atende à revogação
  rápida pretendida.
- **S3 sem CDN:** evita cache do Storage, mas ainda exigiria mediação de sessão e
  autorização, além de credenciais e outra integração no servidor.
- **Apagar tudo para invalidar:** destrutivo, não resolve denúncia temporária nem
  apaga cópias já recebidas; a propagação do cache pode demorar.

## Consequências, risco e custo

Cada reprodução faz verificações de Auth e banco e um download mediado pela
função. Isso acrescenta latência, invocações, processamento e transferência; sem
uso real ou preço atual verificado, nenhum custo é estimado aqui. Acompanhar
volume, duração, erro e gasto agregado, sem gravar IDs, tokens ou áudio em logs.
A indisponibilidade da função, Auth, banco ou Storage impede reprodução com
mensagem de erro; o cliente não volta ao acesso direto.

Entre a última consulta e a entrega existe janela de concorrência: duas
verificações reduzem, mas não eliminam, a possibilidade de uma exclusão ou
quarentena ocorrer nesse intervalo. Respostas já entregues e capturas locais não
podem ser revogadas. Sem limitação de requisições e medição em carga, abuso e
custo não estão quantificados.

## Transição e rollback

Antes de qualquer aplicação em produção: inspecionar banco, políticas combinadas,
integração automática GitHub/Supabase e clientes em uso; configurar origem e
segredos somente no servidor; validar deploy da função, políticas, limpeza e
moderação em ambiente isolado; definir monitoramento e janela para caches diretos
já aquecidos, purga e expiração de JWT. Uma execução em staging não comprova que
os caches de todas as regiões ou navegadores tenham sido invalidados. O acesso
antigo deve ser testado durante a transição e a funcionalidade não deve ser
oferecida como segura antes de a janela ser resolvida.

Se a função falhar, desligar a flag do duelo e manter acesso direto bloqueado;
isso preserva privacidade ao custo de indisponibilidade. Não reabrir a policy
antiga como rollback silencioso. Reverter schema somente após avaliar dados e
migrações aplicadas, garantindo que exclusão e moderação continuem possíveis.
Não excluir bucket ou áudios como procedimento de rollback.

## Evidências e pendências

Testes locais cobrem autorização, sessão, revalidação, recuperação, exclusão e
negação com Auth/Storage simulados. Em staging, um ensaio HTTP com dados
sintéticos verificou participantes, terceiro, denúncia, exclusão e administrador;
o GET aquecido antes da policy respondeu 400 depois nessa execução. Os dados
sintéticos foram limpos. Isso não prova invalidação universal, ausência de janela
de corrida, comportamento de aparelhos reais ou moderação operacional em UI.
Um ensaio de Chromium headless em staging comprovou a fila local com contas
sintéticas e áudio gerado. Faltam prova em aparelhos, métricas de custo e validação da implantação real antes de ativar.

Referências: [Supabase Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn),
[Auth em Edge Functions](https://supabase.com/docs/guides/functions/auth-legacy-jwt).
