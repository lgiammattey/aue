# Missão 0035 — Auê: arena, desafio e revanche

## 1. Enquadramento (Tiago)

- **Dor:** o visitante chega a um feed e a Arena aparece como indisponível. O jogo entre amigos fica longe do primeiro toque.
- **Comportamento:** a entrada leva à gravação sem cadastro obrigatório; a pessoa recebe um laudo honesto e pode desafiar alguém. No novo duelo, o áudio e a marca do criador só aparecem após uma resposta válida. Uma liga privada reúne a turma por rodada semanal.
- **Preservação:** manter conteúdo social e `/feed`, comunidades, perfis, anúncios no feed e links antigos `/b/`, `/x1/`, `/d/` e `/?gravar=1`. Não mudar silenciosamente prazo, acesso ou retenção de dados antigos.
- **Pista:** Full flow sistêmica. Muda entrada, áudio, contratos, privacidade e hospedagem.
- **Fontes afetadas:** visão, escopo, jornada, regras, mapa de páginas e decisões técnicas. A nova direção foi pedida pelo Luiz em 17/11/2026; documentos anteriores descrevem o produto antigo até serem atualizados.

## 2. Donos e fronteiras (Iury)

- **Produto e aceite:** Tiago; **coordenação:** Iury; **tela e fluxo:** Rian e Kayky; **áudio e backend:** Lucas; **arquitetura:** Camillo; **SEO:** Rodrigo; **prova:** Marcelo.
- **Gate arquitetural:** em andamento. Qualquer mudança no contrato de dados ou na infraestrutura de HTML exige desenho e testes antes da integração.
- **Decisões para não bloquear a primeira etapa:** preservar prazo de sete dias e comportamento de links antigos; manter anúncios no feed e retenção atual. A política da nova liga e eventual prazo diferente serão documentados antes de sua implementação.

## 3. Sequência e desenho

1. Entrada e gravação: home escura com marca, desafio editorial sem placar inventado, botão central de gravar e acesso ao mural; feedback visual silencioso, duração, parada e erro de permissão. O microfone só é pedido após ação da pessoa.
2. Laudo versionado: duração do trecho detectado, potência relativa ao ambiente e frequência apenas quando confiável. `dB SPL` não é medido. Não converter grave em Hz nem apresentar o score antigo como novo laudo.
3. Duelo travado: convite sem spoiler, resposta válida atômica e acesso ao áudio somente após autorização do servidor; resultado e revanche. O link por si só não transforma dado em público.
4. Compartilhamento e SEO: cartão sem dados do adversário antes da resposta; HTML público real, canonical, sitemap e noindex para convites; sem repetir a solução de HTML do gateway Supabase já rejeitada no ADR 0003.
5. Liga privada: rodada semanal, melhor duração válida por pessoa, fuso explícito, boletim para copiar e controles de acesso.

A primeira etapa não deve anunciar laudo v2, liga ou duelo travado antes de seus contratos existirem. Não substituir o feed nem apagar dados.

## 4. Matriz de aceite

| Critério observável | Prova | Estado |
|---|---|---|
| Entrada vai à gravação sem exigir cadastro; feed e links antigos continuam acessíveis | testes de rotas e navegador | pendente |
| Microfone abre por toque e encerra ao finalizar, interromper ou sair; permissão tardia não vaza stream | testes do ciclo e aparelhos reais | pendente |
| Laudo não inventa dB físico ou pitch e informa medições indisponíveis | testes de sinais e aparelhos reais | pendente |
| Convite não revela nota nem áudio antes de resposta; duas respostas simultâneas não ocupam a mesma vaga | testes de API, RLS/Storage e integração | pendente |
| Links e conteúdo sociais, incluindo `/?gravar=1`, continuam funcionando | testes de regressão e navegador | pendente |
| Prévia no WhatsApp e HTML público apresentam conteúdo correto sem expor dados privados | inspeção HTTP, navegador e WhatsApp real | pendente |
| Liga fecha a semana no fuso indicado e boletim corresponde ao resultado | testes de calendário, permissão e fluxo completo | pendente |
| Interface confere em desktop e mobile; teclado, toque, safe area e movimento reduzido | inspeção visual e dispositivos | pendente |
| typecheck, lint, testes e build passam | execução local e CI | pendente |

## 5. Encerramento

- **Estado:** em implementação; nenhuma evidência de produção nova.
- **Parecer de qualidade:** não validado.
- **Aceite final:** não validado.

## 6. Pesquisa de mercado e hipóteses a testar

O estudo entregue pelo Luiz em 17/11 reforça a aposta em convites entre amigos,
ligas e uma apresentação de esporte sério. Serve como hipótese, não como prova
que homens brasileiros vão gravar e convidar outras pessoas. A primeira validação
é observar grupos reais com consentimento e medir o fluxo de ponta a ponta.

- Compartilhamento no Brasil começa por links que funcionem no WhatsApp; conteúdo
  para vídeo curto e outros países é hipótese posterior, não dependência do jogo.
- A comparação de quase 6x é do Snapchat, não de WhatsApp nem de todos os chats;
  a pesquisa foi encomendada pela Snap e não incluiu o Brasil. [Fonte original](https://forbusiness.snapchat.com/blog/how-to-laugh-and-win-nextgen?lang=en-US).
- Os 152 milhões no relatório brasileiro são alcance publicitário adulto do
  TikTok, não tamanho do mercado do Auê nem contagem garantida de pessoas únicas.
  [DataReportal](https://datareportal.com/reports/digital-2027-brazil).
- A remoção definitiva de PWAs e push no iOS na União Europeia, afirmada no
  estudo, não serve de premissa: o comportamento foi restaurado no iOS 17.4
  estável. Suporte deve ser testado por versão, país e modo de uso.
  [Registro WebKit](https://bugs.webkit.org/show_bug.cgi?id=268643).
- As contas de receita, conversão e retenção do estudo são cenários, não previsão
  do Auê. D1, conclusão da gravação, abertura e resposta ao convite são sinais
  para definir depois de termos denominadores e coortes reais. Não declarar
  envio pelo WhatsApp só porque a folha de compartilhamento abriu.
- Card estático não contém áudio; vídeo com áudio é outra entrega e depende de
  suporte, custo e teste. Não prometer exportação 9:16 em vídeo na primeira fase.
- Não usar silêncio nas bordas, clipping ou YAMNet como prova de que uma gravação
  é autêntica. Não exigir bebida para jogar, nem condicionar a brincadeira a
  álcool. Moderação e privacidade acompanham conteúdo enviado desde o início.

### Como a pesquisa decide o rumo

A identidade inteira está aberta a revisão: tom, texto, layout, animação, imagens,
cores e tipografia. Cada escolha é uma hipótese a confrontar com comportamento
real, não uma restrição herdada.

O objetivo é recuperar o Auê com um jogo que as pessoas realmente queiram usar,
compartilhar e repetir. Nem o formato antigo nem a proposta v2 são sagrados.
A primeira aposta é desafio entre amigos; a validação pode levar a mudar fluxo,
categorias, público, liga ou posicionamento. Entrevistas e observação com grupos
reais complementam os números; não tratar todos os homens como um perfil único.

Antes de chamar aquisição de sucesso, separar visitas, gravações concluídas,
convites preparados, convites abertos e respostas concluídas, por coorte e com
contagens suficientes para entender a incerteza. Investigar por que as pessoas
não gravam ou não respondem. Uma meta não atingida sugere investigação, não
obriga pivot automático com base em amostra pequena ou dado incompleto. Não há
previsão de receita nem prazo de duas semanas garantidos pela pesquisa.

## 7. Andamento local — 17/11/2026

A prévia local usa uma captura para arquivo e PCM, com calibração anterior à
emissão, fallback voluntário para gravar sem laudo e revisão antes de qualquer
compartilhamento. O laudo `experimental-2` mede duração detectada e potência
relativa quando a amostra permite; frequência ainda aparece indisponível. Uma
mudança súbita no ambiente pode tornar a medição inconclusiva. Limiares ainda
não foram validados em aparelhos reais. A prévia gera áudio de reprodução
apenas com as amostras posteriores à calibração; sons posteriores continuam nele.

A entrada local pode ser ligada na raiz e em `/arena` por flag de build,
desligada por padrão; a produção ainda não foi alterada. Ela não cria duelos nem
ligas. O atalho `/?gravar=1` e `/feed` continuam no fluxo anterior. Antes de
qualquer envio, comprovar a reprodução e a separação em aparelhos reais, além
de permitir a revisão conforme o plano arquitetural. Os testes automatizados não comprovam Safari iOS, Android,
compartilhamento ou comportamento com usuários reais.

## 8. Duelo local — 17/11/2026

As três migrations, a porta de cliente e os componentes de criação e resposta
são trabalho local, sem aplicação ao Supabase remoto nem integração com as
rotas publicadas. A primeira isola gravações, bloqueia leitura antes da resposta
e prepara exclusão/denúncia. A segunda adiciona token gerado pelo cliente,
repetição idempotente, reemissão/revogação com versão e recuperação do duelo
pela identidade. A terceira permite denunciar por duelo recuperado, mesmo sem o
token original. Resultados usam duração declarada pelo cliente e são
provisórios: não comprovam autenticidade nem justiça competitiva.

O teste em PGlite com Auth e Storage simulados cobre privacidade, denúncia,
exclusão lógica e convites; não comprova API HTTP, política combinada, remoção
física ou corridas reais. A criação do bucket fica fora das migrations: deve ser
feita pela Storage API e a configuração verificada antes de aplicar. Descarte
após upload incerto mantém estado pendente; upload já iniciado pode conservar o
Blob até terminar. A recuperação de uploads órfãos após recarga, proteção contra
abuso distribuído e a validação em staging permanecem pendentes. Nenhuma dessas
notas é autorização ou prova de publicação.
