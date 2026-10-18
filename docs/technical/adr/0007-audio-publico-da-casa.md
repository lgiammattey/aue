# ADR 0007 — Áudio público da casa

**Status:** proposto
**Data:** 2026-10-18
**Decide:** Giam e Luiz (aguarda decisão formal; é o item 9 do §8 do [ADR 0001](0001-arquitetura-oficial-do-aue.md))
**Substitui:** nada
**Altera:** o [ADR 0001](0001-arquitetura-oficial-do-aue.md) §8 item 9, e só para o caso descrito aqui
**Vale para:** áudio dos posts do elenco da casa (Burpzilla)

---

## O problema

O elenco Burpzilla (ESCOPO_ATUAL §2.17) leva áudios do grupo "Solo Eructos!" para
os posts de Giam e Lima. Esses áudios não passam pelo jogo: não têm resultado,
nota nem dono jogador. O bucket de áudio dos jogadores é privado desde a
20260807000028 e entrega por URL assinada de 5 minutos, que serve para proteger
arroto de pessoa mas não para um conteúdo que é de todos e que o feed mostra
sempre igual. Cada abertura do feed pediria uma assinatura por áudio, a URL
muda a cada vez e nada fica em cache do navegador nem da borda.

## A decisão em uma frase

**Um bucket público separado, `audio_da_casa`, que só guarda conteúdo da casa.**

## O que muda na prática

- Bucket `audio_da_casa`: público, 1 MB por arquivo, só `audio/mp4`. Sem policy
  de escrita para usuário: só o `service_role` envia (pelo script de carga).
  Sem policy de leitura em `storage.objects`, então não há listagem pela API; o
  endereço direto do objeto continua abrindo.
- O bucket dos jogadores (`audio_records`) continua privado. Nada que a pessoa
  grava no jogo entra no bucket novo, e nada do bucket novo é arroto de jogador.
- `posts_comunidade.caminho_do_audio_da_casa` guarda o caminho. O feed só o
  devolve quando o autor está em `contas_da_casa`. Usuário comum que gravasse a
  coluna não teria o áudio exibido.
- O cliente monta a URL pública do objeto e toca direto. O endereço é sempre o
  mesmo, então o navegador e a borda guardam em cache.
- O bucket é do item 9 do §8 do ADR 0001 ("tornar público o bucket de áudio").
  Esta proposta só vale depois de aceita. A migração `20261018000008` cria o
  bucket, mas não deve ser aplicada antes disso.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Manter o áudio da casa no bucket privado, com URL assinada** | Funciona e não mexe na regra do §8. Custa uma assinatura por áudio a cada abertura do feed, URL que muda sempre, sem cache do navegador nem da borda, e um áudio de personagem tratado como se fosse arroto de jogador. Fica como plano B: se o Giam ou o Luiz recusarem o bucket público, o script e o adaptador trocam para esse caminho e perdem o cache. |
| **Tornar `audio_records` público** | Abre o arroto de todo jogador. É o que o §8 item 9 existe para impedir. |
| **Servir o áudio da casa pelo `public/` do site** | Entra no build e no cache do app (PWA), cresce o pacote e obriga um deploy a cada post novo. O Storage já está de pé. |
| **Guardar o áudio como `data:` no banco** | Infla a tabela e a resposta do feed inteira por causa de uns poucos posts. |

## O que custa

- Uma exceção ao §8 item 9, mesmo que contida: existe um bucket público no
  projeto. A contenção é por convenção e por teste (`src/db/contas-da-casa.migracoes.test.ts`):
  só `audio/mp4`, só 1 MB, só escrita do `service_role`, só conteúdo da casa.
- O áudio é público para quem tiver o endereço. Por isso só entra áudio com
  autorização registrada (`docs/historias/burpzilla/autorizacao-dos-audios.md`).
- Apagar um áudio já servido não derruba a cópia que a borda ou o navegador
  guardaram até o cache vencer.
- Mais um bucket para lembrar quando alguém mexer em Storage.

## O que este ADR não decide

A carga em produção não depende só dele: também exige a prova da autorização dos
áudios no repositório e a revisão do sorteio dos comentários. Esses estão no
Cartão de Missão do seed.
