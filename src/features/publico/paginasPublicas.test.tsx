/**
 * As páginas públicas de conteúdo usam `LayoutPublico`. O conteúdo (título,
 * texto e ordem) não muda quando a casca muda; a leitura segue dentro da
 * mesma navegação OpenDesign do restante da rede.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import type { FC } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ComoJogar } from './ComoJogar';
import { ComoArrotar } from './ComoArrotar';
import { TiposDeArroto } from './TiposDeArroto';
import { RankingDeArrotos } from './RankingDeArrotos';
import { VideosDeArroto } from './VideosDeArroto';

function montar(componente: FC): string {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(componente)));
}

describe('/como-jogar com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(ComoJogar);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Como funciona o Auê/);
  });

  it('explica a comunidade e a Arena disponível sem prometer nota ou X1', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('Toque pra gravar');
    expect(html).toContain('a medição de duração e potência relativa é experimental');
    expect(html).not.toContain('A Arena está sendo preparada');
    expect(html).not.toContain('placar e revanche');
    expect(html).toContain('sem baixar um aplicativo');
    expect(html).not.toContain('burp game');
    expect(html).toContain('Os grupos de WhatsApp ficam fora do Auê');
  });

  it('usa a navegação da Arena', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('guia-arena');
    expect(html).toContain('Navegação principal');
  });

  it('leva pra política de privacidade e de volta pro jogo', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain('href="/"');
  });

  it('o rodapé atual mantém os links institucionais', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('href="/como-jogar"');
    expect(html).toContain('href="/como-arrotar"');
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain('href="/termos"');
  });
});

describe('/como-arrotar com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(ComoArrotar);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Como arrotar/);
  });

  it('apresenta técnicas práticas e modalidades sem incentivar forçar o corpo', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('Como arrotar de propósito (no comando)');
    expect(html).toContain('Bebida com gás: o combustível certo');
    expect(html).toContain('Arroto alto: postura e garganta solta');
    expect(html).toContain('Arroto longo: segurar e dosar o ar');
    expect(html).toContain('Arroto explosivo: curto e grosso');
    expect(html).toContain('Arroto grave: o trovão de dentro');
    expect(html).toContain('Truque clássico: como arrotar o alfabeto');
    expect(html).toContain('A ideia é dar risada, não passar mal');
    expect(html).toContain('sem forçar a voz pra não machucar');
  });

  it('usa a navegação da Arena', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('guia-arena');
    expect(html).toContain('Navegação principal');
  });

  it('leva de volta pro jogo e pra como jogar', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/como-jogar"');
  });
});

describe('/tipos-de-arroto com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(TiposDeArroto);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Tipos de arroto/);
  });

  it('traz os cinco estilos e os critérios acústicos', () => {
    const html = montar(TiposDeArroto);
    expect(html).toContain('O Trovão');
    expect(html).toContain('O Trator');
    expect(html).toContain('A Rajada');
    expect(html).toContain('O Fraseado');
    expect(html).toContain('O Sopro Oco');
    expect(html).toContain('duração');
    expect(html).toContain('potência');
  });

  it('usa a casca compartilhada e links de retorno', () => {
    const html = montar(TiposDeArroto);
    expect(html).toContain('app od-informativo');
    expect(html).toContain('href="/como-arrotar"');
    expect(html).toContain('href="/ranking-de-arrotos"');
  });
});

describe('/ranking-de-arrotos com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(RankingDeArrotos);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Ranking de arrotos no Auê/);
  });

  it('exibe o placar ao vivo e explica o laudo experimental sem promessas irreais', () => {
    const html = montar(RankingDeArrotos);
    expect(html).not.toContain('Guinness');
    expect(html).not.toContain('112,4 dB');
    expect(html).toContain('Top arrotadores');
    expect(html).toContain('duração detectada');
    expect(html).toContain('relativo ao ruído do ambiente');
    expect(html).not.toContain('YAMNet');
    expect(html).not.toContain('Tá roubado. Não é possível.');
  });

  it('usa a casca compartilhada e links de retorno', () => {
    const html = montar(RankingDeArrotos);
    expect(html).toContain('app od-informativo');
    expect(html).toContain('href="/como-jogar"');
    expect(html).toContain('href="/tipos-de-arroto"');
  });
});

describe('/videos-de-arroto com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(VideosDeArroto);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Vídeos de arroto pra ouvir e aprender/);
  });

  it('lista os vídeos curados do YouTube com capas nativas e links originais', () => {
    const html = montar(VideosDeArroto);
    expect(html).not.toContain('Fartin Around');
    expect(html).not.toContain('TikTok');
    expect(html).toContain('Garoto Arroto');
    expect(html).toContain('Gamer Burps 38');
    expect(html).toContain('Aula de Arroto com Professor Moises');
    expect(html).toContain('Assistir arroto');
    expect(html).toContain('Ir pra Arena');
    expect(html).toContain('Ver original no YouTube ↗');
  });

  it('usa a casca compartilhada e links de navegação', () => {
    const html = montar(VideosDeArroto);
    expect(html).toContain('app od-informativo');
    expect(html).toContain('href="/ranking-de-arrotos"');
    expect(html).toContain('href="/grupos"');
  });
});

describe('voz das páginas públicas', () => {
  const paginas: ReadonlyArray<[string, FC]> = [
    ['/como-jogar', ComoJogar],
    ['/como-arrotar', ComoArrotar],
    ['/tipos-de-arroto', TiposDeArroto],
    ['/ranking-de-arrotos', RankingDeArrotos],
    ['/videos-de-arroto', VideosDeArroto],
  ];

  it.each(paginas)('%s não chama o Auê de jogo de arroto nem fala em "causo"', (_rota, componente) => {
    const texto = montar(componente).replace(/<[^>]+>/g, ' ').toLowerCase();

    expect(texto).not.toContain('jogo de arroto');
    expect(texto).not.toMatch(/\bcausos?\b/);
  });

  it('a faixa final convida pra participar, sem falar em competição', () => {
    const html = montar(ComoArrotar);

    expect(html).toContain('Treinou? Testa agora no microfone.');
    expect(html).toContain('Gravar meu arroto');
    expect(html).not.toContain('Bora fazer barulho?');
    expect(html).not.toContain('entra na competição');
  });

  it('a navegação móvel atual tem o atalho para comunidades', () => {
    const html = montar(ComoJogar);

    expect(html).toContain('aria-label="Navegação principal"');
    expect(html).toContain('href="/feed"');
  });
});
