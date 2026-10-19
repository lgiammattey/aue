# Cartão de Missão 0014 — Rede social confiável

> Autorizado pelo Luiz em 18/10/2026: corrigir e aplicar os achados da auditoria social.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** A rede aceitava comportamentos que não fazem sentido: visitante anônimo ganhava perfil público e podia seguir/postar; seguir não influenciava o feed; comunidades eram preferência local; dados e ações sociais escapavam do contrato da interface.
- **Comportamento esperado na tela:** Visitante joga, desafia e lê o Bonde, mas não tem perfil público nem pratica ação social. Conta promovida tem perfil, pode publicar, seguir, reagir, comentar, denunciar e participar de comunidade. O feed **Seguindo** mostra posts reais de quem a pessoa segue.
- **Fora de escopo (Não vira):** DM, algoritmo de recomendação, notificações, contador inventado, edição de causo e publicação automática de resultado privado.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** Identidade, RLS, schema, RPCs, persistência e telas mudam no mesmo contrato.
- **Fonte de verdade afetada:** `JORNADA.md`, `ESCOPO_ATUAL.md` §2.17, ADR 0001 e ADR 0005.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (Supabase/contratos) e Kayky (telas/adaptadores)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** pendente
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma; o corte visitante versus conta promovida foi autorizado.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Webapp Mobile.
- **Estados obrigatórios:** visitante leitor, conta promovida, feed Todos/Seguindo, comunidade dentro/fora, post moderado/oculto, falha de operação social.
- **Maior risco de quebra ou mentira visual:** aceitar a ação no cliente e o servidor recusar; publicar/mostrar perfil de visitante; esconder dado só na tela, deixando-o aberto na RPC.
- **Limite da promessa:** o build e os testes locais não confirmam policies/grants aplicados no Supabase; matriz de RLS real continua obrigatória antes de publicar.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Visitante joga e lê, mas não cria perfil público nem ação social | Lucas / Kayky | Código / Teste / Supabase | pendente |
| Perfil, post, comentário, reação, denúncia e comunidade exigem conta promovida | Lucas / Kayky | Código / Teste / Supabase | pendente |
| Seguir alimenta a aba Seguindo, sem conteúdo inventado | Lucas / Kayky | Código / Teste / Supabase | pendente |
| Curtidas de terceiros não são consultáveis pela RPC | Lucas | Código / Teste / Supabase | pendente |
| Comunidade é vínculo persistente e post usa comunidade validada | Lucas / Kayky | Código / Teste / Supabase | pendente |
| Post oculto não aceita nem expõe thread/reação | Lucas | Código / Teste / Supabase | pendente |
| Excluir causo com áudio devolve um único resultado honesto | Lucas / Kayky | Código / Teste / Supabase | pendente |
| Desktop e Webapp conservam layout e promoção honesta | Rian / Marcelo | Navegador | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente.
- **Parecer do Marcelo:** pendente.
- **Veredito Final do Tiago:** pendente.
- **Pendências ou decisão necessária do Luiz:** aplicar e validar a migração no projeto Supabase antes de publicar.
