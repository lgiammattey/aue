import React from 'react';

import { LayoutPublico, LinksPublicos, SecaoPublica } from './LayoutPublico';

/** `/ranking-de-arrotos` explica a Arena atual sem apresentar um ranking que não existe. */
export const RankingDeArrotos: React.FC = () => (
  <LayoutPublico
    eyebrow="Arena experimental"
    titulo="Ranking de arrotos no Auê"
    resumo="A Arena já permite gravar e ouvir sua tentativa. O ranking ainda não está disponível."
  >
    <SecaoPublica eyebrow="Laudo experimental" titulo="O que a Arena mede?">
      <p>
        Quando a medição funciona, o laudo mostra a duração detectada e um índice de potência
        relativo ao ruído do ambiente. A leitura depende do aparelho e do lugar onde você gravou.
      </p>
      <p>
        Esse índice não mede volume físico em decibéis. A frequência ainda aparece como
        indisponível, e uma gravação também pode ficar sem laudo.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="O que vem depois" titulo="O Auê tem ranking de arrotos?">
      <p>
        Ainda não há ranking de arrotos. A Arena oferece gravação e laudo experimental no navegador.
      </p>
      <p>
        A gravação fica na sua tela até você escolher compartilhá-la ou baixá-la.
      </p>
      <LinksPublicos
        links={[
          { para: '/arena', rotulo: 'Conhecer a Arena' },
          { para: '/como-jogar', rotulo: 'Como funciona o Auê' },
          { para: '/tipos-de-arroto', rotulo: 'Conhecer os tipos de arroto' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
