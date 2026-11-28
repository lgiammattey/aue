# Release e prova de publicação

Release é a passagem de uma missão aceita para uma versão publicada. Este
documento organiza a evidência dessa passagem; ele não autoriza deploy nem
substitui o aceite de Produto.

## Pré-condições

Antes de uma release, a missão precisa ter parecer final e todas as
verificações exigidas pelo seu risco registradas conforme
[`../QUALIDADE.md`](../QUALIDADE.md). Falha, teste ignorado relevante, retry
que mascarou intermitência ou lacuna operacional precisa constar no parecer.

A publicação do site é feita pelo workflow
[`publicar-firebase.yml`](../../../.github/workflows/publicar-firebase.yml).
Ele usa o alvo Firebase configurado no repositório e tem um modo manual de
validação sem publicação. O procedimento de ambiente, flags e segredos está em
[`ambientes.md`](ambientes.md); a operação de domínio e rollback de hosting,
em [`transicao-aue-oficial.md`](transicao-aue-oficial.md).

Nenhum desses documentos é permissão para disparar workflow, alterar segredo,
publicar, aplicar migration ou modificar configuração remota.

## Evidência mínima de release

O registro de release deve ligar, sem ambiguidade:

1. A missão e seu parecer final.
2. O SHA imutável do código e os resultados de validação daquele SHA.
3. A execução de publicação, seu alvo e o resultado observado.
4. As flags de build que mudam comportamento, quando houver.
5. A verificação pós-publicação aplicável: rotas, sitemap/robots/PWA, jornada
   crítica ou outro critério do Cartão de Missão.
6. Limites ainda abertos, incluindo serviços que não foram validados.
7. O caminho de rollback, quando a release alterar artefato ou configuração
   reversível.

Um deploy concluído só prova que o workflow terminou. Não prova banco,
autorização, upload, microfone, analytics, indexação ou experiência em
aparelho. Do mesmo modo, um build local não identifica por si a versão que está
no ar.

## Sequência operacional

1. Produto confirma que a missão recebeu parecer final e que a release cabe no
   escopo aprovado.
2. A pessoa autorizada confere o SHA e a evidência dos gates aplicáveis.
3. A pessoa autorizada usa o fluxo de publicação existente, sem criar fluxo
   paralelo.
4. A pessoa que não publicou confere a evidência pós-release definida no
   cartão e registra o que foi observado e o que ficou sem prova.
5. Se a prova contradisser o aceite ou a jornada crítica falhar, interrompe
   novas releases, aplica o rollback previsto quando autorizado e abre a
   missão de correção. Não declarar sucesso por copy ou por resposta HTTP.

O repositório não demonstra se a proteção de branch obriga a CI antes de merge,
nem se o workflow de publicação depende da validação. Essa conferência é uma
pendência operacional: até haver prova em leitura, o histórico de CI e deploy
deve ser registrado separadamente.

## Rollback

Para conteúdo do Firebase Hosting, usar a versão anterior do mesmo site, como
descrito no roteiro de transição. Para migration, seguir o rollback versionado
somente com plano validado em ambiente descartável e autorização explícita.
Rollback de dados, Auth, Storage, domínio ou flags pode ter efeitos próprios e
não deve ser improvisado durante um incidente.

## Corte do Auê 2.0 · M06.1

Em 28/11/2026, o parecer é **NO-GO para iniciar o corte** e **NO-GO para publicar**. O primeiro depende de recuperação comprovada e de homologação segregada. O segundo depende de o corte autorizado passar nos serviços hospedados, na prova física e na opção de publicidade aprovada pelo PO. As sete migrations podem estar pendentes ao autorizar o início do corte. As provas locais e o delta estão no [relatório da M06](../../missoes/M06-RELATORIO.md).

### Antes de abrir a janela

1. Fixar a candidata funcional 14dae9a9b1a94d97b789db9e1dc93c221bc8a0ab, a develop 4cf8e20723127f320884e03741efed3a3bea9a54 e a versão live 1e8142ce519c2614 do Firebase aue-oficial. A main observada está em ba161a10c50ffa8b7d7c060043e435a8deb59ea1. Conferir novamente os identificadores antes de agir. [PR #390](https://github.com/lgiammattey/aue/pull/390) · [CI da candidata](https://github.com/lgiammattey/aue/actions/runs/46150330280)
2. Fechar a recuperação do banco e dos objetos conforme abaixo. Guardar o pacote de retorno imutável e confirmar quem pode promover a versão no Firebase. Ensaiar o pacote e a candidata contra o mesmo backend de homologação migrado.
3. Usar aue-staging (rrkkmzamjntplgxktkyc) para dados sintéticos. O projeto existe e o Auth público informa login anônimo e e-mail habilitados. O PostgREST devolveu 401 com a chave pública consultada e as duas leituras de histórico expiraram. Storage respondeu à listagem anônima sem buckets visíveis. Apenas duelo-audio-v2 v2 está ativo entre as Edge Functions do staging, com resposta ao preflight. Mais evidência é necessária para aplicar o delta ou homologar serviços nesse ambiente. Esse projeto está autorizado para fixtures sintéticas. Uma restauração de dados reais exige destino segregado e autorização separados. [Mapa de ambientes](ambientes.md)
4. Confirmar as 117 migrations em produção (enjykrpprjfmeqxunzcs) e as sete pendentes, na ordem 20261128000001, 20261128000002, 20261128000004, 20261128000010, 20261128000040, 20261128000041 e 20261128000042. Comparar o histórico e os objetos tocados se houver mudança. Testar no staging constraints, RLS, grants, WAV e formatos históricos, em volume representativo. Verificar a versão do Postgres e medir a duração das validações de tabela. Usar 3 s de espera inicial por lock, como no ensaio local. Fixar o tempo máximo dos statements com base na medição do staging. Timeout, contenda ou erro interrompem a janela.
5. Reservar uma janela sem releases concorrentes. A integração Supabase tem **Deploy to production ligado para a main**. O Firebase também dispara ao atualizar a main e pode republicar por agendamento se a lista de grupos mudar. Coordenar, com autorização, a suspensão desse gatilho Supabase, de publicar-firebase.yml e de notas-publicadas.yml. Drenar execuções já em andamento antes de migrar. Esse controle evita que o frontend e o banco avancem em paralelo. [Integração observada](https://supabase.com/dashboard/project/enjykrpprjfmeqxunzcs/settings/integrations)

### Backup, restauração e reconciliação

O projeto está no plano **Free**, sem backup agendado disponível para restaurar, sem data recuperável listada e com PITR desligado. O painel exige Pro com backup físico para restaurar em um novo projeto. O tamanho observado foi 18.869.395 bytes de Postgres e 76 objetos com 10.339.474 bytes informados pelo Storage. Esse total vem dos metadados e ainda precisa bater com um manifesto de arquivos recuperados. [Backups do projeto](https://supabase.com/dashboard/project/enjykrpprjfmeqxunzcs/database/backups/scheduled) · [Política do Supabase](https://supabase.com/docs/guides/platform/backups)

- A saída de menor custo é autorizar o dump lógico oficial e a cópia dos objetos para um destino existente, privado e criptografado. Usar credencial de banco/túnel na hora da operação, sem reset de credenciais de produção nesta preparação. Conferir explicitamente a cobertura de roles e grants, schemas e dados de aplicação e do Auth, migrations e metadados do Storage. O inventário de configuração do Auth, redirects, emissão de sessão, versão de Edge e referências às credenciais fica separado dos dados e sob acesso restrito. O restore deve preservar contas, perfis, sessões e relações, publicações, comentários, reações, seguidores, resultados, X1, configurações e permissões. Testar refresh e acesso após a recuperação. Trocar de projeto/origem ou de chaves pode exigir novo login.
- Exportar os bytes de todos os buckets separadamente pelo protocolo oficial de Storage adequado ao projeto. O dump do banco preserva referências, e os arquivos precisam de cópia própria. Registrar por objeto o bucket, caminho, MIME, tamanho e SHA-256 em manifesto privado. Recuperar no destino segregado autorizado, conferir o total e os hashes e testar áudio, imagem e leitura assinada, incluindo recusas de conta sem acesso. Comparar o inventário do banco no mesmo ponto da cópia. Os arquivos, o manifesto privado e as credenciais ficam fora do GitHub. [Cópia de objetos](https://supabase.com/docs/guides/storage/management/download-objects) · [Dump e restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- **RPO e RTO atuais seguem sem comprovação.** Com backup diário Pro em operação, o RPO de banco fica em torno de até 24 h entre cópias e a retenção é de sete dias. Para a opção lógica, o RPO depende da frequência acordada e do último par íntegro de dump e arquivos. Para este corte, drenar escritas e fazer um checkpoint consistente antes da migration reduz o intervalo de perda. Medir o RTO da recuperação segregada somando restore do banco, cópia dos bytes, reconfiguração, reconciliação e prova das jornadas. Os tamanhos observados dimensionam a cópia, mas sem vazão e tempo medidos não há RTO a prometer. Pro parte de US$ 25/mês, PITR de sete dias acrescenta cerca de US$ 100/mês. Projeto adicional, cópia e egress têm custo conforme modalidade, destino e uso. [Preços Supabase](https://supabase.com/pricing) · [Preços de PITR](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)
- Ao recuperar, isolar escrita antes de apontar usuários para a cópia. Reter o estado pós-falha para reconciliação. Identificar as escritas posteriores ao checkpoint pelo horário e IDs, inclusive alterações e exclusões de objetos. Reaplicar de forma idempotente só o que se comprovar, na ordem de relações e arquivos, preservando exclusões, permissões e consistência. Conferir contagens, referências, hashes, sessão e isolamento antes de liberar tráfego.

### Homologação física e publicidade

O Firebase aue-oficial tem apenas o canal live. Supabase Preview foi pulado e os aliases públicos servem ou redirecionam para produção. A alternativa de menor custo é recuperar o staging existente com fixtures sintéticas e, com autorização posterior, usar um canal temporário do Firebase dentro da cota disponível. O bundle deve fixar o SHA, conter exclusivamente a URL e a chave pública do projeto de teste e estar com anúncios desligados. Antes de entregar a URL, conferir TLS/microfone, validar a ausência de chamadas ao banco e à coleta de produção e limitar o acesso/tempo de vida do canal. Esta etapa ficou sem URL de homologação. [Firebase Preview](https://firebase.google.com/docs/hosting/test-preview-deploy) · [Cotas do Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing)

Em **Safari no iPhone** e **Chrome Android**, anotar versão do celular, navegador, SHA da URL e resultado. Gravar e ouvir como visitante. Entrar numa conta de teste, gravar, consentir e publicar. Ouvir o WAV após recarga e tocar arquivos antigos. Com duas contas, criar e responder X1 e conferir recusa para terceiro e convite expirado. Instalar ou atualizar a PWA e conferir navegação e sessão.

O painel Publisher lista aue.web.app como aprovado. Native (31835810) e 300 × 250 (32055864) estão ativos, com os mesmos identificadores e URLs de script usados no código do Auê. 728 × 90 (32391235) e 320 × 50 (32391234) também já existem no legado. arrotaaue.com.br não consta no inventário consultado. O ads.txt público respondeu 200 e lista apenas google.com. Solicitar confirmação do provedor sobre aprovação do domínio oficial, reaproveitamento dos placements, uso em iframe isolado, filtros de categorias/idade, eventual entrada em ads.txt e método de teste sem impressão ou clique faturável. A idade declarada no app e o isolamento já foram provados localmente. As regras de criativo e a entrega no domínio oficial seguem sem prova. [Inventário Publisher](https://beta.publishers.adsterra.com/websites) · [Guia de aprovação](https://adsterra.com/blog/set-up-publishers-dashboard/)

- **Opção A.** Lançar com anúncios após homologar domínio e os placements usados no build pelo mecanismo que o provedor indicar. Confirmar ads.txt quando exigido. Preparar VITE_ADSTERRA_CONFIG_URL com HTTPS, GET/CORS, JSON e operação separada do build. Manter o endpoint em OFF até autorização de ativar e conferir indisponibilidade e retorno a OFF. A consulta ocorre ao focar e a cada 15 s em aba ativa, com timeout de 3 s. VITE_ADSTERRA_ATIVAR_REDE e VITE_ADSTERRA_CONFIG_URL estavam ausentes no repositório remoto.
- **Opção B.** Lançar com anúncios desligados e ativar depois mediante autorização do PO. Ainda exige recuperação, staging, prova física e GO dos serviços. Nenhum cadastro ou teste com tráfego cobrável ocorreu nesta etapa.

### Início do corte, publicação e volta

1. Após GO para iniciar o corte, suspender os gatilhos conforme a janela acordada, conferir o checkpoint e aplicar as sete migrations em ordem. Validar o catálogo afetado e as permissões após cada etapa. Atualizar cadastrar-grupo v5 depois da sua RPC e atualizar notas-worker v35 junto da fila. duelo-audio-v2 v41 e painel-administrativo v83 continuam na revisão conferida na M06, salvo divergência na rechecagem.
2. Confirmar as duas versões do frontend, sessão antiga e nova, arquivo histórico e WAV, autorização de Storage e X1, integridade e nota experimental. Validar o gateway e o worker com execução controlada antes de retomar a fila. Conferir o sitemap final com EXIGIR_GRUPOS=1. Interromper com erro de sessão/áudio, acesso indevido, falha na fila, divergência de catálogo, timeout de lock, URL pública perdida ou recuperação que não passe.
3. Solicitar o GO de publicação antes de liberar a main e o hosting público. Liberar o workflow Firebase apenas na janela esperada e correlacionar SHA, /versao-do-build.json, versão live e bundle. Verificar DNS/HTTPS, URLs, PWA, telemetria, consentimento, X1 e erros. Retomar automações depois de conferir histórico e integração. Ativar anúncios só na opção autorizada e quando os testes do provedor passarem.
4. Guardar o pacote local aue-rollback-hosting.tar.gz (SHA-256 34743a0fdaf3e7743a9ee20ff9d2dcfbe44b2fcf7417a8147b2b71b715483315). Ele contém dist, SHA256SUMS e configuração Firebase, com base ba161a10c50ffa8b7d7c060043e435a8deb59ea1, patch de telemetria e4f3f9ec04ef2703a5e05a04e1d2689ff3be637b e anúncios desligados. Passou build Node 24, 20 testes de telemetria, preservação das 13 URLs e playback WAV no WebKit com APIs dublês. Promover a versão compatível do mesmo site pelo mecanismo de Hosting autorizado. A promoção e a prova contra backend hospedado migrado aguardam autorização. [Releases do Firebase](https://firebase.google.com/docs/hosting/manage-hosting-resources)
5. Ao voltar, desligar ads e impedir novos jobs de publicar ou consumir fila até estabilizar. Preservar arquivos WAV, permissões da M02 e escritas pós-corte. Preferir correção aditiva do banco. Se houver recuperação de dados, executar a reconciliação no destino segregado antes de liberar tráfego.

## Prova de fogo pendente

A M00 aceitou a base para planejamento, com ressalvas. Ainda exigem ambiente
autorizado: cadeia real de RLS/Auth/Storage, worker de notas, gravação e
reprodução em aparelhos, estabilidade sem retry, Core Web Vitals de campo,
acessibilidade assistiva, confirmação do deploy efetivo e indexação além das
URLs verificadas. Esses limites permanecem no backlog; uma release futura só
os fecha com evidência proporcional.
