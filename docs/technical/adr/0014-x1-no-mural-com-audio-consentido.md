# ADR 0014: Resultado de X1 no Mural, com áudio só de quem consentir

**Status:** proposto. Rascunho. O Luiz decidiu que o resultado de X1 vira post no Mural com o áudio de quem consentir, mas não definiu o mecanismo de consentimento. O mecanismo abaixo é recomendação e precisa do aceite dele.
**Data:** 2026-11-23
**Decisão de produto:** Luiz (resultado de X1 vira post, áudio só de quem consentir)
**Complementa:** ADR 0011 (áudio privado do duelo) e ADR 0013 (Mural)
**Mantém:** ADR 0011 inteiro. O bucket `duelos_v2` continua fechado e a função `duelo-audio-v2` continua sendo a única forma de ouvir o áudio de um duelo.
**Vale para:** o fim do duelo, o composer do Mural e o card de X1

---

## O problema

O Luiz quer que o resultado de um X1 apareça no Mural. O placar não ofende ninguém. O áudio é outra coisa: o ADR 0011 o mantém privado por desenho, e quem gravou para duelar não autorizou publicar (ADR 0004 §2). Além disso, o ADR 0011 admite que um áudio já entregue não volta atrás, então o consentimento precisa vir antes da publicação.

## A decisão

**O consentimento é por duelista, dado na hora e em separado. Quem consentir publica uma cópia do próprio áudio no Mural. O áudio do duelo em `duelos_v2` não é aberto, movido nem exposto.**

## Na prática

- **Quando.** Na tela de resultado do duelo, depois que os dois lados têm nota. Cada duelista vê só a pergunta sobre o próprio áudio: "Publicar o seu arroto no Mural?". O padrão é **não**. Fechar a tela sem responder é "não".
- **O que consentir significa.** Autorizar o Auê a mostrar o seu áudio, a sua nota e o seu apelido num post público de X1. Não autoriza nada além disso.
- **Como o áudio chega ao Mural.** Uma operação no servidor copia o áudio do lado de quem consentiu para o armazenamento do Mural, o mesmo dos arrotos gravados direto (ADR 0013). A cópia vira um áudio de Mural comum: passa pela avaliação do ADR 0012, tem denúncia e exclusão como qualquer outro. O objeto em `duelos_v2` não muda.
- **O que o post mostra.**
  - Os dois nomes e as duas notas, sempre.
  - O play de cada lado só existe se aquele lado consentiu. Quem não consentiu aparece como "Áudio de fulano é privado".
  - Se os dois consentirem, os dois tocam. Se nenhum consentir, o post continua com o placar.
- **A nota do duelo.** Vem do resultado do X1, que já é oficial no servidor. O navegador nunca escreve nota.
- **Quem cria o post.** O resultado de X1 só vira post depois de pelo menos um consentimento ou de um pedido de publicar o placar. Publicar o placar sozinho também exige a confirmação de quem publica, e o outro duelista é avisado.
- **Revogar.** Quem consentiu pode apagar a sua cópia do Mural. Apagar remove o áudio e o play do post, e o placar fica. Cópia já ouvida ou capturada por quem a recebeu não volta, como no ADR 0011.
- **Denúncia.** A cópia entra na moderação de áudio do Mural. Denunciar um lado não afeta o outro.
- **Conta excluída.** Segue o que o ADR 0011 já faz para duelo: anonimiza o nome no post e remove a cópia do áudio.

## O que não muda

- `duelos_v2` continua com GET direto fechado, e a Edge Function `duelo-audio-v2` continua mediando a reprodução do duelo.
- Nenhuma URL assinada do duelo é criada.
- O §8 item 9 do ADR 0001 não é acionado para o bucket do duelo, porque nada nele é afrouxado. A cópia para o Mural segue as regras do áudio do Mural.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| **Abrir o áudio do duelo em `duelos_v2` para leitura pública** | Quebra o ADR 0011 e o §8 item 9 do ADR 0001. O cache da CDN impediria revogar. |
| **Consentimento antes de gravar** | A pessoa ainda não sabe como ficou o arroto. Consentir depois, vendo a nota, é mais honesto. |
| **Consentimento único para o duelo inteiro** | Um lado poderia publicar o áudio do outro. |
| **Publicar o áudio do outro com aviso** | Gravou para jogar não é autorizou publicar. Aviso depois do fato não é consentimento. |
| **Só placar, para sempre** | Perde o que o Luiz quer: ouvir os dois no Mural. Fica como estado inicial até este ADR ser aceito. |

## O que custa

- **Uma tela nova no fim do duelo**, com uma pergunta por duelista. É atrito num momento de alta emoção e vai cortar a taxa de publicação. O padrão "não" é intencional.
- **Cópia de áudio no servidor**, com armazenamento a mais e uma operação nova a proteger (só quem consentiu, só o próprio lado, uma vez).
- **Mais moderação.** Mais áudio público em circulação.
- **A cópia não é o original.** Se o duelo for denunciado depois, a cópia no Mural precisa ser tratada junto. A moderação precisa saber que as duas existem.
- **Regra de dois consentimentos.** O estado "um lado consentiu e o outro não" precisa ser claro no card, sem parecer defeito.

## Pendências antes de aceitar

- **Luiz:** aceitar o mecanismo (consentimento por lado, depois do resultado, padrão "não", cópia para o Mural) ou propor outro.
- **Lucas:** desenhar a operação de cópia, as permissões e como a moderação liga a cópia ao duelo.
- **Camillo:** conferir o custo de armazenamento e de transferência da cópia.
- **Rian:** especificar a tela de consentimento e o estado "áudio privado" do card.
