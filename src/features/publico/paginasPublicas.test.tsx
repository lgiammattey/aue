/**
 * `/como-jogar` e `/como-arrotar` passaram a usar `LayoutPublico`, a mesma
 * família visual da landing de desktop, em vez de `LayoutLegal`. O conteúdo
 * (título, texto, ordem) não mudou — só a moldura. Este arquivo trava as duas
 * coisas: que o conteúdo continua lá, e que a moldura é mesmo a compartilhada
 * (`desktop-*`), não uma reinvenção por página.
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

describe('/como-jogar com a moldura da landing', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(ComoJogar);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Como jogar o Auê/);
  });

  it('mantém o conteúdo que já existia', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('nota de 0 a 100');
    expect(html).toContain('Depois da nota, chame alguém para o X1');
    expect(html).toContain('sem baixar app');
    expect(html).toContain('burp game');
  });

  it('usa a casca compartilhada com a landing, não uma própria', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('desktop-site');
    expect(html).toContain('desktop-topbar');
    expect(html).toContain('desktop-footer');
  });

  it('leva pra política de privacidade e de volta pro jogo', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain('href="/"');
  });

  it('o rodapé tem os quatro links institucionais, igual a landing', () => {
    const html = montar(ComoJogar);
    expect(html).toContain('href="/como-jogar"');
    expect(html).toContain('href="/como-arrotar"');
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain('href="/termos"');
  });
});

describe('/como-arrotar com a moldura da landing', () => {
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

  it('usa a casca compartilhada com a landing, não uma própria', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('desktop-site');
    expect(html).toContain('desktop-topbar');
    expect(html).toContain('desktop-footer');
  });

  it('leva de volta pro jogo e pra como jogar', () => {
    const html = montar(ComoArrotar);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/como-jogar"');
  });
});

describe('/tipos-de-arroto com a moldura da landing', () => {
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
    expect(html).toContain('desktop-site');
    expect(html).toContain('href="/como-arrotar"');
    expect(html).toContain('href="/ranking-de-arrotos"');
  });
});

describe('/ranking-de-arrotos com a moldura da landing', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(RankingDeArrotos);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Ranking e Recordes de Arroto/);
  });

  it('traz os recordes mundiais e as faixas de nota oficiais', () => {
    const html = montar(RankingDeArrotos);
    expect(html).toContain('112,4 dB');
    expect(html).toContain('Neville Sharp');
    expect(html).toContain('Foi isso?');
    expect(html).toContain('Tá maluco.');
    expect(html).toContain('Tá roubado. Não é possível.');
    expect(html).toContain('YAMNet');
  });

  it('usa a casca compartilhada e links de retorno', () => {
    const html = montar(RankingDeArrotos);
    expect(html).toContain('desktop-site');
    expect(html).toContain('href="/como-jogar"');
    expect(html).toContain('href="/tipos-de-arroto"');
  });
});

describe('/videos-de-arroto com a moldura da landing', () => {
  it('tem um H1 só, e é o da página', () => {
    const html = montar(VideosDeArroto);
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
    expect(html).toMatch(/<h1>[\s\S]*Vídeos de Arroto/);
  });

  it('lista os vídeos curados do YouTube e TikTok com links originais', () => {
    const html = montar(VideosDeArroto);
    expect(html).toContain('Fartin Around');
    expect(html).toContain('Gamer Burps 38');
    expect(html).toContain('Rei do Arroto');
    expect(html).toContain('Assistir arroto');
    expect(html).toContain('Entrar na Arena e Arrotar');
  });

  it('usa a casca compartilhada e links de navegação', () => {
    const html = montar(VideosDeArroto);
    expect(html).toContain('desktop-site');
    expect(html).toContain('href="/ranking-de-arrotos"');
    expect(html).toContain('href="/grupos"');
  });
});
