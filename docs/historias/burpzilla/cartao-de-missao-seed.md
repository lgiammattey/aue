# Cartão de Missão — Elenco Burpzilla no Bonde (seed)

> **Rascunho para o Tiago aprovar.** Ainda não está aprovado. Sem aprovação, a conversa continua em Exploração e ninguém abre branch. Segue o [modelo oficial](../../../.agents/templates/mission-card.md).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem entra no Auê hoje encontra o Bonde e as comunidades vazios. Sem ninguém por perto, não há por que postar causo, reagir ou chamar alguém pro X1.
- **Comportamento esperado na tela:** o Bonde e a comunidade "Eu arroto, e daí?" têm posts de dois personagens (Giam e Lima) contando a história Burpzilla em episódios espaçados, com áudio do Solo Eructos! anexado e comentários ocasionais de perfis da casa, às vezes só um arroto.
- **Identificação (decisão de 18/10/2026):** o feed não leva selo de personagem. O perfil leva a bio "personagem da casa, Burpzilla". Não há menção na página Sobre, a pedido do Luiz.
- **Fora de escopo (não vira):**
  - qualquer selo que simule ranking, como "número 1";
  - nota, contagem de seguidores ou de membros inventada;
  - login real, jogo real ou saldo para os personagens;
  - qualquer coisa que apareça como usuário comum sem identificação no perfil.
- **Pista:** Full flow sistêmica.
- **Por que esta pista:** mexe em Supabase (seed e agendamento), contrato de dados do causo e do comentário, e no conteúdo que o Bonde mostra. Entra no Gate Arquitetural.
- **Fonte de verdade afetada:** `ESCOPO_ATUAL.md` §2.17, `VOZ.md` e `ADR 0001`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (seed, agendamento, contratos) com apoio do Camillo (execução agendada, cache de áudio)
- **Especificação e Auditoria Visual:** Rian (como o perfil de personagem e a bio aparecem)
- **Gate Arquitetural (Camillo / Lucas):** pendente
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver a seção "Conflitos com o escopo atual"

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS / Chrome Android) e Desktop
- **Estados obrigatórios da Arena:** não muda nenhum estado
- **Maior risco de quebra ou mentira visual:** causo seedado com nota que o servidor nunca calculou. Pelo §2.17, o cliente nunca afirma nota.
- **Limite da promessa:** o Auê não sabe se o arroto do áudio é do "Giam". A atribuição é de ficção e vale só no conteúdo.

## 4. Conflitos com o escopo atual (precisa de decisão do Luiz)

O [ESCOPO_ATUAL.md](../../escopo/ESCOPO_ATUAL.md) diz coisas que batem de frente com este seed:

1. **Nota vem do servidor.** Todo causo precisa de nota calculada pelo motor, a partir do áudio. Os causos do seed passam pelo juiz como qualquer outro, ou ficam sem nota. Nota inventada não entra.
2. **Aceite explícito do autor.** O causo "só sobe depois do aceite marcado no modal". Personagem não aceita nada. Precisa de um caminho de publicação para conteúdo da casa registrado no código, não gambiarra no banco.
3. **Perfil de terceiros não existe ainda** ("aparece desabilitado"). A bio do personagem precisa de uma tela de perfil, que hoje não há.
4. **Badge.** Conquistas estão fora do escopo (§3). Um selo "Fundador" ou "Elenco da casa" é conquista nova e pede decisão do Luiz.
5. **Comentário automático.** Os comentários dos agentes vão pelo mesmo caminho dos comentários de usuário (`criar_comentario`), com uma conta que o servidor reconhece como "da casa".

### Decisões do Luiz em 18/10/2026

- **Itens 1 e 3 resolvidos.** A tela de perfil é a mesma do usuário comum, com o símbolo Burpzilla indicando usuário da casa. Os áudios do seed sobem sem passar pelo jogo. Condição que o cartão mantém: **causo sem passar pelo juiz aparece sem nota**, nunca com nota inventada. O card mostra o áudio e o texto, sem selo de pontuação.
- **Mesmo caminho do usuário comum.** O Luiz confirmou que qualquer usuário pode postar áudio sem passar pelo jogo, e então sem nota. O seed usa esse caminho, sem lógica especial de nota. No código, a linha do feed (`LinhaDoFeed` em `src/plataforma/web/comunidade.ts`) já aceita `nota` e `resultado_id` nulos. O Lucas confere se o envio de áudio sem jogo existe de ponta a ponta antes do plano.
- **Item 4 reduzido.** O símbolo Burpzilla é identificação, não conquista. Ele mora no perfil e não indica posição, nota nem ranking. Precisa de uma especificação do Rian (forma, tamanho, onde aparece).
- **Itens 2 e 5 seguem abertos.** Falta o caminho de publicação da casa e a conta que o servidor reconhece como da casa. O Gate Arquitetural fecha isso.

## 5. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Causo seedado que não passou pelo juiz aparece sem nota, nunca com nota inventada | Marcelo | Código / Teste | pendente |
| O perfil é igual ao de usuário comum e mostra o símbolo Burpzilla de usuário da casa | Rian | Safari iOS / Chrome Android | pendente |
| O símbolo não indica posição, nota nem ranking | Rian | Safari iOS / Chrome Android | pendente |
| O feed não mostra selo de personagem | Rian | Safari iOS / Chrome Android | pendente |
| Os posts saem nos horários do cronograma, sem lote único | Marcelo | Teste | pendente |
| O áudio toca e carrega do cache | Marcelo | Safari iOS / Chrome Android | pendente |
| Comentários dos agentes não saem em todos os posts | Marcelo | Teste | pendente |
| Denúncia esconde o conteúdo da casa como qualquer outro | Marcelo | Código / Teste | pendente |
| Os áudios usados têm autorização registrada | Tiago | Documento | pendente |

## 6. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** a definir pelo Gate Arquitetural.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:**
  - os itens 2 e 5 da seção 4, que o Gate Arquitetural fecha;
  - guardar o registro da autorização dada no grupo do Telegram (mensagem ou captura) e o que ela cobre, conforme o [LEIAME](../../../audios/solo-eructos/LEIAME.md).

Decidido em 18/10/2026: os agentes da squad que comentam são sorteados, sem lista fixa.
