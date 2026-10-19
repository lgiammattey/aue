# Cartão de Missão 0020 — Comunidades viram a porta do Auê

> Decisão do Luiz em 19/10/2026: recuperar o Auê como comunidade, sem puxar a Arena para esta rodada. Aprovado pelo Tiago como MVP de entrada. O Bonde continua acessível por compatibilidade; não será removido aqui.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o fórum novo já permite descobrir comunidades, ler tópicos e participar, mas a pessoa que abre o Auê ainda cai no Bonde velho. Ela entra num produto de feed, quando a direção decidida é comunidade e conversa.
- **Comportamento esperado na tela:** quem já tem conta pronta abre `/comunidades`. Quem chega pela Landing e quer só ouvir também entra em `/comunidades`. Dali, encontra uma turma, abre uma conversa, entra na comunidade quando quiser e cria ou responde um tópico. A marca da casca nova volta para Comunidades. As rotas sociais antigas de comunidade levam ao equivalente novo; `/feed`, histórias e Arena continuam funcionando como compatibilidade.
- **Fora de escopo (Não vira):** publicação da Arena; áudio ou nota dentro de tópico; perfil novo; migração ou remoção de banco/RPC/tela legada; redirecionar ou apagar `/feed`; X1; ranking, curtida, repost, chat, recomendação ou contadores inventados.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** troca rota e navegação para contratos de fórum já existentes. Não cria estado da Arena nem muda banco, áudio, Supabase ou contrato compartilhado.
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md`, `docs/design/forum-comunidades.md`, Cartão 0017 e `src/App.tsx`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (rotas, entrada e navegação do fórum)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop e webapp mobile (Safari iOS e Chrome Android).
- **Estados obrigatórios da Arena:** nenhum; a Arena não muda nesta missão.
- **Maior risco de quebra ou mentira visual:** mandar alguém ao fórum e acabar no Bonde velho; quebrar link antigo ao redirecionar aliases; apresentar comunidade vazia como falha ou vice-versa.
- **Limite da promessa:** teste local prova rota e UI, não prova RPC, RLS ou dados no Supabase aplicado. O Bonde não foi removido nem validado como substituído nesta entrega.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Conta pronta abre `/comunidades`, nunca o feed, e conta com perfil pendente continua indo para o perfil | Kayky / Marcelo | Código / Vitest | pendente |
| Landing leva a `/comunidades`; visitante consegue ler diretório, comunidade e tópico sem conta | Kayky / Marcelo | Código / Safari iOS / Chrome Android | pendente |
| `/comm`, `/comunidade` e `/bondes` levam a `/comunidades`; aliases por slug levam a `/c/:slug` | Kayky / Marcelo | Vitest / navegador | pendente |
| A marca do fórum volta para `/comunidades`; Comunidades, Explorar, Arena e Perfil continuam destinos reais | Rian / Marcelo | Tela aberta, 375px e 1280px | pendente |
| Entrar, criar tópico e responder preservam o caminho de volta e o contexto da comunidade | Marcelo | Supabase aplicado / Safari iOS / Chrome Android | pendente |
| `/feed`, histórias e Arena seguem acessíveis sem regressão | Marcelo | Vitest / navegador | pendente |
| Sem rolagem horizontal, alvo menor que 44px, safe-area invadida ou verde acima do orçamento no caminho novo | Rian | Tela aberta, 375px e 1280px | pendente |
| `typecheck`, `lint`, `test` e `build` verdes | Marcelo | Terminal / CI | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente.
- **Parecer do Marcelo:** pendente.
- **Veredito Final do Tiago:** pendente.
- **Pendências ou decisão necessária do Luiz:** nenhuma. A conexão Arena para tópico é a próxima missão, não uma pendência escondida desta.
