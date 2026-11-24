# Cartão de Missão: Fase 1, tráfego com o loop mínimo

> Rascunho do enquadramento, saído da exploração com o Luiz em 23/11/2026. Ainda não aprovado pelo Tiago. Nenhum código foi alterado.

## 0. Contexto e decisões já tomadas

O Luiz quer saber se o site consegue atrair tráfego e fortalecer a página inicial. Decisões desta conversa:

- O Auê continua com o nome Auê. O recorte "masculino" é de conteúdo, imagem e template, sem excluir ninguém e dentro de `docs/jogo/VOZ.md`.
- Home com selo **beta**, aproveitando a estrutura atual.
- Loop da fase: gravar, receber a nota, gerar o cartão 9:12. Sem desafio X1 como foco, sem XN e sem vídeo por enquanto.
- Perfil público com nota máxima, nota média, ranking e métricas do som. Áudios privados por padrão. O login já existe (ADR 0005).
- Fórum fica para depois. O conteúdo antigo é guardado e escondido, sem apagar.
- Inglês: `/en` já existe. A fase estende o inglês aos artigos e ao `hreflang` de cada página.
- Domínio próprio: `arrotaaue.com.br` como principal, se estiver livre. `burpleague.com` e `burpaue.com` como reserva. `aue.com` e `aue.com.br` estão ocupados.

## 1. Sequência de missões (uma por vez)

| # | Missão | Pista | Dono |
|---|---|---|---|
| 1 | Beta na home, sitemap limpo e domínio próprio com canonical | Full flow comum | Camillo (SEO e config), Diego (selo beta) |
| 2 | Prova do fluxo gravar, nota e cartão em celular real | Fast lane ou Full flow comum | Diego e Camillo, um audita o outro |
| 3 | Arena em inglês: loop gravar, nota e cartão em `/en` ([cartão](missao-3-arena-em-ingles.md)) | Full flow comum | Diego (telas e textos), Camillo (camada de idioma) |
| 4 | Conteúdo de busca em pt-BR e inglês com imagens no estilo atual ([cartão](missao-4-conteudo-de-busca.md)) | Full flow comum | Diego (telas), Camillo (SEO técnico) |
| 5 | Perfil mínimo público com áudios privados | Full flow comum | Diego, com contrato do Camillo |
| 6 | Fórum e X1 como foco | Fora desta fase | Depende de medição e de ADR |

Este cartão detalha a missão 1. As outras ganham cartão próprio quando chegar a vez delas.

## 2. Enquadramento da missão 1 (Tiago)

- **Dor / Problema da pessoa:** quem busca "como arrotar" não encontra o Auê no Google. O Search Console reclama de sitemap e de cota de indexação, e o site vive num subdomínio compartilhado (`aue.web.app`).
- **Comportamento esperado na tela:** a home mostra que o jogo está em beta, sem mudar tema, paleta, tipografia ou layout. O sitemap lista só rotas vivas. O endereço novo abre o mesmo site e o antigo continua no ar, mas declara o novo como canônico.
- **Fora de escopo (Não vira):** nova tela, redesign, desafio X1 como foco, XN, vídeo, fórum, perfil, mudança de nome da marca, tradução da Arena.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** mexe em configuração de hospedagem e SEO sem tocar motor central, contrato compartilhado nem migração. Não exige Gate Arquitetural.
- **Fonte de verdade afetada:** `AUE.md` (posicionamento beta), `PRODUCAO_ATUAL.md` e o ADR 0006 (hospedagem somente Firebase).

## 3. Donos e fronteiras

- **Orquestração, mesa limpa e aceite final:** Tiago
- **Responsável pela implementação:** Camillo (sitemap, domínio, redirecionamento, canonical, OG, hreflang) e Diego (selo beta na home)
- **Especificação visual:** Diego, com cópia aprovada pelo Luiz
- **Gate Arquitetural (Camillo):** não aplicável
- **Auditoria e Prova Real:** Diego audita o que o Camillo entregou e confere a home em desktop e celular. Camillo audita o selo beta do Diego.
- **Decisão pendente do Luiz:**
  1. Comprar o domínio e dizer qual (confirmar a disponibilidade de `arrotaaue.com.br` no registro.br).
  2. Aprovar a copy do selo beta.
  3. Dizer se `/comunidades` e as rotas antigas devem responder 404 ou 301 para `/`.

## 4. Comportamento, plataformas e risco

- **Plataformas afetadas:** Web Mobile (Safari iOS e Chrome Android), Desktop, documentação
- **Estados obrigatórios da Arena:** a missão não altera a Arena. Os estados atuais (inicial, gravando, analisando áudio, resultado, erro, microfone negado) precisam continuar iguais.
- **Maior risco de quebra ou mentira visual:** trocar o domínio e tirar o antigo do ar quebraria os links e as prévias já compartilhadas (ADR 0003). Por isso os dois seguem servindo, e o canonical consolida o Google no novo. Publicar o código antes de o domínio novo estar servindo o site faz o canonical apontar para um endereço que não abre. O selo beta não pode empurrar a Arena para baixo nem alargar a página no mobile.
- **Limite da promessa:** a missão não garante posição no Google nem tráfego. Ela só tira os erros que impedem a indexação. A nota continua sendo um laudo experimental.

## 5. Matriz de aceite e evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `sitemap.xml` lista só rotas vivas e sem `/comunidades` | Diego | Código e teste (`seo-publico.test.ts`) | pendente |
| `/comunidades` e rotas antigas respondem 404 ou 301, não 200 | Diego | Ambiente publicado (curl) | pendente |
| Home mostra o selo beta sem alterar tema, tipografia ou layout | Camillo | Desktop e Safari iOS, com capturas de antes e depois | pendente |
| `document.documentElement.scrollWidth === window.innerWidth` na home | Camillo | Safari iOS e Chrome Android | pendente |
| Domínio novo serve o site e emite certificado | Diego | Ambiente publicado | pendente |
| `aue.web.app` segue servindo o site, e o canonical de toda página aponta para o domínio novo (o Firebase não faz 301 do domínio padrão `web.app` para um domínio próprio) | Diego | Código e ambiente publicado | pendente |
| Canonical, OG e `hreflang` apontam para o domínio novo | Diego | Código e página publicada | pendente |
| Prévia do link continua funcionando em `/b/` e `/d/` (ADR 0003) | Diego | Ambiente publicado | pendente |
| `typecheck`, `lint`, `test` e `build` verdes | Diego | Código | pendente |
| Search Console: propriedade nova cadastrada e sitemap reenviado | Luiz | Search Console | pendente |

## 6. Encerramento e parecer final

- **Arquivos/módulos alterados:** a preencher.
- **Parecer do auditor:** a preencher.
- **Veredito Final do Tiago:** a preencher.
- **Pendências ou decisão necessária do Luiz:** ver seção 3.
