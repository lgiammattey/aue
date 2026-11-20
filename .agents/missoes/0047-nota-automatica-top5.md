# Missão 0047 — Nota automática e Top 5

- **Problema:** novos arrotos publicados ainda não recebem nota automaticamente; a home não destaca os arrotadores.
- **Comportamento esperado:** avaliar os novos arrotos com uma régua confiável, vincular a nota ao áudio publicado e alimentar o perfil. Na home, listar até cinco pessoas reais pela melhor nota publicada, com acesso ao perfil e ao áudio correspondente.
- **Fora de escopo:** números fictícios, áudio privado exposto, atribuir jogos ou vitórias inexistentes.
- **Pista:** full flow sistêmica. Motor, persistência, ranking e interface são afetados.
- **Donos:** Tiago (aceite), Iury (coordenação), Lucas e Camillo (motor e arquitetura), Rian (experiência), Marcelo (qualidade).
- **Riscos:** nota forjada por cliente, falha silenciosa de análise, exposição de áudio privado, classificação inconsistente com a nota visível, misturar réguas diferentes e exibir casa como jogador sem decisão explícita.
- **Aceite:** processamento confiável e recuperável; dados públicos reais e menos de cinco quando necessário; notas e perfis corretos; privacidade e exclusões respeitadas; validação de ponta a ponta e aparência desktop/mobile.
- **Estado:** investigação e arquitetura em andamento; gate e aceite pendentes.
