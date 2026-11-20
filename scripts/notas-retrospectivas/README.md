# Piloto local de notas retrospectivas

Ferramenta de investigação: não lê o banco, não publica notas e não modifica áudios. Recebe arquivos locais, avalia cada um no navegador com o juiz YAMNet e o motor antigo do Auê, e exibe um relatório. Requer as dependências do projeto e o Chromium do Playwright instalados.

```sh
node scripts/notas-retrospectivas/executar.mjs caminho/primeiro.m4a caminho/segundo.m4a
```

Para usar a interface manualmente, rode `npm run dev` e abra `/scripts/notas-retrospectivas/index.html` no endereço local indicado pelo Vite. A seleção e o relatório ficam no navegador; o modelo é servido pelo próprio projeto. Use o botão para baixar o JSON, se precisar preservá-lo.

A nota acústica retrospectiva é a média das três parciais de força, fôlego e grave da régua antiga. É uma régua diferente da nota antiga da Arena, que também inclui origem. O relatório indica a faixa que a fórmula antiga produziria considerando todas as origens possíveis; nenhuma origem é atribuída. A medição não é equivalente ao laudo experimental atual nem demonstra desempenho comparável entre aparelhos. O juiz pode errar, e arquivos não reconhecidos ou que não possam ser analisados não recebem nota.

Este piloto não autoriza publicar os resultados nem criar jogos, XP ou conquistas. Faça revisão dos arquivos e valide a regra e o tratamento da origem antes de usar os números no produto.

Para analisar um inventário de registros publicados em produção, há um piloto administrativo somente de leitura:

```sh
node scripts/notas-retrospectivas/piloto-producao.mjs REF inventario.json relatorio.json
```

O inventário é um array de objetos com `tipo`, `id`, `bucket` e `caminho`, produzido por uma consulta prévia que selecione apenas registros ainda publicados. O comando recupera a chave de serviço por meio da CLI autenticada; a chave e os áudios ficam em memória. O relatório contém caminhos e identificadores e deve ficar protegido. Antes de publicar qualquer nota, confira novamente a visibilidade dos itens, pois ela pode ter mudado desde a coleta.
