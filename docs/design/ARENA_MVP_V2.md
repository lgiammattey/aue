# Arena MVP v2 — desenho da experiência

## Implementação em 23/11/2026

Base: commit `dc83657589294fb45e28f7b5753712044e709b08`, deploy do Firebase e código. Conferência em 23/11/2026; detalhes e limites em [Produção atual](../PRODUCAO_ATUAL.md).

A Arena v2 e o duelo privado constam no build publicado. O laudo é experimental, a comparação do duelo usa duração fornecida pelo cliente e a UI não foi validada ponta a ponta nesta revisão. Liga privada semanal, telas previstas e demais itens deste plano não se tornam entregues por existirem neste documento ou por haver uma seção visual chamada Liga.

## Registro anterior preservado

O texto a seguir registra decisões, contratos e referências anteriores. Em conflito com o retrato acima, não descreve o comportamento atual; contratos legados continuam relevantes para links e dados antigos.

**Missão:** [0035 — arena, desafio e revanche](../../.agents/missoes/0035-arena-mvp-v2.md)
**Situação:** especificação para implementação; não descreve uma entrega publicada.
**Referência de produção:** [`../PRODUCAO_ATUAL.md`](../PRODUCAO_ATUAL.md), sujeita a nova conferência no navegador.

## O jogo em uma frase

A pessoa entra, grava seu arroto e chama alguém para superar a marca. Quem aceita
um novo duelo grava antes de conhecer o resultado do outro. A revelação dá
motivo para ouvir, provocar e pedir revanche. A liga prolonga a brincadeira ao
longo da semana.

A Arena é a entrada principal. O mural e as comunidades continuam existindo,
mas não competem com o botão de gravar pelo primeiro toque. Não há necessidade
de uma comunidade movimentada ou de um placar público para a tela fazer sentido.

## Princípios visuais

**Nova direção aprovada pelo Luiz:** começar pela Arena com fundo claro, visual
editorial de esporte, navegação superior enxuta e ilustrações discretas de
refrigerante e futebol. A ação e a medição ganham espaço; o verde fica
concentrado na ação e no sinal. A tipografia mantém os arquivos existentes
enquanto a família definitiva é explorada. Abaixo ficam os princípios anteriores
que ainda se aplicam ao comportamento e à honestidade das medições; quando
discordarem da nova aparência, esta direção visual prevalece.

- Tratar a disputa como esporte sério de um jeito engraçado: preto e grafite,
  branco de alto contraste, placas e números com peso. Sem estética de sujeira,
  infantilização ou cores de funções corporais.
- Anton nos títulos e números; Archivo nos textos e controles. Uma face
  monoespaçada pode identificar métricas, se estiver disponível sem atrasar a
  entrada. Dourado sinaliza vitória ou recorde real; cor vibrante aparece em
  onda, ação ou exceção, com moderação.
- Sem números fictícios nem ranking decorativo. O desafio editorial funciona
  mesmo com zero partidas: **“SEU DESAFIO · CAPRICHE NO FÔLEGO”** descreve
  uma regra, não afirma que existe liga ou competição pública ativa.
- Uma superfície contínua: a posição da ação e o sentido de cada mudança devem
  permanecer claros. O microfone e o contador são feedback, não enfeite.
- O fundo da página deve chegar às bordas da janela e manter o mesmo tom em
  cada estado; não criar faixas ou uma cortina de outro preto em volta do conteúdo.
- A captura é silenciosa; não tocar sinais, música ou efeito pelo alto-falante
  enquanto o microfone estiver aberto. Respeitar movimento reduzido.

## Primeira entrega: entrada e gravação

A primeira entrega só pode mostrar e oferecer aquilo que funcionar de ponta a
ponta naquela versão. Laudo v2, duelo travado e liga não aparecem como serviços
ativos enquanto seus contratos não estiverem prontos. A disponibilidade em
produção depende do aceite e da publicação, não deste documento.

### Entrada

**Hierarquia:**

1. Cabeçalho compacto com marca Auê e acesso secundário ao **Mural** e ao menu.
   O menu leva também a comunidades, como jogar, privacidade e termos.
2. Faixa editorial curta: **“SEU DESAFIO”** / **“CAPRICHE NO FÔLEGO”**.
   Enquanto a liga não existir, não chamar essa faixa de liga ou placar ativo.
3. Centro com botão grande **“Gravar meu arroto”**, reconhecível como botão e
   com ícone de microfone. Uma linha esclarece: **“Sem cadastro. O microfone só
   liga quando você tocar.”**
4. Nenhum feed, anúncio, cadastro ou permissão interrompe essa entrada. O
   conteúdo social e os anúncios continuam no feed, acessível por **Mural**.

O toque é a única ação que pede acesso ao microfone. Enquanto a permissão estiver
pendente, mostrar **“Aguardando permissão do microfone”** e impedir toques
repetidos; não afirmar que está gravando antes de receber o acesso. Se a pessoa
sair durante a solicitação, qualquer acesso concedido depois é encerrado e a
captura não começa escondida.

### Gravando

A ação passa a dizer **“Finalizar gravação”** e conserva posição e tamanho
reconhecíveis. Mostrar tempo decorrido e onda baseada no som captado, com uma
indicação textual **“Gravando”**. A onda não substitui o texto para leitor de
tela nem implica medição de volume físico. Mostrar aviso de aproximação do limite
se existir parada automática. Ao finalizar, atingir o limite, sair da tela ou
interromper a sessão, o microfone deve ser liberado. Não manter um indicador de
captura depois que a trilha parou.

### Revisão e falhas

A pessoa consegue ouvir a própria tentativa, descartar e gravar outra antes de
confirmar qualquer envio. Se a primeira entrega ainda não tiver um caminho de
revisão ou confirmação funcional, ela deve permanecer isolada de publicação até
ter esse caminho: não apresentar uma tela que pareça guardar ou enviar algo que
não foi guardado ou enviado.

- **Permissão negada:** “O microfone está bloqueado. Libere o acesso nas
  configurações do navegador e tente de novo.” Ação: **Tentar novamente**.
- **Nenhum som ou trecho utilizável:** explicar o ocorrido e oferecer nova
  tentativa, sem nota nem vitória.
- **Navegador sem suporte:** explicar a limitação e orientar a abrir em um
  navegador compatível, sem prometer compatibilidade não testada.
- **Interrupção ou falha de rede/envio:** dizer o que foi ou não salvo, permitir
  nova tentativa quando possível e nunca criar um desafio como se o áudio
  tivesse sido enviado. Não prometer recuperação após fechar a página.
- **Análise indisponível:** identificar a medição ou validação indisponível; não
  transformar ausência de detector em confirmação de autenticidade.

Nenhum áudio vira post público por ter sido gravado. Publicação no mural requer
uma ação separada e consentimento explícito.

Na revisão, a pessoa pode escolher compartilhar o arquivo de áudio pelo próprio
aparelho ou baixá-lo. Abrir o menu de compartilhamento não prova envio a alguém;
caso o aparelho não aceite compartilhar o arquivo, oferecer o download. Isso
não cria duelo nem publicação no mural.

## Laudo v2 — entrega posterior

O laudo apresenta primeiro a **duração do trecho detectado**, em segundos e
centésimos, seguida de potência relativa ao ruído e frequência estimada apenas
quando a leitura for confiável. Uma medida indisponível aparece como
**“não foi possível medir”**. Não chamar o índice de potência de dB físico, nem
converter a proporção de graves do score antigo em frequência fundamental.
Textura é experimental e só entra com método e linguagem definidos.

O resultado antigo não deve ser renomeado como laudo v2. Se o resultado não
puder ser calculado com confiança, a tela oferece nova tentativa e não inventa
vencedor. A resposta rápida, tanto quanto a aparência do placar, faz parte da
experiência: o objetivo de 30 segundos será medido em aparelhos reais, incluindo
permissão e envio, sem promessa de controlar o tempo gasto no WhatsApp.

## Novo duelo — entrega posterior

Na implementação local, convite, resposta e placar usam a nova linguagem
visual da Arena. Após o resultado, compartilhar abre uma prévia do texto e
“Pedir revanche” inicia **um desafio independente**, que a própria pessoa pode
enviar ao mesmo adversário. Ainda não há rounds vinculados nem placar acumulado.
O player do placar só carrega o áudio após o pedido de quem está jogando e a
autorização do servidor.

- O convite mostra **“Você foi desafiado”** e **“Grave sua resposta para revelar
  o confronto”**, com uma ação direta. Não exibe duração, nota, onda ou áudio do
  criador; a prévia do link também não contém esses dados.
- O convidado pode tentar novamente antes de confirmar. A primeira resposta
  válida confirmada ocupa a vaga; outra pessoa vê que o desafio já foi respondido.
- Após confirmação e autorização real no servidor, mostrar os dois resultados,
  ouvir cada áudio, compartilhar o resultado ou pedir revanche. Empate e leitura
  inconclusiva têm mensagens próprias. A pessoa vê o que será compartilhado.
- Convite expirado, indisponível ou com áudio apagado tem mensagem clara e
  caminho para criar outro desafio. A proteção precisa valer no servidor e no
  acesso ao arquivo, não apenas na interface.

As URLs legadas `/b/:code`, `/x1/:code` e `/d/:id` não são convertidas
silenciosamente para uma promessa de duelo travado. Seu prazo, acesso e conteúdo
seguem o contrato anterior até uma decisão de compatibilidade implementada e
verificada. Um convite novo só pode receber a linguagem de trava quando ela
estiver efetivamente protegida.

## Liga semanal — entrega posterior

A entrada por convite identifica a liga, permite escolher apelido e gravar sem
cadastro obrigatório. A tela mostra o fuso e os limites da rodada, a melhor
marca válida de cada pessoa e o estado da própria participação. A ausência de
participantes é um convite para chamar amigos, nunca um ranking inventado.

Ao fechar a semana, o boletim mostra o texto antes de copiar ou compartilhar.
Ele não é enviado automaticamente ao WhatsApp. Convites podem ser revogados;
exclusão de áudio e efeitos sobre o placar precisam de regra explícita antes da
publicação. Preservar a política atual de retenção dos dados antigos.

## Rotas e preservação

| Entrada | Comportamento pretendido |
|---|---|
| `/` | Arena v2 quando a primeira jornada estiver pronta para integração. |
| `/arena` | Acesso à mesma Arena; não anunciar disponibilidade antes do aceite. |
| `/feed` | Feed social existente, incluindo conteúdo e anúncios. |
| `/?gravar=1` | Preservar o acesso legado ao compositor social, com encaminhamento que conserve o significado da intenção. |
| `/comunidades`, `/c/...`, perfis e páginas públicas | Manter conteúdo, endereços e ações existentes. |
| `/b/:code`, `/x1/:code`, `/d/:id` | Preservar acesso e comportamento de links antigos; novo duelo exige contrato separado ou versionado. |

Retornos da autenticação, da publicação e da navegação social que hoje apontam
para `/` devem ser revistos para não expulsar alguém do feed para a Arena. O
atalho **Mural** aponta para `/feed`; comunidades continuam com seu próprio
atalho. Antes de integrar, conferir essas transições na interface, não apenas as
rotas declaradas.

## Condições de aceite da interface

- Em larguras móveis de 320 a 430 px e em desktop, o botão principal e os
  textos cabem, sem sobreposição, corte ou rolagem horizontal; respeitar safe
  areas e áreas de toque de pelo menos 44 × 44 px.
- Navegação por teclado, foco visível, nomes acessíveis, contraste e movimento
  reduzido preservam a mesma informação e ações. Pedidos de microfone não são
  disparados ao abrir ou por navegação de foco.
- Conferir a rota real em desktop e mobile, com capturas comparáveis e contrato
  visual E2E. Verificar sessão anônima e com perfil pendente, permissão negada,
  interrupção e retorno ao feed.
- Testar em Safari iOS e Chrome Android físicos gravação, parada e permissão;
  emulador e teste automatizado não substituem essa prova.
- Testar links legados e `/?gravar=1`, incluindo retorno após login e publicação.
  Para o novo duelo, testar acesso direto aos dados antes da resposta e abertura
  de convite no WhatsApp real.

## Prévia local de trabalho

Com `npm run dev`, abrir `/prever-arena-v2.html` para conferir a primeira tela
sem sessão nem banco. A prévia grava apenas no aparelho e termina na revisão; o laudo exibido é
experimental e ainda não serve como resultado competitivo. Não há publicação
nem duelo. Essa entrada não integra o
build de produção. Os links de Mural e Comunidades levam ao aplicativo normal,
que ainda precisa da configuração habitual do Supabase.
