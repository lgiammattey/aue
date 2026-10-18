import React from 'react';

import { LayoutLegal, QuemResponde, RodapeLegal, Secao } from './LayoutLegal';
import { ANUNCIOS_ATIVOS } from './anunciosAtivos';

/**
 * Política de privacidade.
 *
 * O QUE ESTE ARQUIVO É: a descrição HONESTA do que o app faz com o áudio e com
 * a identidade das pessoas. Cada afirmação aqui corresponde a comportamento
 * verificável no código ou nas migrações, e está anotada com onde conferir.
 *
 * O QUE ELE NÃO É: um documento jurídico revisado por advogado.
 *
 * O responsável publicado é a Buildea Labs, decidido por Luiz em 2026-08-08 —
 * ver `QuemResponde` em `LayoutLegal.tsx`. O único ramo vermelho que sobrou é o
 * do canal de contato, e ele só aparece quando a build sai sem
 * `VITE_CONTATO_PRIVACIDADE`.
 *
 * AS REGRAS DE USO SAÍRAM DAQUI para `/termos` (`TermosDeUso.tsx`). Esta página
 * fala do que acontece com o dado; a outra, do que a pessoa pode e não pode
 * fazer. Ver o cabeçalho de `LayoutLegal.tsx` para o porquê de serem duas rotas.
 *
 * ALCANÇÁVEL DE TODO LUGAR, e não só do desktop. A lei brasileira não distingue
 * dispositivo, e o aviso de uma linha do `AudioRecorder` precisa levar a algum
 * lugar. O que a versão mobile não tem é um item de MENU para cá — só o link
 * dentro do aviso, no momento em que ele importa.
 */
export const PoliticaDePrivacidade: React.FC = () => {
  const contato = import.meta.env.VITE_CONTATO_PRIVACIDADE as string | undefined;

  return (
    <LayoutLegal rotulo="Privacidade">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        Em linguagem direta, sem letra miúda. Se algo aqui não bater com o que o
        app faz, o errado é o app.
      </p>

      <Secao titulo="Conta é opcional">
        <p>
          Dá para jogar sem conta. Ao abrir o site, o app cria uma identidade
          anônima para o seu aparelho, só para guardar a sua gravação e ligá-la à
          sua batalha. Ela não tem nome, e-mail nem qualquer dado seu.
        </p>
        <p>
          Se limpar os dados do navegador, essa identidade anônima se perde e você
          passa a ser tratado como uma pessoa nova. As gravações antigas continuam
          existindo, mas deixam de ser reconhecidas como suas, o que inclui perder
          a possibilidade de apagá-las pelo app.
        </p>
        <p>
          Quem quiser pode <strong>criar uma conta com e-mail e senha</strong>. A
          conta aproveita a identidade que você já tinha: seus arrotos, causos e
          comentários continuam seus. O e-mail serve para confirmar a conta, para
          você entrar de outro aparelho e para recuperar a senha. Nada além disso.
        </p>
      </Secao>

      <Secao titulo="O que guardamos de quem cria conta">
        <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
          <li>
            <strong>E-mail e senha.</strong> Ficam no serviço de autenticação do
            Supabase, nosso provedor de banco de dados. A senha é guardada
            embaralhada (hash); nem a equipe do Auê consegue ler a sua senha. O
            e-mail nunca aparece no seu perfil nem para outros jogadores.
          </li>
          <li>
            <strong>Dados do perfil.</strong> Apelido, @, bio, cidade, foto e os
            @ das suas redes sociais, quando você preenche. São públicos (veja
            abaixo). A foto é reduzida no seu aparelho antes de subir.
          </li>
          <li>
            <strong>O que você faz no jogo.</strong> Seus resultados, causos,
            comentários, reações e quem você segue.
          </li>
        </ul>
        <p>
          O e-mail não é usado para propaganda e não é vendido nem repassado a
          terceiros. Hoje o Auê não manda e-mail de novidade; os e-mails que saem
          são os de confirmação de conta e de nova senha.
        </p>
      </Secao>

      <Secao titulo="O que é público no Bonde">
        <p>
          Tudo o que você coloca no Bonde pode ser visto por qualquer pessoa, sem
          conta:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
          <li>seu perfil: apelido, @, foto, bio, cidade, links das redes que você informar, título, quando entrou, quantidade de causos, quem você segue e quem segue você, e a sua melhor nota <em>entre os causos publicados</em>;</li>
          <li>seus causos, comentários e respostas;</li>
          <li>a nota e o áudio de um causo, <strong>só se você marcou a autorização de publicar o arroto</strong> na hora de postar.</li>
        </ul>
        <p>
          <strong>Gravar para jogar não é autorizar a publicação.</strong> Um
          arroto gravado para um duelo ou para testar a nota não vai para o Bonde.
          Ele só vira público quando você toca em publicar e marca o aceite.
          Notas de jogos que você não publicou não aparecem no seu perfil.
        </p>
        <p>
          Duas coisas que você precisa saber: a lista de quem segue quem e de quem
          reagiu a quê pode ser consultada tecnicamente por qualquer pessoa com
          conhecimento para isso, mesmo que nenhuma tela do app a mostre; e
          conteúdo público pode ser copiado, printado ou ouvido por quem tiver o
          endereço do áudio antes de você apagar. A foto de perfil fica numa
          pasta pública: quem tiver o endereço dela consegue abri-la, mesmo fora
          do app. Dá para remover a foto na tela de editar o perfil.
        </p>
        <p>
          <strong>Apagar o que você publicou:</strong> no menu de cada causo seu
          há <strong>"Apagar meu causo"</strong>. Ele apaga o texto, os comentários
          e, se houver, o arquivo de áudio. Se o servidor não apagar, o app diz que
          não apagou.
        </p>
      </Secao>

      <Secao titulo="O microfone">
        <p>
          O acesso ao microfone é pedido pelo seu próprio navegador, e só no
          momento em que você toca em gravar. Nada é capturado antes disso, e o
          microfone é liberado assim que a gravação termina. A gravação dura no
          máximo 10 segundos.
        </p>
      </Secao>

      <Secao titulo="O que acontece com o seu áudio">
        <p>
          O áudio é enviado e guardado no Auê. Ele fica disponível para quem
          abrir a batalha em que você gravou.
        </p>
        <p>
          <strong>Isso não é um segredo, e não vamos fingir que é.</strong> O
          endereço do áudio é assinado e temporário, mas a chave pública do app
          é, por natureza, pública — então qualquer pessoa com conhecimento
          técnico consegue ouvir qualquer gravação que não tenha sido escondida.
          Se você não quer que algo seja ouvido, não grave.
        </p>
        <p>
          Você pode apagar a sua gravação no botão <strong>"Apagar o meu
          arroto"</strong>. Ele aparece na tela do desafio que você criou e na
          sua linha do placar — ou seja, enquanto você tiver o link daquela
          disputa aberto no mesmo navegador. O som sai do servidor na hora, e a
          nota da disputa continua lá.
        </p>
        <p>
          <strong>Se o arquivo não sair, o app diz que não saiu.</strong> Ele
          não escreve "apagado" enquanto a gravação estiver no servidor — e você
          pode tentar de novo.
        </p>
        <p>
          Duas coisas que continuam valendo, e não temos como mudar: se você
          perder o link da disputa ou limpar os dados do navegador, o app não
          reconhece mais aquelas gravações como suas e a exclusão passa a
          depender de um pedido pelo contato abaixo. E quem já tiver baixado o
          arquivo continua com ele, o que vale para qualquer coisa publicada em
          qualquer lugar da internet.
        </p>
      </Secao>

      {/*
        RETENÇÃO — a seção mais fácil de escrever errado.

        Decisão de produto de Luiz: passados os 7 dias, o ACESSO é bloqueado e o
        ARQUIVO É MANTIDO. Não existe rotina de expurgo, nem prazo, nem plano de
        prazo. O texto anterior dizia "as gravações não são apagadas
        automaticamente", o que é verdade mas deixa a pessoa completar a frase
        sozinha com um prazo que ela imagina. Aqui isso está dito com todas as
        letras: retenção por tempo indeterminado.

        NÃO INVENTE UM PRAZO AQUI. Um prazo escrito numa política é uma promessa
        que alguém precisa cumprir com código que não existe.
      */}
      <Secao titulo="Os áudios ficam guardados, sem prazo para sair">
        <p>
          O <strong>link</strong> de uma batalha para de funcionar depois de 7
          dias. A partir daí ninguém consegue abrir aquela disputa nem ouvir o
          que foi gravado ali pelo app. <strong>O que expira é o acesso.</strong>
        </p>
        <p>
          <strong>O arquivo continua guardado.</strong> Ele não é apagado no
          sétimo dia nem depois: não existe prazo de exclusão automática, e
          inventar um aqui seria mentira. O áudio de um arroto só aparece
          no Bonde se você publicar com o aceite. Mudar isso, como usar gravações
          para outra finalidade, só acontece com aviso aqui antes. Nenhuma
          gravação é usada para treinar modelo.
        </p>
        <p>
          Na prática: apagar é com você, e o botão está onde você vê o seu
          próprio arroto — no desafio que você criou e na sua linha do placar.
          Enquanto tiver o link da disputa e o mesmo navegador, dá para apagar
          quando quiser. Perdeu o link ou limpou o navegador, aí a exclusão
          passa a depender de um pedido pelo contato abaixo.
        </p>
      </Secao>

      {/*
        TELEMETRIA — eventos anônimos de PRODUTO, não de publicidade.
        Migração `20260826000001_telemetria_de_eventos.sql`: tabela
        write-only para o cliente (sem SELECT/UPDATE/DELETE), sem nome,
        e-mail, IP, áudio ou texto digitado. A seção "O que o Auê não faz"
        logo abaixo continua verdadeira: isto não é Google Analytics, não é
        pixel de rede social e não é rastreamento publicitário — é o próprio
        Auê contando quantas pessoas passam de uma tela para a outra.
      */}
      <Secao titulo="Eventos de uso, para entender o jogo">
        <p>
          O Auê registra alguns eventos anônimos enquanto você joga — abrir o
          jogo, gravar um arroto, receber a nota, desafiar alguém, responder,
          pedir revanche. É o que permite entender em que ponto o jogo perde
          gente e o que melhorar.
        </p>
        <p>
          Cada evento carrega só o nome do que aconteceu, o horário, um código
          de sessão aleatório (trocado sozinho depois de um tempo sem uso) e,
          quando você chegou por um link de campanha, de onde você veio. Nunca
          carrega nome, e-mail, IP, o áudio do seu arroto ou qualquer texto que
          você tenha digitado. Ninguém, nem o próprio app, consegue ler esses
          eventos de volta — só quem administra o banco de dados enxerga o
          total.
        </p>
      </Secao>

      <Secao titulo="Denúncia e moderação">
        <p>
          Toda gravação e todo causo têm um botão de denúncia. Quando três pessoas
          diferentes denunciam o mesmo conteúdo, ele é escondido automaticamente e
          deixa de aparecer para qualquer pessoa. Uma decisão tomada à mão sobre
          uma gravação não é desfeita por denúncias posteriores.
        </p>
        <p>
          A denúncia guarda quem denunciou e o motivo, só para a moderação. Quem
          foi denunciado não é avisado de quem foi.
        </p>
      </Secao>

      {/*
        ANÚNCIOS — texto DERIVADO da configuração, não escrito à mão.

        Ver `anunciosAtivos.ts`: a frase muda junto com as variáveis do AdSense,
        e `coerenciaDeAnuncios.test.tsx` monta a tela de resultado para conferir
        que os dois lados concordam. Antes, esta afirmação era uma frase solta na
        lista de "o que o Auê não faz" — e bastava preencher duas variáveis na
        Vercel para o documento legal publicado virar mentira, sem nada quebrar.
      */}
      <Secao titulo="Anúncios">
        {ANUNCIOS_ATIVOS ? (
          <>
            <p>
              Esta versão <strong>exibe anúncios do Google AdSense</strong>. Eles
              aparecem depois do conteúdo, nunca encostados nos botões de ação.
            </p>
            <p>
              Para servir esses anúncios, o Google carrega um script no seu
              navegador e pode gravar cookies ou identificadores no seu aparelho.
              Esse tratamento é do Google e segue as políticas dele, não as
              nossas. O Auê não envia ao Google a sua gravação, a sua nota nem
              qualquer coisa ligada à sua identidade anônima.
            </p>
          </>
        ) : (
          <p>
            <strong>Não exibe anúncios nesta versão.</strong> Nenhum script de
            publicidade é carregado e nenhum cookie de anúncio é gravado no seu
            aparelho.
          </p>
        )}
      </Secao>

      <Secao titulo="O que o Auê não faz">
        <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
          <li>Não usa Google Analytics nem nenhuma ferramenta de rastreamento.</li>
          <li>Não tem pixel de rede social.</li>
          <li>Não pede acesso a contatos, câmera, localização ou arquivos.</li>
          <li>Não vende, aluga nem compartilha gravações nem e-mails com terceiros.</li>
        </ul>
      </Secao>

      <Secao titulo="Quem gravou junto">
        <p>
          Na disputa presencial, uma pessoa usa o próprio aparelho para gravar
          várias. Quem opera o aparelho é responsável por avisar as demais de que
          estão sendo gravadas e de que o áudio fica guardado. O app não tem como
          pedir isso a cada uma.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          A Lei Geral de Proteção de Dados garante a você acesso, correção e
          exclusão dos seus dados. Na prática: o perfil você corrige direto na
          tela de perfil; causos e áudios você apaga pelo próprio app; e o que o
          app não alcança, como <strong>excluir a conta inteira</strong> (e-mail,
          perfil e histórico), é por pedido pelo contato abaixo. Ainda não existe
          botão para isso.
        </p>
        {contato ? (
          <p>
            Para pedidos, escreva para{' '}
            <a href={`mailto:${contato}`} style={{ color: 'var(--accent)' }}>
              {contato}
            </a>
            . Para conta, escreva do e-mail cadastrado. Para um áudio sem conta,
            informe o link da batalha e a posição da gravação — sem eles, não há
            como localizar o áudio, porque a identidade anônima não guarda nada
            que identifique você.
          </p>
        ) : (
          /*
            Sem `VITE_CONTATO_PRIVACIDADE` configurada, a página NÃO inventa um
            endereço: declarar indisponível é melhor do que oferecer um caminho
            que não existe.

            Desde que a tela de ajustes saiu do produto (#109), ESTA página é
            o endereço do pedido de exclusão — e ela é rota pública, fora de
            flag e fora do gate de desktop. A Arena também tem "Apagar o meu
            arroto" no menu dela.

            O valor de lançamento existe e está no `.env.example`. Este ramo
            continua de pé porque `VITE_*` é resolvida em tempo de BUILD: um
            deploy feito sem a variável no ambiente publica a política com este
            aviso vermelho, e configurá-la depois no painel não conserta — exige
            build novo. É item do checklist de lançamento, não decoração.
          */
          <p style={{ color: 'var(--danger)' }}>
            O canal de contato ainda não foi configurado nesta publicação.
          </p>
        )}
      </Secao>

      <QuemResponde />

      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
        Esta página muda junto com o app. Quando algo relevante mudar, o texto
        muda antes.
      </p>

      <RodapeLegal paraOnde="/termos" rotulo="Ler também os termos de uso →" />
    </LayoutLegal>
  );
};
