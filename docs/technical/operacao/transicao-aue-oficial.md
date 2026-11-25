# Transição do Firebase Hosting para `aue-oficial`

Este roteiro prepara a troca de site Firebase. Não transfere domínio, não muda
DNS, não publica o legado e não altera Supabase.

## O que esta preparação garante

- O Hosting ativo do workflow usa o alvo `aue-oficial`, mapeado para o site
  Firebase de mesmo nome em `.firebaserc`.
- O mesmo job preserva build com credenciais, `EXIGIR_GRUPOS=1` e a verificação
  do sitemap final antes de publicar.
- `firebase.legado-redirect.json` é um artefato separado. O workflow não o
  lê. Portanto, adicionar este arquivo ao repositório não muda `aue`.

O domínio canônico continua definido pelo aplicativo como
`https://arrotaaue.com.br`. A associação do domínio não é configurável pelo
repositório e só acontece na etapa operacional.

## Coordenação do pipeline e pré-corte

**Não mesclar esta troca de alvo cedo.** Enquanto o domínio ainda estiver no
site `aue`, a `main` precisa continuar publicando nele. Mesclar o workflow antes
da janela de corte não derruba o domínio, mas congela `aue.web.app` na última
versão e cria duas versões do produto. O clone já feito é prova de ponto de
partida, não espelho contínuo.

Sequência segura:

1. Manter o workflow antigo em `main` até fechar uma janela sem outra entrega.
   Publicar a última versão aprovada no legado e anotar sua versão live.
2. Rodar a cópia imutável dessa versão para `aue-oficial` e conferir o novo
   endereço padrão. Se houver nova entrega antes do corte, repetir a cópia
   dessa versão final, nunca supor que a cópia antiga ainda é igual.
3. Na janela, mesclar esta mudança de target, rodar `somente_validar=true` e,
   com a prova verde, publicar uma vez no novo site. Só então iniciar no
   console a transferência do domínio.
4. Deixar o redirect do legado por último, após o domínio responder pelo novo
   site. Até ele existir, a volta para o legado continua possível sem loop.

Até o domínio mudar, nenhuma entrega nova deve entrar entre os passos 2 e 3.
Se isso for inevitável, cancelar a janela, publicar a entrega no legado e
reiniciar a cópia a partir da nova versão imutável.

### Provar o novo site sem domínio

1. Executar o workflow oficial manualmente com `somente_validar=true`. Ele
   ainda exige todos os segredos e prova build, grupos e sitemap, mas não
   publica.
2. Publicar a versão aprovada pelo workflow normal, que agora aponta apenas ao
   alvo `aue-oficial`.
3. Conferir em `https://aue-oficial.web.app` as rotas públicas, uma página
   estática de grupo, `robots.txt`, `sitemap.xml`, o service worker e uma URL
   de convite. Conferir também login e recuperação de senha no domínio
   canônico depois do corte real.

Não use `aue.web.app` como prova desta etapa: ele permanece a versão de
rollback e pode ter cache e service worker próprios.

## Corte de domínio

Para domínio que já pertence a outro site Firebase, seguir o fluxo **Quick
Setup** mostrado pelo console do Firebase durante a transferência. O fluxo
Advanced Setup é para a migração vinda de outro provedor. Não é seguro assumir
que o console permitirá deixar o domínio como `Connected` nos dois sites antes
do corte: registrar a tela e os registros solicitados naquele momento.

Antes de confirmar a operação, salvar os registros DNS atuais e anotar a versão
live de ambos os sites. Depois, validar HTTPS e certificado, home, uma rota
estática, grupo com barra final, convite, login, recuperação, sitemap e
`robots.txt`. Sessão, PWA e cache são separados por origem: o navegador pode
precisar carregar de novo o domínio novo, e isso não é uma migração automática
de estado local.

O Site URL e a lista de redirects do Supabase já abrangem o domínio oficial;
não duplicar configurações sem uma falha observada no callback real.

## Aplicar o redirect do site legado, somente após o domínio estar no novo site

O arquivo `firebase.legado-redirect.json` publica no site legado `aue` duas
regras 301: uma para a raiz e uma para os demais caminhos. O grupo
capturado preserva o caminho, e Firebase Hosting
mantém a query quando o destino não declara query. A regra exclui
explicitamente o namespace técnico `/__/`; ele é reservado pelo Hosting e deve
ser conferido no emulador e no site antes de liberar o corte.

O comando abaixo é deliberadamente manual e só pode ser usado depois do
domínio estar atendido pelo novo site:

```bash
firebase deploy --config firebase.legado-redirect.json --only hosting --project aue-game
```

Antes de executá-lo, testar sem publicar:

```bash
npx --yes firebase-tools emulators:exec --config firebase.legado-redirect.json --only hosting \
  'curl -sSI "http://127.0.0.1:5003/perfil/ana?origem=zap" && curl -sSI "http://127.0.0.1:5003/__/firebase/init.js"'
```

O primeiro resultado deve ser 301 para
`https://arrotaaue.com.br/perfil/ana?origem=zap`. O segundo não pode ser um
redirect para o domínio novo. Se a porta do emulador estiver ocupada, usar a
porta informada no log em vez de assumir `5003`.

## Rollback

Se a versão publicada no `aue-oficial` estiver errada, restaurar a versão live
anterior desse site no Firebase Hosting. Isso não exige mudar o domínio e o
pipeline continua apontado ao mesmo alvo.

Se o problema for a associação do domínio, interromper o redirect legado e
seguir a tela de rollback da transferência no console, reaplicando os registros
DNS salvos antes do corte. Não publicar o `firebase.legado-redirect.json`
enquanto o domínio aponta para o site legado, pois ele cria um loop. Depois de
o domínio voltar ao legado, reverter o commit de target antes da próxima
publicação; assim a automação volta a alimentar o site que atende o domínio.

Referências oficiais: [sites múltiplos e deploy targets](https://firebase.google.com/docs/hosting/multisites), [gerenciar versões e rollback](https://firebase.google.com/docs/hosting/manage-hosting-resources) e [domínio próprio](https://firebase.google.com/docs/hosting/custom-domain).
