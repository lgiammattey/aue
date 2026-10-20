# Cartão de Missão — Auê

> Obrigatório antes de o Iury abrir execução na oficina (exceto Hot lane, que registra logo após apagar o incêndio). Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a identidade visual da casca OpenDesign hoje usa soluções provisórias díspares (arcos de onda no desktop, três barras de equalizador no mobile) que não refletem o protótipo canônico do Bonde do Arroto (`AUÊ!` / `A!`). Além disso, o favicon utilizava a Bolha Viva em vez da assinatura brutalista solicitada pelo dono do produto (Luiz).
- **Comportamento esperado na tela:**
  - Na barra lateral desktop (`BarraLateral.tsx`), o logo vira o wordmark brutalista puro `AUÊ!` em Anton Display.
  - No modo recolhido/tablet, a barra lateral exibe o monograma compacto `A!` sem quebrar o layout.
  - No webapp mobile (`VersaoMobileOpenDesign.tsx`), o cabeçalho superior remove as três barras e exibe o wordmark limpo `AUÊ!`.
  - No favicon (`favicon.svg`, `favicon.ico`, etc.), a marca passa a exibir o monograma brutalista `A!` com tipografia pesada e alto contraste.
- **Fora de escopo (Não vira):** alterar a lógica de estados da Arena, criar novas rotas, introduzir gradientes ou novas cores fora do design system.
- **Pista (Lane):** Fast lane
- **Por que esta pista:** Ajuste cirúrgico de marca visual e token gráfico em componentes de casca e assets estáticos, sem impacto em contratos de API ou modelo de dados.
- **Fonte de verdade afetada:** `docs/design/prototipo/Bonde do Arroto.dc.html`, `docs/design/design-system/system/DESIGN.md`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas/OpenDesign) + Camillo (Favicon/Assets estáticos)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma (Luiz escolheu explicitamente a Opção 4, inclusive no favicon)

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop (3 colunas), Tablet (barra recolhida), Webapp Mobile (<700px), Favicon no navegador.
- **Estados obrigatórios da Arena:** não afetados.
- **Maior risco de quebra ou mentira visual:** quebrar o alinhamento da sidebar no desktop ou colidir com a suíte de testes de sincronia de ícones (`sincronia-dos-icones.test.ts`).
- **Limite da promessa:** Favicon vetorial com SVG puro renderizando a forma do `A!` em alta fidelidade.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| Sidebar desktop mostra `AUÊ!` em Anton e oculta SVG de arcos | Kayky / Rian | Código / Teste | comprovado |
| Sidebar compacta (tablet) mostra `A!` centralizado | Kayky / Rian | Código / Teste | comprovado |
| Webapp mobile mostra `AUÊ!` limpo sem as três barras de equalizador | Kayky / Rian | Código / Teste | comprovado |
| Favicon exibe o monograma `A!` com legibilidade em fundo escuro e claro | Camillo / Rian | Código / Navegador | comprovado |
| Suíte de testes (`npm test`), `typecheck` e `lint` passam sem regressão | Marcelo | Terminal / Vitest | comprovado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/novo-aue/BarraLateral.tsx`: wordmark `AUÊ!` (expandido) e `A!` (compacto), removidos arcos provisórios.
  - `src/features/novo-aue/casca.css`: classes `.brand-full`, `.brand-compact`, regra tablet e `.wordmark`.
  - `src/features/novo-aue/VersaoMobileOpenDesign.tsx`: cabeçalho mobile simplificado para `AUÊ!` limpo.
  - `src/features/novo-aue/InicioOpenDesign.test.tsx`: asserção explícita do wordmark e monograma.
  - `src/features/novo-aue/VersaoMobileOpenDesign.test.tsx`: asserção do cabeçalho mobile brutalista.
  - `docs/design/design-system/system/scripts/build-favicons.py`: gerador atualizado com geometria Anton do `A!`.
  - `docs/design/design-system/assets/favicon/*` e `public/*`: favicon.svg, favicon.ico e ícones PWA sincronizados.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` (155 suites verdes, 1851 testes passando, build e typecheck sem erros, teste de paridade de ícones byte-a-byte aprovado).
- **Veredito Final do Tiago:** `APROVADO`
- **Pendências ou decisão necessária do Luiz:** nenhuma
