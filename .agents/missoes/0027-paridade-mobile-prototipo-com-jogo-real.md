# Cartão de Missão 0027 — Paridade do Webapp Mobile com o Jogo Real

> Aberto pelo Tiago a pedido direto do Luiz em 20/10/2026. Este cartão substitui a leitura literal do protótipo externo: ele é referência de experiência visual e navegação, nunca contrato de dados, áudio ou sucesso.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:**
  No telefone, a pessoa precisa atravessar o Auê inteiro — descobrir uma resenha, entrar numa comunidade, ouvir, responder, arrotar, receber a nota, publicar conscientemente e chamar pro X1 — sem cair numa casca desktop espremida nem numa prévia que finge publicar ou pontuar. A Missão 0026 já entregou a barra inferior e os alvos de toque; falta comprovar e ajustar a jornada de ponta a ponta nas superfícies canônicas.

- **Comportamento esperado na tela:**
  1. O webapp mantém topo útil e barra inferior persistente de cinco destinos: Início, Comunidades, Arrotar/Arena, X1 e Perfil, respeitando teclado e `safe-area`.
  2. Início, comunidade, tópico e perfil usam os componentes OpenDesign canônicos e dados vindos das portas existentes: post, áudio, reações, respostas, seguir/salvar e falha aparecem como são de verdade.
  3. O compositor cria tópico ou resposta no destino escolhido pelo contrato atual; mídia só oferece caminhos que já existem e devolve erro honesto quando o serviço recusar.
  4. A Arena conserva a máquina de dez estados. Microfone só é pedido depois de tocar em arrotar; captura, validação YAMNet, origem, resultado, publicação e desafio seguem o motor real, sem nota, cronômetro ou vitória inventados.
  5. X1 abre apenas por código real, reproduz o áudio do oponente quando disponível e mostra expiração, falhas, placar e revanche conforme o backend; nada de link, adversário ou placar de exemplo.
  6. Em 375, 390 e 430 px não há corte horizontal, elemento atrás da barra, alvo menor que 44 px ou modal impossível de fechar. Desktop continua com três colunas.

- **Fora de escopo (Não vira):**
  - Criar contrato paralelo, migration, RLS ou RPC novo sem diagnóstico e plano aprovados por Camillo/Lucas.
  - Copiar arrays, contagens, perfis, notas (86/89), áudios demonstrativos, publicação local, follow local, links de X1 ou toasts de sucesso do HTML externo.
  - Chat privado, notificações em tempo real, algoritmo de recomendação, loja nativa, upload genérico de vídeo ou qualquer estado novo da Arena.
  - Declarar os tópicos como produção publicada sem prova própria; a direção aceita continua Comunidade → tópico → conversa.

- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** A fidelidade mobiliza feed, fórum, autenticação, reprodução de áudio, Arena/YAMNet, desafios, responsividade e PWA. Ela atravessa contratos compartilhados e pode expor lacunas de backend; Camillo e Lucas precisam fechar o plano antes de qualquer substituição estrutural.
- **Fonte de verdade afetada:** `docs/escopo/ESCOPO_ATUAL.md` §§2.11–2.17; `docs/jogo/JORNADA.md`; `docs/jogo/ARENA.md`; `docs/jogo/REGRAS.md`; `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`; `docs/design/design-system/system/DESIGN.md`; ADR 0001 e ADR 0010. O arquivo externo `/Users/giammattey/Downloads/aue-mobile-prototipo.html` é referência visual complementar, subordinada a estas fontes e ao comportamento real.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago.
- **Orquestração e Mesa Limpa:** Iury — uma fatia fechada por vez, preservando WIP e trabalhando em branch própria, nunca `main`.
- **Responsáveis pela implementação:** Kayky (casca webapp, superfícies OpenDesign e regressão desktop); Lucas (captura, julgamento e contratos de áudio/X1); Camillo (portas, ciclo de vida de browser, performance e gate); somente se a auditoria provar necessidade, não por antecipação.
- **Especificação e Auditoria Visual:** Rian — comparação com protótipos canônicos e com o externo somente no que não os contradiz.
- **Gate Arquitetural (Camillo / Lucas):** **aprovado** para o plano de seis fatias, limitado às portas, modelos, RPCs e ciclo de vida de navegador já existentes. A implementação pode começar sem migration, RLS ou contrato paralelo. Qualquer necessidade nova volta ao Gate antes de abrir código.
- **Auditoria e Prova Real:** Marcelo — independente; sem a prova dele, entrega fica `NÃO VALIDADO`.
- **Decisão pendente do Luiz:** nenhuma para iniciar a auditoria e as fatias abaixo. Volta ao Luiz se a prova apontar novo produto/privacidade: publicação de áudio sem resultado, vídeo/upload fora dos contratos, novo tipo de comunidade, mudança de retenção, expiração ou regra de duelo.

## 3. Fatias incrementais e saídas verificáveis

1. **Mapa de aderência, sem promessa:** tela/ação do HTML externo → rota/componente/porta atual → estado real ou lacuna → reutilizar/adaptar/não implementar. Inventariar explicitamente cada simulação: player demonstrativo, notas fixas, publicação/follow/reação/salvar locais, comentários em memória, comunidades em array, desafio e compartilhamento de mentira.
2. **Casca e leitura mobile:** consolidar Início, diretório, comunidade, tópico, perfil e player nos canônicos ativos; tratar loading, vazio, offline/erro e entrada. Prova em 375/390/430 e regressão desktop.
3. **Participação honesta:** compositor, resposta, reações, salvar, seguir, denúncia e mídia usam portas e retornam o resultado do servidor. O que não tiver contrato fica indisponível ou mostra erro explicativo — nunca toast de sucesso local.
4. **Arena e depois da nota:** integrar o visual mobile à máquina existente sem criar estado; testar permissão, stream, cancelamento por troca de aba, `NO_SOUND`, não-arroto, erro de análise, resultado, consentimento de publicação e compartilhar.
5. **X1 e revanche:** link/código real, expiração real, áudio do oponente, placar persistido, empate e revanche; os estados sem backend comprovado ficam honestamente indisponíveis ou documentados como lacuna.
6. **Fechamento:** comparação visual com as referências, automação de rotas e jornadas reais, navegador mobile quando disponível, desktop sem regressão, e todos os gates de qualidade verdes.

### Lacunas registradas — não simuladas

- **Busca global:** sem contrato de busca global comprovado, não vira tela com resultados de exemplo.
- **Atividade / notificações:** não há fluxo em tempo real ou caixa de atividade no escopo; não desenhar badge, contador ou lista falsa.
- **Salvos:** só entra se a porta e a persistência existentes sustentarem leitura e escrita reais; caso contrário, a ação fica indisponível com explicação honesta, sem coleção local.
- **Preferências:** tema, notificações e demais ajustes só aparecem quando já tiverem contrato e persistência reais; não guardar uma configuração como se tivesse sido salva na conta.
- **Publicação no perfil alheio:** não pertence ao contrato atual. O compositor publica tópico/resposta no destino permitido e o resultado da Arena só publica com consentimento explícito; não criar mural alheio local.

## 4. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Safari iOS e Chrome Android como alvos; browser desktop no layout de três colunas preservado.
- **Estados obrigatórios da Arena:** `IDLE`, `RECORDING`, `ORIGIN`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD`, `REMATCH`, `ERROR`; casos de resiliência incluem microfone negado, sem som, não-arroto, análise/rede e link expirado.
- **Maior risco de quebra ou mentira visual:** transportar a implementação local do protótipo para React e vender como dados reais; ou corrigir mobile espremendo/quebrando desktop e a máquina contínua da Arena.
- **Limite da promessa:** o modelo mede um sinal acústico e a origem é declarada, não detectada; o score oficial vem do servidor. O app não sabe se áudio externo, YouTube/TikTok, rede, convite ou navegador vai responder até a chamada real terminar.

## 5. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Mapa completo do protótipo: tela/ação → canônico atual → diferença → decisão, com todas as simulações marcadas | Iury / Camillo / Lucas | código e contratos | pendente |
| Navegação inferior, safe areas, modais e teclado funcionam em 375, 390 e 430 px sem rolagem lateral e com alvos >= 44 px | Kayky / Rian / Marcelo | browser automatizado e Safari iOS / Chrome Android quando disponíveis | pendente |
| Feed, comunidade, tópico, perfil e player mostram apenas conteúdo e estados recebidos pelas portas; loading/vazio/erro não fingem conteúdo | Kayky / Marcelo | teste + browser com serviços configurados | pendente |
| Participar exige entrada quando aplicável; reação, resposta, seguir, salvar e denúncia persistem ou exibem falha real | Lucas / Marcelo | teste de integração + browser | pendente |
| Composer respeita o contrato de tópico/resposta e consentimento; mídia sem caminho real não se apresenta como publicada | Kayky / Lucas / Marcelo | teste + browser | pendente |
| Arena pede mic após gesto; captura e YAMNet percorrem sucesso e `MIC_ERROR`/`NO_SOUND`/não-arroto/erro sem stream ou timer vazado | Lucas / Camillo / Marcelo | teste + Chrome/Safari com microfone real | pendente |
| Resultado só publica após consentimento explícito e score oficial; sem servidor não há nota/publicação inventada | Lucas / Marcelo | integração com Supabase e browser | pendente |
| X1 usa código, prazo, áudio, placar e revanche reais; inexistente/expirado/rede falha dizem a verdade | Lucas / Marcelo | integração + browser | pendente |
| Desktop mantém três colunas e rotas canônicas sem regressão | Kayky / Marcelo | browser desktop + testes | pendente |
| `typecheck`, `lint`, testes e build passam; Rian confirma fidelidade visual, Marcelo entrega parecer independente | Marcelo / Rian | terminal + comparação visual | pendente |

> Compilar não prova UI, microfone, browser, backend, dados ou publicação. Cada nível de evidência é cobrado separadamente.

## 6. Encerramento e Parecer Final

- **Arquivos/módulos previstos (a confirmar pela auditoria):** superfícies canônicas em `src/features/novo-aue/`, `src/arena/`, portas correspondentes em `src/portas/` e adaptações web em `src/plataforma/`; sem mexer nas cascas legadas indicadas pelo Mapa de Páginas.
- **Parecer do Marcelo:** pendente.
- **Autorização de início do Tiago:** **APROVADO** para iniciar a implementação das seis fatias, estritamente nos contratos existentes e nas lacunas registradas acima. Esta autorização não é aceite final.
- **Veredito Final do Tiago:** `NÃO VALIDADO` até as provas da matriz e os pareceres independentes chegarem.
- **Pendências ou decisão necessária do Luiz:** só as lacunas de produto explicitadas neste cartão; busca global, atividade/notificações, salvos, preferências e publicação no perfil alheio exigem contrato comprovado ou nova decisão antes de virar promessa.
