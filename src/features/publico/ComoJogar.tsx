import React from 'react';

import { LayoutPublico, LinksPublicos, SecaoPublica } from './LayoutPublico';

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
    resumo="O Auê é a comunidade de quem gosta de arrotar. Você entra, ouve, conversa e pode gravar seu arroto na Arena."
  >
    <SecaoPublica eyebrow="As comunidades" titulo="Cada turma tem seu canto">
      <p>
        Quem gosta de arrotar se junta por comunidade. Dá pra ler e ouvir tudo sem conta; pra
        publicar e responder, precisa de conta.
      </p>
      <p>Os grupos de WhatsApp e Telegram são outra coisa: ficam fora do Auê.</p>
      <LinksPublicos
        links={[
          { para: '/comunidades', rotulo: 'Ver as comunidades' },
          { para: '/grupos', rotulo: 'Grupos externos' },
        ]}
      />
    </SecaoPublica>

    <SecaoPublica eyebrow="A Arena" titulo="Grave na Arena">
      <p>
        Você pode gravar e ouvir seu arroto. O microfone só é pedido quando você decide gravar.
        Quando disponível, a medição de duração e potência relativa é experimental.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="Seu áudio" titulo="Você decide o que fazer com o áudio">
      <p>
        Dá pra baixar a gravação e compartilhá-la em aparelhos compatíveis. O áudio não é
        publicado automaticamente na comunidade.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="Sem instalar" titulo="Direto no navegador, de graça">
      <p>
        A Arena funciona no navegador do celular ou do computador, sem baixar um aplicativo.
        A gravação pode ser feita sem cadastro.
      </p>
      <LinksPublicos links={[{ para: '/privacidade', rotulo: 'O que o Auê faz com o seu áudio' }]} />
    </SecaoPublica>
  </LayoutPublico>
);
