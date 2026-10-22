# Cartão de Missão — Comunidades por tópicos

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a tela chama comunidades de rodas, exibe o slug técnico e trata tópicos como posts soltos. Isso esconde a hierarquia que torna uma comunidade uma comunidade.
- **Comportamento esperado na tela:** o diretório e a comunidade usam nomes humanos; uma comunidade abre sua lista de tópicos; cada tópico abre a conversa com respostas incrementais no próprio documento. O modal de criar exige título e mensagem, com anexos. Não existe criar comunidade nesta fase.
- **Fora de escopo (Não vira):** criação pública de comunidade, chat em tempo real, inventar métricas/conteúdo ou publicar imagens como se fossem do Orkut sem fonte verificável.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** altera a jornada canônica em telas existentes, mas reaproveita os contratos reais de tópicos, respostas, anexos e participação.
- **Fonte de verdade afetada:** `ESCOPO_ATUAL.md`, `docs/design/forum-comunidades.md`, ADR 0010.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (telas) e Lucas (contratos já existentes)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável: sem alteração de schema, RPC ou RLS.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma. Título e mensagem de tópico permanecem obrigatórios, por decisão de 22/10/2026.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Webapp Mobile.
- **Maior risco de quebra ou mentira visual:** expor um campo de título sem entregá-lo à RPC real, ou converter resposta incremental em envio visual sem confirmação do servidor.
- **Limite da promessa:** comunidade e resposta só aparecem após o `ok` do servidor; mídia continua sujeita às regras reais de upload.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Diretório usa nomes humanos, sem `r/` como título | Rian | Navegador desktop/mobile | pendente |
| Criar tópico exige título e mensagem e preserva anexo real | Marcelo | Teste + navegador | pendente |
| Resposta entra incrementalmente no tópico, sem modal/navegação | Marcelo | Teste + navegador | pendente |
| Sem regressão em entrar/sair, anexos e falha de rede | Marcelo | Teste + navegador | pendente |
