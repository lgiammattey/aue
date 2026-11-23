# ADR 0013: Mural, todo post tem arroto

**Status:** proposto. Decisão de produto do Luiz em 23/11/2026. Falta o Gate Arquitetural do Camillo e do Lucas para o contrato do feed antes de virar aceito.
**Data:** 2026-11-23
**Decisão de produto:** Luiz
**Substitui, quando aceito:** ADR 0004 §2 item 1 (história escrita obrigatória) e §5 (card de causo com texto como protagonista)
**Mantém:** ADR 0001, ADR 0004 §2 itens 2 e 3 (vínculo com resultado, moderação), ADR 0005, ADR 0010, ADR 0012
**Vale para:** o Mural (`/feed`) e o composer que publica nele

---

## O problema

O Mural de hoje mostra post de texto: avatar, nome, @, frase. O arroto, que é o motivo do produto, nem aparece no card. O ADR 0004 pediu uma história escrita para publicar um causo, e o card nasceu em torno do texto. O resultado parece um Twitter, que o Luiz não quer.

O Luiz quer outra coisa: o Mural serve para ver os arrotos que a galera mandou, pela Arena ou direto no mural, com as reações e os comentários em cima deles.

## A decisão

**No Mural, todo post raiz é um arroto em áudio. O texto vira legenda opcional.**

## Na prática

- **Duas origens, um tipo de post.** Arroto que veio da Arena e arroto gravado direto no mural. Os dois têm áudio. Post só de texto, só de imagem ou GIF, ou só de embed deixa de ser post raiz do Mural.
- **Legenda.** Opcional, no limite de 180 caracteres que o ADR 0010 já definiu.
- **Nota.**
  - Arroto da Arena herda a nota oficial pelo `result_id`, como no ADR 0004.
  - Arroto gravado direto no mural não nasce com nota. A nota chega depois, pelo trabalho assíncrono do ADR 0012. Enquanto não chega, ou se a avaliação der erro ou sinal inconclusivo, o card mostra o player sem nota. Nunca nota inventada, nunca nota vinda do navegador.
- **Consentimento.** Segue o ADR 0004 §2: gravar não é autorizar publicar. O envio ao Mural continua sendo uma ação separada, com confirmação explícita.
- **Comentário e reação.** Continuam como estão (ADR 0005 para níveis de comentário). O card passa a mostrar a contagem por reação e a prévia do último comentário. Isso muda o contrato da porta `feed`, e é o motivo do Gate.
- **Composer.** Publicar no Mural exige áudio. O caminho de gravação é a Arena com destino "mural" ou o gravador do próprio modal. Texto sozinho não publica no Mural.
- **Botão de ação do card.** "Bater X" quando há nota, "Revanche" em resultado de X1, "Levar pra Arena" quando não há nota. Todos levam à Arena.
- **Dados existentes.** Nada é apagado. A consulta do Mural passa a exigir áudio. Onde o texto antigo continua visível (perfil, comunidade) é decidido no Plano Arquitetural do Gate.

## O que este ADR não decide

- **Tópicos de comunidade.** O ADR 0010 define a conversa dentro de comunidade e continua valendo como está. Este ADR não mexe nisso.
- **Futuro do `/feed`.** O ADR 0010 pretende aposentar o feed solto. Este ADR assume que o Mural continua existindo enquanto essa migração não acontece. Se o Luiz quiser que o Mural vire a porta das comunidades, é outro ADR.
- **Aparência.** Fica no protótipo [`docs/design/propostas/mural-chapado.html`](../../design/propostas/mural-chapado.html) e no [Cartão de Missão](../../escopo/missoes/2026-11-23-mural-chapado.md).

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Manter texto puro como post do Mural** | É o que faz o Mural parecer um Twitter. O Luiz decidiu que o centro é o arroto. |
| **Texto puro rebaixado, sem player, no mesmo feed** | O feed misturaria dois ritmos e dois pesos. Quem quiser conversar comenta em cima de um arroto. |
| **Exigir que todo arroto passe pela Arena** | O Luiz quer arroto direto no mural. Além disso, o ADR 0012 já resolve a nota de quem não passou pela Arena. |
| **Dar nota provisória ao arroto direto** | Seria nota inventada. Falha ou espera não vira sucesso por copy. |

## O que custa

- **Quem não pode gravar não posta.** Sem microfone ou sem lugar para arrotar, a pessoa só comenta e reage. É perda real de participação, e precisa de medição depois da entrega.
- **Mais áudio por tela.** Cada card carrega áudio. É preciso carregar só ao entrar na tela, tocar um por vez e usar picos de waveform pré-calculados no servidor. Sem isso o celular engasga.
- **Mais moderação.** Todo post passa a ser áudio, e a denúncia de áudio (ADR 0004 §2 item 3) carrega mais volume.
- **Conteúdo de conversa escrita sai do Mural.** A conversa escrita fica nos comentários.
- **Atraso da nota no arroto direto.** Depende da fila do ADR 0012, que não garante prazo. O card precisa aguentar esse estado sem parecer quebrado.
