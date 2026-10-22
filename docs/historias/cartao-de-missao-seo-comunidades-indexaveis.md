# Cartão de Missão — Diretório de comunidades indexável

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o Google recebe `/comunidades` como se fosse a home do Auê, enquanto o sitemap ainda aponta para a URL antiga `/comunidade`.
- **Comportamento esperado na tela:** abrir `/comunidades` entrega título, canonical, Open Graph e conteúdo útil próprios antes do React; com JavaScript, continua abrindo o diretório canônico já existente.
- **Fora de escopo (Não vira):** não indexar páginas dinâmicas de tópicos, perfis ou X1; nem colocar `/c/:slug` no sitemap antes de haver HTML próprio por comunidade.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** mexe em build, Firebase Hosting, sitemap e leitura pública do Supabase usada no build.
- **Fonte de verdade afetada:** `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`, `src/seo-publico.test.ts`, `firebase.json` e `public/sitemap.xml`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Camillo (build/hospedagem) e Kayky (entrada pública)
- **Especificação e Auditoria Visual:** não aplicável
- **Gate Arquitetural (Camillo / Lucas):** aprovado — conteúdo do diretório vem da RPC pública existente, sem consulta direta a tabela protegida.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop, Web Mobile e rastreadores.
- **Maior risco de quebra ou mentira visual:** inserir `/c/:slug` no sitemap embora o Firebase ainda sirva HTML canônico da home nessas rotas.
- **Limite da promessa:** teste e build validam o contrato; indexação, posição e Core Web Vitals dependem do deploy e do Google Search Console.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/comunidades` possui canonical, Open Graph e HTML de entrada próprios | Marcelo | teste + build | pendente |
| Sitemap aponta à URL canônica e não inclui rotas dinâmicas | Marcelo | teste | pendente |
| Lista sem JavaScript é lida da RPC pública no build, sem nomes inventados | Camillo | teste + build | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `comunidades.html`, `public/sitemap.xml`, `firebase.json`, `vite.config.ts`, `scripts/gerar-pagina-de-comunidades.ts`, `src/seo-publico.test.ts` e testes associados.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` no contrato local: 61 testes focados, typecheck e build passaram. O build local não tinha credencial real do Supabase; a lista remota não foi materializada nele.
- **Veredito Final do Tiago:** `APROVADO COM RESSALVAS` — falta o merge/deploy e a confirmação no Search Console.
- **Pendências ou decisão necessária do Luiz:** páginas individuais de comunidade exigem uma entrega estática/SSR específica antes de entrarem no sitemap.
