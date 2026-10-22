# Cartão de Missão — Comunidade Grupos WhatsApp

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** os três grupos oficiais de WhatsApp estavam soltos no diretório externo; quem procura os convites não encontra uma casa comum dentro do Auê.
- **Comportamento esperado na tela:** a comunidade `Grupos WhatsApp` aparece no diretório como qualquer outra comunidade e abre com um tópico fixado, `Links dos grupos oficiais de WhatsApp`, contendo os três convites reais.
- **Fora de escopo (Não vira):** criar novos grupos pelo app, inventar convite, espelhar conversa do WhatsApp ou exibir contagem de membros.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** é uma migração de dados sobre contratos de comunidade e fórum já publicados; não cria tabela, RPC, policy ou novo fluxo.
- **Fonte de verdade afetada:** `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`, `docs/technical/adr/0005-conta-opcional-e-perfil-publico.md`, migrations de grupos externos e fórum.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (migração de dados)
- **Especificação e Auditoria Visual:** Rian — não aplicável: a tela lê a comunidade pelo contrato existente.
- **Gate Arquitetural (Camillo / Lucas):** não aplicável: sem schema, API ou RLS nova.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Webapp mobile, via listagem real de comunidades.
- **Maior risco de quebra ou mentira visual:** duplicar os convites em dois diretórios ou escrever link inventado. A migration oculta apenas os três registros migrados e reaproveita as URLs já oficiais no banco.
- **Limite da promessa:** o Auê abre o convite; não controla nem conhece os membros dos grupos no WhatsApp.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Comunidade e tópico fixado são criados no banco sem duplicar em reexecução | Lucas | teste da migration | passou (teste focado) |
| Os três links são os convites oficiais já cadastrados | Marcelo | revisão SQL | passou (a migration lê `grupos_externos`) |
| Os registros antigos deixam de aparecer no diretório externo | Marcelo | banco remoto + navegador | pendente externo |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** migration de dados e teste estático de contrato.
- **Parecer do Marcelo:** `APROVADO COM RESSALVAS`: teste focado, typecheck e build passaram; falta aplicar e ler no banco remoto.
- **Veredito Final do Tiago:** `NÃO VALIDADO` até a comunidade aparecer pela leitura real.
- **Pendências ou decisão necessária do Luiz:** aplicar a migration pelo fluxo seguro do banco; não executar `supabase db push` contra o histórico remoto divergente.
