# Plano arquitetural — Arena v2, duelo e liga

Missão 0035 · 17/11/2026 · Camillo / Lucas

**Estado:** desenho para implementação e revisão. Não comprova mudança em banco, política, publicação ou segurança. A Arena v2 não deve anunciar duelo travado ou liga antes dos testes de contrato e acesso descritos abaixo. O histórico das batalhas existentes continua com seu contrato anterior.

## Ponto de partida

O jogo usa React/Vite, portas em `src/portas`, adaptadores em `src/plataforma/web`, Supabase para identidade e persistência e Firebase Hosting. A Arena canônica monta as portas em `src/arena/adaptadores.ts`. O áudio de resultado anterior está no bucket privado `audio_records`. Na migração `20260811000003_a_revanche_vira_round.sql`, `obter_batalha` devolve nota e caminho do áudio a quem possui o código. A política em `20260807000034_fecha_leitura_de_resultados.sql` não distingue participante de batalha travada. Uma nova tela escondendo esses campos não fecha o acesso.

A auditoria da missão conferiu a função e a política no ambiente de produção em 17/11, mas **não** executou teste de acesso com dois jogadores, nem comparou toda a configuração remota com as migrations. Antes de aplicar qualquer migration, comparar histórico e esquema do staging e da produção. Não transformar alertas automáticos de RLS em prova isolada de vulnerabilidade ou de segurança.

O score antigo é calculado no servidor a partir de características fornecidas pelo cliente. A própria migration `20260807000011_server_side_score_and_duel.sql` registra que um cliente adulterado pode fabricar essas características. A decisão do vencedor no banco não autentica a origem do som.

## Limites que não mudam

- Preservar `/b/:code`, `/x1/:code`, `/d/:id`, dados, prazo e regras legadas. O novo duelo recebe rota e contrato próprios, por exemplo `/duelo/:token`; o nome definitivo deve ser fixado com a implementação e seus testes. Não encaminhar token novo às RPCs antigas.
- `/feed`, comunidades, anúncios existentes, perfis, URLs sociais e `/?gravar=1` continuam funcionando; ao mover a raiz, corrigir também retornos de login e publicação que hoje apontam para `/`.
- Manter Supabase e Firebase Hosting. Nada de mover os dados para Firestore, expor `service_role` ao browser, abrir bucket ou ampliar RLS para que a tela funcione.
- Não reaproveitar score antigo como duração ou laudo v2; armazenar versão e unidade. O cálculo legado continua atendendo resultados antigos.
- Sessão anônima não é cadastro exigido: ela fornece `auth.uid()` ao backend. Limpar armazenamento ou trocar de dispositivo pode perder a identidade; a interface deve explicar isso quando houver necessidade de recuperar histórico.

## Gravação e laudo

O adaptador `src/plataforma/web/captura.ts` é dono do microfone, gravador e medidor da Arena. Solicitar desligamento de ganho automático, cancelamento de eco e supressão de ruído como preferência; inspecionar as configurações que o navegador realmente informa, sem prometer ausência de processamento. Detectar formato suportado e guardar o MIME efetivo. O toque de parar deve iniciar o encerramento e liberar as tracks sem descartar o último `dataavailable`; cancelamento e permissão tardia precisam ter dono e testes. Cobrir também ocultação da aba, erro e desmontagem.

A referência de ruído é uma janela explícita captada antes da emissão. A medição deve registrar falha ou qualidade insuficiente quando não houver base utilizável. O núcleo puro recebe amostras e calcula duração detectada, potência relativa ao ruído e, se houver confiança, frequência fundamental; não chama APIs web. Não chamar a potência de dB SPL, nem converter energia abaixo de 150 Hz em pitch. `0–100` requer fórmula, limites e versão explícitos; clipping ou ruído excessivo podem tornar a tentativa inconclusiva. YAMNet é sinal auxiliar sujeito a erro, não prova de arroto ao vivo ou de ausência de reprodução externa.

Manter prévia local separada do resultado persistido. O modelo novo precisa guardar, no mínimo, duração em ms, índice e parâmetros de potência quando disponíveis, Hz e confiança quando disponíveis, qualidade/estado, versão do cálculo e identificação do áudio. A definição exata de limiares fica sujeita a medições de amostras consentidas e aparelhos reais. A regra de vitória inicial usa duração válida e mesma versão de cálculo; não combinar versões silenciosamente.

## Duelo novo: fronteiras e transações

### Entidades propostas

Nomes sujeitos à nomenclatura e às migrations, não são esquema já aplicado:

- **`gravacoes_v2`:** id, `usuario_id` derivado de `auth.uid()`, referência ao objeto privado, estado de upload/validação, medições versionadas, data e estado de exclusão. Nenhum resultado é criado ou revelado como áudio disponível antes de o upload estar confirmado.
- **`duelos_v2`:** id interno, hash do token de convite aleatório, dono, gravação inicial, categoria/versão de regra, validade, estado e timestamps. Não listar tokens ou linhas por acesso direto.
- **`respostas_duelo_v2`:** duelo, identidade vencedora da vaga, gravação e data. Constraint única por duelo na primeira rodada, além de unicidade/idempotência para repetição da mesma operação.
- **Resultados/revanches:** guardar o resultado decidido no servidor com versão da regra e estado inconclusivo/empate; modelar revanche como novo desafio de rodada somente quando os contratos de ambos os participantes estiverem definidos.

A duração de validade do link novo ainda não foi escolhida. Até isso ser registrado, preservar os sete dias do produto atual como padrão de compatibilidade, sem alterar links já emitidos. O token deve ser imprevisível com entropia suficiente, nunca sequencial, e armazenado como hash sempre que o fluxo permitir. Evitar gravá-lo em telemetria, logs, analytics, URLs externas e cabeçalhos de referência; a posse do link permite iniciar o desafio, então quem o recebe pode encaminhá-lo.

**Medição da Arena e limite de privacidade:** a tag Google Analytics é carregada só em `/` ou `/arena`, com endereço sem parâmetros ou fragmento e sem exclusão ativa; eventos explícitos usam localização canônica e nenhuma medição de áudio. `send_page_view: false` não desliga necessariamente eventos automáticos de medição otimizada configurados na propriedade Google. Confirmar essa configuração e observar a rede antes de ligar qualquer rota de convite ou navegação SPA que mantenha a tag carregada: eventos automáticos podem incluir URLs. A exclusão de telemetria deste navegador não exclui contagens de contas de autenticação nem desfaz dados já enviados.

### Contrato de operações

1. **Preparar gravação:** sessão anônima autenticada; servidor cria referência de upload restrita ao dono e aos limites de tamanho/MIME. Upload vai a objeto privado, separado do namespace e das políticas permissivas do áudio legado. Se a criação for interrompida, a tentativa fica pendente, não vira duelo válido.
2. **Confirmar gravação:** servidor verifica propriedade, objeto associado e estado. Verificar objeto no catálogo do Storage ou por meio autorizado não é validação acústica; falhas de upload, decodificação ou leitura produzem erro/inconclusivo. A integridade do arquivo e a coerência das medições exigem testes próprios.
3. **Criar convite:** apenas o dono de gravação confirmada cria duelo; servidor fixa prazo e regra, gera token e grava apenas representação verificável. Retorna link uma única vez ou oferece mecanismo explícito para recriá-lo/revogá-lo sem listar segredos.
4. **Abrir convite:** consulta pública deliberadamente mínima: existência/estado necessário à experiência, categoria e orientação para gravar. Não devolve nota, duração, áudio, caminho, id de resultado, waveform, prévia do placar ou URL assinada do criador. A resposta deve ser equivalente para dados que não devem ser distinguidos; limitar tentativas, sem depender apenas da dificuldade de adivinhar token.
5. **Responder:** uma RPC/serviço transacional valida sessão, convite, expiração, posse e estado da gravação, bloqueia a linha do duelo (`FOR UPDATE`), recusa o criador como oponente, grava a primeira resposta válida e fecha a vaga. Constraint única é segunda defesa. Repetição da mesma requisição pelo mesmo usuário deve devolver o resultado da própria operação; outra pessoa recebe estado de vaga ocupada, sem dados privados. Definir a idempotência de forma a não permitir mudar a resposta após confirmação.
6. **Revelar:** uma leitura autenticada verifica `auth.uid()` como criador ou respondente confirmado e estado fechado; então devolve somente os dados permitidos. Quem tem o link mas não participou não ganha acesso pelo estado fechado. O criador pode acessar a própria gravação por sua identidade; um usuário que perdeu a sessão anônima não deve receber acesso de participante apenas por conhecer o token.
7. **Ouvir:** preferir acesso autenticado ao objeto com RLS conferindo dono ou participação e estado da disputa. Se uma URL assinada for necessária para o player, emiti-la após a mesma checagem, com duração curta, sem a colocar em HTML, OG ou logs. Ela é uma credencial temporária transferível e pode permanecer válida até expirar; não prometer revogação instantânea.
8. **Apagar, denunciar ou expirar:** dono pode pedir exclusão do próprio áudio conforme política existente; o duelo passa a indicar áudio indisponível sem divulgar arquivo por outra rota. Denúncia/moderação impede nova leitura. Expiração do convite não é expurgo de áudio. Definir e testar o efeito sobre placar antes de publicar; preservar o comportamento dos dados antigos.

**Bloqueio para habilitar upload remoto:** as tabelas v2 referenciam `auth.users` sem tratamento de exclusão; uma conta que preparou uma gravação não pode ser removida enquanto a referência existir. É necessário implementar e testar um fluxo de exclusão de conta que primeiro bloqueie acesso, trate os arquivos pelo Storage e resolva as referências e a retenção de moderação. Exclusão lógica ou ausência de metadados não comprovam remoção física. Não habilitar upload remoto antes dessa solução e sua validação isolada.

Tabelas novas em esquema exposto exigem RLS habilitada e grants mínimos. Uma função privilegiada, se necessária para uma transação que RLS não consegue expressar, recebe validação de `auth.uid()`, estado e propriedade dentro do corpo, `search_path` fixo e permissões `EXECUTE` explicitamente revogadas e concedidas apenas ao papel necessário. `authenticated` inclui sessões anônimas; esse papel sozinho não prova autorização. Nunca autorizar a partir de `user_metadata` editável pelo cliente.

A função legada `obter_batalha`, a política `Audio is readable while not hidden`, o feed, perfis, buscas, funções públicas e links assinados antigos precisam ser incluídos na análise de caminhos alternativos. Um bucket novo e isolamento de dados são preferíveis a passar áudio v2 pelo bucket e pelas RPCs que já devolvem conteúdo legado. Não há garantia de sigilo se a mesma gravação também for publicada voluntariamente em outro lugar; a interface precisa tornar essa audiência explícita.

## Liga privada semanal

Proposta mínima: `ligas_v2` (id, criador, nome, fuso e configurações), `convites_liga_v2` (hash de token, validade e revogação), `membros_liga_v2` (liga, usuário, apelido e papel), `rodadas_liga_v2` (início/fim UTC mais fuso IANA usado, versão da regra e estado), `tentativas_liga_v2` (rodada, membro, gravação e validação) e resultado consolidado. Restringir leitura e escrita ao membro correto; token de convite permite pedir entrada, não listar participantes ou ler gravações antes da confirmação da participação. Criador pode revogar convite, gerar outro e administrar membros conforme regra de produto.

Rodada de segunda a domingo no fuso escolhido, convertida para intervalos UTC `[início, fim)`; não usar relógio do aparelho para aceitar tentativa. O fechamento deve ser idempotente e transacional, com unicidade por liga/período, registro da versão da regra e ordenação determinística. Melhor duração válida por membro; empate explícito. Processos de fechamento atrasados não podem aceitar tentativa após o fim do intervalo. O boletim é gerado a partir do resultado consolidado, exibe os apelidos e marcas antes de a pessoa compartilhar, e nunca é enviado automaticamente.

Antes de reaproveitar `grupos`, `campeonatos` e `participantes_campeonato`, comparar regras, visibilidade e estado do banco remoto. Sua existência não comprova que sejam ligas privadas semanais. Sem mudança explícita de produto, não criar exclusão automática de dados nem prometer recuperação de conta anônima entre aparelhos.

## Prévia, hospedagem e busca

A página pública de apresentação pode ser HTML estático gerado no build, entregue antes da hidratação; título, descrição, canonical, texto e link de entrada devem refletir o produto real. Preservar `robots.txt`, `sitemap.xml`, arquivos legais e regras do service worker que não armazenam áudio privado. Convites fora do sitemap, acessíveis ao robô para ler `noindex`, com metadados genéricos que não revelam confronto.

Para a primeira fatia, uma entrada HTML estática genérica específica da rota de convite pode resolver o aviso sem spoiler sem exigir dado dinâmico. A rota deve retornar a casca correta para humanos e bots e preservar a URL necessária ao cliente. Para resultado/card dinâmico após revelação, comparar opções com custo, privacidade e tempo de operação: Firebase Hosting encaminhando rota específica a Cloud Function/Cloud Run é uma possibilidade técnica, não implantação aprovada nem custo zero. O rewrite específico precede o catch-all; arquivo estático exato e redirects têm precedência. Resposta personalizada não entra em cache compartilhado; não incluir áudio, token privado ou nome de usuário em imagem/metadados por padrão.

O ADR 0003 documenta que a tentativa antiga de servir HTML pelo gateway Supabase voltou como `text/plain` com CSP e `nosniff`. Não repetir o mesmo caminho como se estivesse resolvido. Renderização no servidor/borda ou backend adicional exigem novo ADR pelo §8 do ADR 0001; registrar a solução, custo e rollback antes de integrar. A autorização de implementação da missão não é evidência de deploy ou aceitação do custo de infraestrutura.

Referências atuais: [controle de acesso do Storage](https://supabase.com/docs/guides/storage/security/access-control), [chaves de URLs assinadas](https://supabase.com/docs/guides/storage/security/signing-keys), [prioridade e rewrites do Firebase Hosting](https://firebase.google.com/docs/hosting/full-config), [cache do Hosting](https://firebase.google.com/docs/hosting/manage-cache).

## Provas que liberam cada etapa

1. **Captura:** testes do adaptador para dois pedidos concorrentes, cancelamento antes da permissão, parada, erro, último chunk e formatos; teste real em Safari iOS e Chrome Android, inclusive saída da aba. Marcar separadamente o que foi comprovado em código e no aparelho.
2. **Medição:** testes com sinais conhecidos, silêncio, ruído ambiente, clipping e pitch ausente; amostras consentidas em dispositivos diferentes. Documentar erro, indisponibilidade e taxa de rejeição, sem chamar centésimos de precisão física.
3. **Privacidade:** testes em ambiente isolado com criador A, convidado B e terceiro C: acesso direto à API/Storage por todos antes e depois da resposta, token inválido/expirado, áudio removido, revogação e URLs temporárias; verificar também funções e políticas legadas, CDN, metadados e telemetria.
4. **Concorrência:** respostas simultâneas de B e C, clique duplo, retry após timeout, falha entre upload e confirmação, tentativa com gravação de terceiro ou excluída, rollback e consistência da vaga. Só uma resposta fecha o duelo.
5. **Ligas:** fuso, virada de semana e horário de verão quando aplicável; escrita no limite do relógio do servidor, fechamento repetido, edição/exclusão, usuário fora da liga, empate, mudança de versão e boletim após reload.
6. **Entrega web:** compatibilidade dos links antigos e parâmetros, inspeção do HTML/headers e ausência de spoiler com acesso direto, navegador real e prévia no WhatsApp; verificar crawler e Search Console depois da publicação. Testes locais não comprovam indexação nem envio no WhatsApp.
7. **Mudanças de banco:** migrations e reversão no ambiente local, comparação de drift e teste de staging, revisão de funções privilegiadas, Storage e advisors; nenhuma migration ou deploy de produção fica implícito nesta missão.

O gate fica **pendente de validação** até cada contrato implementado passar nas provas correspondentes. O desenho não garante que o navegador, a rede ou um terceiro com acesso ao aparelho impeçam fraude ou redistribuição de áudio.

## Achado da prévia: ambiente no arquivo

Na captura experimental, o `MediaRecorder` grava desde o começo da calibração.
A prévia gera o arquivo reproduzido em WAV a partir das amostras PCM posteriores
à calibração; ela não utiliza o arquivo comprimido que contém o ambiente. Testes
sintéticos verificam essa separação, mas a reprodução e o comportamento real em
iPhone e Android ainda precisam de prova. Sons captados após o início da emissão
continuam no áudio. Antes de enviar, permitir que a pessoa o ouça e confirme.
Não usar tempo de interface como ponto de corte exato de um arquivo comprimido.
Uma amostra de ambiente contaminada por som repentino também deve produzir
resultado inconclusivo, com limites tratados como hipóteses até validação real.

## Provisionamento e privacidade do bucket v2

O bucket `duelos_v2` deve ser criado antes das migrations pela API administrativa
oficial do Storage, usando ambiente e credencial de servidor próprios. Ele precisa
ser privado, aceitar somente `audio/wav` e limitar o arquivo a 5.242.880 bytes.
A migration consulta os metadados e falha se o bucket estiver ausente ou tiver
configuração diferente; não cria nem apaga o bucket por SQL. Nenhum recurso foi
provisionado por esta preparação local.

Exclusão é uma sequência com retomada: a RPC de solicitação torna áudio e duelo
indisponíveis, devolve o caminho só ao dono e permite que este chame
`storage.remove`. A confirmação só verifica ausência dos metadados depois da
chamada; ausência de metadados isolada não comprova remoção física nem autoriza
anunciar sucesso sem a confirmação da API. Após interrupção, o dono recupera
pedidos pendentes. A policy limita seleção, inserção e exclusão a operações
Storage específicas e bloqueia assinatura de URLs; verificação real HTTP e de
policies combinadas em staging permanece obrigatória.

A denúncia é limitada ao outro participante do duelo concluído e coloca o áudio
em quarentena. Somente administradores autorizados do Auê podem consultar a fila
ou revisar o áudio denunciado; solicitação de exclusão prevalece sobre a revisão.
Decisões de manter oculto ou restaurar ficam registradas. Estes contratos são
locais e ainda não comprovam operação de moderação em produção.
