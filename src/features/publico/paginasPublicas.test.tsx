/**
 * As páginas públicas de conteúdo usam `LayoutPublico`, a moldura desenhada em
 * `docs/design/prototipo/Páginas Públicas.dc.html`. O conteúdo (título, texto,
 * ordem) não mudou quando a moldura mudou. Este arquivo trava as duas coisas:
 * que o conteúdo continua lá, e que a moldura é mesmo a compartilhada
 * (`publico-*`), não uma reinvenção por página.
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

  it('mantém o conteúdo que já existia', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('nota de 0 a 100');
    expect(html).toContain('Depois da nota, chame alguém para o X1');
    expect(html).toContain('sem baixar app');
    expect(html).not.toContain('burp game');
    expect(html).toContain('Os grupos de WhatsApp e Telegram são outra coisa');
  });

  it('usa a casca pública compartilhada, não uma própria', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('publico-site');
    expect(html).toContain('publico-topo');
    expect(html).toContain('publico-rodape');
  });

  it('leva pra política de privacidade e de volta pro jogo', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain('href="/"');
  });

  it('o rodapé tem os links institucionais', () => {
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

  it('tem as cinco técnicas, o framing dos dois tipos e o desvio pro médico', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('Engole ar, devolve ar');
    expect(html).toContain('trapaça');
    expect(html).toContain('O corpo ajuda, se você deixar');
    expect(html).toContain('Arroto renovado');
    expect(html).toContain('Arrotar alto');
    expect(html).toContain('Arroto de ar');
    expect(html).toContain('Arroto de estômago');
    expect(html).toContain('assunto de médico');
    expect(html).toContain('não de jogo');
  });

  it('usa a casca pública compartilhada, não uma própria', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('publico-site');
    expect(html).toContain('publico-topo');
    expect(html).toContain('publico-rodape');
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
    expect(html).toContain('publico-site');
    expect(html).toContain('href="/como-arrotar"');
    expect(html).toContain('href="/ranking-de-arrotos"');
  });
});

describe('/ranking-de-arrotos com a moldura pública', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(RankingDeArrotos);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Ranking e notas de arroto/);
  });

  it('traz as faixas de nota oficiais e não repete recorde sem fonte', () => {
    const html = montar(RankingDeArrotos);
    expect(html).not.toContain('Guinness');
    expect(html).not.toContain('112,4 dB');
    expect(html).toContain('Foi isso?');
    expect(html).toContain('Tá maluco.');
    expect(html).toContain('Tá roubado. Não é possível.');
    expect(html).toContain('YAMNet');
  });

  it('usa a casca compartilhada e links de retorno', () => {
    const html = montar(RankingDeArrotos);
    expect(html).toContain('publico-site');
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
    expect(html).toContain('publico-site');
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

    expect(html).toContain('Arrota, aprende ou só vem ouvir. O importante é participar da resenha.');
    expect(html).not.toContain('entra na competição');
  });

  it('o menu do celular existe, fechado, e a navegação tem as comunidades', () => {
    const html = montar(ComoJogar);

    expect(html).toContain('aria-label="Abrir menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="menu-publico"');
    expect(html).toContain('href="/comunidade"');
  });
});
