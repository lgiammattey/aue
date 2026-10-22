import React from 'react';

import { LayoutPublico, LinksPublicos, SecaoPublica } from './LayoutPublico';

/**
 * `/como-jogar` — a página que explica o Auê por escrito. A URL fica (ela está
 * no sitemap e no canonical); o texto agora diz "como funciona", porque o Auê
 * é a comunidade de quem gosta de arrotar e a Arena é só uma parte dela.
 *
 * A ordem segue a jornada: comunidades, Arena, X1, navegador.
 *
 * Ela não cria estado da Arena, não muda o loop e não é alcançável de dentro
 * da Arena. Também não usa o gate `ehDesktop`: quem chega por busca abre do
 * telefone.
 *
 * O QUE ESTÁ ESCRITO AQUI É SÓ O QUE O PRODUTO FAZ HOJE. Nada de "em breve",
 * nada de recurso desligado por flag.
 */
export const ComoJogar: React.FC = () => (
  <LayoutPublico
    eyebrow="Guia rápido"
    titulo="Como funciona o Auê"
    resumo="O Auê é a comunidade de quem gosta de arrotar. Você entra, ouve, conversa e, quando quiser, solta um arroto na Arena pra ver a nota."
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

    <SecaoPublica eyebrow="A Arena" titulo="Solta um e vê a nota">
      <p>
        Toque em ARROTAR e solte. O microfone só é pedido nessa hora. O Auê ouve e mostra a nota de
        0 a 100, com as quatro medidas: duração, potência, profundidade e textura.
      </p>
      <p>
        Não é sorteio: o que não for arroto não vira nota. Não gostou do número? Manda outro. O
        arroto só vai pra comunidade se você escolher publicar.
      </p>
    </SecaoPublica>

    <SecaoPublica eyebrow="O X1" titulo="Desafie alguém">
      <p>
        Depois da nota, chame alguém para o X1. O Auê gera um link privado: quem abrir ouve o seu
        arroto, arrota a resposta no próprio aparelho e as duas notas se enfrentam.
      </p>
      <p>No fim tem placar e tem revanche.</p>
    </SecaoPublica>

    <SecaoPublica eyebrow="Sem instalar" titulo="Direto no navegador, de graça">
      <p>
        Funciona no navegador do celular, Android ou iPhone. Quem recebe um desafio joga pelo mesmo
        link, sem baixar app e sem criar conta. Não tem assinatura nem moeda dentro do app.
      </p>
      <LinksPublicos links={[{ para: '/privacidade', rotulo: 'O que o Auê faz com o seu áudio' }]} />
    </SecaoPublica>
  </LayoutPublico>
);
