# Cartão de Missão — Perfil antes do Bonde

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem acabou de criar conta cai no feed sem fechar nome, @ e foto; a edição de perfil também está espalhada e sem hierarquia.
- **Comportamento esperado na tela:** conta nova completa um perfil curto antes de entrar no Bonde. Quem já tem perfil abre uma página de perfil organizada e edita em uma folha clara, sem perder contexto.
- **Fora de escopo (Não vira):** questionário, onboarding com várias telas, capa de perfil, métricas inventadas ou bloquear Arena/convidado.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** muda a primeira entrada de conta e duas superfícies sociais existentes, sem alterar o contrato de identidade já aprovado.
- **Fonte de verdade afetada:** `JORNADA.md`, protótipos `Login.dc.html` e `Bonde do Arroto.dc.html`, ADR 0009.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável; contrato social existente é preservado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop e webapp mobile.
- **Maior risco de quebra ou mentira visual:** confundir conta já promovida com perfil incompleto e impedir a Arena; salvar perfil sem confirmação do servidor.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Cadastro novo abre conclusão de perfil antes do feed | Kayky / Marcelo | código e teste | pendente |
| Arena e visitante continuam sem bloqueio | Marcelo | código e teste | pendente |
| Perfil e edição têm hierarquia coerente em desktop e mobile | Rian | navegador | pendente |
| Falha de salvar não vira sucesso | Marcelo | código e teste | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
