# Hospedagem no Firebase

> **Atualização de 20/10/2026:** `https://aue.web.app` é a produção verificada e
> o Firebase Hosting é a única publicação deste repositório. A convivência com
> Vercel foi contexto de migração; não é procedimento vigente.

Escopo: `firebase.json`, `.firebaserc` e o procedimento de publicar. Não cobre
banco, autenticação nem variáveis de aplicação (essas estão no `.env.example`).

Issue: [#137](https://github.com/gmmattey/aue/issues/137).

## 1. A decisão vigente

O Auê é publicado em **`https://aue.web.app`** pelo Firebase Hosting, projeto
`aue-game`, site `aue`. Este é o endereço de produção a usar em testes e
documentação. A decisão está no [ADR 0006](adr/0006-hospedagem-somente-firebase.md).

## 2. Endereço canônico

`ORIGEM_CANONICA` (`src/shared/enderecoPublico.ts`) é
`https://aue.web.app`.

Endereço canônico é o que o site declara ao buscador como "o de verdade", e ele
aparece em cinco lugares travados por `src/seo-publico.test.ts`. Apontar o
canônico para um endereço antes de ele estar validado é o pior caso possível de
SEO: manda o buscador desindexar a URL que está de pé e indexar uma que talvez
não responda.

Isso não atrapalha ninguém jogando: `origemDoJogo()`
(`src/plataforma/web/enderecoDoJogo.ts`) monta o link de desafio a partir da
origem de onde o jogo está rodando, não da constante. Batalha criada no
`aue.web.app` gera link do `aue.web.app`, e a briga fica inteira no mesmo lugar.

## 3. O que o `firebase.json` faz, e por quê

O app é uma SPA: `/d/:id` e `/b/:code` são roteados no cliente
(`src/App.tsx`). Sem regra de reescrita, o Hosting procura o arquivo `/d/ABC123`,
não acha e devolve **404** — e o link de desafio, que é o mecanismo de
distribuição do produto, morre antes do React montar. O 404 aparece do outro
lado, no telefone de outra pessoa, onde ninguém está olhando.

As regras de reescrita do Firebase são:

- `/privacidade`, `/termos` e `/como-jogar` servem os HTML estáticos que o
  `vite.config.ts` gera como entradas próprias;
- `**` cai no `index.html`.

Arquivo que existe em `dist/` é servido como arquivo: o Firebase procura no
sistema de arquivos **antes** de aplicar reescrita, igual à Vercel. Por isso não
há regra de exclusão para `sw.js`, `manifest.webmanifest`, `robots.txt`,
`sitemap.xml`, `ads.txt`, `og-image.png` e `assets/*` — ela seria redundante e
mais fácil de errar.

**Isso é leitura da documentação dos dois provedores, não observação.** Confira
na primeira publicação: já mordeu antes, quando `/favicon.ico` respondia HTML
disfarçado de ícone (commit `422e5ee`).

### Os cabeçalhos de cache

`sw.js` e `manifest.webmanifest` saem com `Cache-Control:
no-cache`. Sem isso o Hosting serve com cache de uma hora por padrão, e o service
worker antigo continua no ar depois de uma publicação — o app fica preso numa
versão velha e ninguém entende por quê. Os arquivos de `assets/*` têm hash no
nome e não precisam disso.

## 4. Como publicar

**Antes de qualquer coisa: as variáveis.** `VITE_*` é lida em **tempo de
build**, não em runtime. Um build sem elas gera um jogo que abre bonito e não
fala com backend nenhum, e configurar depois no painel **não conserta** — exige
build novo.

O mínimo que precisa existir num `.env` local (ou no ambiente do CI) antes de
rodar `npm run build`:

| Variável | O que quebra sem ela |
|---|---|
| `VITE_SUPABASE_URL` | O jogo não fala com o banco. Nada de gravar, dar nota ou criar batalha. |
| `VITE_SUPABASE_ANON_KEY` | Idem. |
| `VITE_CONTATO_PRIVACIDADE` | A política publica dois avisos vermelhos dizendo que o canal de contato não foi configurado. |

### As flags: leia a produção, não o `.env.example`

O `.env.example` já conta o corte certo, e uma trava de teste segura os dois
juntos: `src/corte-de-producao.paridade.test.ts` compara o que o
`.github/workflows/publicar-firebase.yml` declara com o que o `.env.example` e o
`src/shared/flags.ts` dizem. Divergiu, a suíte fica vermelha nomeando a flag.

**A fonte continua sendo o workflow.** O `.env.example` carrega uma cópia
declarada, não uma segunda verdade — e é por isso que a trava existe.

Leia as flags no workflow de publicação e confira a página publicada depois do
deploy. Não há segundo host para usar como prova de paridade.

### Publicação automática

O `.github/workflows/publicar-firebase.yml` publica a cada merge na `main`. Os
segredos que ele exige estão no cabeçalho do próprio arquivo.

As flags ficam **escritas no workflow**, à vista, em vez de escondidas num
painel.

### Publicação à mão

Com o `.env` no lugar:

```bash
npm run build
firebase deploy --only hosting --project aue-game
```

O deploy publica o conteúdo de `dist/` no site `aue`, e o endereço é
`https://aue.web.app`.

## 5. Duas coisas que não têm conserta bonito

**Quem já instalou o Auê pelo `aue.vercel.app` fica lá.** App instalado se prende
à origem de onde foi instalado: outro service worker, outro armazenamento local.
Não existe migração automática e não vamos inventar uma. Se alguém reclamar que
"o app não atualizou", é isto.

**A prévia dinâmica do WhatsApp está desligada, e virou decisão.** O cartão que
sai hoje é o estático do `index.html`. A tentativa aconteceu e não deu: o
gateway do domínio compartilhado do Supabase não deixa Edge Function servir
HTML, então o robô não lê a prévia e quem clica não chega no jogo. A
[#143](https://github.com/gmmattey/aue/issues/143) fechou aceitando o cartão
estático, a Edge Function saiu do ar, e a nota viaja como imagem pela
[#151](https://github.com/gmmattey/aue/issues/151).

O que foi testado, e o que continuaria valendo com domínio próprio, está no
[ADR 0003](adr/0003-a-previa-do-link.md) §10. **Isso deixou de ser pendência de
hospedagem** — não é mais o Firebase que trava, e a dúvida sobre `has:
user-agent` morreu junto, porque o desvio por user-agent saiu do desenho.
