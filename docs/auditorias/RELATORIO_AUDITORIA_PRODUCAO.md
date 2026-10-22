# Relatório de auditoria de produção — Auê

**Data da rodada:** 21/10/2026 (BRT)
**Produção observada:** `https://aue.web.app/`
**Código auditado:** `87491845c46ef20f2c05104157616cbf419dfdab` (`main` e `origin/main` no início da rodada)
**Estado local preservado:** havia conteúdo não rastreado em `docs/auditorias/` e `docs/technical/adr/0011-exclusao-da-propria-conta.md`. Nada dele foi alterado.

> Esta é uma auditoria de produção e código, não uma homologação completa. O Luiz retirou a Arena do foco desta rodada durante a execução; por isso, gravação, microfone, score, desafio, placar e revanche constam como **fora do escopo**, e não como aprovados ou reprovados.

## 1. Resumo executivo

O Auê está vivo para leitura pública: feed, comunidades, perfis, busca e embeds de YouTube abriram no navegador. A busca por pessoas, um problema relatado, foi **refutada na produção atual**: pela busca da home, `giam` levou a `/explorar?q=giam` e retornou `Giam @giam` e `giamz @giamzinn_aue`.

Mesmo assim, a superfície social pública **não está apta**. Permanecem P1 para acompanhar: ações dos posts ultrapassam a largura em celulares até haver prova no artefato publicado; publicidade de cassino/conteúdo sexualizado é injetada no feed; links privados de X1 chegam indexáveis a rastreadores; e há deriva entre o histórico local de migrations e o banco remoto, que impede tratar o schema como reproduzível.

Nenhum P0 foi confirmado nesta rodada. Avatar e publicação de vídeo ainda não receberam prova E2E de escrita porque não havia conta promovida de teste autorizada; isso é uma lacuna, não uma aprovação.

## 2. Versão e método

| Item | Evidência |
|---|---|
| Branch/commit | `main`/`origin/main` em `87491845c46e` no começo da auditoria |
| Artefato publicado | resposta HTTP de `aue.web.app` com `Last-Modified: Wed, 21 Oct 2026 01:14:43 GMT`; não há build ID que relacione esse artefato a um SHA com certeza |
| Navegador | Chromium/IAB, desktop 1440 e emulações 375, 390, 430 e 768 px |
| Produção e banco | navegação visitante, cabeçalhos HTTP e chamadas somente leitura autorizadas ao Supabase |
| Segurança | sem carga, enumeração, login, upload, escrita, publicação ou alteração de dados |

Safari iOS, Chrome Android e Safari macOS reais não foram usados. Emulação Chromium não substitui esses ambientes.

## 3. Inventário funcional observado

| Domínio | O que existe | Cobertura desta rodada |
|---|---|---|
| Leitura pública | home/feed, filtros, comunidades, perfis públicos, áudio já publicado, embeds externos | navegador visitante |
| Descoberta | busca na home e `/explorar` por pessoas, rodas e publicações | busca por `giam` e `Lima` confirmada |
| Identidade/perfil | login, perfil, avatar, capa e redes | tela/contrato lidos; sem escrita autenticada |
| Social | tópicos/posts, comentários, reações, salvar, compartilhar, seguir, denúncia e exclusão | leitura e contratos; sem escrita autenticada |
| Mídia | áudio de post, YouTube/TikTok, anexos | embeds YouTube publicados abriram; criação/remoção não testadas |
| Comunidades | diretório, comunidade por slug, regras e participação | leitura pública; gestão e moderação não testadas |
| Público/SEO | landing, páginas legais, sitemap, robots e grupos externos | navegador, HTTP e testes focados |
| Administração | painel e operações privilegiadas | inventariado no código, não testado |
| Arena e X1 operacional | captura, análise, score, convite, resposta e revanche | **fora do escopo desta rodada** |

## 4. Matriz de cobertura

| Jornada | Código | Produção visitante | Persistência/reload | Outra sessão | Estado |
|---|---:|---:|---:|---:|---|
| Abrir feed e comunidades | sim | sim | parcial | n/a | coberta |
| Buscar perfil | sim | sim | n/a | n/a | coberta |
| Ver vídeo já publicado | sim | sim (YouTube) | parcial | n/a | coberta parcialmente |
| Editar avatar | sim | não | não | não | não validada |
| Publicar vídeo | sim | não | não | não | não validada |
| Reagir, comentar, salvar, seguir | sim | só CTA/leitura | não | não | não validada |
| Administração/moderação | sim | não | não | não | não validada |
| Arena/X1 | sim | não | não | não | fora do escopo |

## 5. Achados confirmados

| ID | Área | Sev. | Problema, reprodução e evidência | Correção proposta |
|---|---|---|---|---|
| SOC-01 | Feed mobile | P1 | Em 375 px, a home tem `scrollWidth` de 492 px; em 390 px, 492 px; em 430 px, 492 px. A barra com comentários, reações, salvar, compartilhar e menu sai pela direita. A causa está em `.post-actions--twitter`, que mantém oito ações sem quebra/overflow no mobile. | Ajustar a composição da toolbar canônica para caber e preservar alvos tocáveis; criar regressão de `scrollWidth === viewport` em 375/390/430 na home e comunidade. |
| SOC-02 | Brand safety | P1 | O feed público injetou anúncios de terceiros, incluindo “Online Casino Accepts: BTC, USDT ...”, “Hottest online bloggers' profiles” e variações sexualizadas/apostas. Os links observados incluem destinos sem curadoria do Auê. | Desligar a rede/slot externo até existir decisão de monetização, curadoria e bloqueio de categorias. Não resolver com CSS. |
| SEO-02 | Privacidade de links | P1 | URLs privadas de X1 (`/x1/:code`, `/b/:code`, `/d/:id`) chegam com `robots=index,follow` e canonical da home. Estarem fora do sitemap não impede rastreamento. | Definir noindex antes da hidratação/na resposta para cada rota privada e cobrir com teste HTTP/HTML. |
| DB-01 | Banco e entrega | P1 | O Supabase remoto lista a migration `20261021011500`, inexistente no repositório. Como houve aplicações fora do fluxo da CLI, o histórico local não reproduz o banco remoto. | Inventariar funções, políticas, constraints e buckets; recuperar/versionar a migration ou registrar baseline. Não executar `db push` como “conserto”. |

### Achado refutado após nova prova de produção

- **SEO-01 — rotas de vídeo:** em 21/10, visitante em `https://aue.web.app/videos-de-arroto` e `https://aue.web.app/videos` foi levado para `https://aue.web.app/c/arrotos-youtube`, com a comunidade **r/arrotos-youtube** visível. O 404 observado na rodada inicial não se reproduz no artefato atual; as rotas foram substituídas por esse redirecionamento no app. O rewrite antigo do Firebase continua sendo dívida de configuração a inventariar, mas não é bloqueio funcional nem deve ser reportado como P1 enquanto o comportamento publicado for esse.

## 6. Problemas de UX e acessibilidade

- **P2 — alvos pequenos no mobile:** compositor com 38 px e botão do player com 40 × 40 px, abaixo do mínimo canônico de 44 px.
- **P2 — páginas indexáveis só após JavaScript:** rotas desconhecidas e algumas rotas autenticadas devolvem HTTP 200 com HTML/canonical indexáveis; o `noindex` da 404 só aparece depois da renderização.
- **Positivo:** o feed expõe `article`, `time`, `region`, `toolbar` e nomes acessíveis para as ações dos posts.

## 7. Segurança e backend

- **P2 — cabeçalhos ausentes:** a origem entrega HSTS, mas não CSP, `Permissions-Policy`, `X-Content-Type-Options`, `Referrer-Policy` ou proteção de frame. O risco aumenta porque há scripts de anúncios de terceiros.
- **P2 — anexos/Storage sem prova entre contas:** validações locais de MIME, tamanho e caminho do dono são boas, mas não houve matriz E2E entre dono, visitante e segunda conta.
- **P2 — avatar sem prova real:** a migration restringe o upload à conta promovida/pasta própria e o RPC valida URL e dono, porém upload, substituição, remoção e reload não foram executados com conta de teste.
- **P2 — vídeo sem prova de escrita:** a correção da regex SQL histórica está no código e vídeos publicados do YouTube renderizam; criar um tópico/resposta com YouTube/TikTok, recarregar e verificar erro continua pendente.
- **P2 — fronteira arquitetural:** há APIs de navegador e imports diretos de Supabase fora de `src/plataforma/`; o teste de fronteira tem exceções explícitas e não prova a aderência declarada pelo ADR 0001.

Não houve teste destrutivo de RLS, enumeração de objetos ou ação administrativa. Portanto, ausência de achado adicional não equivale a aprovação dessas superfícies.

## 8. Performance e confiabilidade

- O PWA e o cache do modelo estão estruturados de forma razoável: SW sem cache agressivo para HTML, modelo em cache próprio e áudio de Storage em rede.
- Os quatro shards do modelo respondem e somam aproximadamente 16 MB. O principal JS observado tem cerca de 276 KB sem compressão; os assets com hash usam somente `max-age=3600`, sem `immutable`, provocando revalidações evitáveis.
- Um shard inexistente de modelo cai no catch-all e recebe HTML com HTTP 200: soft-404 de asset (**P3**).
- Não foram obtidos Core Web Vitals de campo, trace de performance, nem medição em Safari/iOS real.

## 9. Testes executados

| Comando/ação | Resultado |
|---|---|
| `npm run typecheck` | passou |
| `npm run lint` | passou com 17 warnings |
| `npm run test` | 2.119 testes passaram; 9 pulados; 188 arquivos mais 1 pulado |
| `npm run build` | passou; PWA com 84 entradas de precache/2,314 MiB; páginas de grupos foram puladas sem credencial |
| Testes focados de arquitetura/captura/ciclo de vida | 26 passaram em 3 arquivos |
| `src/seo-publico.test.ts` | 29 passaram |
| Testes focados de contratos de backend | 45 passaram em 5 arquivos; 9 pulados |
| Navegação de produção | home, comunidades, perfis, busca, vídeo, páginas públicas, sitemap e robots observados |

Os testes acima não substituem E2E autenticado nem prova do banco/Storage publicados.

## 10. Correções realizadas

### SOC-01 — barra de ações no mobile

O cartão Fast lane derivado autorizou a correção isolada da toolbar canônica, em worktree separado de qualquer WIP. O CSS mobile passou a quebrar a linha, ocupar a largura disponível e remover o `max-width` que causava o corte, sem retirar nenhuma ação e mantendo alvo mínimo de 44 px.

Prova local independente (Chromium com dados reais de leitura):

| Superfície | Larguras | Resultado |
|---|---|---|
| Home | 375, 390 e 430 px | `scrollWidth` igual ao viewport; oito ações visíveis e 44 × 44 px |
| Comunidade | 430 px | `scrollWidth` igual ao viewport; mesma toolbar sem corte |
| Desktop | 1440 px | sem overflow e sem mudança no breakpoint desktop |

O teste focal de `CardDoPost` passou (15/15), `git diff --check` passou, e Marcelo emitiu `SEM ACHADOS MATERIAIS` no recorte. Rian aprovou a fidelidade com a ressalva não bloqueante de que os botões compactos já existentes no desktop não foram alterados. Esta correção ainda **não está publicada**.

Tiago emitiu `APROVADO COM RESSALVAS` para SOC-01: a ressalva é exclusivamente o tamanho pré-existente dos botões desktop, fora do recorte mobile.

Os demais achados continuam sem alteração: ads, SEO/links privados e banco exigem cartões separados por terem política, contrato ou risco de produção próprios.

## 11. Pendências e riscos de produção

1. Corrigir e validar o overflow do feed mobile e remover/bloquear publicidade insegura antes de anunciar a experiência social como confiável.
2. Fechar o `noindex` dos links privados e inventariar rewrites públicos obsoletos sem reabrir a rota de vídeos que está funcional.
3. Recuperar a reprodutibilidade do banco antes de nova migration relevante.
4. Executar E2E autenticado com duas contas promovidas descartáveis: avatar, vídeo, comentário, reação, salvar, seguir, denúncia e reload/nova sessão.
5. Criar E2E de navegador. Hoje há 0 configuração Playwright/Cypress/E2E; a suíte Vitest não prova a jornada publicada.
6. Tratar a política de anúncios e cabeçalhos de segurança como decisão conjunta de produto/plataforma, não como detalhe visual.

## 12. Recomendações priorizadas

1. **Cartão Social Mobile:** SOC-01, com teste em 375/390/430 e browser real.
2. **Cartão Brand Safety:** SOC-02, decisão explícita de manter/desligar a rede e categorias permitidas.
3. **Cartão Público/SEO:** SEO-02 e inventário dos rewrites públicos, com resposta HTML e rastreabilidade verificadas antes do JavaScript.
4. **Cartão Banco/Contratos:** DB-01, avatar, vídeo e matriz de Storage/RLS usando contas de teste; Camillo/Lucas no gate.
5. **Cartão E2E Social:** cobrir escrita, persistência, falha e segunda sessão antes de novo aceite de produção.

## 13. Veredito de qualidade

**NÃO APTO.**

Não há P0 confirmado, mas os P1 de layout mobile até publicação comprovada, anúncios inseguros, privacidade de links e deriva de migrations comprometem confiança, experiência e segurança operacional. Além disso, os fluxos autenticados essenciais não têm prova E2E. A busca por pessoas e os dois atalhos de vídeo estão funcionando na produção observada e não entram como bloqueio desta conclusão.

## 14. Itens fora do escopo ou não testados

- Arena, microfone, gravação, score, X1 operacional, placar e revanche: fora do foco desta rodada por decisão do Luiz.
- Safari iOS, Chrome Android e Safari macOS reais: não disponíveis nesta rodada.
- Login, cadastro, recuperação de senha, logout, escrita social, moderação e administração: não executados sem contas autorizadas.
- Indexação efetiva no Google e Core Web Vitals de campo: não comprovados; sitemap/robots rastreáveis não provam processamento pelo Google.
