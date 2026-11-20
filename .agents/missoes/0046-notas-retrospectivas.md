# Missão 0046 — Nota para áudios já publicados

- **Problema:** áudios publicados antes do jogo aparecem sem nota.
- **Resultado desejado:** analisar o acervo publicado e mostrar uma avaliação posterior quando houver informação suficiente. Preservar notas existentes e não criar partidas, XP ou vitórias.
- **Pista:** investigação e piloto antes de qualquer escrita; eventual implementação sistêmica.
- **Responsáveis:** Tiago (produto e aceite), Iury (coordenação), Lucas e Camillo (motor e dados), Rian (experiência), Marcelo (verificação).
- **Limites:** excluir conteúdo removido e gravações privadas de duelo; preservar acesso e autoria; não inventar informação ausente. O motor atual exige amostra de ambiente que arquivos antigos podem não conter. A nota legada inclui origem, que pode não estar registrada.
- **Aceite:** arquivos disponíveis inventariados, régua e limitações verificadas em amostra; nenhuma nota existente alterada; avaliação posterior identificável; sem efeitos colaterais em ranking ou histórico de jogo. Testar dados e exibição antes de publicar.
- **Estado:** investigação e piloto em andamento; gate e aceite pendentes.

## Decisão adicional de produto — 20/11

Cada arroto publicado deve ter nota, independentemente de ter passado pela Arena. O perfil da pessoa autora deve apresentar **Melhor Nota Publicada** e **Média**, calculadas sobre seus áudios publicados e avaliados. Retirados/ocultos deixam de compor os números; informação indisponível não vira zero. Áudios futuros também precisam de avaliação, e as notas dos arrotos já publicados devem ser preservadas.

## Corte de publicação

Disponibilizar somente avaliações históricas verificadas no lote e o resumo de notas publicadas. O registro automático de novos áudios permanece desativado: a análise no navegador não comprova a nota e a RPC não é executável por clientes. Uma implementação confiável de análise no servidor segue pendente. O ambiente de staging não contém o esquema necessário; testes de banco usam PGlite, e a publicação exige conferência de produção.
