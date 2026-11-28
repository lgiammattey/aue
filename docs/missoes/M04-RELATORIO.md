# M04 | Confiabilidade

## Cartão de Missão

A pessoa que grava, abre um X1 ou publica mídia precisa conseguir completar a ação, recuperar uma falha e entender o que foi salvo. A M04 encerra a recuperação técnica com as jornadas existentes, dentro da autorização do Product Owner de 28/11/2026. M01 a M03 entram na `develop` com seus commits originais.

A ordem é provar o ponto de partida, corrigir falhas reproduzidas em áudio, Arena e Mural, e medir a home mobile em condições iguais. O recorte inclui sessão, mídia, compartilhamento, PWA, os links legados e os diagnósticos já disponíveis. Preservar os dois fluxos de Arena, o desenho das telas, os motores de gravação e laudo, o histórico e as proteções da M02. Publicação, migração hospedada e M05 ficam para autorização própria.

- **Produto:** Marcelo por procedimento alternativo, após o runtime recusar Marcelo e Renan como perfis nativos.
- **Engenharia:** Camillo no perfil nativo. Os ajustes ficam na camada que já detém o recurso ou a jornada.
- **Experiência:** Felipe por papel, só no ciclo de vida da mídia do Mural, conforme o mapa de telas.
- **Qualidade:** Renan em instância distinta, com papel explícito e revisão cruzada da mudança.
- **Aceite do Product Owner:** pendente após entrega da PR em rascunho.

A aceitação técnica exige integração e CI, testes da jornada crítica nos ambientes disponíveis, medição mobile antes e depois, revisão cruzada e pendências de aparelhos e serviços hospedados registradas para a M06.

## Integração

A `main` remota em `ba161a10c50ffa8b7d7c060043e435a8deb59ea1` antecede diretamente os três commits aprovados. A `develop` saiu de `0c314e2` e recebeu apenas `dcd2df6`, que inclui a branch na validação de push e como destino de PR. A [Validação da base integrada](https://github.com/lgiammattey/aue/actions/runs/46105246011) passou em todos os passos, incluindo MP4, WebM e YAMNet em Chromium.

| PR encerrada manualmente | Commit incorporado por ancestralidade |
|---|---|
| [#385 Foundation](https://github.com/lgiammattey/aue/pull/385#issuecomment-7233600073) | `921a3cc6fddd8990c7f30432d645232d1c302cee` |
| [#386 Integrity](https://github.com/lgiammattey/aue/pull/386#issuecomment-7233600052) | `7f4bdd1c93b20a70fa79cfc1eaf4dc0146ba1c9a` |
| [#387 Cleanup](https://github.com/lgiammattey/aue/pull/387#issuecomment-7233600028) | `0c314e2e6c2d8e695c1c5c50da0518eac0fed819` |

O GitHub registra as três como fechadas, com `mergeCommit: null`, e as branches de origem continuam no remoto. O push disparou só Validação. Na checagem prévia, o Firebase tinha gatilhos de publicação na `main`, agendamento e despacho manual. A consulta da Vercel por repositório não retornou vínculo, e o Supabase listou apenas a branch padrão `main`. Os previews do Supabase nas três PRs de origem estavam com `SKIPPED`.

## Correções e preservação

- **Arena clássica.** Depois de interromper uma revanche e voltar ao início, uma gravação solo carregava o código do duelo anterior. Abandonar a tentativa encerra esse contexto. Quando o gravador falha ao abrir após liberar o microfone, a Arena solta a captura e usa a saída de erro que já existe para revanche, resposta e nova gravação. Os dois cenários falharam na base e passaram com a correção.
- **Relógio da revanche.** O teste controla a contagem e a revelação da nota, sincroniza a montagem dos efeitos e restaura o relógio mesmo em caso de falha. As asserções da contagem, do placar e dos códigos do X1 continuam na suíte.
- **Mural.** Anexos otimistas usam a porta de URL local. A prévia permanece disponível enquanto houver um item visível que a use. Quando a mídia é substituída, removida ou a tela é desmontada, a referência local é liberada. A publicação autorizada no servidor conserva sua confirmação mesmo se a tela fechar.
- **Observabilidade.** A Arena v2 registra falha de gravação no GA4 existente, sujeito às restrições de rota e à preferência de exclusão. O adaptador do X1 distingue no console local falta de sessão, upload sem confirmação, erro de persistência e falha para obter os bytes do áudio. O diagnóstico só contém etapa e motivo fixos, sem ID, token, caminho, texto, Blob ou valor de laudo. Requisições e falhas de carregamento continuam disponíveis nos diagnósticos do navegador.
- **Contratos.** O diff não altera motores de captura, detecção e pontuação, regras competitivas, migrations, dependências, hospedagem ou service worker. O ajuste do X1 reaproveita a validação dos bytes nos dois caminhos de áudio e mantém os retornos existentes. O layout e as rotas permanecem conforme o mapa.

## Provas

| Verificação | Resultado |
|---|---|
| Typecheck, lint e build | Passaram com Node 24.19.0. Lint teve os 23 avisos preexistentes. O build local sem credenciais pulou as páginas de grupos. |
| Vitest | 2.583 passaram, 9 casos de fórum ficaram no opt-in. A primeira bateria foi interrompida pelo repouso do Mac. A execução completa seguinte passou sem retry por teste. |
| Motor e worker | 10/10 cenários Node, incluindo MP4, WebM e YAMNet no Chromium. A primeira execução sofreu a mesma interrupção por repouso. |
| Chromium | 41 cenários verdes no código final com configuração sintética. Os 3 testes da Arena v2 passaram na rodada independente com a flag de build, mas não chegaram à gravação PCM na conferência final a 320, 390 e 1440 px. A mesma falha apareceu na base. |
| WebKit | 41/41 na rodada independente, com configuração sintética. Na conferência final passaram 39/41. Nos outros dois casos, em 390 × 844 e 1440 × 900, a prévia do compositor não avançou na reprodução da mídia simulada. A base reproduziu o mesmo resultado. |
| PostgreSQL descartável | 123/123 migrations aplicadas com as fixtures e o prelude atuais, via socket privado, sem TCP e sem `pg_net`. A primeira configuração incluía em duplicidade um bucket de teste e foi substituída pelas fixtures atuais. |
| PWA | Chromium controlou a página, recarregou a casca offline e ativou o worker do segundo build. WebKit controlou a home e manteve 390 px de largura. Os hosts `aue.web.app`, `aue.firebaseapp.com` e `aue.vercel.app` devolveram 301 de `/en` para o domínio oficial e 200 com `no-cache` em `/sw.js`. |

Os E2E usaram uma cópia isolada e placeholders locais para montar o aplicativo. O runner versionado tira as variáveis do Supabase por padrão. A suíte que espera a tela de Arena em breve e a suíte de gravação da v2 precisam de flags diferentes. A cobertura inclui casca pública, responsividade, microfone do compositor, perfil, mural e duelo com fixtures, contrato visual, Analytics interceptado e migração do worker legado. Testes unitários complementam sessão, busca, reações, avatar, publicação com anexos, estados de erro e recuperação de desafios com adaptadores simulados. As cinco falhas de mídia variaram entre rodadas e se repetiram nas duas versões sob a mesma configuração. A causa ainda não está isolada. A prova de compatibilidade desses cenários fica inconclusiva, com os dois sintomas no backlog da M06.

Renan fez a revisão cruzada do diff e deu parecer `SEM ACHADOS MATERIAIS`. Camillo confirmou a preservação dos contratos e revisou a liberação das URLs. O teste do Mural passou com StrictMode após separar a criação do registro em cada montagem da sua liberação.

## Desempenho mobile

Home `/` em build local, Chrome 158 headless, viewport 390 × 844, CPU a 4× de desaceleração, latência de 150 ms e descarga de 1,6 Mbps. Três contextos novos em cada versão, com cache frio, service worker bloqueado para esta medição e API sintética. A atualização e o cache do worker foram exercitados separadamente. Comparação entre a `develop` em `dcd2df6` e o código final da M04 em `f7a2af8`.

| Mediana | Develop | M04 |
|---|---:|---:|
| FCP | 2.572 ms | 2.544 ms |
| LCP | 2.892 ms | 2.860 ms |
| JS inicial, `encodedBodySize` de scripts | 235.576 B | 235.716 B |

Amostras de LCP em ms: 2.892, 2.896 e 2.852 na base. 2.860, 2.868 e 2.852 na M04. Elas se sobrepõem. O comparativo não demonstra ganho de carregamento nem regressão material. YAMNet e os pesos ficaram fora das seis cargas iniciais e a home mediu 390/390 px sem overflow. Os 9,0 s de LCP da [M00](../technical/auditorias/M00-BASELINE.md) vieram de uma amostra Lighthouse histórica com outro método. A M04 preservou as imagens, os chunks sob demanda, o SEO e o cache existente.

## Pendências antes da M06

Homologar em iPhone e Android reais e com o build identificado em serviços hospedados autorizados. Conferir microfone, codecs e reprodução, sessão e recuperação, consentimento para publicar, avatar, busca, reações, notificações e compartilhamento. Repetir o percurso completo do X1 e do áudio publicado com Auth, Storage, RLS, Edge e worker. Exercitar a atualização de uma PWA instalada em cada plataforma e confirmar o comportamento do redirecionamento a partir dos clientes legados. O laboratório desta missão usa mídia de teste e banco descartável.

## Próxima missão

Marcelo recomenda levar à M05 a revisão de UX da Arena, Mural e Perfil após o aceite do Product Owner, usando a base integrada e um desenho aprovado. A homologação de hardware, serviços e publicação fica no gate da M06.


## Parecer de Marcelo

**APROVADO COM RESSALVAS** no escopo local e automatizado. Aceite do Product Owner pendente. A [PR #388](https://github.com/lgiammattey/aue/pull/388) está em rascunho na `develop`. A [validação do primeiro commit de fechamento](https://github.com/lgiammattey/aue/actions/runs/46114745272) passou em todos os passos. Os checks da PR registram a execução da revisão atual.
