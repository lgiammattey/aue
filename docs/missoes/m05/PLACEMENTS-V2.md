# Publicidade no refinamento V2

Os blocos da prévia são simulações. O seletor demonstra anúncio disponível, vazio e indisponível. A distribuição por área e dispositivo ainda depende de implementação, configuração e decisão de produto.

| Área | Posição proposta | Desktop | Mobile |
|---|---|---|---|
| Início | Depois da explicação do jogo | Horizontal | Banner entre blocos |
| Resenha | Entre 4 e 6 publicações | Nativo no fluxo e retângulo lateral | Intercalado entre publicações |
| Disputas | Entre itens da listagem pública | Bloco intercalado | Bloco intercalado |
| Perfil | Após atividade pública | Retângulo contextual | Banner entre seções |
| Resultado solo | Após resultado e ações | Retângulo ou horizontal | Banner após ações |

Espaços são candidatos, sem obrigação de preenchê-los juntos. A frequência deve ser configurável por área e dispositivo. Ausência ou falha recolhe o espaço. Reserva de dimensões, identificação e isolamento precisam ser decididos antes da integração real. A simulação não aciona scripts externos.

A gravação, revisão, consentimento, convite privado, resposta X1 e reprodução têm prioridade. Nenhum anúncio deve interromper essas ações, cobrir controles, reproduzir som automaticamente ou deslocar a navegação. Conteúdos sexualizados, apostas, fraudes, popunders, sobreposições e redirecionamentos forçados ficam fora da proposta.

## O que existe no código

- Banner nativo na Home e no feed, com carregamento externo e container de identificação fixa. O ciclo de montagem merece atenção caso apareça mais de uma vez na mesma página.
- Banner 300 × 250 em iframe isolado, usado em páginas públicas, Arena e feed.
- Smartlink no feed, com destino externo.
- Social Bar global carregado pela aplicação, sem dimensão controlada pelo produto. Sua compatibilidade com a regra de não sobreposição precisa ser avaliada antes de qualquer uso nesta direção.

A flag e os componentes versionados mostram possibilidades técnicas. Não comprovam disponibilidade na conta, aprovação do criativo, impressão ou receita. O backend deve manter privacidade e desempenho sob revisão antes de ativar qualquer placement. Referências em [adsterra.ts](../../../src/plataforma/web/adsterra.ts), [banner 300 × 250](../../../src/shared/components/AdsterraBanner300x250.tsx) e [slot do feed](../../../src/features/novo-aue/SlotPatrocinadoDoFeed.tsx).
