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

## Prova de fogo pendente

A M00 aceitou a base para planejamento, com ressalvas. Ainda exigem ambiente
autorizado: cadeia real de RLS/Auth/Storage, worker de notas, gravação e
reprodução em aparelhos, estabilidade sem retry, Core Web Vitals de campo,
acessibilidade assistiva, confirmação do deploy efetivo e indexação além das
URLs verificadas. Esses limites permanecem no backlog; uma release futura só
os fecha com evidência proporcional.
