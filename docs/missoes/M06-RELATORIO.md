# M06 · Prontidão do Auê 2.0

28/11/2026 · Parecer de Marcelo **NO-GO para publicar**. Tiago deu à preparação o aceite **APROVADO COM RESSALVAS**. O Product Owner decide a publicação após fechar os bloqueios registrados.

A [M05 #389](https://github.com/lgiammattey/aue/pull/389) entrou na develop em **4cf8e20723127f320884e03741efed3a3bea9a54**. O SHA eaa43eca8722e8612bf3aac8adc4d77a31dce52b é o segundo pai do merge e o conteúdo das árvores é igual. O [CI da M05](https://github.com/lgiammattey/aue/actions/runs/46146924004) e o [CI da develop integrada](https://github.com/lgiammattey/aue/actions/runs/46147650839) passaram. A branch codex/m06-release parte desse merge. O head e os checks da candidata constam na PR da M06.

A main segue em **ba161a10c50ffa8b7d7c060043e435a8deb59ea1**. O canal live do Firebase aue-oficial aponta para a versão **1e8142ce519c2614**, de 25/11 às 13:17:47 BRT. O timestamp cai dentro da etapa de publicação desse SHA e o domínio serve assets/main-BxOCUpHZ.js. A versão antecede o marcador de SHA, então a identificação é por correlação de metadados. O merge na develop disparou somente validação. [Run da publicação anterior](https://github.com/lgiammattey/aue/actions/runs/45652330153)

## Correções e revisão

- Os roteiros SQL duelos_v2.sql e duelos_v2_privacidade.sql agora passam o token gerado pelo cliente no contrato aue_v2_criar_duelo(uuid, text). O harness aplica a migration de convites antes dos roteiros. A cobertura de recuperação, privacidade, denúncia e exclusão foi preservada.
- A telemetria do X1 clássico conta eventos sem transmitir o código de acesso. O código entra só na deduplicação em memória do navegador.
- Hosting ganhou noindex, no-referrer e no-store para histórico de Disputas, perfil próprio, administração e redefinição de senha. Perfis públicos continuam acessíveis. O workflow identifica o artefato em /versao-do-build.json e restringe publicação à main, inclusive em disparos manuais.
- A publicidade ganhou controle por build, confirmação local de 18+ e configuração em tempo de execução. Native e 300×250 ficam isolados em iframes. Smartlink e Social Bar saíram do caminho. O histórico privado de Disputas fica sem slot real.

Camillo revisou os contratos, a ordem do corte e o isolamento da publicidade. A rodada cruzada encontrou problemas no iframe e na montagem responsiva, corrigidos antes da validação. O diff revisado recebeu **SEM ACHADOS MATERIAIS**. O aceite do Tiago cobre a preparação e mantém os bloqueios de publicação.

No Node 24, typecheck, lint, test e build passaram. Foram 2.589 testes aprovados e nove ignorados. Os dez testes do worker/modelo e oito E2E do PWA legado, perfil, nota e visual do X1 também passaram.

## Comparação com o Supabase de produção

A consulta autorizada usou somente leitura de metadados do projeto Auê, Postgres 17.6. Conferimos migrations, colunas, funções/RPCs, RLS, policies, grants, buckets, configuração pública do Auth e versão/fonte de Edge. A prova guarda configurações e contagens, sem dados de contas ou áudios privados.

| Área | Produção observada e diferença na candidata |
|---|---|
| Migrations | 117 aplicadas de 124 versionadas. Todos os identificadores e nomes aplicados batem com o Git. As sete abaixo são o delta confirmado. |
| Tabelas, colunas e RLS | Mesmas 47 relações de aplicação em public e aue_privado e mesmo estado de RLS. A diferença de colunas é resultados.integridade. Os schemas gerenciados de Auth e Storage têm objetos e versões diferentes da stack local. |
| Policies e grants | Mesmo conjunto de 64 policies no recorte. Sete regras de escrita de Storage passam ao novo helper de sessão promovida. O helper interno aue_ler_comunidades_do_forum(text) ainda tem EXECUTE de cliente em produção. A candidata retira esse acesso. Há diferenças em grants efetivos de objetos históricos entre a stack gerenciada e a descartável. |
| RPCs e funções | 202 funções da aplicação na produção e 205 na candidata. Assinaturas de criação e resposta do X1 já batem. A candidata acrescenta cadastrar_grupo_com_limite, sessao_promovida() e um helper interno de recuperação. Altera comparação, elegibilidade e a fila de notas. |
| Storage | Mesmos nove buckets. duelos_v2 é privado, tem limite de 5 MiB e já aceita WAV. audio_records também é privado e aceita WAV. anexos_do_forum é privado, 10 MiB, e ainda recusa WAV no bucket e nas constraints de tópicos e respostas. A candidata adiciona WAV mantendo WebM, Ogg, MP4/M4A, MPEG/MP3 e os limites anteriores. |
| Auth | E-mail e sessões anônimas habilitados, com cadastro aberto e confirmação de e-mail ativa. Provedores sociais da configuração pública estavam desligados. As sessões hospedadas após o corte precisam de homologação no ambiente correspondente. |
| Edge Functions | cadastrar-grupo v5 ainda tem o código anterior e precisa da versão que chama a RPC atômica. notas-worker v35 precisa do entrypoint que aceita audio_records. O código comparado de duelo-audio-v2 v41 e painel-administrativo v83 é idêntico ao candidato. og-preview, teste-content-type e uso-unico-imagens-oficiais também constam ativos. |
| Worker e dependências | O worker roda no GitHub Actions da main e chama o gateway notas-worker. A [execução agendada observada](https://github.com/lgiammattey/aue/actions/runs/46109267548) passou. O candidato rodou contra Edge, Storage, banco e YAMNet locais. Recusou HTTP sem segredo e concluiu dois itens sintéticos como rejeitados pelo modelo, sem erro. Origem confiável no gateway e processamento com o candidato hospedado seguem sem prova. O build do Firebase depende ainda da leitura dos grupos públicos para preservar o sitemap. |

| Versão pendente | Mudança que precisa bater depois da aplicação |
|---|---|
| 20261128000001 | Cadastro de grupos atômico, com RPC de serviço e limite por origem e total. |
| 20261128000002 | Resultados históricos preservados como legado. Medições não verificadas perdem elegibilidade competitiva. |
| 20261128000004 | Fila aceita áudio publicado com consentimento e distingue objeto, autor e concessão. Comparação do X1 continua experimental. |
| 20261128000010 | Resumo de perfil e placares respeitam elegibilidade dos resultados. |
| 20261128000040 | Storage confere promoção da sessão sem expor consulta sobre outra conta. |
| 20261128000041 | EXECUTE do helper interno do fórum retirado dos clientes. |
| 20261128000042 | Bucket, constraints e RPC de anexos da Resenha passam a aceitar WAV. |

O primeiro startup local confirmou o pré-requisito histórico de criar o bucket privado duelos_v2. Com ele provisionado na fixture, as 124 migrations passaram. O 503 inicial da Edge veio da montagem de arquivos da VM. Servir as funções de um diretório que a VM consegue ler resolveu o problema local. O 500 de admin.listUsers veio de um token nulo no seed. A prova seguiu com contas sintéticas novas e login anônimo habilitado só nessa stack.

No ensaio incremental, PostgreSQL recebeu as sete migrations uma por vez sobre 117 já aplicadas. A conta, perfil, sessão, resultado e quatro publicações e objetos sintéticos em WebM/Ogg/M4A/MP3 permaneceram reconhecíveis. O resultado antigo recebeu a classe legado prevista. Um dump local com SHA-256 restaurou a mesma conta, perfil, sessão, resultado e quatro referências de mídia em outro banco. Esse ensaio prova a recuperação dos registros sintéticos. O teste HTTP cobriu os bytes de áudio separadamente.

## Homologação

| Jornada | Resultado e limite |
|---|---|
| Início PT/EN | Canonicals, alternates e entradas PT/EN conferidos. As duas Homes mostraram cinco itens elegíveis e playback no Chromium e WebKit. Dez cenários locais incluíram navegação, largura travada em 320, 390 e 1440 px e anúncio simulado. Atualização da Resenha preservou o player no Chromium. Destaques, vazio e falhas têm cobertura de componente ou contrato. |
| Arrotar | Chromium gravou PCM com uma amostra de microfone sintética. O consentimento começou desmarcado e nenhum envio aconteceu antes da autorização. Depois houve upload WAV 200, RPC de publicação 200 e reprodução após recarga. MP4, WebM, modelo do juiz, falha e descarte têm cobertura automatizada. Laudo continua experimental. |
| Resenha | Fixture WebM teve URL assinada e 35.319 bytes entregues pelo Storage local. Reações positiva, negativa e retirada passaram no Chromium. Comentário, imagem e seguidores entraram pelo seed HTTP. Player, nota elegível, vídeo e compartilhamento têm cobertura de contrato ou componente. |
| Disputas | Roteiros SQL corrigidos e o de convites passaram no PostgreSQL local. O X1 sintético fez convite, resposta e recuperação com duas contas. Edge devolveu 200/200 para os participantes com WAV íntegro e no-store, e 404 para a terceira conta. Chromium e WebKit abriram o X1 respondido sem declarar vencedor. Expiração, denúncia e exclusão têm prova SQL/contrato. |
| Perfil | Três contas sintéticas criadas, login com senha, sessão anônima, conclusão de perfil e seguir passaram via API local. Resumo de notas conferido em desktop e viewport móvel. Foto, busca, visibilidade e permissões contam com testes existentes. |

Além da prova da Resenha, o WebKit tocou um Blob WAV autorizado no próprio compositor, com avanço do player e publicação ainda bloqueada sem consentimento. A reprodução logo após uma captura física segue sem prova. WebKit local não disponibilizou o microfone sintético exigido pelo roteiro de captura.

### Checklist físico para Safari no iPhone e Chrome Android

1. Como visitante, negar o microfone, liberar de novo, gravar por dois segundos, parar, ouvir, compartilhar e descartar. Conferir se a indicação de gravação desaparece ao parar ou sair.
2. Entrar e gravar na Arena e no compositor. Ouvir até avançar o tempo nas duas telas. Consentir, publicar, recarregar e tocar na Resenha. Ouvir o WAV novo e áudios antigos disponíveis.
3. Criar e responder X1 com duas contas, ouvir as duas gravações, reabrir pelo histórico e conferir que terceira conta e link expirado ficam sem acesso.
4. Atualizar um PWA já instalado e conferir sessão, navegação PT/EN, largura da tela e anúncio autorizado fora dos controles.

## Monetização, SEO e telemetria

**Adsterra.** O Início reaproveita Native 4:1. Resenha, lateral desktop, perfil com atividade e resultado solo usam 300×250. A frequência padrão na Resenha é de cinco itens no desktop ou seis no mobile, até três espaços. O build só libera chamadas com VITE_ADSTERRA_ATIVAR_REDE=1 e VITE_ADSTERRA_CONFIG_URL. O endpoint HTTPS sob controle do Auê responde GET/CORS com JSON {"adsterra":true}. Ausência, falha ou tempo esgotado fecha o switch. {"adsterra":false} retira os frames na próxima consulta, no foco e a cada 15 segundos em aba ativa, com até três segundos por consulta. As variáveis remotas estavam ausentes. O dublê comprovou ativação após maioridade e retirada após indisponibilidade. Bloqueio de script também encerra o slot. Resposta sem inventário e clique legítimo do provedor ainda precisam de prova.

Confirmar no painel publisher a elegibilidade dos placements existentes para arrotaaue.com.br, formatos de criativo permitidos e clique dentro do sandbox. O inventário versionado não tem **728×90 desktop** nem **320×50 mobile** em formatos horizontais fixos. São os dois placements a cadastrar caso o Native não cubra a posição horizontal. O retângulo existente atende aos espaços desse formato. A entrada Adsterra no ads.txt deve vir do painel se exigida. O arquivo público atual só contém a entrada do AdSense. Os testes geraram zero impressões e cliques de rede publicitária. [Formatos do Publisher Adsterra](https://adsterra.com/blog/how-banner-ads-make-money/)

**SEO/PWA.** HTTP público confirmou Home PT/EN, sitemap, robots, manifest, service worker e ads.txt. aue.web.app, aue.firebaseapp.com, aue.vercel.app e www.arrotaaue.com.br fizeram 301 preservando caminho e query. O sitemap tinha 13 URLs, quatro de grupos e nenhuma rota privada do recorte. O build com EXIGIR_GRUPOS=1 e dados de grupos simulados preservou as 13 URLs oficiais. O Firebase Emulator confirmou 404 real, caminhos privados, perfil público e cabeçalho sem cache do marcador de versão. A migração do PWA legado preservou dados locais simulados. Usar a propriedade existente do Search Console para monitorar depois da autorização. Indexação nova permanece sem prova.

**Telemetria.** Chromium executou a tag GA4 com a coleta interceptada. O adaptador respeita opt-out e restringe hosts e URLs. A tabela do Supabase permite INSERT e fica sem SELECT para clientes. Visitas, início/fim de gravação, falha, laudo, play, compartilhamento de áudio e X1 clássico têm caminhos de medição. Publicação, interações da Resenha e X1 v2 têm registros de produto no backend e cobertura parcial como eventos de Analytics. A correção do código do convite vale para o novo cliente. Dados históricos e clientes antigos em cache precisam de verificação de retenção ou bloqueio no servidor antes de uma ação corretiva.

## Ordem de publicação e rollback

1. **Fixar versões.** Registrar head validado, versão live e bundle público. Construir e guardar o artefato de retorno com correção da telemetria, anúncios desligados e leitura de WAV. Uma cópia do frontend da main atual tocou WAV em Chromium e WebKit com bytes reais sintéticos e APIs dublês. Ensaiar o artefato de retorno com o backend migrado.
2. **Confirmar backup e recuperar.** Confirmar janela de backup/PITR e separar a cópia dos objetos de Storage. Guardar schemas da aplicação e do Auth, versões, papéis/policies, manifesto e bytes dos objetos e configuração das funções. Registrar hora, tamanho e checksums. Restaurar em ambiente segregado e conferir contagens, referências, bytes e sessão de teste. Valores sensíveis ficam no cofre. [Backups do Supabase](https://supabase.com/docs/guides/platform/backups)
3. **Preparar a janela do banco.** Conferir catálogo, Auth, bucket X1 e travas. M02 altera resultados, fila e policies. WAV recria duas constraints e pode bloquear escrita de tópicos e respostas. Medir tempo em volume representativo e limitar espera por locks. Coordenar a pausa do worker durante a mudança de fila.
4. **Subir o backend antes do frontend.** Aplicar as sete migrations em ordem crescente, confirmando catálogo, grants e integridade após cada aplicação. Atualizar cadastrar-grupo depois da nova RPC e notas-worker junto da fila. Conferir origem, segredo e concessão do worker, formatos de mídia e leitor antigo. Retomar a fila após um ciclo de validação.
5. **Validar as duas versões do app.** Checar sessão antiga e nova, perfis, Storage, consentimento, áudio antigo e WAV, X1, permissões, moderação e sitemap final com EXIGIR_GRUPOS=1. Interromper o corte se o catálogo divergir, o backup não puder ser recuperado, houver timeout de lock, erro de sessão ou mídia, acesso indevido, perda de URL pública ou falha no gateway/worker.
6. **Publicar após o GO.** A main dispara deploy automático no Firebase. Considerar o job agendado de grupos e o worker de notas. Conferir /versao-do-build.json, SHA do run, live no Firebase, PWA e domínio. Só então liberar ads no endpoint de controle. Monitorar sessões, erros de captura, uploads, fila e inventário real. Suspender o corte se o criativo interferir em áudio, controles ou navegação.
7. **Voltar por camada.** Desligar anúncios e pausar jobs que possam sobrescrever o retorno. Promover o artefato de frontend ensaiado. Preservar suporte WAV, permissões da M02 e registros pós-corte. Para banco, preferir uma correção aditiva. Em caso de perda de dados, restaurar primeiro para conferência e reconciliar as escritas entre a janela do backup e a falha. [Modelo de release do Firebase](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels.releases)

## GO/NO-GO por dimensão

| Dimensão | Parecer | Evidência ou bloqueio |
|---|---|---|
| Código e CI | GO | M05 validada e integrada. Checks da candidata registrados na PR. |
| Banco e migrations | NO-GO | Sete migrations pendentes no ambiente hospedado. Ensaio incremental passou. |
| Integridade dos dados | NO-GO | Fixture histórica preservada. Compatibilidade e recuperação hospedadas pendentes. |
| Auth, Storage e serviços | NO-GO | Auth, Storage, X1 e worker passaram em recortes locais com Edge. Novo gateway/worker e configuração hospedada sem prova. |
| Áudio e compatibilidade | NO-GO | PCM sintético, consentimento, WAV, X1 privado e rollback local comprovados. Compositor após captura física e validação do corte hospedado pendentes. |
| Experiência | GO com ressalvas | Chromium e WebKit passaram os recortes de experiência. Aparelhos físicos não validados. |
| Publicidade | NO-GO | Isolamento e switch conferidos com dublê. Inventário, clique e entrega do provedor sem homologação. |
| SEO e PWA | GO com ressalvas | HTTP, build e PWA legado conferidos. Indexação nova e PWA em aparelho aguardam prova. |
| Telemetria | GO com ressalvas | Coleta interceptada e código de convite fora do payload. Lacunas no social e X1 v2. |
| Backup e rollback | NO-GO | Restore sintético e leitura WAV no build de retorno passaram. Restauração hospedada e retorno com backend migrado pendentes. |

Bloqueiam a publicação o banco atual incompatível, a falta de prova dos serviços hospedados no novo corte, a recuperação hospedada e a monetização real. A main e a versão live seguem no corte anterior. A decisão fica com o Product Owner.
