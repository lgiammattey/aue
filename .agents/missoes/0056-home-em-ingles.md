# Cartão de Missão 0056 — Home em inglês (`/en`), SEO primeiro

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem fala inglês e procura "how to burp", "burp the alphabet" ou "burping community" não encontra o Auê. Hoje o site só existe em PT-BR e o buscador não tem uma página em inglês para mostrar.
- **Comportamento esperado na tela:** `https://aue.web.app/en` abre uma home em inglês, indexável sem JavaScript, com o guia de como arrotar, os tipos de arroto e a porta de entrada para gravar na Arena. Copy adaptada ao público de língua inglesa (EUA primeiro), nunca tradução literal.
- **Fora de escopo (Não vira):**
  - Arena, mural, perfil, login e erros em inglês. Isso é a Fase 2 e precisa de decisão do Luiz (ver §2).
  - Framework de i18n. Hipótese primeiro: uma página, copy própria, sem camada de tradução.
  - Termos e privacidade em inglês. Texto jurídico não sai de tradução de agente. A página em inglês linka as versões em PT-BR e diz isso.
  - Outras páginas em inglês (`/en/how-to-burp`, `/en/types-of-burps`). Candidatas da Fase 2, uma intenção de busca por página.
  - Detecção automática de idioma ou redirecionamento por IP. Quem chega pelo Google decide pelo hreflang; redirecionar por idioma derruba indexação.
- **Pista:** Full flow comum (página nova em módulos e contratos existentes). A Arena em inglês, quando vier, é Full flow sistêmica.
- **Por que esta pista:** não mexe em motor, banco nem contrato. Mexe em rota, entrada de build, hospedagem e sitemap, tudo aditivo e coberto por `seo-publico.test.ts`.
- **Fonte de verdade afetada:** `VOZ.md` (SEO), `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md` (rota nova), `docs/escopo/BACKLOG.md` (item "Versão em inglês" deixa de ser adiado).

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (página e rota), Camillo (hospedagem, build, sitemap)
- **Especificação e Auditoria Visual:** Rian. A página reaproveita a moldura pública existente (`guia-arena`) e os tokens atuais. Sem tema, fonte ou layout novo.
- **SEO:** Rodrigo (title, description, canonical, hreflang, sitemap, JSON-LD)
- **Gate Arquitetural (Camillo / Lucas):** não aplicável nesta fase
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:**
  1. A Arena fica em inglês na Fase 2? Hoje o botão de gravar leva para uma Arena em PT-BR e a página avisa isso. Traduzir a Arena inclui as 42 falas de nota, que dependem de VOZ própria em inglês.
  2. Termos e privacidade em inglês: quem revisa o texto jurídico?
  3. Os nomes ingleses dos cinco tipos (Thunder, Freight Train, Rapid-Fire, Talker, Dud) são adaptação, não tradução. Aprovar ou trocar.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Web Mobile (Safari iOS / Chrome Android)
- **Estados obrigatórios da Arena:** não aplicável. A página não hospeda a Arena, só leva para ela.
- **Maior risco de quebra ou mentira visual:**
  - hreflang sem par de volta (o Google ignora o par inteiro);
  - canonical da página em inglês apontando para a home PT, o que tira `/en` do índice;
  - o rewrite `/en` cair no catch-all e servir o HTML da home;
  - Service Worker servir o `index.html` PT em `/en` e deixar `lang` e título errados para quem já visitou;
  - copy em inglês prometendo o que a Arena em PT não entrega.
- **Limite da promessa:** a medição da Arena é experimental. A página não fala em nota oficial, ranking nem juiz. Não promete Arena em inglês.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/en` tem um H1, `lang="en"`, canonical próprio, hreflang `pt-BR`, `en` e `x-default` nos dois sentidos | Rodrigo | Código / Teste | pendente |
| Sitemap lista `/en` com alternates recíprocos com `/` | Rodrigo | Código / Teste | pendente |
| Firebase serve `/en` e `/en/` com `en.html`, antes do catch-all | Camillo | Código / Teste | pendente |
| Conteúdo sem JavaScript é igual ao conteúdo com JavaScript | Marcelo | Código / Teste | pendente |
| Nenhum texto em português, travessão ou "causo" na copy em inglês | Marcelo | Código / Teste | pendente |
| Página abre sem quebra, sem transbordo, alvos de toque >= 44px, em 390px e 1440px | Rian | Navegador desktop e mobile (capturas) | pendente |
| Troca de `/` para `/en` e volta pelo app atualiza `lang` e título e devolve o original | Marcelo | Teste de componente | pendente |
| `typecheck`, `lint`, `test`, `build` verdes | Marcelo | CI | pendente |
| Indexação real no Google | Rodrigo | Search Console, depois do deploy | fora do aceite (não se promete) |

> "Compilou" não é "funcionou na tela". Indexação não entra no aceite: é preparo técnico.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `paginas/en.html`, `src/features/publico/HomeEn.{tsx,css}` e teste de paridade, rota `/en` em `src/App.tsx`, `vite.config.ts`, `firebase.json`, `index.html` (hreflang), `scripts/gerar-sitemap.ts` e `public/sitemap.xml`, `src/plataforma/web/documento.ts`, `AvisoMaioridade` (idioma por rota), link "English" em `ConteudoDaHome`, `seo-publico.test.ts`, BACKLOG e mapa de páginas.
- **Parecer do Marcelo:** pendente. Prova até aqui: `typecheck`, `lint` (só avisos antigos), 2.564 testes e `build` verdes; capturas em 1440px e 390px sem transbordo, alvos de 44px; ida e volta `/` ↔ `/en` troca e devolve `lang` e título. Não testado: Safari iOS, Chrome Android real, indexação.
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** as três do §2.
