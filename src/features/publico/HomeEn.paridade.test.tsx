// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomeEn, TITULO_DA_HOME_EN } from './HomeEn';

function textos(elementos: NodeListOf<Element>): Array<string | undefined> {
  // A Arena em inglês é só JavaScript: não existe no <noscript>, então fica fora da paridade.
  return Array.from(elementos)
    .filter((e) => !e.closest('.home-en__arena'))
    .map((e) => e.textContent?.replace(/\s+/g, ' ').trim());
}

describe('home em inglês (/en)', () => {
  it('mantém os mesmos títulos e parágrafos com e sem JavaScript', () => {
    const entrada = readFileSync('paginas/en.html', 'utf8');
    const fallback = /<noscript>([\s\S]*?)<\/noscript>/.exec(entrada)?.[1];
    expect(fallback).toBeTruthy();
    const semJs = new DOMParser().parseFromString(fallback!, 'text/html');
    const comJs = new DOMParser().parseFromString(
      renderToStaticMarkup(<MemoryRouter><HomeEn /></MemoryRouter>),
      'text/html',
    );
    expect(textos(semJs.querySelectorAll('h1, h2, h3, p:not(:has(a))'))).toEqual(
      textos(comJs.querySelectorAll('.guia-arena__miolo h1, .guia-arena__miolo h2, .guia-arena__miolo h3, .guia-arena__miolo p')),
    );
  });

  it('tem um H1 só e o título da aba bate com o <title> da entrada HTML', () => {
    const entrada = readFileSync('paginas/en.html', 'utf8');
    const titulo = /<title>([^<]+)<\/title>/.exec(entrada)![1].replace('&amp;', '&');
    expect(TITULO_DA_HOME_EN).toBe(titulo);
    const { container } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('troca lang e título enquanto está na tela e devolve os originais ao sair', () => {
    document.documentElement.lang = 'pt-BR';
    document.title = 'Auê! Grave seu arroto e entre na resenha';
    const { unmount } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(TITULO_DA_HOME_EN);
    unmount();
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(document.title).toBe('Auê! Grave seu arroto e entre na resenha');
  });

  it('a Arena em inglês está na página, e o botão de gravar do fim leva até ela', () => {
    const { container } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    const arena = container.querySelector('#arena.home-en__arena');
    expect(arena).toBeTruthy();
    expect(arena!.querySelector('button')?.textContent).toBe('Record now');
    const links = Array.from(container.querySelectorAll('a'));
    const gravar = links.filter((a) => /record (a|my) burp/i.test(a.textContent ?? ''));
    expect(gravar).toHaveLength(1);
    expect(gravar[0].getAttribute('href')).toBe('#arena');
  });

  it('nenhum link da página em inglês leva à Arena em português sem estar rotulado como português', () => {
    const { container } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    for (const a of Array.from(container.querySelectorAll('a[href="/"]'))) {
      expect(a.getAttribute('hreflang')).toBe('pt-BR');
    }
  });

  it('a página em inglês não fala português nem avisa que a Arena está em português', () => {
    const { container } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    expect(container.textContent).not.toMatch(/Arena is in Portuguese/i);
  });

  it('há saída para a versão em português', () => {
    const { container } = render(<MemoryRouter><HomeEn /></MemoryRouter>);
    const links = Array.from(container.querySelectorAll('a'));
    expect(links.some((a) => a.getAttribute('hreflang') === 'pt-BR' && a.textContent === 'Português')).toBe(true);
  });
});
