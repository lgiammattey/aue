# Cartão de Missão — Auê 3.0: Comunidades, Feed de Causos e Jogo

> Aberto pelo Giam (PO & Braço Direito do Luiz) em 17/10/2026.
> Alinhado e aprovado com o Luiz.

---

## 1. Enquadramento (Giam)

- **Dor / Problema da pessoa:** Arroto solto vira só barulho; o que faz a zoeira ser eterna é o contexto (*"arrotei no primeiro encontro"*, *"arrotei na reunião da firma"*). Ao mesmo tempo, a disputa rápida de 1 toque no X1 é a mecânica mais divertida. O Auê 3.0 une o motor do jogo à essência de comunidade do Orkut (*"Eu arroto, e daí?"*) com a agilidade de um feed moderno estilo Twitter/Reddit.
- **Comportamento esperado na tela:**
  1. **Arena rápida (1 toque):** O botão principal segue acessível de qualquer lugar para arrotar, receber a nota do juiz de IA (0 a 100) e desafiar no WhatsApp.
  2. **Feed de Causos (Twitter/X style):** Cards rápidos com áudio reproduzível, nota do juiz, causo/história curta, badge da comunidade e botão de retrucar/desafiar ("Duvido").
  3. **Comunidades (Reddit/Orkut style):** Hubs temáticos, com a pioneira *"Eu arroto, e daí?"*, onde os causos e duelos daquele tema ficam agrupados.
  4. **Publicação com Consentimento Explícito:** Ao arrotar na Arena, a pessoa pode escolher *"Mandar pro X1 privado"* ou *"Publicar causo na Comunidade"*.
- **Fora de escopo (Não vira nesta fase):**
  - Algoritmo complexo de recomendação / ML de feed (ordenação cronológica ou por mais votados/reagidos basta).
  - Chat privado em tempo real (a conversa acontece no WhatsApp ou nas respostas públicas).
  - Sistema de monetização paga ou moedas virtuais.
- **Pista (Lane):** **Full flow sistêmica** (Gate Arquitetural Obrigatório do Camillo).
- **Por que esta pista:** Mexe em persistência de dados (tabelas de comunidades, posts e moderação), contratos de segurança/RLS (áudios públicos vs privados) e estrutura de telas.
- **Fonte de verdade afetada:** `docs/jogo/VISAO.md`, `docs/escopo/ESCOPO_ATUAL.md`, `docs/jogo/ARENA.md`, `docs/technical/adr/`.

---

## 2. Donos e Fronteiras (Marco)

- **Braço direito e Aceite Final:** Giam
- **Orquestração e Mesa Limpa:** Marco
- **Gate Arquitetural (Motor, Persistência e Moderação):** Camillo (Pendente de emissão do plano)
- **Especificação UX/UI e Design System:** Priscila
- **Implementação:** Bia (Telas/Feed/Comus) + Camillo (APIs/Supabase/Portas)
- **Auditoria e Prova Real:** Renan
- **Decisão pendente do Luiz:** Nenhuma (Direcionamento validado: moderno, alma do Orkut / "Eu arroto, e daí?", feed ágil e jogo ativo).

---

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web mobile (PWA) e cascas nativas (iOS e Android via Capacitor).
- **Estados obrigatórios:** feed carregando (esqueleto), feed com posts, player de áudio tocando, postagem enviando, erro de envio, denúncia de conteúdo, offline e modo sem som.
- **Maior risco de quebra ou mentira visual:** 
  1. *Segurança/LGPD:* Publicar áudio de quem só queria jogar privado. A trava deve ser inviolável (opt-in explícito para comunidade).
  2. *Cold start:* Feed vazio parece app morto. O app deve nascer com comunidades oficiais populadas de sementes e causos de exemplo.
  3. *Custo de áudio:* Áudio de comunidade precisa de política de cache e retenção claras definidas pelo Camillo.
- **Limite da promessa:** O juiz de IA continua medindo se é arroto real no aparelho antes de autorizar o selo de nota no causo.

---

## 4. Matriz de Aceite e Evidência (Renan & Priscila → Giam)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Abertura e gravação de arroto em 1 toque continuam intactas | Renan | Web Mobile / Celular | pendente |
| Postagem no mural só ocorre com consentimento e escolha de comunidade | Renan | Código / Supabase | pendente |
| Feed renderiza cards com áudio, nota, causo e autor sem quebrar layout | Priscila | Visual / Navegador | pendente |
| Sistema de denúncia e moderação oculta áudio denunciado | Renan | Banco / RLS | pendente |
| Pipeline automatizado 100% verde (`typecheck`, `lint`, `test`, `build`) | Renan | CI / Local | pendente |

---

## 5. Próximo Passo Imediato

1. Giam atualiza a [VISAO.md](../../docs/jogo/VISAO.md) e [ESCOPO_ATUAL.md](../../docs/escopo/ESCOPO_ATUAL.md) para registrar a era Auê 3.0.
2. Marco aciona Camillo para elaborar o **Plano Arquitetural** e Priscila para especificar a **Interface**.
