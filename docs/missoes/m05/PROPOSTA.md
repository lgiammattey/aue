# M05 | Experience

[Segunda rodada do protótipo e comparativo V1 → V2](REVISAO-V2.md). O registro abaixo descreve a primeira proposta.

**Definição funcional e visual para aprovação de Luiz.** A autorização de 28/11/2026 cobre a integração da M04 e esta etapa de desenho. A implementação aguarda aceite.

[Protótipo navegável](prototipo/index.html) · [Prévia mobile a 390 px](prototipo/mobile.html) · [Backlog estratégico](https://chatgpt.com/space/page_78a57da82f108191baa7cafabdbac7dc)

Abra em **Entrar na Arena** para jogar solo ou em **Ver um X1** para experimentar como convidado. **PT / EN** troca a Home. O gravador, a conta, o convite e as publicações são demonstrativos. As duas amostras de áudio são sintéticas e locais. Os controles sob o gravador e o convite ajudam a inspecionar falhas e estados que normalmente dependem de tempo, permissão ou rede.

## M04 integrada

A [PR #388](https://github.com/lgiammattey/aue/pull/388) foi mesclada na `develop` em 28/11/2026. O merge `dd0e102cb35892eb35f3db00689fe8e3b39e6f67` preserva como segundo pai o SHA aceito `eb2f931f76f69474c82d25ba5bdbb81b92f39dd8`. A árvore do merge equivale à árvore aprovada e os cinco commits da M04 continuam no histórico. A [validação da PR](https://github.com/lgiammattey/aue/actions/runs/46115059295) e a [validação da develop integrada](https://github.com/lgiammattey/aue/actions/runs/46138295564) passaram. A M05 parte desse merge em worktree isolada.

O workflow de publicação Firebase é acionado por push na `main`, agendamento na branch padrão ou despacho manual. O redirect do legado usa despacho manual. A contingência de emergência está restrita à branch própria e a um marcador explícito. A validação de `develop` tem permissão de leitura. A consulta da Vercel pelo repositório não retornou projeto vinculado na conta consultada. O GitHub também retornou zero deployments para o SHA integrado. A listagem do Supabase retornou apenas a branch padrão `main`, e o check de preview da PR ficou `SKIPPED`. No GitHub, o push do merge disparou apenas **Validação**. A `main` remota ficou em `ba161a1` e o domínio oficial serviu o mesmo bundle principal antes e depois (`assets/main-BxOCUpHZ.js`).

## Cartão de Missão

Quem chega precisa achar o gravador no primeiro minuto. Quem volta precisa encontrar o próprio X1, ver se alguém respondeu e ter uma razão para jogar de novo. Quem só quer ouvir e participar da resenha precisa ter um lugar no produto, mesmo com a ficha de competição vazia.

Marcelo conduz o recorte de produto e as decisões para Luiz. Felipe propõe a interface desktop e mobile. Camillo responde pela viabilidade e pela preservação dos contratos existentes. Renan faz a revisão independente e define as provas de aceite. Camillo atuou no perfil nativo. Marcelo, Felipe e Renan atuaram por papel, conforme o procedimento alternativo já registrado nas missões anteriores. A etapa entrega desenho e critérios. Se o PO aprovar uma capacidade que muda o contrato de disputa, privacidade, áudio ou dados, ela passa pelo Gate Arquitetural antes de qualquer implementação.

## O que o jogador encontra

| Superfície | Proposta para o primeiro corte | Próximo passo condicionado |
|---|---|---|
| **Home pública** | Foto de microfone em palco, promessa direta, entrada principal **Entrar na Arena** e saída **Ver um X1**. Uma explicação curta do laudo e do X1, caminhos para guias e Mural, troca PT/EN. | Testar a hierarquia dos CTAs com comportamento observado. |
| **Arena** | Lobby com gravação solo em primeiro plano, acesso ao X1 por link e lista privada de **Meus X1**. Quando houver dados elegíveis, também dá acesso aos áudios públicos avaliados. | Recorde pessoal rotulado como experimental, histórico além dos X1 existentes e desafio editorial recorrente. Batalhas abertas e progressão oficial só com regra e volume de participação aprovados. |
| **Gravador** | Uma experiência de captura reutilizável em solo e X1, com revisão, escuta e descarte. A mesma linguagem se aplica ao compositor, respeitando o contrato de mídia de cada fluxo. | Reaproveitar por contrato e ciclo de vida. Uma unificação física dos gravadores exige prova de paridade de codecs, duração, permissão e compatibilidade. |
| **Mural** | Resenha em torno do jogo, com posts livres e mídia existentes. **Seguindo** reaproveita o feed atual. Jogador e espectador podem abrir o perfil, ouvir, reagir, comentar e responder. | Uma publicação de batalha precisa de autorização de ambos quando incluir as duas vozes. Um destaque de recorde precisa de fonte, consentimento e rótulo. Esses formatos ficam em estudo. |
| **Perfil** | Ficha com foto, nome, bio, seguidores, seguindo, posts e melhor nota **publicada**, quando houver. No perfil próprio, entrada para os X1 privados. Um espectador mantém sua identidade e conexões sem preencher uma carreira fictícia. | Patente, posição competitiva, vitórias, derrotas, aproveitamento, conquistas e acervo público de competições dependem de regra e dados oficiais. |

A página inicial hoje pode abrir a Arena diretamente, conforme as flags. A proposta dá à Home uma narrativa própria e mantém a gravação visível no primeiro bloco. Ao separar Home e Arena, o caminho pode ganhar um toque. A avaliação deve comparar a entrada atual com a proposta, contando quem inicia uma tentativa, além de quem toca no botão da Home. Em desktop, a Arena dá espaço ao palco e usa uma coluna lateral para contexto de jogo. Em mobile, a entrada do gravador fica antes das listas. A navegação de jogo fixa **Arena**, **Mural** e **Perfil** na barra inferior. O X1 tem lugar no lobby e no resultado, inclusive quando o convite chega por deep link.

## Os percursos

1. **Chegar e gravar.** Home PT ou EN → **Entrar na Arena** → Arena pronta para capturar → pessoa aciona o gravador → permissão → calibrar → gravar → finalizar → ouvir → **Mandar pro juiz** → resultado experimental ou retorno explícito sem laudo. A pessoa pode tentar de novo. Ao sair ou cancelar, o microfone é liberado e o contexto de resposta ou revanche é encerrado. Jogar solo continua acessível a visitante, respeitado o aviso de maioridade vigente.
2. **Chamar no X1.** Do resultado ou lobby → iniciar X1 → autenticar quando necessário → gravar ou usar uma tentativa elegível → confirmar criação → receber link privado e prazo. Em **Meus X1**, acompanhar convite, resposta, expiração ou revogação e usar as ações já autorizadas em cada estado. Se falhar antes de confirmar a criação, o estado deixa a etapa clara e oferece recuperação.
3. **Responder no X1.** Deep link → convite ou indisponibilidade → autenticação quando exigida → ouvir e responder com o gravador → confirmação → comparação experimental dos áudios e medições disponíveis. Sem resposta até o prazo, o convite expira. A comparação não produz vencedor. Reemitir ou lançar revanche cria uma nova disputa segundo o contrato vigente.
4. **Publicar e interagir.** Do resultado, **Publicar no Mural** abre uma ação separada com prévia, audiência e consentimento. O X1 privado permanece privado. No Mural, navegar por **Tudo** e **Seguindo**, abrir o post, ouvir ou ver a mídia, reagir ou abrir respostas e réplicas. Ações que exigem sessão pedem autenticação mantendo o contexto.
5. **Voltar ao perfil.** Do Mural ou navegação → ficha própria ou pública → publicações e conexões. A ficha distingue ausência de dados, erro e carregamento. A melhor nota publicada abre a respectiva gravação quando ela estiver disponível. Histórico privado e estatísticas públicas têm permissões próprias.

## Como decidir um vencedor

O X1 atual oferece comparação experimental e convite privado com prazo de sete dias. A M02 retirou consequências oficiais de métricas enviadas pelo navegador. O primeiro corte proposto mantém essa regra e reaproveita o X1. O top de áudios publicados com consentimento usa seu pipeline próprio e continua identificado como seleção de publicações. Um laudo pessoal, mesmo quando salvo, não vira posição competitiva.

| | Voto da comunidade | Modalidade com áudio verificado |
|---|---|---|
| **O que um resultado significa** | Vitória pela preferência dos espectadores elegíveis naquela disputa. | Vitória em uma medida definida e calculada de modo reproduzível pelo servidor. |
| **Piloto para discussão** | Abrir votação quando os dois áudios puderem ser publicados com consentimento. Janela proposta de 24 h e quórum inicial de 5 votos válidos. Maioria simples, com empate declarado. Sem quórum, encerrar sem resultado. | Começar por duração de sinal conforme regra publicada e tolerância a definir com gravações reais. Usar dois áudios elegíveis, medir sob a mesma versão do motor e declarar empate dentro da tolerância. Análise inválida ou incompleta encerra sem resultado. |
| **Prazo e desistência** | Convite continua com o prazo vigente. Expiração ou desistência antes da resposta não gera vitória por ausência. Em disputa já aberta, perda de consentimento ou remoção de áudio encerra votação com status visível e sem efeito competitivo. | Mesmo prazo de convite. Captura ausente, removida ou incapaz de ser verificada não vira derrota. Participante vê o motivo que pode ser exibido com segurança. |
| **Integridade** | Uma conta elegível, um voto por batalha, autovoto e voto dos dois competidores bloqueados no servidor. Fechamento atômico, limites e sinais de abuso, revisão para fraude ou conluio e registro de regra aplicada. Sem total parcial no piloto para reduzir efeito manada. | Autoria, sessão, objeto e versão vinculados antes de medir. Preservar restrições da M02 e trilha de revisão. Gravação elegível, repetição, reprodução de áudio gravado, ajustes de ganho e diferenças de dispositivos precisam de política própria avaliada. |
| **Papel do espectador** | Ouvir antes de escolher, votar se elegível e voltar para ver a apuração após o prazo. | Ouvir os dois áudios públicos, ver regra e medição, reagir e comentar. |
| **Dependência de produto** | Precisa de público suficiente por partida, moderação e solução razoável para voto coordenado. | Precisa de prova de que a medida é comparável em condições reais. Verificar o áudio analisado não comprova a origem do som. |

Recomendação de Marcelo para discussão. Primeiro, provar que quem recebe um X1 responde e volta para ouvir o resultado. Se Luiz quiser testar uma modalidade oficial depois, escolher **uma** das colunas para um piloto isolado, sem ranking acumulado no início. Quórum, prazo de votação, elegibilidade, tolerância e moderação são propostas para aprovação, não regras em vigor.

## Direção visual de Felipe

Grafite e carvão dão a base, osso garante leitura e o laranja queimado destaca a ação de gravar, responder ou entrar. O cobre é uma proposta. Na Home publicada, o destaque do botão de gravar já é laranja saturado. O Design System documenta verde elétrico. A proposta parte do laranja observado e traz um tom menos saturado para a revisão. **Anton** fica no wordmark, nas chamadas grandes e em números com significado. **Archivo** permanece na interface, no texto de apoio e nas medidas. A imagem fotográfica é reservada à Home. Arena, Mural e Perfil usam superfícies chapadas e filetes. Fichas de disputa e posts repetíveis podem ter contorno funcional.

| Uso no protótipo | Referência proposta |
|---|---|
| Fundo e superfície | Grafite `#111212`, carvão `#1a1b1b` e superfície de controle `#202121` |
| Leitura e apoio | Osso `#f2efe9` e cinza `#a5a39e` |
| Ação e foco | Cobre `#ec6b3a`, com texto grafite no botão. Estado de foco e destaque secundário em `#ff9a63` |
| Erro e estado | Vermelho `#fb514c` com texto que diz o que falhou e como continuar |
| Tipografia | Anton nos títulos, marca e números do jogo. Archivo em navegação, formulário e texto corrido |

O par grafite/cobre tem contraste calculado de 6,01:1. Osso/cobre fica em 2,72:1, por isso o botão cobre usa texto escuro. Essa medição cobre os pares sólidos citados. Foto, foco, estados de interação e tema claro exigem conferência própria no produto.

O palco da Arena precisa ser reconhecível pelo gravador, pelo estado da captura e pela saída para o X1. O Mural começa pela resenha das partidas com mídia em destaque e reúne comentário e reação em torno de cada publicação. O Perfil agrupa identidade, desempenho disponível e atividade. A proposta usa a mecânica do jogo para diferenciar as telas, preservando a facilidade de navegar com uma mão e de entender estados sem depender de cor.

O tema escuro está no protótipo como direção principal. A implementação precisa combinar a cor aprovada com contraste e tema claro nas superfícies que já o oferecem. O movimento acompanha estado de gravação, processamento e mudança de foco, respeitando movimento reduzido. A [imagem demonstrativa da Home](prototipo/hero-arena.webp) foi gerada com a ferramenta integrada ImageGen e exportada com 50 KiB.

<details>
<summary>Pedido usado para gerar a foto</summary>

Photorealistic editorial sports campaign photograph only, for the local design prototype of Auê, an adult Brazilian competitive burping web game. Very wide landscape hero composition, with the entire left half naturally almost black as negative space for white typography that will be placed externally, visual focus on the right at roughly 74% x. An unbranded worn matte-black broadcast dynamic microphone, tight shot in profile aimed toward the right, recognizable perforated metal grille, short mic stand, on the right in a small underground competition sound stage. Behind it, out-of-focus warm amber spotlights and subtle dark concrete, suggestion of a local live event venue, crisp tactile sports photography, graphite black with burnt-orange and warm-neutral light, credible and premium, natural optical falloff, avoid glossy CGI and fake lens flares. Have the microphone and airy dark background remain identifiable when cropped toward the right on mobile. Absolutely no person, no mouth, no assault or weapons imagery, no logos, no signage, no lettering, no gradients drawn on top, no UI, no extra equipment crowding the composition.

</details>

## Matriz de reaproveitamento de Camillo

A coluna **Existe** descreve a base integrada. A disponibilidade no domínio oficial depende de flags, autenticação, permissões e serviços hospedados.

| Funcionalidade | Existe | Reaproveitar | Adaptar | Criar | Complexidade |
|---|---|---|---|---|---|
| Home PT/EN | Entradas públicas, página `/en`, metadados/sitemap, PWA, conteúdo indexável e CTA para Arena | Entradas HTML, traduções e assets úteis | Hierarquia editorial, navegação e CTA; medir imagem/LCP | Capa e conteúdo aprovados | Média |
| Lobby e gravação solo | Arena V2, entradas de captura e motor de laudo com fallback | Máquina, portas de microfone, detecção, player e telemetria | Layout, entrada e apresentação de erros e resultado | Composição do lobby | Média |
| Recorde pessoal e ranking | Laudo experimental, resumo e top de áudio público avaliado | Histórico permitido, consulta e player assinado | Separar publicação avaliada, desempenho pessoal e dados históricos | Recorde pessoal agregado e rotulado se aprovado; progressão e ranking oficial em fase própria | Média no recorde; alta no oficial |
| Desafio direto, X1 e histórico | Convite por link, atalhos via perfil, comparação, Meus Duelos, gestão de prazo e privacidade | Porta `dueloV2`, entradas existentes, Edge, RLS e links | Descoberta no lobby, rótulos, status e retorno de autenticação | Nada no contrato atual para o primeiro corte | Média |
| Batalha aberta e desafios recorrentes | Formatos locais/históricos e regras que servem de referência | Experiência de turno se aplicável | Distribuição editorial se aprovada | Inscrição, pareamento, calendário público, resultado, denúncia e moderação para batalhas abertas | Alta |
| Mural, publicações e mídia | Posts, áudio, imagem, vídeo, comentário encadeado, reação, denúncia, salvos, Seguindo | `InicioOpenDesign`, `CardDoPost`, `ModalCompositor`, `ThreadDeComentarios`, portas e Storage | Ordenação visual, moldura, contexto esportivo e entrada da mídia | Formato de batalha pública e destaque de recorde só se aprovados | Média; alta no formato público |
| Perfil | Avatar, bio, conexões, posts e notas publicadas | `TelaPerfilOpenDesign`, `InicioOpenDesign` e portas existentes | Ficha de competidor/espectador, estados e histórico privado | Métricas oficiais, patentes e conquistas após regra e fonte | Média; alta no oficial |
| Resolução competitiva | Comparação experimental; nota de publicação com autoria, objeto e versão vinculados | Limites da M02 e pipeline existente como referência | Apresentação honesta da comparação | Voto ou análise oficial, elegibilidade, apuração e moderação somente após aceite e Gate Arquitetural | Alta |

As áreas candidatas a consolidar depois são as entradas duplicadas da Arena, as rotas legadas e qualquer estatística que o jogador possa interpretar como vitória oficial. A M05 pode revisar a hierarquia dessas superfícies. Uma descontinuação exige decisão do Luiz, prova de paridade e destino para link, histórico e acervo. `/x1/:code`, `/b/:code`, `/d/:id`, `/duelo` e as aliases de perfil continuam tratados como caminhos com consumidores próprios. [Mapa vigente](../../design/MAPA_DE_PAGINAS_E_FLUXOS.md) · [Relatório da M02](../M02-RELATORIO.md)

## Corte recomendado de implementação após aprovação

Entregar uma jornada vertical de Home → Arena → gravação → resultado → convite e resposta do X1. Na mesma direção, adaptar a descoberta do Mural e a ficha do Perfil com dados existentes. Validar o disparo de gravação e de convite com os eventos já disponíveis, distinguindo visitas, tentativas, laudos, convites confirmados e respostas. Selecionar as medições existentes pela definição de cada evento. Dados de demonstração e de teste não entram na leitura.

Levar como decisões seguintes: histórico e recorde pessoais quando sua fonte estiver definida, desafio recorrente editorial, batalhas públicas, apuração oficial, ranking competitivo, patente, vitórias e conquistas. Evitar acoplar qualquer uma dessas hipóteses a um pré-requisito da mudança visual. Nenhuma funcionalidade existente está marcada para remoção neste corte.

## Aceite proposto por Renan

| Critério observável | Prova esperada depois da implementação |
|---|---|
| Visitante entra da Home PT/EN, entende o jogo, chega à gravação e mantém a opção de apenas assistir | Navegador desktop e mobile com rota real, sessão nova, idioma e aviso de maioridade |
| Permissão negada, erro de abertura, falha de análise e desistência liberam recursos e oferecem recuperação clara, inclusive mídia em reprodução e URLs temporárias | Testes de máquina, navegador e iPhone/Android físicos. Conferir PCM em Chromium e prévia de mídia em WebKit conforme M04 |
| Convite, escuta, resposta, prazo, revogação, exclusão, denúncia, revanche e recuperação preservam estado e privacidade | Teste do contrato e ensaio em serviço autorizado com Auth, Storage, RLS e Edge, inclusive tentativa de acesso fora da sessão e interrupção do player após revogação ou expiração |
| Métricas do navegador não alteram vitória, XP, ranking ou conquista. Publicação só entra no fluxo de nota com consentimento, autoria e objeto vinculados | Regressões versionadas de M02, teste de UI e homologação do worker em serviço autorizado |
| Mural preserva posts, áudio e anexos, encadeamento, reações e Seguindo. Perfil distingue dados ausentes, carregamento, falha e acesso privado | Navegador com fixtures e ciclo de publicação, erro/retentativa, remoção, troca de sessão e recuperação |
| Navegação completa por teclado e leitor de tela, foco visível, estados falados, áreas clicáveis ≥ 44 px, contraste AA, movimento reduzido e largura do documento igual à da janela | Contrato visual desktop/mobile, revisão em 320/390/1440 px e aparelho real. Conferir favoritos/scroll interno e barra inferior com área segura |
| Home entregue em HTML público, com título/descrição, canonical e hreflang recíproco, sitemap, URLs e redirects atuais. PWA e bundle inicial preservam o caminho crítico | Inspecionar HTML de build e comparar LCP com o método da M04. Imagem leve e motor de áudio fora do carregamento inicial. Testar atualização de PWA e links antigos em aparelho |
| Typecheck, lint, testes e build verdes | CI no commit de implementação e na base integrada. Homologação física e de serviços permanece requisito anterior à publicação |

## Prova da etapa de desenho

Renan, em instância distinta da implementação, deu parecer **SEM ACHADOS MATERIAIS** no protótipo servido localmente em Chromium. Em 320 × 700, 390 × 844 e 1440 × 900, a largura do documento acompanhou a janela, sem erros de console nem recursos ausentes. A revisão confirmou a troca PT/EN, o acesso por teclado pelo link de pulo, o foco visível, a tentativa solo, a resposta pelo gravador, os estados do X1 e o bloqueio de publicação até consentimento.

Marco abriu as duas versões no navegador do Codex e percorreu a Home em inglês, a gravação, o convite, a resposta, a expiração e a retomada após microfone negado. A demonstração só mostrou a postagem depois de aceitar explicitamente o consentimento. A conversa abriu com uma resposta encadeada de exemplo.

A prova cobre a experiência navegável com dados simulados em navegador. Microfone, dispositivo físico, codecs reais, serviços hospedados, atualização de PWA instalada e regras de disputa oficial permanecem fora da prova. O tema claro fica como critério de implementação das superfícies que já o oferecem.

**Parecer de Marcelo: APROVADO COM RESSALVAS para apresentar a definição.** A jornada solo e o X1 privado formam o primeiro corte recomendado. O resultado experimental descreve a tentativa e fica sem consequência competitiva oficial. O aceite funcional e visual de Luiz é a condição para implementar.

## Decisões de Luiz

1. Aprovar o caminho Home → gravação como ação principal e o X1 como destino natural depois do laudo. **Ver um X1** mantém uma porta para espectadores.
2. Aprovar o corte com X1 privado e comparação experimental. Escolher se o primeiro teste competitivo posterior deve ser por voto, análise de áudio verificada ou continuar aberto à discussão.
3. Aprovar a hierarquia e a direção visual desktop/mobile, incluindo a proposta de laranja queimado e o uso da fotografia na Home. A paleta, as telas e os fluxos só viram referência de implementação após aceite.
4. Decidir se desafio editorial e recorde pessoal valem entrar no primeiro corte mesmo sem vencedor, ou se a prioridade é terminar e medir o X1. Marcelo recomenda o segundo.

As pendências de áudio, aparelho físico e serviços hospedados da [M04](../M04-RELATORIO.md) continuam como requisitos anteriores à publicação.
