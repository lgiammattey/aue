# Cartão de Missão — anúncio nativo na lateral

## 1. Enquadramento

- **Dor / Problema da pessoa:** enquanto o AdSense ainda não entrega uma peça, há espaço ocioso na lateral direita e os apps do ecossistema não têm um lugar claro, nem levam para seus sites oficiais.
- **Comportamento esperado na tela:** no desktop, um único slot aparece após “Suas rodas” e antes do rodapé. Ele tenta o AdSense primeiro; sem configuração ou com retorno `unfilled`, mostra uma campanha sorteada de SignallQ, Lagcheck ou Linka. O card abre o site do produto e o QR leva à loja correspondente.
- **Fora de escopo:** lateral esquerda, feed de comunidades, perfil, árvore de respostas, compositores, gravação, Arena real, migração, RLS e alterações no contrato de anúncios do Google.
- **Pista:** Fast lane.
- **Por que esta pista:** reaproveita o mesmo componente e o mesmo fallback já validados no feed; muda só uma superfície visual e seus destinos.
- **Fonte de verdade afetada:** `MAPA_DE_PAGINAS_E_FLUXOS.md`, Design System e política de publicidade já derivada do ambiente.

## 2. Donos e Fronteiras

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural:** não aplicável; nenhum contrato ou serviço novo.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop; no tablet e webapp a lateral continua ausente.
- **Maior risco de quebra ou mentira visual:** exibir campanha da casa junto de um anúncio preenchido ou deixar o link apontar para a loja errada.
- **Limite da promessa:** o bloco só reserva um espaço para o Google quando há cliente e slot configurados; não afirma que haverá demanda nem receita.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| A lateral exibe um único slot após as rodas | Kayky / Marcelo | Código e navegador desktop | pendente |
| AdSense tem prioridade; `unfilled` aciona uma só campanha própria | Marcelo | Teste | pendente |
| SignallQ, Lagcheck e Linka abrem seus sites corretos; QR segue para a loja | Marcelo | Teste | pendente |
| A lateral desaparece no tablet e no webapp | Rian / Marcelo | Navegador responsivo | pendente |

## 5. Encerramento

- **Arquivos/módulos alterados:** pendente
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** aprovação do AdSense continua externa ao produto.
