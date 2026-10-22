# Cartão de Missão — diálogo de áudio e destino do arroto

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o botão “Soltar um arroto” abre hoje um compositor de texto genérico e mistura captura, áudio e publicação. Não deixa claro onde a gravação vai parar.
- **Comportamento esperado na tela:** o botão abre um diálogo próprio de gravação direta, sem Arena, motor ou nota. Ao confirmar, o áudio entra em **Arrotos** no perfil de quem gravou. Se ela marcar um `@` real, o áudio entra em **Arrotos** no perfil marcado, com a autoria visível de quem enviou. O envio é uma publicação no perfil escolhido: pessoas autenticadas que abrirem esse perfil podem ouvir o áudio.
- **Fora de escopo (Não vira):** não aciona Arena, YAMNet ou score; não publica em feed/comunidade; não é DM/conversa; não usa conteúdo simulado.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** envolve captura de microfone, persistência de áudio, destino de perfil de terceiro e RLS.
- **Fonte de verdade afetada:** `JORNADA.md` | `ARENA.md` | `REGRAS.md` | `ADR 0001`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (diálogo e destinos) | Lucas (captura, persistência e contrato)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado — domínio novo `Arrotos do Perfil`, separado de Arena, comunidade, feed e `resultados`; bucket privado, URLs temporárias e RPCs próprias. O bucket não é público, mas itens publicados aparecem para pessoas autenticadas que acessam o perfil de destino.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma — `@` é entrega no grupo Arrotos do perfil marcado, com autoria explícita do remetente.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop web, Safari iOS e Chrome Android.
- **Estados obrigatórios da Arena:** não aplicável — este fluxo não passa pela Arena.
- **Maior risco de quebra ou mentira visual:** dizer que enviou um áudio para outro perfil sem persistência e RLS real, ou abrir o microfone sem liberar todos os recursos ao fechar.
- **Limite da promessa (o que o motor de áudio/API não mede):** não há motor, score ou validação de arroto neste fluxo; é gravação direta.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| “Soltar um arroto” abre diálogo próprio de áudio, não compositor de texto | Rian | Código / Teste / navegador | pendente |
| Captura usa microfone real e comunica negação ou falha sem falso sucesso | Marcelo | Código / Teste / Safari iOS / Chrome Android | pendente |
| Sem @ marcado, áudio entra no grupo Arrotos do perfil de quem gravou | Lucas | Contrato / Teste / banco | pendente |
| @ resolve um perfil real e o áudio aparece no grupo Arrotos dele com remetente identificado | Lucas + Marcelo | Contrato / Teste / banco | pendente |
| Antes de enviar, a tela deixa explícita a visibilidade do áudio no perfil escolhido | Rian + Marcelo | Código / Teste | pendente |
| Layout funciona no desktop e webapp sem quebrar safe area | Rian + Marcelo | navegador / Safari iOS / Chrome Android | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** nova porta/adaptador de arrotos, migração de Storage/RPC/RLS, diálogo de gravação e seção Arrotos no Perfil OpenDesign.
- **Parecer do Marcelo:** `NÃO VALIDADO`
- **Veredito Final do Tiago:** `NÃO VALIDADO`
- **Pendências ou decisão necessária do Luiz:** validar ao vivo o fluxo de permissão e o destino publicado após a migração/contrato aplicável.
