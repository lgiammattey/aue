# Cartão de Missão — deixar arroto no perfil

## 1. Enquadramento

- **Dor / Problema da pessoa:** a aba Arrotos do próprio perfil mostra a coleção, mas não convida com clareza a gravar e deixar um áudio ali.
- **Comportamento esperado na tela:** no próprio perfil, a aba Arrotos mostra um CTA circular com microfone. O toque abre o gravador direto; aquele ponto só permite enviar para o próprio perfil. Publicar segue sendo uma ação explícita depois da gravação.
- **Fora de escopo:** Arena, nota, YAMNet, X1, feed/comunidade, envio a outro perfil, rota nova, migração, RLS, Storage ou contagem inventada.
- **Pista:** Full flow comum.
- **Por que esta pista:** cria um CTA e um modo contextual num fluxo já existente, sem alterar contrato ou persistência.
- **Fonte de verdade afetada:** `MAPA_DE_PAGINAS_E_FLUXOS.md`, `Bonde do Arroto.dc.html` e Design System.

## 2. Donos e Fronteiras

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural:** não aplicável enquanto o contrato de arroto de perfil for reutilizado sem mudança
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop, Safari iOS e Chrome Android webapp.
- **Maior risco de quebra ou mentira visual:** círculo abrir um fluxo que envia para outro destino, pedir microfone sem gesto ou confirmar publicação que não aconteceu.
- **Limite da promessa:** o botão abre a gravação; só uma publicação confirmada entra na coleção.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Só o dono vê o CTA na aba Arrotos | Kayky / Marcelo | Código e teste | pendente |
| O CTA abre o gravador e o destino fica em Meu perfil | Kayky / Marcelo | Código e teste | pendente |
| O círculo respeita tokens, os dois temas e alvo tocável | Rian / Marcelo | Navegador desktop e webapp | pendente |
| Gravar, enviar, recarregar e tocar o áudio funciona | Marcelo | Safari iOS e Chrome Android | pendente |
| Permissão ou upload negado não insere áudio nem anuncia sucesso | Marcelo | Código, Safari iOS e Chrome Android | pendente |

## 5. Encerramento

- **Arquivos/módulos alterados:** pendente
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** validação real de microfone, envio e playback.
