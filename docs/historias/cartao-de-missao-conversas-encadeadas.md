# Cartão de Missão — conversas encadeadas

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a resenha perde o fio quando alguém responde uma resposta. Em alguns caminhos a tela até mostra que publicou, mas o servidor não confirmou o vínculo.
- **Comportamento esperado na tela:** quem abre um tópico enxerga uma conversa contínua; pode responder qualquer fala, voltar depois e encontrar o ramo no mesmo lugar. No celular o recuo para no segundo nível, mas a conversa não para.
- **Fora de escopo (Não vira):** voto ou reação em resposta, ordenação por relevância ou votos, notificações, DM, chat, push e e-mail.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** toca persistência, porta, adaptador web, telas canônicas, links e testes.
- **Fonte de verdade afetada:** `ADR 0001` e `ADR 0010`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago.
- **Orquestração e Mesa Limpa:** Iury.
- **Responsável pela implementação:** Kayky (telas) e Camillo/Lucas (contrato e plataforma).
- **Especificação e Auditoria Visual:** Rian.
- **Gate Arquitetural (Camillo / Lucas):** aprovado para manter `pai_id` como vínculo canônico e `nivel` como faixa visual saturada.
- **Auditoria e Prova Real:** Marcelo.
- **Decisão pendente do Luiz:** nenhuma. Luiz definiu nesta conversa: primeiro fecha a conversa encadeada; voto, ranking e notificação ficam fora.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS / Chrome Android) e Desktop.
- **Estados obrigatórios:** carregando, vazio, enviando, erro, sem permissão, removido e conteúdo indisponível.
- **Maior risco de quebra ou mentira visual:** inserir uma resposta local ou aumentar contagem antes da confirmação do servidor; achatar um ramo ao recarregar ou abrir seu link.
- **Limite da promessa:** não haverá voto, ranking de resposta, notificação ou moderação nova nesta frente. A alteração não afirma que há prova em aparelho físico antes de ela existir.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Resposta fica no pai certo após recarregar | Lucas / Marcelo | SQL, teste de integração e navegador | pendente |
| Cadeia com quatro ou mais respostas preserva os vínculos | Camillo / Marcelo | contrato, teste e navegador | pendente |
| Mobile limita só o recuo, sem rolagem horizontal | Rian / Marcelo | 375, 390 e 430 px | pendente |
| Falha preserva texto e não mostra sucesso falso | Kayky / Marcelo | teste e navegador | pendente |
| Pai removido mantém descendentes navegáveis | Lucas / Marcelo | SQL, teste e navegador | pendente |
| Link direto abre, expande e destaca a resposta | Camillo / Marcelo | teste e navegador | pendente |
| Pipeline e build verdes | Marcelo | typecheck, lint, teste e build | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente.
- **Parecer do Marcelo:** pendente.
- **Veredito Final do Tiago:** pendente.
- **Pendências ou decisão necessária do Luiz:** nenhuma para esta frente.
