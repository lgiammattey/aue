# Escopo atual — Auê

Este recorte foi conferido com o Game Design Document [`../jogo/AUÊ!-2.md`](../jogo/AUÊ!-2.md)
e com a prancha visual de telas recebida. O GDD detalha o produto; este arquivo
continua sendo a decisão de escopo vigente.

**O que pertence ao jogo agora.**

Este documento decide escopo. Se uma ideia não está aqui e não é correção
necessária para manter o jogo funcionando, ela vai para
[`BACKLOG.md`](BACKLOG.md) — não para o código.

Não existe gate sequencial, fila de Features numeradas nem autorização por
etapa. Existe esta lista, e a regra de terminar uma coisa antes de começar
outra.

---

## 1. O produto

Um **jogo mobile casual, web-first**: abre no navegador do celular, arrota,
recebe nota, desafia alguém, responde, revanche.

A experiência acontece em **uma Arena que muda de estado**
([`../jogo/ARENA.md`](../jogo/ARENA.md)), com referência visual em
[`../design/prototipo-arena/arena.html`](../design/prototipo-arena/arena.html).

---

## 2. Dentro do escopo

### 2.1 A Arena

Superfície única, estrutura fixa de quatro faixas, dez estados: `IDLE`,
`RECORDING`, `ORIGIN`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD`,
`REMATCH`, `ERROR`.

### 2.2 Arrotar

Um toque começa. Microfone pedido só quando necessário. Bolha reagindo ao áudio
real. Teto de duração com aviso e parada automática.

### 2.3 Detecção real de arroto

O que não é arroto não vira nota. Classificação roda no aparelho.

### 2.4 Origem

Cinco opções mínimas em um toque, no nível principal. Informada pela pessoa,
nunca detectada.

### 2.5 Julgamento e score

Auê Score de 0 a 100, fórmula versionada e espelhada entre TypeScript e SQL.
Espera curta com teatro. Revelação com contagem, métricas depois do número.

### 2.6 Desafiar e link privado

Chamar no X1 como saída principal do resultado. Link privado, imprevisível, não
enumerável, com prazo real de 7 dias lido do banco.

### 2.7 Responder

Quem abre o link joga sem cadastro e **ouve o arroto que o desafiou antes de
responder**.

### 2.8 VS, placar e revanche

Confronto das duas notas, vencedor do round em ouro, placar com linhas que tocam
o arroto de cada um.

A revanche continua a mesma disputa **em rounds**: cada revanche abre um round
novo, o round só fecha quando os dois arrotam, nota maior vale uma vitória e
empate não pontua. A tela mostra o placar de vitórias e o último round — não
existe histórico de round.

### 2.9 Disputa local

O mesmo loop no mesmo aparelho: 2 a 5 participantes, 1 a 3 rounds, contexto
opcional, pódio compartilhável. Hoje protegida pela flag
`VITE_FEATURE_DISPUTA_LOCAL` até rodar de ponta a ponta em telefone real.

### 2.10 Compartilhamento

Mandar a nota e mandar o desafio. Compartilhamento nativo quando existir, cópia
de link como saída honesta quando não existir.

### 2.11 Erros

Um estado honesto para microfone negado, sem som, não é arroto, falha de análise,
falha ao compartilhar, link expirado e ausência de rede/configuração.

### 2.12 Mobile real

Safari iOS e Chrome Android são alvo de validação, não "quando der". Isso inclui
safe areas, `svh`, barra que recolhe e permissão de microfone pedida uma vez só.

### 2.13 O mesmo jogo empacotado como app

A Arena fechou o loop em produção, então empacotar deixou de ser preparação e
virou trabalho — decidido no
[ADR 0002](../technical/adr/0002-o-aue-nas-lojas.md).

O que pertence ao escopo:

- a casca de Android e a de iPhone rodando **o mesmo build** do site, com
  adaptador nativo só atrás de porta que já existe;
- o loop inteiro validado em Android e iPhone **de verdade**, dentro do app;
- o juiz dentro do pacote, sem espera na primeira gravação;
- vibração na revelação da nota;
- o link do desafio abrindo o app **no Android**;
- publicação na **trilha interna** da Play.

O que **não** pertence, e continua exigindo decisão nova: produção aberta na
Play, qualquer coisa na App Store, e toda a lista do
[§1 do ADR 0002](../technical/adr/0002-o-aue-nas-lojas.md#1-o-que-passa-a-ser-permitido).

**Nenhuma tela, regra ou feature nasce do lado nativo.** A web continua sendo o
produto: quem abre o link sem instalar joga igual.

### 2.14 Privacidade mínima

- política de privacidade e termos em páginas públicas, sem interromper o jogo;
- **o que expira é o acesso pelo link, não a gravação** — dito com essas palavras;
- **não existe expurgo automático de áudio**, e nenhuma tela sugere o contrário;
- quem gravou pode apagar o próprio áudio;
- denúncia esconde a gravação;
- áudio não é reusado para acervo, finalidade nova ou treinamento de modelo.

### 2.15 Publicação

O jogo no ar, com Supabase configurado, PWA instalável, páginas públicas e
metadados sociais suficientes para o link render no grupo.

### 2.16 QA

`typecheck`, `lint`, `test` e `build` verdes antes de qualquer merge. Testes de
paridade entre a regra em TypeScript e a versionada em SQL. Fluxo real validado
em celular quando a mudança tocar a jornada.

### 2.17 Comunidades temáticas e Feed de Causos (Auê 3.0)

Aprovado por decisão de produto pelo Luiz em 17/10/2026:

- **Hubs temáticos de comunidade:** com a pioneira *"Eu arroto, e daí?"* e categorias de vergonhas e histórias reais (*"Na reunião da firma"*, *"Primeiro encontro"*, *"Arroto trovão"*);
- **Feed dinâmico estilo Twitter/Reddit:** cards com reprodução de áudio, nota do juiz de IA em destaque, o texto do causo e o botão de desafio direto ("Duvido");
- **Consentimento e Opt-in:** gravação privada continua padrão; publicação na comunidade exige ação consciente e aceite explícito;
- **Moderação ativa:** sistema de denúncia e ocultação server-side para áudios públicos.

**Direção decidida em 19/10/2026 — ainda não é o comportamento do produto.**
O Luiz decidiu que o Auê deixa de ter feed livre: a conversa passa a morar em
**tópicos dentro de comunidades**, com respostas ([#251](https://github.com/lgiammattey/aue/issues/251)).
A decisão de arquitetura está em [ADR 0010](../technical/adr/0010-comunidades-topicos-e-respostas.md)
(**proposto**, sem aceite formal). Até o aceite e até a jornada nova ser provada
ponta a ponta, o feed e o causo avulso descritos abaixo seguem sendo o que o
produto faz — e a documentação não deve prometer o contrário.

Contrato de funcionamento (auditoria de 18/10/2026):

- a nota e o áudio de um causo vêm do resultado guardado no servidor; o cliente nunca afirma nota;
- o arroto só sobe **depois** do aceite marcado no modal, nunca na hora de jogar;
- reação, comentário e denúncia vão ao banco (`alternar_reacao_do_causo`, `criar_comentario`, `denuncias`); erro do servidor aparece como erro, não como sucesso;
- três denúncias de pessoas distintas escondem o causo;
- sem Supabase configurado, o causo fica no aparelho e vem marcado "só neste aparelho";
- **sem número inventado:** nada de contagem de membros, seguidores ou duelo de exemplo. O perfil de terceiros existe em `/u/:handle` e o Seguir grava no servidor.

Elenco da casa (decisões do Luiz em 18/10/2026, Cartão `docs/historias/burpzilla/cartao-de-missao-seed.md`):

- **Conteúdo da casa:** o Bonde e a comunidade "Eu arroto, e daí?" recebem posts dos personagens Giam e Lima (história Burpzilla), com comentários de contas da casa. É carga retroativa (backfill), de 28/08 a 15/10/2026, horário de Brasília, com a data de cada post como no cronograma. Não é agendamento;
- **Perfil:** igual ao de usuário comum. A conta da casa leva um símbolo Burpzilla (usuário da casa) só na tela de perfil. Não há selo no feed, nada na página Sobre, e o símbolo não indica posição, nota nem ranking. Não é conquista;
- **Áudio sem nota:** os áudios do Solo Eructos! sobem sem passar pelo jogo, logo sem nota. Nota nunca é inventada e o card não desenha pontuação quando ela não existe. Por ora esse caminho é só da casa (servidor). Postar áudio sem jogo como usuário comum não existe e pede outro Cartão;
- **Comentários da casa:** só texto. Os agentes da squad que comentam são sorteados (semente registrada e revisada antes de aplicar), nunca com o nome "Lucas";
- **Rastreável e fora de métrica:** a conta da casa fica marcada no banco, fora do alcance do usuário, e não entra em ranking nem em métrica de audiência;
- **Autorização dos áudios:** foi dada pelo grupo do Telegram. A prova precisa estar guardada no repositório antes de qualquer carga em produção.

### 2.18 Diretório de grupos externos

Aprovado por decisão de produto pelo Luiz em 18/10/2026:

- **O que é:** uma lista de grupos de **WhatsApp, Telegram e TikTok** que moram fora do Auê. Cada um tem nome, descrição, link do convite e imagem opcional. O botão abre o convite na plataforma de origem;
- **Cadastro aberto:** dentro do app, para quem está logado, e numa tela pública fora do login, para o visitante sem conta. O grupo cadastrado aparece na hora no app;
- **Oficiais de partida:** os três grupos de WhatsApp que o Luiz passou entram como oficiais, com o texto aprovado por ele;
- **Segurança:** o cadastro passa só pelo servidor, com limite de envios por origem. Sem verificação anti-robô, por decisão do Luiz em 18/10/2026. O link só vale se for do domínio da plataforma (`chat.whatsapp.com`, `t.me`, `tiktok.com`), e isso é conferido no banco. Só quem está logado denuncia; três pessoas distintas escondem o grupo, exceto os oficiais;
- **Google:** cada grupo visível ganha uma página própria em `/g/<slug>`, gerada no build e republicada só quando a lista muda, conforme o [ADR 0008](../technical/adr/0008-paginas-publicas-dos-grupos.md). O link do convite sai com `nofollow`;
- **Sem número inventado:** nada de contagem de membros, "ativos agora" ou ranking de grupo. O Auê não sabe se o grupo está cheio nem se o convite expirou;
- **Não é a lista de comunidades temáticas** do app (Bonde Geral etc.), que continua separada.

Fora desta fase: chat dentro do Auê, validar se o convite ainda funciona, editar grupo depois de cadastrado, moderação manual além da denúncia e outras plataformas além das três.

### 2.19 Vida social das comunidades (Open Design)

Decisão do Luiz em 19/10/2026, Cartão de Missão 0026 e ADR 0012:

- o Open Design é a casca única de comunidades, explorar, tópico, perfil e acesso;
- pessoas são referenciadas por `@handle`, comunidades por `/slug` e tópicos por
  `#id`; esses três identificadores são a convenção de URL, busca e interface;
- votos, salvos, inbox, fundação de comunidade, papéis de moderação, regras,
  presença agregada, karma derivado e conquistas objetivas pertencem ao produto;
- cada ação nasce em RPC e porta própria, com RLS e rollback antes de qualquer
  tela depender dela; não há dado do protótipo como substituto de backend;
- a Arena e sua jornada não entram nesta entrega.

---

## 3. Fora do escopo

Continuam fora do produto, e **não pertencem a esta fase**:

algoritmo viciante de recomendação · seguidores obrigatórios · campeonatos e ligas
formais · temporadas · assinatura e monetização · paywall · XP e níveis ·
mensagens privadas (chat) · login social obrigatório para arrotar.

Comunidades e feed voltaram como decisão explícita do Auê 3.0, respeitando o
gate arquitetural do Camillo, a especificação da Priscila e o Cartão de Missão 0001.

---

## 4. Pronto significa

Um comportamento só está pronto quando:

- funciona de ponta a ponta em navegador mobile real;
- o erro é tratado sem fingir sucesso;
- nada aparece habilitado sem fazer o que promete;
- dado fictício não aparece como real;
- `typecheck`, `lint`, `test` e `build` passam;
- a PR foi revisada e aprovada.

Não contam como pronto: "já fiz a tela", "o backend fica pra depois", "tem mock
mas depois liga", "funciona no meu navegador".
