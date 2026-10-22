# Cartão de Missão — Páginas públicas na casca OpenDesign

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** as páginas Como jogar, Ranking, Termos e Privacidade saem da experiência visual do Auê e abrem uma casca clara paralela. O rodapé da casca OpenDesign ainda cola os links institucionais.
- **Comportamento esperado na tela:** cada rota de conteúdo continua com seu texto e URL próprios, mas aparece no layout escuro de três colunas do OpenDesign. A navegação leva de volta ao produto e os links institucionais têm espaçamento e quebra corretos em desktop e webapp.
- **Fora de escopo (Não vira):** não muda texto jurídico, regra da Arena, banco, autenticação, feed, fórum nem cria ações sociais decorativas.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** a mudança atravessa a casca visual compartilhada de várias rotas públicas, com exigência de fidelidade desktop e mobile, mas não toca contratos ou persistência.
- **Fonte de verdade afetada:** `docs/design/prototipo/Páginas Públicas.dc.html`, `docs/design/prototipo/Bonde do Arroto.dc.html` e `docs/design/design-system/system/DESIGN.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky — `src/features/publico/` e testes associados
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop e webapp mobile
- **Maior risco de quebra ou mentira visual:** transformar conteúdo informativo em controles sociais sem backend, ou perder legibilidade/navegação no mobile.
- **Limite da promessa:** a mudança não prova microfone, Arena ou conteúdo externo; só garante a moldura e a navegação dessas páginas.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Todas as rotas públicas e legais usam a casca OpenDesign | Kayky | Código e teste | em validação |
| Conteúdo, links e URLs existentes continuam disponíveis | Kayky | Teste | em validação |
| Links institucionais não colam e quebram com leitura no mobile | Rian / Marcelo | Desktop e webapp | em validação |
| `typecheck`, `lint`, `test` e `build` passam | Marcelo | Código | em validação |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
