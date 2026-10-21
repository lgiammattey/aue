# ADR 0011 — Excluir a própria conta

**Status:** proposto — aguarda as decisões de produto do Luiz (seção 4) e o Gate Arquitetural do Camillo e do Lucas. Nada deste documento está implementado.
**Data:** 2026-10-21
**Origem:** pedido do Luiz de 21/10/2026 ("o apagar do usuário"), junto com apagar post e comentário (#321 e #322)
**Vale para:** perfil, Auth, banco, Storage e a política de privacidade
**Relaciona-se com:** ADR 0001, ADR 0009 (identidade social promovida), [`PoliticaDePrivacidade.tsx`](../../../src/features/legal/PoliticaDePrivacidade.tsx)

---

## 1. O problema

Hoje a pessoa apaga **cada post, comentário e áudio** pelo app, mas **não consegue excluir a conta**.
A política de privacidade diz, com todas as letras, que "ainda não existe botão para isso" e manda escrever por e-mail.

A LGPD garante exclusão dos dados pessoais. Um pedido por e-mail serve para a primeira dúzia de pessoas; não serve para uma rede social.

## 2. O que foi verificado (leitura de produção, 21/10/2026)

**O banco já apaga quase tudo sozinho.** Todas estas tabelas referenciam o usuário com `ON DELETE CASCADE`: perfil, tópicos, respostas, comentários, posts, reações (de causo e de tópico), salvos, seguidores (nos dois sentidos), membros de comunidade, denúncias feitas, conquistas, favoritos, push e arrotos do perfil.

**Ficam, com o vínculo zerado (`SET NULL`):** `resultados` (a nota da Arena, hoje 14 com dono), participações em batalha e rodadas, `grupos.created_by`, `campeonatos.created_by`. A nota sobrevive anônima.

**O que o banco NÃO faz sozinho — e é o que importa:**

1. **Arquivos no Storage não saem junto.** Há objetos por usuário em `audio_records`, `avatars`, `capas_de_perfil`, `anexos_do_forum`, `arrotos_de_perfil`. Apagar o usuário no banco deixa os arquivos órfãos, e hoje as gravações de jogo são legíveis por qualquer visitante (issue #313). Excluir a conta sem apagar os arquivos **não exclui** o áudio da pessoa.
2. **Apagar `auth.users` exige a chave de administração.** O navegador nunca pode ter essa chave. É trabalho para uma Edge Function (o repositório já tem duas: `painel-administrativo` e `cadastrar-grupo`).
3. **Conteúdo dos outros some junto.** Apagar o autor de um tópico apaga as respostas de terceiros embaixo dele (cascata). É o comportamento atual de "apagar meu causo", mas numa conta com muita atividade o estrago é maior.
4. **Contas que não podem sair sem aviso:** a administradora global, os moderadores (a trava de `sair_da_comunidade` já existe) e as 10 contas da casa.
5. **A maior parte do Auth é anônima** (339 de 354). Essas não têm perfil nem e-mail; para elas o caminho já existente ("Apagar o meu arroto") continua valendo.

## 3. A decisão proposta

### 3.1 Fluxo

1. **Perfil → "Excluir minha conta"**, no fim da tela de editar perfil, só para conta com e-mail.
2. Tela de confirmação que **lista o que sai** (posts, comentários, áudios, foto, seguidores, salvos) e **o que fica** (a nota da Arena, sem nome nem áudio).
3. **Reautenticação:** pede a senha. Sessão antiga não basta.
4. Digitar o próprio `@` para confirmar (mesmo padrão de apagar repositório).
5. A conta é **desativada na hora** (some de buscas, perfis e feeds; ninguém mais abre o `/u/@handle`) e **excluída de vez depois do prazo** (4.1). Nesse prazo, entrar de novo cancela.

### 3.2 Execução (servidor)

Uma Edge Function `excluir-conta`, com chave de serviço, que só roda para o próprio usuário autenticado:

1. recusa se a conta é administradora global, moderadora ou da casa, com a mensagem que explica o caminho;
2. apaga, **pela API do Storage**, os arquivos do usuário em cada bucket (não por SQL, que deixaria o arquivo de verdade no armazenamento);
3. zera `resultados.caminho_do_audio` das notas que ficam, para o link de duelo não apontar para arquivo que não existe;
4. apaga o usuário no Auth (a cascata leva o resto);
5. registra, **sem dado pessoal**, que uma exclusão aconteceu (data, tipo) para a política e para o suporte;
6. é idempotente: rodar de novo depois de falha no meio termina o serviço, em vez de duplicar ou travar.

### 3.3 O que não entra

- Exportar os dados antes de sair (direito de acesso): é um pedido à parte; a política continua oferecendo por e-mail.
- Anonimizar o conteúdo em vez de apagar: descartado por padrão, porque texto escrito pela pessoa é dado pessoal.
- Apagar a conta de quem só jogou como convidado: não há perfil nem e-mail.

## 4. O que o Luiz precisa decidir

1. **Prazo de arrependimento.** Excluir na hora, ou desativar e excluir de vez em N dias (proposta: **7 dias**, igual ao prazo do link de duelo)? O prazo protege contra conta roubada e clique por engano, e a LGPD aceita um prazo curto declarado.
2. **O que acontece com os tópicos que têm resposta de outras pessoas.** (a) apagar tudo, como hoje (mais simples, perde conversa dos outros); (b) trocar o autor por "conta excluída" e manter a conversa (mais gentil com os outros, mas o texto da pessoa continua publicado, o que **não** é exclusão). A proposta é (a) para o que a pessoa escreveu e **manter** as respostas dos outros só se o tópico for convertido por decisão dela. Preciso do seu aval.
3. **Moderadores e administradora:** pedir à administração do Auê (proposta) ou ter tela própria de transferência.
4. **Conta com e-mail que nunca concluiu o perfil social:** exclui sem o prazo?

## 5. Como entra, em PRs pequenos

1. **Pré-requisito:** fechar o #313 (arquivos de áudio abertos). Sem isso, excluir a conta não protege o áudio.
2. **PR A — servidor:** Edge Function + tabela de registro sem dado pessoal + testes com banco local; **não liga** nada na tela.
3. **PR B — tela:** o fluxo de 3.1, atrás de flag, testado com uma conta de teste (contas `*_aue`).
4. **PR C — texto:** atualizar a política de privacidade (o parágrafo "ainda não existe botão") **junto** com a flag ligada, nunca antes.

Cada PR precisa de `typecheck`, `lint`, `test` e `build` verdes, e a exclusão só é considerada pronta quando conferida de ponta a ponta numa conta de teste: a conta some, os arquivos somem do Storage, o `@` abre "não encontrado" e entrar de novo depois do prazo falha.

## 6. Riscos

- **Definitivo.** Erro na função apaga a conta errada. Mitigação: só o próprio usuário, reautenticado, com `@` digitado, prazo de arrependimento e teste com conta dedicada antes de ligar a flag.
- **Arquivo órfão se a função cair no meio.** Mitigação: ordem arquivos → Auth e idempotência.
- **Backups do Supabase** guardam cópias por um período. A política precisa dizer isso com palavras claras.
- **Contagem de seguidores e notas** mudam quando a conta sai; é esperado e deve ser dito na tela de confirmação.
