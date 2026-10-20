# Cartão de Missão — Perfil OpenDesign completo

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o Perfil OpenDesign é a tela nova, mas hoje expõe uma identidade inventada para visitante, métricas sem fonte, ações que confirmam sucesso antes do servidor e painéis decorativos. A pessoa não consegue reconhecer nem cuidar da própria presença na rede com confiança.
- **Comportamento esperado na tela:** `/perfil` mostra o perfil real da pessoa dona da sessão ou uma entrada clara para criar/concluir a ficha; `/u/:handle` mostra um perfil público real ou o estado de inexistente. O dono pode editar capa, foto, nome, `@`, bio, cidade e redes; visitante só vê e faz ações realmente suportadas. Toda contagem, nota e conteúdo têm fonte de dados. Falhas nunca viram sucesso.
- **Fora de escopo (Não vira):** XP, karma, níveis, conquistas, ranking próprio, mensagens privadas, post de áudio fora da Arena e qualquer métrica ou selo sem contrato. Não troca o OpenDesign pelo perfil legado.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** envolve rota viva, porta de perfil, Supabase/RLS, Storage de imagens, contrato compartilhado e visual responsivo em três larguras.
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md`, `docs/design/design-system/system/DESIGN.md`, `docs/design/prototipo/`, `docs/technical/adr/0001-arquitetura-oficial-do-aue.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (Perfil OpenDesign) + Lucas (perfil, persistência e Storage)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado — capa entra por migração aditiva, bucket próprio com prefixo da pessoa dona e RPCs dedicadas `definir_minha_capa`/`remover_minha_capa`; não sobrecarrega `atualizar_meu_perfil`.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** banner/capa será público junto ao perfil e editável apenas pela dona ou dono; é a premissa desta missão.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop web, tablet web e webapp mobile (Safari iOS / Chrome Android).
- **Estados obrigatórios:** carregando, perfil próprio sem ficha social, perfil de terceiro inexistente, indisponibilidade de rede, upload de foto/capa inválido/grande/falho, edição em andamento, conflito de `@`, perfil sem atividade e ação de seguir recusada.
- **Maior risco de quebra ou mentira visual:** permitir que um visitante altere algo, anunciar upload/edição/seguir como sucesso sem confirmação do Supabase, ou exibir capa/métrica que não existe no servidor.
- **Limite da promessa:** foto e capa são públicas quando o perfil é público; nenhum número de karma, conquista, comentário, favorito ou posição nasce nesta tela sem fonte persistida.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/perfil` visitante não inventa pessoa, contagem ou permissão de editar/postar | Marcelo | código + teste + navegador | pendente |
| Dona/o altera foto, capa, nome, `@`, bio, cidade e redes; servidor confirma antes do feedback | Lucas + Marcelo | teste + Supabase staging + navegador | pendente |
| `/u/:handle` só permite seguir/compartilhar o que existe; inexistente e falha não se confundem | Marcelo | teste + navegador | pendente |
| Capa/foto obedecem tipo, tamanho, RLS e cache sem expor upload de outra conta | Camillo + Marcelo | código + staging | pendente |
| Sem karma, conquista, favorito ou métrica inventada; atividade e melhor nota vêm do contrato | Marcelo | código + teste + navegador | pendente |
| Fidelidade OpenDesign: três colunas, tablet sem overflow, mobile com safe-area e alvos >= 44px | Rian + Marcelo | desktop + tablet + Safari iOS/Chrome Android | pendente |
| `typecheck`, lint, teste e build verdes | Marcelo | CI/local | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente do plano arquitetural.
- **Parecer do Marcelo:** pendente.
- **Veredito Final do Tiago:** pendente.
- **Pendências ou decisão necessária do Luiz:** nenhuma além da premissa registrada para a capa pública.
