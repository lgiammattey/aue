import React from 'react';
import { Link } from 'react-router-dom';

import { LayoutLegal, QuemResponde, RodapeLegal, Secao } from './LayoutLegal';

/**
 * Termos de uso — a segunda página exigida pelo Contrato MVP1 §3.10
 * ("política de privacidade **e** termos/política de uso ... em páginas
 * públicas"). Até esta mudança ela simplesmente não existia: a palavra "termos"
 * não aparecia em `src/`.
 *
 * A DIVISÃO ENTRE OS DOIS DOCUMENTOS: `/privacidade` fala do que acontece com o
 * dado; `/termos` fala do que a pessoa pode e não pode fazer, e do que o Auê
 * promete (pouco) em troca. A seção "Regras de uso" que morava na política veio
 * para cá, ampliada.
 *
 * TUDO AQUI DESCREVE COMPORTAMENTO QUE EXISTE. Nada de "podemos suspender sua
 * conta" — não há conta. Nada de "plano premium" — o Auê+ está desligado no
 * corte e cobrar nada é cobrar nada. Se uma cláusula não corresponde a algo que
 * o código faz, ela não entra.
 *
 * A IDADE MÍNIMA (13 anos) vem do protótipo (`legal.html`), que é a fonte de
 * produto mais próxima de uma decisão registrada sobre o assunto. O que MUDOU em
 * relação a ele: o protótipo diz "conforme verificado na Entrada", e no app não
 * existe verificação nenhuma. Então aqui isso está escrito como o que é — uma
 * regra, não um portão.
 */
export const TermosDeUso: React.FC = () => (
  <LayoutLegal rotulo="Termos de uso">
    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
      As regras da brincadeira. Curtas, porque o Auê é curto.
    </p>

    <Secao titulo="O que o Auê é">
      <p>
        Uma comunidade de quem gosta de arrotar. Dá para ler, ouvir e
        conversar. A Arena está sendo preparada; quando abrir, vai analisar o
        som e devolver uma nota de 0 a 100.
      </p>
      <p>
        <strong>A nota é brincadeira</strong>, não medição científica de coisa
        nenhuma. Não serve de prova, de laudo, nem de argumento em discussão de
        bar — embora vá ser usada exatamente para isso.
      </p>
      <p>
        Usar o Auê é de graça. Nesta versão não existe cobrança, assinatura, nem
        compra dentro do app: não há nada para pagar e nada para cancelar. A
        conta, com e-mail e senha, é opcional.
      </p>
    </Secao>

    <Secao titulo="Ao usar o Auê, você concorda com isto">
      <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6 }}>
        <li>Enviar só gravações feitas por você, ou por quem sabe que está sendo gravado e topou.</li>
        <li>Não mandar conteúdo sexual, discurso de ódio, ameaça, assédio ou crime.</li>
        <li>Não usar o Auê para expor, humilhar ou perseguir alguém.</li>
        <li>Não se passar por outra pessoa no apelido, no @ ou no perfil.</li>
        <li>Só publicar numa Roda o que você tem direito de publicar. O que você posta ali é público.</li>
        <li>Não tentar quebrar, sobrecarregar ou automatizar o serviço.</li>
      </ul>
      <p>
        A régua é simples: se você não mandaria no grupo da família, não mande
        aqui.
      </p>
    </Secao>

    <Secao titulo="A gravação continua sua">
      <p>
        O áudio é seu. O que você dá ao Auê é permissão para guardá-lo e tocá-lo
        dentro do app para quem abrir a batalha em que você gravou — que é o
        mínimo para o produto funcionar. Para o arroto aparecer numa Roda, você
        precisa publicar e marcar a autorização na hora; ao fazer isso, você
        permite que qualquer pessoa o ouça e comente.
      </p>
      <p>
        Onde isso fica guardado, por quanto tempo e quem consegue ouvir está na{' '}
        <Link to="/privacidade" style={{ color: 'var(--publico-verde)' }}>
          política de privacidade
        </Link>
        . Leia essa parte: ela é a que tem consequência.
      </p>
    </Secao>

    <Secao titulo="Moderação">
      <p>
        Toda gravação tem botão de denúncia. Com três denúncias de pessoas
        diferentes, ela é escondida automaticamente e para de tocar para todo
        mundo. Gravação escondida à mão não volta por falta de denúncia nova.
      </p>
      <p>
        Resenhas, comentários e perfis também podem ser denunciados e escondidos. A
        moderação age primeiro sobre o conteúdo. Quem abusar repetidamente pode
        ter a conta ou o acesso bloqueados.
      </p>
    </Secao>

    <Secao titulo="Idade">
      <p>
        O Auê não é para menores de 13 anos.{' '}
        <strong>Não existe verificação de idade no app</strong> — nenhuma tela
        pergunta, nenhum sistema confere. Isto é uma regra, não um portão, e
        depende de quem usa e de quem é responsável por quem usa.
      </p>
    </Secao>

    <Secao titulo="Sem garantia, e sem promessa de amanhã">
      <p>
        O serviço é oferecido como está, de graça e sem garantia de
        disponibilidade. Ele pode sair do ar, ficar lento, perder uma gravação,
        mudar de ideia sobre uma funcionalidade ou simplesmente acabar.
      </p>
      <p>
        O Auê não se responsabiliza pelo que as pessoas gravam nem pelo que fazem
        com o link depois de recebê-lo. Um link de batalha é público para quem o
        tiver.
      </p>
    </Secao>

    <Secao titulo="Estas regras podem mudar">
      <p>
        Quando mudarem, mudam nesta página, antes de valer. Mudança que mexa no que
        você já publicou ou no uso do seu e-mail é avisada também no app.
      </p>
    </Secao>

    <QuemResponde />

    <RodapeLegal paraOnde="/privacidade" rotulo="Ler também a política de privacidade →" />
  </LayoutLegal>
);
