# Cartão de Missão 0026 — Open Design em toda a experiência social

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a comunidade está repartida entre cascas e telas de fases diferentes; quem entra não vê uma experiência única nem o desenho vigente.
- **Comportamento esperado na tela:** comunidade, diretório, explorar, tópico, perfil e acesso usam a mesma casca Open Design, mantêm links vivos e exibem somente dados e ações que o servidor confirma.
- **Identidade e endereçamento:** pessoas usam `@handle`, comunidades usam `/slug` e tópicos usam `#id` em URL, busca e copy; o restante reproduz a geometria e os comportamentos do Open Design.
- **Acesso:** toda pessoa entra pelo Início, autenticada ou não. Visitante lê comunidades e tópicos, mas não possui perfil e não interage; cada tentativa de ação o leva ao acesso preservando o retorno.
- **Fora de escopo (Não vira):** trocar a máquina, as regras ou a visualização da Arena; copiar os perfis, votos, números, ranking, busca local e publicação simulados do snapshot.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** troca várias rotas e pode exigir leituras/escritas novas no Supabase, portas e adaptadores compartilhados.
- **Fonte de verdade afetada:** `DESIGN_OPEN.md`, ADR 0001, ADR 0010, ADR 0011 e portas social/fórum/perfil.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (casca e telas), Lucas (contratos e dados), Camillo (integração e performance)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado — ADR 0012; rollout em migração, confirmação, porta e telas.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma — Luiz autorizou criar backend quando faltar contrato real.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop e webapp mobile (Safari iOS / Chrome Android).
- **Maior risco de quebra ou mentira visual:** trocar uma página inteira de uma vez, perder links existentes ou preencher lacunas com dado do snapshot.
- **Limite da promessa:** o snapshot define estética e geometria; dados, permissões e ações dependem de porta/RPC. Uma migração nova só entra depois de aditiva, RLS, rollback, teste de contrato e confirmação de aplicação.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Inventário visual e de contratos por rota fechado | Rian / Camillo | Código e documento | pendente |
| Casca responsiva única sem navegação de mentira | Kayky / Marcelo | Teste e navegador desktop/mobile | pendente |
| Cada leitura e escrita consome porta real; lacuna vira RPC nova ou ausência honesta | Lucas / Marcelo | Teste de adaptador, RLS e navegador | pendente |
| Links legados continuam encontrando rota útil | Marcelo | Teste e navegador | pendente |
| `typecheck`, `lint`, `test` e `build` verdes | Marcelo | CI local | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** a definir após o plano; novas telas em `src/features/novo-aue/`.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** NÃO VALIDADO
- **Pendências ou decisão necessária do Luiz:** nenhuma
