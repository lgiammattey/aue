# Cartão de Missão — Painel administrativo de acompanhamento

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o `/admin` já é protegido, mas parece uma listagem técnica e não mostra o pulso real do Auê, especialmente o acesso às páginas.
- **Comportamento esperado na tela:** administrador vê um painel visual, responsivo e fácil de ler com alcance, cadastros, publicação, conversas, Arena e páginas mais acessadas; troca o intervalo e atualiza os dados sem ver dados pessoais ou números inventados.
- **Fora de escopo (Não vira):** ferramenta externa de analytics, gravação de sessão, IP, user-agent, e-mail, UUID de visitante ou perfil de comportamento individual.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** cria telemetria agregada no Supabase, amplia uma RPC administrativa, altera porta/adaptador e uma tela canônica.
- **Fonte de verdade afetada:** `docs/technical/adr/0001-arquitetura-oficial-do-aue.md`, `src/portas/administracao.ts`, `src/plataforma/web/administracao.ts` e migrações Supabase.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Camillo/Lucas (contrato e RLS) e Kayky (painel)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado — evento agregado por rota/dia, com lista de rotas permitidas e sem identificador pessoal.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Web Mobile; banco e cliente web.
- **Maior risco de quebra ou mentira visual:** chamar estimativa de acesso de “visita real” sem captura persistente, ou vazar dados pessoais pelo painel.
- **Limite da promessa:** visualizações começam a contar depois da migração publicada; o painel não reconstrói tráfego histórico e não mede pessoas únicas.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Telemetria aceita apenas rota pública permitida e grava agregado diário | Marcelo | teste de migração e adaptador | validado em teste local |
| Resumo administrativo exige admin e não retorna identificador pessoal | Marcelo | teste de migração | validado em teste local |
| Painel mostra estados de carga, vazio e falha sem métricas falsas | Rian/Marcelo | teste de tela | validado em teste local e navegador |
| Gráficos e cartões respondem ao intervalo selecionado | Rian | teste de tela | validado em teste local |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `TelaAdministracao`, portas/adaptadores de administração e telemetria, rastreador de rotas, migração `20261022002000` e testes focados.
- **Parecer do Marcelo:** `VALIDADO LOCALMENTE` — typecheck, 57 testes focados e build passaram; a suíte total possui 28 falhas preexistentes em telas de feed/perfil/404 e mocks do fórum, fora deste cartão.
- **Veredito Final do Tiago:** `APROVADO COM RESSALVAS` — a coleta real de acessos só começa após a migração chegar ao Supabase via merge/publicação.
- **Pendências ou decisão necessária do Luiz:** merge/publicação e período de coleta para haver acesso real às páginas.
