# Cartão de Missão — Auê

> Missão 0034: Ativação dos anúncios Adsterra no Feed e na Barra Lateral.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a monetização via Adsterra já estava habilitada em configuração de deploy, mas os slots patrocinados da interface (feed e lateral direita) estavam direcionados exclusivamente ao AdSense com fallback na vitrine interna de apps, impedindo a exibição real das peças da Adsterra.
- **Comportamento esperado na tela:** com a flag da Adsterra ativa, o slot patrocinado do feed renderiza o banner nativo da Adsterra (`AdsterraNativeBanner`) e o slot patrocinado da lateral renderiza o card parceiro com Smartlink da Adsterra (`adsterra-smartlink-panel`). Quando a flag estiver desligada, os slots mantêm seu comportamento anterior com AdSense e fallback na vitrine da casa.
- **Fora de escopo (Não vira):** alterar Arena, jogo de áudio, sistema de pontuação, migrações de banco, login social ou alterar IDs de placements da Adsterra.
- **Pista (Lane):** Fast lane
- **Por que esta pista:** ajuste focado nos componentes existentes de monetização (`SlotPatrocinadoDoFeed.tsx`), sem criação de novos contratos, banco de dados ou endpoints.
- **Fonte de verdade afetada:** `src/features/novo-aue/SlotPatrocinadoDoFeed.tsx`, `src/features/novo-aue/SlotPatrocinadoDoFeed.test.tsx`, `src/features/novo-aue/AdsterraNativeBanner.tsx`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Telas/UI)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável (sem novas APIs ou migrações de backend)
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma (Luiz optou pela opção 3: nos dois lugares, feed e lateral).

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop (feed e lateral direita) e Webapp Mobile (feed).
- **Estados obrigatórios da Arena:** não afeta a Arena.
- **Maior risco de quebra ou mentira visual:** colisão de script ou desconfiguração do fallback caso a flag esteja desligada.
- **Limite da promessa:** a renderização dos scripts de anúncios depende da resposta externa da rede Adsterra no navegador real; em ambiente de testes ou desligado, o comportamento e fallback são garantidos via testes.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Com Adsterra ativa, slot do feed renderiza `AdsterraNativeBanner` | Kayky / Marcelo | Teste unitário e de tela | APROVADO |
| Com Adsterra ativa, slot lateral renderiza card do Smartlink Adsterra | Kayky / Marcelo | Teste unitário e de tela | APROVADO |
| Com Adsterra inativa, slot mantém compatibilidade com AdSense / Vitrine de apps | Marcelo | Teste unitário | APROVADO |
| Typecheck, lint e build de produção passam 100% | Marcelo | `npm.cmd run typecheck`, oxlint e `npm.cmd run build` | APROVADO |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/novo-aue/SlotPatrocinadoDoFeed.tsx` (integração do banner nativo e do card lateral com Smartlink sob a flag da Adsterra)
  - `src/features/novo-aue/SlotPatrocinadoDoFeed.test.tsx` (testes de feed e lateral com Adsterra ligada e desligada)
  - `src/features/novo-aue/AdsterraOpenDesign.test.tsx` (testes de exibição do card de parceiro)
  - `src/features/novo-aue/AdsterraNativeBanner.test.tsx` (teste de injeção do banner nativo quando habilitado)
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — Cobertura de testes garantida, isolamento limpo via hooks e subcomponentes, typecheck e build de produção verdes.
- **Veredito Final do Tiago:** `APROVADO` — Anúncios da Adsterra ativados no feed e na lateral direita conforme solicitado pelo Luiz.
- **Pendências ou decisão necessária do Luiz:** nenhuma.
