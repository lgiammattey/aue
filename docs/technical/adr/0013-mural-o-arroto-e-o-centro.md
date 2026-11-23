# ADR 0013: Mural, o arroto é o centro

**Status:** aceito pelo Luiz em 23/11/2026. O Gate Arquitetural deu parecer aprovado com condições (Camillo e Lucas, nos arquivos `2026-11-23-mural-chapado-gate-*.md`), e as condições entram na implementação. A parte do post de X1 com áudio só vale depois do ADR 0014.
**Data:** 2026-11-23
**Decisão de produto:** Luiz
**Complementa:** ADR 0010 (comunidades, tópicos e respostas) e ADR 0012 (nota do áudio publicado)
**Ajusta, quando aceito:** ADR 0004 §5 (card de causo com texto como protagonista)
**Mantém:** ADR 0001, ADR 0004 §2 itens 2 e 3, ADR 0005, ADR 0011
**Depende de:** ADR 0014 (resultado de X1 no Mural com áudio consentido), ainda proposto
**Vale para:** o Mural (`/feed`) e o composer que publica nele

---

## O problema

O Mural de hoje mostra todo post como texto: avatar, nome, @, frase. O arroto, que é o motivo do produto, nem aparece no card. As sete reações ocupam duas linhas sem contagem, o comentário some num ícone solto e a tela tem cerca de doze molduras. O resultado parece um Twitter, que o Luiz não quer.

O Luiz quer outra coisa: o Mural serve para ver os arrotos que a galera mandou, pela Arena ou direto no mural, com as reações e os comentários em cima deles.

## A decisão

**No Mural o arroto é o centro. Post de arroto leva player, nota quando houver, e é o destaque da tela. Post só de texto continua existindo, mais discreto e sem player. O resultado de um X1 também vira post.**

## Na prática

- **Quatro tipos de post no Mural.**
  1. **Arroto da Arena.** Áudio, e a nota oficial herdada pelo `result_id` (ADR 0004).
  2. **Arroto gravado direto no mural.** Áudio, sem nota no início. A nota chega depois pela avaliação assíncrona do ADR 0012.
  3. **Texto.** Sem player e sem botão de ação. Mesma legenda, mesmas reações e comentários.
  4. **Resultado de X1.** Placar dos dois duelistas. Só toca o áudio de quem consentiu publicar. O áudio de quem não consentiu continua privado (ADR 0011).
- **Um anexo por post.** É o que o banco impõe hoje, e continua assim.
- **Legenda.** Opcional nos posts de arroto, no limite de 180 caracteres do ADR 0010.
- **Nota só do servidor.** O card otimista hoje mostra nota calculada no navegador. Isso sai. Sem nota de servidor nem de Arena, o contrato devolve nota nula e o card mostra só o player. Erro ou sinal inconclusivo nunca vira nota inventada.
- **Uma reação por pessoa.** Tocar em outra troca a reação, tocar na mesma remove. Hoje a função do banco impõe um polegar mais um emoji, então a regra muda. A chave do banco (`user_id`, `topico_id`, `tipo`) já comporta mais de uma, e o Lucas define como consolidar quem hoje tem duas.
- **Contagem e comentário no card.** O card mostra a contagem por reação e a prévia do último comentário. O Mural de hoje roda em tópicos (ADR 0010): `explorar_topicos` e `listar_publicacoes_pessoais`, juntados no cliente em `paginacaoDoMural.ts`, e esse caminho não devolve áudio, nota, reações nem último comentário. O Gate propõe uma RPC nova, `listar_mural`, só aditiva, com rollback desligando o flag. A porta `feed` do ADR 0004 não alimenta o Mural.
- **Botão de ação.** "Bater X" quando há nota, "Levar pra Arena" quando não há, "Revanche" no resultado de X1. Todos levam à Arena. Post de texto não tem botão.
- **Consentimento.** Segue o ADR 0004 §2: gravar não é autorizar publicar. Publicar no Mural é uma ação separada, com confirmação explícita.
- **Dados existentes.** Nada é apagado. O texto antigo continua aparecendo no Mural.

## Depende de

- **Áudio de duelo publicado.** O ADR 0011 mantém o áudio de duelo privado. O [ADR 0014](0014-x1-no-mural-com-audio-consentido.md) propõe consentimento por duelista, na hora, com cópia do áudio para o Mural e sem abrir o bucket do duelo. Até ele ser aceito, o post de X1 existe só com o placar.

## O que este ADR não decide

- **Tópicos de comunidade.** O ADR 0010 continua valendo como está.
- **Futuro do `/feed`.** O ADR 0010 pretende aposentar o feed solto. Este ADR assume que o Mural continua existindo enquanto essa migração não acontece.
- **Aparência.** Fica no protótipo [`docs/design/propostas/mural-chapado.html`](../../design/propostas/mural-chapado.html) e no [Cartão de Missão](../../escopo/missoes/2026-11-23-mural-chapado.md).

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Todo post do Mural precisa de arroto** | Foi a primeira versão deste ADR. O Luiz decidiu manter o texto no Mural, mais discreto. |
| **Resultado de X1 só com placar, para sempre** | O Luiz quer áudio de quem consentir. Fica como placar até o ADR de consentimento existir. |
| **Reação múltipla livre por emoji** | O Luiz decidiu uma reação por pessoa. |
| **Nota provisória no arroto direto** | Seria nota inventada. Falha ou espera não vira sucesso por copy. |
| **Exigir que todo arroto passe pela Arena** | O Luiz quer arroto direto no mural, e o ADR 0012 já resolve a nota de quem não passou pela Arena. |

## O que custa

- **Mais áudio por tela.** Cada card de arroto carrega áudio. É preciso gerar a URL assinada só quando o card fica visível, tocar um por vez, usar um único elemento de áudio e picos de waveform pré-calculados no servidor (condições do Camillo).
- **Mudança de regra de reação.** Exige migração e decisão sobre quem hoje tem duas reações no mesmo post.
- **Mais moderação.** Mais áudio em circulação, e a denúncia de áudio (ADR 0004 §2 item 3) carrega mais volume.
- **Dois níveis de post no mesmo feed.** Arroto e texto têm pesos diferentes. O desenho precisa manter o ritmo sem o texto parecer defeito.
- **Atraso da nota no arroto direto.** Depende da fila do ADR 0012, que não garante prazo. O card precisa aguentar o estado sem nota.
- **O Mural pode abrir quase vazio de arroto.** Antes de ligar o flag é preciso medir quantos posts com áudio existem e o custo de `reivindicar_audios_para_nota`, que cresce com o total de áudios.
