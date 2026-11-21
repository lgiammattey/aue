import React from 'react';

import { TopArrotadoresDaHome } from '../novo-aue/TopArrotadoresDaHome';
import { LayoutPublico, LinksPublicos, SecaoPublica } from './LayoutPublico';

/** `/ranking-de-arrotos` mostra o placar ao vivo dos melhores áudios avaliados e explica o laudo. */
export const RankingDeArrotos: React.FC = () => (
  <LayoutPublico
    eyebrow="PLACAR"
    titulo="Ranking de arrotos no Auê"
    resumo="Os mais pesados da casa. Aperta o play."
  >
    <SecaoPublica eyebrow="TOP 5" titulo="Top arrotadores">
      <TopArrotadoresDaHome variante="painel" ocultarCabecalho />
    </SecaoPublica>

    <SecaoPublica eyebrow="LAUDO" titulo="Como sai a nota">
      <p>
        Mede a duração detectada e a potência relativo ao ruído do ambiente — varia com o aparelho e o lugar,
        não é decibel.
      </p>
      <p>
        Frequência ainda indisponível. Se o áudio falhar, sai sem nota.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="ENTRA AÍ" titulo="Quer subir no placar?">
      <p>
        Grava na Arena ou manda no Mural. Só vai pro ar se você quiser.
      </p>
      <LinksPublicos
        links={[
          { para: '/arena', rotulo: 'Arena' },
          { para: '/como-jogar', rotulo: 'Como funciona' },
          { para: '/tipos-de-arroto', rotulo: 'Tipos de arroto' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
