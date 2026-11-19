import React from 'react';

import { LinksPublicos, SecaoPublica } from './LayoutPublico';
import { LayoutArenaPublica as LayoutPublico } from './LayoutArenaPublica';

/**
 * `/como-jogar` — a página que explica o Auê por escrito. A URL fica (ela está
 * no sitemap e no canonical); o texto agora diz "como funciona", porque o Auê
 * é a comunidade de quem gosta de arrotar e a Arena é só uma parte dela.
 *
 * A ordem segue a jornada: comunidades, Arena, áudio, navegador.
 *
 * Ela não cria estado da Arena nem muda o loop. Também não usa o gate `ehDesktop`: quem chega por busca abre do
 * telefone.
 *
 * O QUE ESTÁ ESCRITO AQUI É SÓ O QUE O PRODUTO FAZ HOJE. Nada de "em breve",
 * nada de recurso desligado por flag.
 */
export const ComoJogar: React.FC = () => (
  <LayoutPublico
    eyebrow="Guia rápido"
    titulo="Como funciona o Auê"
    resumo="Seu arroto merece mais do que desaparecer no sofá. Grave, dê o play e decida se a obra vai ganhar plateia."
  >
    <SecaoPublica eyebrow="O mural" titulo="Toda lenda tem sua torcida">
      <p>
        No mural, dá pra acompanhar as publicações públicas da galera. Pra publicar ou responder, você precisa de uma conta.
      </p>
      <p>Quer levar a resenha pro zap? Os grupos de WhatsApp ficam fora do Auê.</p>
      <LinksPublicos
        links={[
          { para: '/feed', rotulo: 'Abrir o mural' },
          { para: '/grupos', rotulo: 'Grupos externos' },
        ]}
      />
    </SecaoPublica>

    <SecaoPublica eyebrow="A Arena" titulo="Microfone pronto. Solta o som.">
      <p>
        Toque pra gravar, solte o arroto e dê o play. O microfone só é pedido quando você decide gravar. Quando disponível, a medição de duração e potência relativa é experimental.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="Seu áudio" titulo="Seu arroto, suas regras">
      <p>
        Ficou bom? Baixe ou compartilhe em aparelhos compatíveis. O áudio não é publicado automaticamente no mural.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="Sem instalar" titulo="Sem download. Sem desculpa.">
      <p>
        A Arena funciona no navegador do celular ou computador, de graça e sem baixar um aplicativo. Pra gravar, nem precisa de cadastro.
      </p>
      <LinksPublicos links={[{ para: '/privacidade', rotulo: 'O que o Auê faz com o seu áudio' }]} />
    </SecaoPublica>
  </LayoutPublico>
);
