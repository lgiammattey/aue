# Auditoria de produção — Auê (20/10/2026)

**Escopo:** https://aue.web.app + projeto Supabase de produção `Auê` (`enjykrpprjfmeqxunzcs`).
**Método desta rodada:** leitura de código, migrations e contratos; consultas **somente leitura** ao banco de produção; navegação de visitante no site publicado.
**Limite declarado:** não havia conta de teste autorizada. Nenhum fluxo autenticado foi executado no navegador, e criar conta em produção é proibido pela governança. Tudo que depende de login está marcado **NÃO VALIDADO** abaixo, nunca como aprovado.

Cartão de Missão (Tiago): lane **Full flow sistêmica** (toca banco/contrato). Dono do Gate Arquitetural: Camillo/Lucas. Validação: Marcelo.

---

## 1. Resumo executivo

| Bug relatado | Estado | Causa raiz | Evidência |
|---|---|---|---|
| **C — vídeo por link** | **Reproduzido no banco. P0.** | Regex da função SQL `aue_url_video_externo_canonica` usa `\\.` em string comum (`standard_conforming_strings=on`): vira "barra literal + qualquer caractere". Nenhuma URL real casa. O RPC rejeita todo vídeo. | `select aue_url_video_externo_canonica(...)` em produção devolveu `null` para YouTube watch, youtu.be e TikTok. 0 tópicos e 0 respostas com vídeo em produção. |
| **B — busca** | **Confirmado no código. P1.** | A busca é um filtro local (`InicioOpenDesign.tsx:1498-1520`) sobre os posts já carregados. Não existe RPC de busca no banco, nem busca de pessoas, nem paginação. Placeholder promete "posts, arrotos ou comunidades". | `BarraSuperior.tsx`, nenhuma função `buscar_*` nas migrations. Já existe a issue #241 (cobre Explorar/tópicos/pessoas). |
| **A — foto de perfil** | **Causa provável encontrada, NÃO reproduzida no navegador.** P1. | Ver seção 2.A. | Só 1 de 323 perfis tem foto; só 15 de 323 são contas promovidas. |

## 2. Detalhe dos três bugs

### A — Foto de perfil não salva
Fluxo: recorte → `prepararImagemDePerfil` → `storage.avatars.upload` → RPC `atualizar_meu_perfil(p_url_do_avatar)`.

Fatos confirmados em produção:
- Bucket `avatars` e políticas de INSERT/UPDATE/SELECT estão corretos; trigger `proteger_campos_sociais_do_perfil` só libera a coluna dentro do RPC (desenho certo).
- O RPC exige `aue_exigir_conta_promovida()` (e-mail, não anônimo, perfil social concluído). **293 de 308 perfis anônimos/não concluídos não conseguem salvar foto.** O upload ao Storage passa (a política só exige `authenticated`, que inclui anônimo), o RPC falha com 42501, e a tela mostra apenas "Não foi possível trocar a foto agora." — a causa real (precisa concluir o perfil) é engolida em `perfilRemoto.ts` (`console.error` + `motivo: 'falhou'`).
- Sobra um arquivo órfão no Storage a cada tentativa de quem não é promovido (limitado a 1 por usuário pelo `upsert`).
- A única foto salva é de 19/10 02:23; nenhuma depois disso, embora a conta promovida possa tentar.

Defeitos secundários verificados no código:
1. `enviarFoto` reprocessa uma imagem que a tela já recortou e comprimiu (dupla compressão JPEG).
2. `removerFoto` ignora o erro do `storage.remove`; **não existe política DELETE em `avatars`**, então o arquivo nunca sai do bucket (violação de "apagar o que é meu").
3. Se o upload e o RPC passam mas `obterMeuPerfil()` falha, o usuário vê "falhou" com a foto já salva.

**Falta para fechar:** reproduzir com conta promovida e conta anônima em navegador real (refresh, logout, novo login).

### B — Busca
Sem backend. Pessoas (`@handle`/nome) não são pesquisáveis em lugar nenhum. A rota `/explorar` existe (`TelaExplorar`), mas a barra superior do Bonde não a usa.

### C — Vídeo por link
Três camadas, três parsers diferentes que discordam:

| Camada | Aceita |
|---|---|
| Cliente do compositor (`embeds.ts`) | protocolo opcional, `m.youtube.com`, sem TikTok curto |
| Cliente do fórum (`MidiaDoForum.tsx` `videoDoForum`) | parser próprio por `URL` |
| SQL (`aue_url_video_externo_canonica`) | só `https://`, sem `m.youtube.com`, **e com a regex quebrada** |

Mesmo corrigida a regex, `youtube.com/watch?v=ID` (sem `https://`) sai do cliente como `urlOriginal` sem protocolo e o SQL rejeita. Links curtos do TikTok (`vm.tiktok.com`, `/t/`) e `youtube.com/live`, `music.youtube.com`, `/embed/` não são suportados em nenhuma camada. Vídeo indisponível ou com embed bloqueado não tem estado de falha no player.

## 3. Matriz funcional (parcial)

| Funcionalidade | Estado | Evidência | Sev. | Teste de regressão proposto |
|---|---|---|---|---|
| Vídeo por link (publicar) | Quebrado | consulta SQL em produção | P0 | Teste de migração que executa a função com os formatos aceitos; paridade com parser do cliente |
| Foto de perfil | Falha p/ não promovido; não reproduzido p/ promovido | RPC + contagem de perfis | P1 | Teste de porta com motivo `precisaConcluirPerfil`; teste de política DELETE |
| Busca | Filtro local, sem pessoas | código | P1 | Teste de RPC com termo especial, vazio, página 2 |
| Feed anônimo | Carrega, sem erro de console | navegação real | OK | — |
| Posts de teste no feed público ("teste", "oi", "Coe galera") | Presentes em produção | texto da home | P2 | Limpeza editorial (decisão do Luiz) |
| Bloco "PATROCINADO" com "Free dating site for men / Hey Darling!" | Anúncio adulto numa rede de público amplo | texto da home | P2 | Filtro de categoria na rede de anúncios (decisão do Luiz) |
| Login, cadastro, comentários, reações, seguir, salvar, Arena, X1, áudio, mobile | **NÃO VALIDADO** | sem conta de teste | — | — |

## 4. Segurança (leitura de produção)
- RLS ligado em `perfis`; leitura pública de perfis esperada.
- `anon` tem `INSERT/UPDATE` em `perfis.url_do_avatar` por grant de coluna; a trigger neutraliza fora do RPC. Funciona, mas é defesa só por trigger. P3.
- O RPC aceita **qualquer string** em `p_url_do_avatar`: o dono pode apontar a foto para URL externa (rastreador) em vez do bucket. P2.
- Política de INSERT em `avatars` não exige conta promovida, ao contrário de `capas_de_perfil`. P3.
- Advisors do Supabase e demais RLS (causos, tópicos, desafios) **ainda não revisados nesta rodada**.

## 5. Ordem de correção proposta
1. **PR 1 (P0):** corrigir a regex SQL em nova migration (`CREATE OR REPLACE`, não destrutiva), alinhar os três parsers num contrato único (+ links curtos/`m.`), normalizar protocolo no cliente, estado de falha do player. Teste de migração + paridade.
2. **PR 2 (P1):** foto — motivo honesto para conta não concluída, política DELETE em `avatars`, validar prefixo da URL no RPC, não reprocessar a imagem já recortada.
3. **PR 3 (P1):** busca — RPC `buscar_no_aue` (pessoas por nome/@handle, comunidades, tópicos; paginada; escapa `%`/`_`), ligada à barra superior e ao Explorar, alinhada à #241.
4. Rodada autenticada completa (matriz restante) assim que houver conta de teste.

## 6. O que preciso do Luiz
- Uma **conta de teste promovida** e uma **anônima** (ou autorização para o Luiz fazer a captura com mim), para reproduzir A no navegador e validar o resto da matriz.
- Autorização para **aplicar as migrations em produção** depois do merge (eu só preparo os arquivos e testes; não aplico nada no banco).

---

## 7. Atualização (mesmo dia): correções entregues

| Bug | PR | Migration em produção | Verificação |
|---|---|---|---|
| C — vídeo por link | [#297](https://github.com/lgiammattey/aue/pull/297) | `corrige_regex_do_video_externo` aplicada; YouTube, youtu.be e TikTok devolvem a URL canônica, URL maliciosa devolve `null` | testes de paridade SQL × cliente |
| A — foto de perfil | [#298](https://github.com/lgiammattey/aue/pull/298) | `foto_de_perfil_so_conta_promovida` aplicada; políticas INSERT/UPDATE/DELETE em `avatars`, RPC volta a validar a URL | testes de porta e de migration; **não reproduzido no navegador** (sem sessão) |
| B — busca | [#299](https://github.com/lgiammattey/aue/pull/299) | `busca_de_pessoas_rodas_e_topicos` aplicada; testada em produção só com leitura | navegador local como visitante, dados reais |

Os três PRs estão abertos, sem merge. As migrations já estão no banco; o código que as usa só entra com o merge.

Achados novos: botão ⌕ do mobile era inoperante (corrigido no #299); título da aba errado em `/u/:handle` (P3, aberto).
Pendente por falta de sessão: validar publicação de vídeo, troca de foto, comentários, reações, seguir, Arena, X1 e áudio com as contas `*_aue`.

---

## 8. Segunda rodada: segurança e consistência (leitura de produção + código)

Limite mantido: sem sessão logada, nada foi escrito em produção para testar. Cada item abaixo diz como foi provado.

| # | Achado | Sev. | Prova | Issue |
|---|---|---|---|---|
| 1 | "Fundar comunidade" mostra sucesso e não grava nada | P1 | código (`fundarNovaComunidade`) | [#302](https://github.com/lgiammattey/aue/issues/302) |
| 2 | "Gestão da comunidade salva" só atualiza a memória da tela | P1 | código (`aoSalvar`) | [#303](https://github.com/lgiammattey/aue/issues/303) |
| 3 | `/c/bonde-geral` (apagada) abre como comunidade viva, com dados fixos no código | P1 | navegador local + `comunidadesPadrao.ts` | [#304](https://github.com/lgiammattey/aue/issues/304) |
| 4 | `grupos` aceita INSERT direto de qualquer sessão, inclusive anônima | P1 | policy + grants no banco; não executado | [#305](https://github.com/lgiammattey/aue/issues/305) |
| 5 | Botão Salvar desabilitado em todo card; aba Salvos manda usá-lo | P2 | código + site publicado | [#306](https://github.com/lgiammattey/aue/issues/306) |
| 6 | Senha vazada desligada, 4 funções sem search_path, TRUNCATE amplo, telemetria e áudio sem teto, soft-404 | P3 | advisors do Supabase + curl | [#307](https://github.com/lgiammattey/aue/issues/307) |

Revisado e sem achado: RLS ligado nas 31 tabelas públicas; tabelas sociais (comentários, reações, posts, seguidores, denúncias) sem grant direto a `anon`/`authenticated`, só via RPC; policies de `perfis`, `favoritos`, `push_subscriptions`, `desafios` amarradas a `auth.uid()` ou a funções de posse; telemetria com CHECK de tamanho e lista fechada de eventos.
Ainda não revisado: Storage de áudio por conta, limites de taxa do Auth, Arena/X1/áudio no aparelho (exigem sessão logada e microfone).

---

## 9. Terceira rodada: correções dos P1, P2 e P3

| Achado | Correção | PR | Banco em produção |
|---|---|---|---|
| #305 INSERT direto em `grupos` | sem escrita direta para `anon`/`authenticated` | [#308](https://github.com/lgiammattey/aue/pull/308) | `20261021000247` |
| #307 TRUNCATE, search_path, áudio e telemetria sem teto | revogados, fixado, 300 áudios/conta, 120 eventos/sessão/min | #308 | `20261021000247` |
| #302 Fundar comunidade falso | botão e modal removidos | [#309](https://github.com/lgiammattey/aue/pull/309) | — |
| #303 Gestão "salva" só na memória | regras gravadas por RPC; moderadores só leitura | #309 | `20261021000412`, `…000458` |
| #304 Comunidade removida abria fantasma | "não encontrada"; comunidades fixas só as 2 reais; slug padrão corrigido | #309 | — |
| #306 Salvar morto + botões do card mortos | curtir, 🔥, 🤢, 🏆 e salvar de verdade; aba Salvos; Compartilhar com link real | [#310](https://github.com/lgiammattey/aue/pull/310) | `…001030`, `…001154` |
| #307 soft-404, título da aba, botões "Em breve" | página 404 com noindex; título restaurado; botões removidos | [#311](https://github.com/lgiammattey/aue/pull/311) | — |

Verificado no navegador com sessão real (ações desfeitas): curtir 0→1→0; salvar aparece em Perfil > Salvos e persiste após recarregar; `/c/bonde-geral` mostra "não encontrada"; Sobre mostra regras e moderador do banco; `/rota-que-nao-existe` mostra 404.

Fica para a Luiz: ligar "Prevent use of leaked passwords" no painel do Supabase (Auth). `VersaoMobileOpenDesign.tsx` é código morto com toasts falsos; remover em outro PR.
Ainda NÃO validado: Arena, X1, áudio no aparelho, comentários/respostas, seguir, publicar vídeo com 2ª conta.
