# Cartão de Missão 0029 — a Tropa entra em campo

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** “Bonde” descreve hoje a camada social do Auê, mas o nome não traduz tão bem o vínculo entre quem se segue, troca ideia e se desafia. Luiz decidiu que essa camada se chama **Tropa**.
- **Comportamento esperado na tela:** a pessoa encontra a **Tropa** no perfil e no feed de pessoas seguidas. Rodas continuam sendo os assuntos; Arena continua sendo onde o arroto recebe nota e o X1 acontece. A troca não cria contagem, reputação ou relação fictícia.
- **Fora de escopo (Não vira):** nova regra de seguidores, migração de seguidores, Moral, ranking, conta nova, remoção de links antigos, renomear slugs/identificadores sem plano explícito, ou reescrever documentos arquivados.
- **Pista (Lane):** Full flow comum, com gate de Camillo aprovado com delimitação para o nome persistido da praça central.
- **Por que esta pista:** o vocabulário percorre telas canônicas, protótipos e documentação viva; uma ocorrência pode ser cópia, referência histórica ou dado que já mora no banco.
- **Fonte de verdade afetada:** `docs/jogo/VISAO.md`, `docs/jogo/JORNADA.md`, `docs/jogo/LOOP.md`, `docs/escopo/ESCOPO_ATUAL.md`, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md` e protótipos canônicos.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky na cópia/tela; Camillo define a fronteira de dados e compatibilidade.
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** **APROVADO COM DELIMITAÇÃO.** Tropa substitui a linguagem de pessoas, perfil e feed seguido. `bonde-geral`, URLs, aliases, RPCs, migrações, seeds e callbacks como `onPostarNoBonde` permanecem contratos legados; não são renomeados nesta missão.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma. O nome oficial da camada social é Tropa.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop, webapp mobile e documentação viva.
- **Estados obrigatórios da Arena:** nenhum; estados, áudio, nota e X1 não mudam.
- **Maior risco de quebra ou mentira visual:** renomear um slug ou dado persistido por acidente, ou misturar Tropa (pessoas) com Rodas (assuntos).
- **Limite da promessa:** o nome não torna alguém seguido, não cria um perfil, não muda a publicação única por roda e não adiciona Moral.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Perfil e feed de pessoas usam Tropa; Rodas e Arena mantêm seus papéis | Rian / Marcelo | código + navegador desktop/mobile | código concluído; navegador local bloqueado sem `VITE_SUPABASE_URL` |
| Nenhum slug, URL ou contrato de dados é alterado sem decisão registrada | Camillo / Marcelo | código + migrações | conferido: `bonde-geral`, aliases, RPCs, migrações, seeds e callbacks preservados |
| Protótipo e documentação viva usam o mesmo vocabulário | Rian | revisão de documentos | concluído; nomes de arquivo legados foram preservados para não quebrar links |
| typecheck, lint, test e build passam | Marcelo | CI local | concluído: 2.123 testes passaram; lint com avisos preexistentes |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** telas canônicas em `src/features/novo-aue/`, fala da Arena, páginas públicas/legais, protótipos e fontes vivas de produto/design.
- **Parecer do Marcelo:** sem quebra detectada em `typecheck`, lint, testes e build. A prova visual em navegador fica pendente pela configuração local ausente.
- **Veredito Final do Tiago:** APROVADO COM RESSALVAS — pronto para revisão; não declara validação visual enquanto faltar a configuração local.
- **Pendências ou decisão necessária do Luiz:** nenhuma.
