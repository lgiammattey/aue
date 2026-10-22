# Cartão de Missão — correção da revisão pública

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a revisão encontrou uma asserção E2E frágil, páginas públicas usando casca social escura, ajustes no login legado que não chegam à rota ativa e mapa desatualizado.
- **Comportamento esperado na tela:** páginas públicas e `/login` ativos seguem sua família clara; o feed da raiz continua social; a prova do card mede a posição real do `@`; o mapa descreve as rotas de `App.tsx`.
- **Fora de escopo:** publicação, migração, mudança de rota por documentação e alteração da Arena.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** altera componentes ativos de interface, teste e documentação, sem contrato compartilhado ou persistência.
- **Fonte de verdade afetada:** `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`, `Páginas Públicas.dc.html`, `Login.dc.html` e `App.tsx`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago.
- **Orquestração e Mesa Limpa:** Iury.
- **Responsável pela implementação:** Kayky — somente componentes ativos públicos e auth canônico.
- **Especificação e Auditoria Visual:** Rian.
- **Gate Arquitetural:** não aplicável.
- **Auditoria e Prova Real:** Marcelo.
- **Decisão pendente do Luiz:** nenhuma.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop, Web Mobile e documentação.
- **Maior risco:** o tema claro vazar para a Tropa ou o login ativo herdar a casca social escura.
- **Limite da promessa:** a Arena permanece em breve; a missão não a torna jogável.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `@` abaixo do nome, sem métrica mágica | Marcelo | E2E Chromium 390, 768 e 1440 | atendido — `Range` após `document.fonts.ready`, 9/9 E2E |
| Públicas e login ativos claros com Archivo | Rian e Marcelo | Chromium 390 e 1440 | atendido — preview 4193 e capturas revisadas |
| Raiz social e card não recebem estilo público | Marcelo | Chromium 390 e 1440 | atendido — Tropa permanece escura e card preservado |
| Mapa coincide com `App.tsx` | Iury | revisão de código | atendido — Arena em breve, OpenDesign e aliases corrigidos |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `LayoutPublico`, `InicioOpenDesign`, E2E canônico, mapa de rotas e testes de moldura/legal.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — `typecheck`, `lint`, `test`, `build` e E2E passaram. A suíte completa fechou 2.231 testes (9 pulados) e o Chromium fechou 15/15 em 390, 768 e 1440 px.
- **Veredito Final do Tiago:** `APROVADO` — os três bloqueios gerais estavam sanados ou já refletidos no WIP: comparações semânticas não dependem de CRLF, `/explorar` já verifica a tela canônica e o comando de testes roda no PowerShell.
- **Pendências ou decisão necessária do Luiz:** nenhuma. O build sem credencial do Supabase mantém a saída honesta: não gera diretório externo com dados ausentes. Os 9 testes pulados já existentes não são desta entrega.
