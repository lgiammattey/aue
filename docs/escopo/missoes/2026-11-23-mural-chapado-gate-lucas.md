# Gate Arquitetural (Lucas): mural chapado, arroto no centro

**Lado:** dados, backend, nota e contratos. Ciclo de vida do áudio no cliente, performance e bundle são do Camillo.
**Data:** 2026-11-23. **Base:** ADR 0013 (proposto), ADR 0004, 0010, 0012, Cartão de Missão e protótipo `mural-chapado.html`.
**Limite desta leitura:** só código e migrações do repositório. Não consultei o banco remoto, então não sei quantos posts hoje têm áudio.

## Parecer

**APROVADO COM CONDIÇÕES.** O contrato novo é aditivo e dá para entregar sem quebrar produção. Não bloqueia, mas três coisas precisam estar fechadas antes do Kayky abrir código (condições 1 a 3 no fim).

## 0. Correção de premissa

Os arquivos `src/portas/feed.ts`, `src/plataforma/web/feed.ts` e a RPC `criar_post_social` não alimentam o Mural de hoje. `criar_post_social` só existe na migração de nomenclatura legada (`20260807000036_nomenclatura_ptbr_mvp1.sql:1720`). O ADR 0004 §2 ainda cita `src/portas/feed.ts`, que não existe. O Mural real roda sobre o modelo de **tópicos** do ADR 0010:

- `paginacaoDoMural.ts:27-28` junta no cliente duas leituras: `forum.explorarTopicos` (RPC `explorar_topicos`) e `forum.listarPublicacoesPessoais` (RPC `listar_publicacoes_pessoais`).
- O caminho antigo (`listar_feed_de_causos`, `publicar_causo`, tabela `posts_comunidade`) segue vivo em `src/plataforma/web/comunidade.ts:262`, mas o Mural não o usa.

Consequência: o ADR 0013 fala em `result_id` e causo. No banco vivo o vínculo com a Arena é `topicos.resultado_id` + `consentimento_audio_publico` (`20261019000014_topicos_e_respostas.sql:47-48`). O ADR precisa dizer isso, ou o Kayky vai procurar a tabela errada.

## 1. Contrato atual e contrato novo

**Hoje** o card monta cada pedaço com uma chamada diferente, por página de 30:

| Dado | De onde vem hoje |
|---|---|
| Autor, título, respostas total | `explorar_topicos` (`20261022160614...:148-190`) e `listar_publicacoes_pessoais` (`20261021011000...:96-110`). Os dois devolvem só texto, sem anexo, sem nota. |
| Áudio e nota da Arena | `audio_de_topicos` (`20261022160617...:4`). Faz `JOIN grupos`, então **exclui todo post pessoal**. |
| Áudio gravado direto | `listar_anexos_do_forum` (`20261020063849...:353`), em outra chamada. |
| Nota do áudio direto | `listar_notas_retrospectivas` (`20261120110709...:21`), em outra chamada. |
| Contagem por reação | `contar_reacoes_dos_topicos` (`20261120231500...:70`), máximo 100 ids. |
| Prévia de comentário | `listar_previa_respostas_dos_topicos`, devolve as **2 primeiras** em ordem crescente (`20261020072444...:51`), não a última. |
| Picos de waveform | **Não existe em lugar nenhum** (busca por peaks, picos e waveform em SQL e `src/` deu zero). |
| Origem arena, mural, x1 | Não existe campo. `topicos.origem` é só `comunidade` ou `pessoal` (`20261021011000...:13`). |

São 6 a 7 idas ao banco por página, mais a intercalação de dois cursores no cliente. Com todo post tendo áudio, isso pesa.

**Proposta:** uma RPC nova, `listar_mural`, uma linha por post, cursor único `(criado_em, id)` no servidor. As RPCs atuais ficam como estão, então a mudança é **compatível** (só adiciona). A porta ganha `listarMural?` opcional, como as demais em `src/portas/forum.ts`.

Campos por linha:

- `id`, `criado_em`, `legenda` (corpo, até 180), `comunidade` (slug e nome, ou nulo se pessoal), autor (`apelido`, `handle`, `url_do_avatar`).
- `origem_do_post`: `arena` (tem `resultado_id` ou áudio da casa) ou `mural` (anexo de áudio). Derivada, sem coluna nova. `x1` ver item 2.
- `audio`: `fonte` (`resultado`, `anexo`, `casa`), `caminho`, `duracao_ms`, `picos` (`smallint[]` ou nulo).
- `nota` (0 a 100 ou nulo) e `nota_origem` (`oficial`, `servidor`, `retrospectiva`, nulo).
- `reacoes` (objeto emoji para contagem, só as existentes) e `minhas` (lista).
- `comentarios_total` e `ultimo_comentario` (`autor_handle`, `autor_apelido`, `corpo`, `criado_em`; corpo pode vir vazio se o comentário é só anexo).

Regras que a RPC copia das atuais (não pode afrouxar): `status IN ('aberto','fechado')`, `aue_e_conta_promovida(autor)`, fora de `pautas_de_topicos`, `NOT r.esta_escondido` e consentimento para áudio de Arena, `SECURITY DEFINER` com `search_path` fixo, `GRANT` para `anon, authenticated`.

**Dois buracos que a RPC precisa fechar, não só projetar:**

1. Hoje **nenhuma RPC grava `resultado_id` em post pessoal** (`criar_publicacao_pessoal_*` não recebe resultado, `20261021011000...:146-160`). "Arena com destino mural" com nota oficial exige uma escrita nova, por exemplo `criar_publicacao_pessoal_de_resultado`, com a mesma trava do `criar_topico` (`20261020063849...:283-291`): consentimento verdadeiro e `aue_resultado_e_meu`.
2. Um tópico tem **um anexo só** (`topicos_anexo_valido`). Áudio e imagem no mesmo post não cabem. Precisa estar escrito no ADR.

Último comentário: "mais recente visível, de conta promovida, qualquer nível". Falta o Rian confirmar se resposta de nível 2 conta.

## 2. "Todo post tem áudio" sem apagar dado

Filtro na `listar_mural`, nunca `DELETE` nem `UPDATE`:

```
anexo_tipo = 'audio'
OR (resultado_id IS NOT NULL AND consentimento_audio_publico)
OR (caminho_do_audio_da_casa IS NOT NULL AND consentimento_audio_publico)
```

Índice parcial novo se o plano de consulta pedir, nos moldes de `topicos_pessoais_por_data` (`20261021011000...:19`).

**Posts antigos só de texto:** continuam no banco e continuam visíveis onde o ADR 0010 já os põe, porque essas leituras não mudam:
- Tópico de comunidade: página da comunidade e Explorar (`explorar_topicos`, `listar_topicos_da_comunidade`).
- Perfil do autor: `listar_topicos_do_autor` e `listar_publicacoes_pessoais_do_autor`.
- Marcações: `listar_publicacoes_marcadas`. Link direto do tópico também segue abrindo.
- **Fica sem casa fora do perfil:** publicação pessoal só de texto. Não pertence a comunidade, então some do Mural e só vive no perfil do autor e nas marcações. É o caso mais sensível.

**O que o ADR 0013 não decidiu e precisa do Luiz:**

1. Publicação pessoal só de texto some do Mural e fica só no perfil. Pode?
2. Tópico de comunidade só de texto também sai do Mural (e continua na comunidade). Confirma?
3. Quantos posts com áudio existem hoje? Se forem poucos, o Mural abre quase vazio no dia da virada. Preciso de um número de produção (consulta só de leitura, com o Luiz ou o Camillo) antes de ligar o filtro. Plano B: manter o Mural antigo atrás de flag até haver massa.
4. **Origem `x1` não tem como existir.** O áudio de duelo é privado (ADR 0011, `20261118024347_duelos_v2_audio_privado_edge.sql`) e nenhum caminho publica resultado de X1 como post. O botão "Revanche em resultado de X1" depende disso. Ou o Luiz abre uma decisão de publicar X1 com consentimento explícito, ou `x1` sai desta rodada.
5. Posts de Arena sem nota mínima: qualquer resultado pode ir ao Mural, ou há piso?
6. Autor pode apagar o próprio post de áudio? Hoje há `apagar` por status `removido` (`20261019000014...:504`), mas não revisei a UI. Editar legenda?
7. Quem não pode gravar só comenta e reage (custo já aceito no ADR). Comentário em áudio segue fora (Cartão).

## 3. Nota e o ADR 0012

O desenho já cabe. O que existe:

- Arroto da Arena: nota vem de `resultados.nota`, exposta só com `consentimento_audio_publico` (`audio_de_topicos`).
- Arroto direto: nota só entra em `aue_privado.notas_retrospectivas` pelo trabalhador, via `concluir_nota_do_audio`, concedida só a `service_role` (`20261120114349...:121-124`). O worker é `supabase/functions/notas-worker/index.ts`. A RPC que aceitava nota do navegador, `registrar_nota_de_audio_publicado`, está revogada de `authenticated` (`20261120111847...:49`).
- Nota só aparece se o `eTag` do arquivo ainda bate (`20261120110709...:56-58`), então trocar o arquivo invalida a nota.

**Estado "sem nota ainda" no contrato:** `nota = null` e `nota_origem = null`. Vale para quatro casos que o card não distingue em público: fila pendente, processando, `erro` e `rejeitado` (sinal inconclusivo). O card mostra player sem nota e o botão "Levar pra Arena". Não dar nota provisória, não diferenciar publicamente "rejeitado" (seria um veredito em praça pública sobre o arroto de alguém). Se o autor quiser saber, é detalhe só dele, depois.

**Furo que contradiz o ADR 0013:** o navegador **calcula** uma nota e mostra no card otimista logo após publicar. `calcularNotaLocalDoAudio` em `InicioOpenDesign.tsx:190` roda a análise local e o resultado entra no item na tela em `:1753` e `:1646` (`...(notaDoAudio ... ? { nota: notaDoAudio } : {})`, `:1779`). Não grava no banco (a RPC está fechada), mas **o autor vê uma nota que veio do navegador**, e depois ela muda quando a nota do servidor chega. É nota vinda do navegador, exatamente o que o ADR 0013 proíbe. No Mural chapado esse caminho tem de sair: o card otimista nasce sem nota.

**Garantia de que o navegador nunca escreve nota:** cobrir com teste de contrato (já há `src/qualidade/filaNotasBanco.test.ts`), incluindo "`authenticated` e `anon` não executam `registrar_nota_de_audio_publicado`, `concluir_nota_do_audio`, `reivindicar_audios_para_nota`". A `listar_mural` não pode ter parâmetro de nota.

**Riscos de escala (mensurar, não bloqueiam):**
- `reivindicar_audios_para_nota` faz `DELETE ... NOT EXISTS` e `INSERT ... SELECT` sobre a view inteira a cada chamada (`20261120114349...:50-66`). Cresce com o total de áudios, não com o lote. Com todo post sendo áudio, precisa de medida antes de abrir.
- Fila em agenda do GitHub Actions: sem prazo. Em `erro`, o retry segue com espera até 1 hora, sem teto de tentativas. Áudio que nunca mede fica retentando para sempre.
- Nota pode demorar minutos ou mais. O card aguenta porque `nota = null` é estado normal, não falha.

**Picos de waveform:** não existem. Recomendo gerar no mesmo trabalhador que já decodifica o áudio e gravar em tabela privada nova (`aue_privado.picos_de_audio`, chave `bucket, caminho, etag`, 40 a 64 valores `smallint`). Se o cliente mandasse os picos, o desenho poderia mentir sobre a forma do som. Enquanto os picos não chegam, `picos = null` e o player mostra barras neutras e planas, nunca aleatórias. Isso amarra a waveform à mesma fila do ADR 0012 e exige mudança no worker.

## 4. RLS, consentimento, moderação e denúncia

**RLS:** todas as tabelas envolvidas têm RLS ligada e `REVOKE ALL` para `anon` e `authenticated` (`reacoes_de_topicos`: `20261021001030...:25-27`). Leitura é só por RPC `SECURITY DEFINER`. A `listar_mural` herda esse padrão. Risco real é a RPC nova esquecer um filtro (promovida, oculto, escondido, consentimento). Pedir teste de migração igual ao `src/db/feed-de-causos.migracoes.test.ts` para a nova.

**Consentimento ("gravou não é autorizou publicar"):**
- Gravador do modal: o arquivo sobe para `anexos_do_forum` como rascunho. Bucket privado; só o dono lê antes de publicar, e o dono pode apagar o rascunho (`20261020063849...:107-135`). Só vira público quando um tópico aponta para o caminho (`aue_anexo_do_forum_publicado`).
- Arena para o Mural: reaproveitar `consentimento_audio_publico = true` mais `aue_resultado_e_meu`. A confirmação na tela é ação separada (já exigida pelo ADR 0004 §2).
- Cuidado com o espelho do perfil: `criar_publicacao_pessoal_espelho` (`20261120112635...`) publica o mesmo arquivo em dois cards. O Mural não pode puxar `arrotos_do_perfil` direto, só o tópico espelhado.

**Moderação e denúncia (novo volume):**
- `denunciar_topico` oculta com 3 denunciantes distintos (`20261019000014...:560-562`) e exige conta promovida. Ocultar tira o tópico da leitura e a policy do Storage deixa de autorizar o arquivo (`aue_anexo_do_forum_publicado` confere status). URL assinada de 300 s já emitida (`InicioOpenDesign.tsx:1035`) vale até expirar.
- Não existe moderação de conteúdo do áudio em si (nenhuma triagem automática), só denúncia por pessoa. Com tudo sendo áudio, o único freio é a denúncia. O painel do Luiz (`20261020090000_painel_administrativo_do_luiz.sql`) existe, mas não revisei se lista denúncia de tópico com áudio para ouvir.
- Votação aberta a sessão anônima (`20261120231500...:22`) infla contagem. Contagem de reação não pode virar ordenação nem ranking sem tratar isso.
- Denúncia precisa estar no card (menu), não só no sheet.

## 5. Reação: uma ou várias?

**Várias, mas com regra.** Chave primária `(user_id, topico_id, tipo)` (`20261021001030...:7-13`), então o banco guarda mais de uma. A função vigente `alternar_reacao_do_topico` (`20261120231500...:21-72`) impõe:

- 👍 e 👎 se excluem entre si.
- Os outros 8 tipos (`dedo`, `hangloose`, `rock`, `cerveja`, `refrigerante`, `fogo`, `nojo`, `trofeu`) são **escolha única entre eles**.
- O polegar é independente do grupo. Resultado: no máximo **2 reações por pessoa por post** (um polegar e um emoji).

O protótipo assume outra coisa: `mural-chapado.html:465-466` liga e desliga cada emoji de forma independente, então 👍 🤙 🤘 🍺 juntos seriam possíveis. **Não bate com o banco.** Decisão do Luiz, com duas saídas:

- (a) Ajustar o protótipo e o card à regra atual (1 polegar + 1 emoji). Zero migração.
- (b) Reação múltipla de verdade. Muda só a função `alternar_reacao_do_topico` (tirar o `DELETE` de exclusividade); a tabela já suporta. Migração pequena, mas muda o sentido do dado já gravado.

Os 7 do protótipo (👍 👎 🖕 🤙 🤘 🍺 🥤) mapeiam em `like, dislike, dedo, hangloose, rock, cerveja, refrigerante`. Ficam de fora `fogo`, `nojo`, `trofeu`: reações antigas existem no banco e **não têm lugar no desenho**. O contrato devolve o mapa completo; o Rian decide se esconde ou converte. Não apagar.

## 6. Migração, risco e ordem de entrega

**Migração:** só aditiva. Sem `ALTER` destrutivo, sem tocar nas RPCs atuais.

1. `listar_mural` (leitura nova, `anon` e `authenticated`).
2. `criar_publicacao_pessoal_de_resultado` (escrita nova, só `authenticated`), se o Mural receber arroto da Arena.
3. `aue_privado.picos_de_audio` e o ajuste do worker para preenchê-la, e a leitura dos picos dentro da `listar_mural`.
4. (Opcional, depende do Luiz no item 5) troca da função de reação.
5. (Se o plano de consulta pedir) índice parcial para o filtro de áudio.

**Ordem para não quebrar produção:**

1. ADR 0013 aceito, com a correção do item 0 e as respostas do item 2.
2. Migração 1 aplicada, com **o Mural ainda lendo o caminho antigo**. Produção não muda.
3. Teste de migração e de paridade da `listar_mural` (mesmos posts das RPCs atuais, só filtrados por áudio).
4. Porta `listarMural?` e adaptador; o Mural lê a nova atrás de flag. Se a RPC falhar, **mostra erro**, não volta em silêncio para o feed de texto (nada de sucesso inventado).
5. Worker de picos (migração 3). Antes disso o card usa barras neutras.
6. Medir contagem de posts com áudio, tempo da `listar_mural` com volume real e fila de nota. Só então virar o flag.
7. Remoção do caminho antigo, depois, em missão própria.

**Rollback:** desligar o flag. Nenhum dado foi alterado, então voltar é instantâneo.

## Condições (o que precisa estar fechado antes do código)

1. **Nota nunca vem do navegador, nem na tela.** Remover o card otimista com nota local (`InicioOpenDesign.tsx:1646`, `:1753`, `:2246`). `listar_mural` devolve `nota = null` para tudo sem nota de servidor ou de Arena. Teste de contrato de permissões das RPCs de nota.
2. **O ADR 0013 precisa ser corrigido e respondido pelo Luiz** antes de aceitar: modelo real é tópico (não causo), post pessoal só de texto sai do Mural, um anexo por post, `x1` sem origem possível, e a regra de reação (itens 2 e 5 acima).
3. **Contagem real de posts com áudio e medida de custo da fila antes de ligar o flag**, porque o filtro pode deixar o Mural vazio e `reivindicar_audios_para_nota` cresce com o total de áudios. O flag só vira com os dois números na mão.

Condições menores, tratadas durante a entrega: RPC nova copia todos os filtros de visibilidade (com teste); escrita de Arena para o Mural mantém consentimento e `aue_resultado_e_meu`; picos só do servidor, nulos até chegarem; denúncia no card; reações legadas não somem.

**Para o Camillo:** ciclo de vida do áudio no cliente (um por vez, carga ao entrar na tela), URL assinada de 300 s em lote, e custo de 1 RPC contra 6 a 7 por página. Não opino aqui.
