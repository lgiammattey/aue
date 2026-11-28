# M03 · Cleanup

O PO aceitou a M02 com ressalvas e autorizou a limpeza na branch `codex/m03-cleanup`, a partir de `7f4bdd1c93b20a70fa79cfc1eaf4dc0146ba1c9a`, da [PR #386](https://github.com/lgiammattey/aue/pull/386). A M03 reduz código sem consumidor, recupera dois testes SQL e permite validação de PR entre branches `codex/`. O aceite do PO segue pendente.

## Recorte da missão

O jogador precisa continuar chegando ao perfil, à Arena e ao acervo pelos caminhos que já conhece. O trabalho reaproveitou os candidatos M00 e as falhas registradas pela M02. Marcelo enquadrou o recorte de manutenção sistêmica e Camillo manteve as fronteiras da Arena, áudio, persistência e serviços. A reversão de código usa o commit da M03. Como o histórico de migrations permanece intacto, ela dispensa reversão de banco.

## Retiradas e simplificação

- **Template Vite.** Saíram `App.css`, `hero.png`, `react.svg` e `vite.svg`, sem entradas de CSS, HTML, build ou PWA.
- **Galeria.** Saíram `VideosDeArroto`, `PlayerVideoCard`, a lista `playlistDeVideos`, quatro seletores exclusivos e os testes da galeria desativada. O React e o Firebase mantêm o destino de `/videos` e `/videos-de-arroto`.
- **Perfis substituídos.** Saíram `PerfilConectado`, `PerfilDoUsuario`, `TelaPerfil`, `SimboloBurpzilla` e seus estilos e testes exclusivos. As rotas `/perfil`, `/u/:handle` e `/perfil/:handle` carregam diretamente `TelaPerfilOpenDesign`, que já lê o handle. Dois wrappers idênticos saíram do `App`.
- **Exploração.** Saiu a antiga `TelaExplorar` do fórum. `/explorar` continua apontando para a home e os testes de exploração seguem exercitando `TelaExplorarOpenDesign`.

Para cada cadeia removida foram conferidos imports, carregamento dinâmico, entradas, rotas, testes e build. O [mapa de telas](../design/MAPA_DE_PAGINAS_E_FLUXOS.md) aponta para o perfil em uso e os aliases. O arquivo de dependências e o lockfile conservaram o mesmo conteúdo.

| Medida | Base M02 | M03 | Diferença |
|---|---:|---:|---:|
| Arquivos versionados, incluindo documentação | 1.167 | 1.151 | 17 removidos, 1 relatório incluído |
| Linhas `.ts`, `.tsx` e `.css` em `src`, incluindo testes | 106.809 | 103.104 | −3.705 |
| Linhas no mesmo recorte, sem arquivos de teste | 70.405 | 67.212 | −3.193 |
| Dependências diretas de app e desenvolvimento | 11 + 13 | 11 + 13 | 0 |
| Arquivos e bytes em `dist` | 139 / 34.078.787 | 139 / 34.077.719 | −1.068 bytes |

Os dois artefatos da tabela foram gerados com Node 24.22.3, sem credenciais. As páginas de grupos dependem do banco e ficam fora dessa medição.

## Código legado mantido

- **Arenas, captura e players.** `/x1/:code`, `/b/:code` e `/d/:id` ainda usam o fluxo clássico ou o player de desafio. Arena V2 usa PCM e um ciclo de revisão próprio. As flags da Arena e do X1 participam do build ou de consumidores ativos.
- **Mural, comunidade e exploração.** `/desafios` e `/resenha/:id`, `/historia/:id`, `/conto/:id` ainda usam superfícies legadas. A árvore antiga do fórum atende o harness e os testes do contrato. O mural usa a consulta `explorarTopicos` para paginação.
- **Dados e publicação.** O acervo e os contratos históricos continuam cobertos. As migrations, o worker de notas, os redirects legados, a PWA, as rotas públicas, o sitemap e os arquivos de publicação permanecem versionados.

## SQL e CI

`topicos.sql` e `forum_leituras.sql` usam fixtures transitórias para os cenários que dependiam do catálogo antigo. As asserções cobrem papéis, autorização, leitura, cursores e persistência do acervo por ID. A suíte de leituras confere o conjunto atual de colunas, incluindo os campos de anexo, vídeo e origem. A validação SQL usa a cadeia de migrations da M02 e as simulações locais de Auth e Storage do repositório.

O workflow `Validação` aceita PRs com destino à `main` ou a `codex/**`. O push automático continua restrito à `main`, com acesso de leitura e sem segredos de publicação. Firebase roda no push da `main`, agendamento ou disparo manual. O redirect é manual, com uma contingência histórica restrita à branch de emergência e ao marcador explícito. A execução remota da M03 pode ser acompanhada no PR.

## Provas locais

| Verificação | Resultado |
|---|---|
| Typecheck, lint e build | Passaram com Node 24.22.3. O lint registrou 23 avisos já conhecidos. |
| Vitest | 2.578 passaram e 9 de fórum ficaram no opt-in. A primeira execução encontrou uma falha de timing no teste de revanche da Arena clássica, cujo código e testes permanecem intactos. A execução geral de conferência passou sem retry. |
| Motor e worker | Os 10 testes Node passaram, incluindo Chromium, MP4, WebM e YAMNet. |
| PostgreSQL 17.12 | Aplicadas 123 migrations em clusters descartáveis com socket privado e sem TCP. `topicos.sql` passou com 340 asserções e `forum_leituras.sql` com 315. Passaram também os oito scripts da M02 para permissões do Storage, laudo e worker, recuperação do X1, convites, anonimização, exclusão, denúncia e respostas no mural. |
| Chromium | Passaram 16 E2E sem retry. Treze cobrem contrato visual, duelo, perfil e migração da PWA legada. Três cobrem gravação, revisão e reprodução na Arena V2 com microfone simulado. As três rotas de perfil, quatro aliases e duas páginas públicas passaram antes e depois em 390 e 1440 px, com Auth e RPC simulados. Oito pares de capturas ficaram idênticos com a mesma campanha na vitrine. |

Camillo usou o perfil de engenharia e revisou o SQL. Renan seguiu o roteiro de qualidade em uma instância separada e revisou o código e o CI. Ambos emitiram `SEM ACHADOS MATERIAIS`. Marcelo, em uma instância com perfil de produto, deu parecer `APROVADO COM RESSALVAS` para a PR em rascunho. As ressalvas são o teste sensível a timing, os opt-ins e a falta de homologação fora do ambiente local.

## Pendências para decisão do PO

Para a M04, a recomendação é começar pela prova de áudio e sessão em iPhone e Android reais, da permissão ao envio e à reprodução. Vale atacar junto o teste de revanche sensível ao relógio e o ciclo de vida dos anexos. A prova local da M03 usa dados sintéticos e não cobre aparelhos físicos ou o serviço hospedado.
