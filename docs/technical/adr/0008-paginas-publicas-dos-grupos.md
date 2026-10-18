# ADR 0008 — Páginas públicas dos grupos

**Status:** aceito
**Data:** 2026-10-18
**Decidiu:** Luiz escolheu o caminho de páginas estáticas geradas no build, com conselho do Camillo. Aceito pelo Luiz em 18/10/2026.
**Substitui:** nada
**Altera:** o [ADR 0001](0001-arquitetura-oficial-do-aue.md) §8, só para o caso descrito aqui
**Relaciona com:** [ADR 0003](0003-a-previa-do-link.md), em especial o §10.2
**Vale para:** as páginas `/g/<slug>` do diretório de grupos externos

---

## O problema

O Auê vai ter um diretório de grupos de WhatsApp, Telegram e TikTok. Qualquer
pessoa cadastra, logada ou não, e o grupo aparece na hora dentro do app. Também
queremos que o Google encontre esses grupos.

O app é uma SPA com um `index.html` só. Grupo cadastrado em tempo de execução
não existe no build, então o Google chegaria numa página sem título, sem
descrição e com o canonical da home. O `sitemap.xml` já avisa: URL sem canonical
próprio não entra.

Para o Google ler um grupo, alguém precisa entregar um HTML pronto com o nome e
a descrição daquele grupo.

## A decisão em uma frase

> **O build gera uma página estática por grupo visível, e um agendamento
> refaz e republica o site só quando a lista de grupos mudou.**

## 1. O que o build faz

- lê os grupos visíveis (`oculto = false`) com a chave pública do Supabase, que
  é a mesma que o navegador já usa, passando pela RLS;
- escreve `dist/g/<slug>/index.html` para cada um, com `<title>`, `description`,
  `canonical` próprio, Open Graph e o link de entrada;
- escreve `dist/g/lista.json` com o hash da lista que serviu de base (usado na
  comparação do §3) e troca o marcador do `<noscript>` de `grupos.html` pela
  lista de links, para o rastreador sem JavaScript chegar em cada página;
- acrescenta as URLs ao `sitemap.xml`;
- a URL termina em barra (`/g/<slug>/`), porque o Firebase serve a pasta pelo
  `index.html` sem `cleanUrls`, que o repositório proíbe. Canonical, `og:url` e
  sitemap usam a barra;
- se a leitura falhar num push ou numa execução manual, o build **segue sem as
  páginas de grupos** e avisa. O app não pode deixar de publicar porque o
  Supabase estava fora. Como cada deploy troca o site inteiro, as páginas somem
  até a próxima rodada, que as recria em até uma hora;
- se a leitura falhar no **agendamento**, o build falha (`EXIGIR_GRUPOS=1`).
  Ali o único motivo de publicar é a lista, e publicar sem as páginas apagaria
  do Google o que já estava lá;
- sem credencial do Supabase no build (CI de validação, máquina sem `.env`), o
  passo é pulado sem erro.

## 2. O que a página pode fazer, e o que não pode

Ela é uma vitrine, como a prévia do ADR 0003. Lê e mostra.

**Pode:**

- mostrar nome, descrição, plataforma, imagem e o botão de entrada;
- levar a pessoa para o app, onde o grupo continua existindo como tela viva.

**Não pode:**

- escrever nada, nem contador, nem visita;
- mostrar grupo escondido por denúncia. Vale o `oculto` do banco no momento do
  build, e grupo escondido depois sai na próxima rodada;
- inventar número. Sem contagem de membros, sem "ativo agora";
- passar autoridade de SEO a link de terceiro. O link do convite sai com
  `rel="nofollow ugc noopener noreferrer"`;
- virar rota de jogo. Nada de estado ou regra nascendo ali.

Grupo escondido depois do build continua no ar até a próxima rodada. O app
respeita o `oculto` na hora. Só a página estática atrasa.

## 3. O agendamento e os limites do GitHub gratuito

O repositório hoje é público, então os minutos de Actions em runner padrão não
têm cota. Mesmo assim o desenho não depende disso.

- **Gatilho:** `schedule` a cada hora, mais `workflow_dispatch` para rodar à mão.
  O `schedule` do GitHub não é pontual e pode atrasar. Ninguém deve contar com a
  hora exata.
- **Verificação barata antes do deploy.** O primeiro job só consulta os grupos
  visíveis, calcula um hash e compara com o `lista.json` que já está no site
  (`scripts/verificar-lista-de-grupos.ts`). Se for igual, termina em segundos e
  não publica nada. Antes da primeira publicação o arquivo não existe, e o
  Firebase responde com o `index.html` da SPA: isso conta como "nada
  publicado". Se o banco não puder ser lido, não publica; se o site no ar não
  puder ser lido, publica. O build completo, de uns
  50 segundos, só roda quando a lista mudou. Push na `main` e execução manual
  sempre publicam.
- **60 dias sem atividade.** Em repositório público o GitHub desliga workflows
  agendados depois de 60 dias sem atividade no repositório. O aviso do GitHub
  chega por e-mail. Se isso acontecer, as páginas dos grupos param de atualizar
  e o resto do site continua intacto. O `workflow_dispatch` e qualquer push na
  `main` seguem funcionando.
- **Se o repositório virar privado:** a cota gratuita cai para 2.000 minutos por
  mês. Com a verificação barata, o pior caso fica em torno de 720 execuções de
  1 minuto (verificação) mais os deploys reais. Cabe, mas deve ser revisado.
- **Fila:** o job usa o mesmo `concurrency` do `publicar-firebase.yml`, para não
  chegar fora de ordem e deixar no ar um build mais velho.
- **Segredos:** só a URL e a chave pública do Supabase. Nenhuma chave de serviço
  entra neste workflow.

## 4. A fronteira não muda

A geração das páginas é script de build, fora das quatro camadas do ADR 0001.
O cliente do Supabase do navegador continua só em `src/plataforma/web/`. O
script de build fala com o Supabase por requisição HTTP simples, sem importar o
núcleo.

## 5. Por que isto exige ADR

O ADR 0001 §8 pede decisão formal para mexer na forma como o site é entregue. Aqui
o build passa a depender de dado de produção e a publicação passa a ter um
agendamento. Os dois mudam o contrato do deploy.

## 6. Alternativas descartadas

**Edge Function do Supabase servindo HTML.** Era a proposta inicial. Cai pelo
§10.2 do ADR 0003: o gateway do `*.supabase.co` responde `text/plain` com
`sandbox` para qualquer função, e o Google não lê HTML assim. Testado duas vezes
em agosto. Só volta com domínio próprio no Supabase.

**Cloud Function ou Cloud Run no Firebase.** Funcionaria, mas traz runtime,
cobrança e uma segunda plataforma executando código, pelo mesmo motivo que o ADR
0003 §8 já recusou.

**Renderização no servidor para o app inteiro.** Fora de questão. O ADR 0003 §3
já fixou que o app continua uma SPA sem servidor.

**Deixar sem página pública.** Honesto e barato, mas o Luiz pediu que o Google
encontre os grupos.

## 7. O que isto custa

- a página do Google pode atrasar até uma hora, mais o atraso natural do
  `schedule`, atrás do que o app mostra;
- o build passa a falar com o Supabase, e por isso precisa degradar sem quebrar;
- mais um workflow para manter;
- o formato `/g/<slug>` vira contrato público quando o primeiro link for
  indexado. O slug nunca muda depois de criado.

## 8. Reversibilidade

Apagar o workflow agendado e o passo do build devolve o site ao estado de hoje.
As páginas já publicadas ficam no ar até a próxima publicação sem elas. Como o
ADR 0003 §10.5 lembra, o custo de sair de uma coisa ligada é maior que o de uma
linha de configuração. A verificação de saída é conferir que `/g/` deixou de
existir no site publicado.

## 9. Como isto foi decidido

1. O Luiz pediu cadastro público de grupos, visível ao Google, em 18/10/2026.
2. A primeira proposta, Edge Function, foi derrubada pelo §10.2 do ADR 0003.
3. O Luiz aceitou a geração estática no build e pediu atenção aos limites do
   GitHub gratuito, tratados no §3.

Este ADR está aceito. Mudar o que está aqui exige ADR novo, não PR.
