# Cartão de Missão — novo Auê: perfil conectado

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o perfil da conta conectada ainda abre na casca antiga e quebra a entrada nova de comunidades.
- **Comportamento esperado na tela:** em `/perfil`, a pessoa vê sua ficha real do servidor, edita dados e foto pela porta existente, consulta conexões e lê somente as resenhas que o servidor devolve.
- **Fora de escopo (Não vira):** Arena, migração, contrato novo, ranking, contagem decorativa, comunidades falsas ou reformar a tela legada.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** é uma tela nova sobre contratos existentes, sem mudança de banco ou de porta.
- **Fonte de verdade afetada:** `DESIGN_OPEN.md`, ADR 0010, ADR 0011 e `src/portas/perfil.ts`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado: reaproveita `PortaDePerfil`, `PortaDeComunidade` e `PortaDeConta`, sem contrato novo.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop, Safari iOS e Chrome Android via webapp.
- **Maior risco de quebra ou mentira visual:** tratar falta/falha de perfil ou de feed como dados vazios e inventar números de comunidade.
- **Limite da promessa:** a tela prova consumo das portas em teste; perfil e conteúdo reais dependem do Supabase configurado e de uma sessão promovida.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| `/perfil` usa o módulo isolado novo | Marcelo | Código e teste | provado em teste |
| ficha, edição, foto e conexões passam pela porta real | Marcelo | Teste | provado em teste; sessão real pendente |
| feed é filtrado pelo id do perfil e não ganha dado local | Marcelo | Teste | provado em teste |
| grade desktop e barra mobile respeitam Open Design | Rian | Navegador | provado localmente em desktop e 390px; aparelho real pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `src/features/novo-aue/`, rota mínima de `/perfil` e testes próprios.
- **Parecer do Marcelo:** `AJUSTA` — a suíte global ainda tem quatro falhas fora deste módulo.
- **Veredito Final do Tiago:** NÃO VALIDADO
- **Pendências ou decisão necessária do Luiz:** validação numa sessão real e nos navegadores físicos; corrigir a suíte global antes de merge.
