// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ComoArrotar } from './ComoArrotar';

describe('conteúdo indexável de como arrotar', () => {
  it('mantém os mesmos títulos e parágrafos com e sem JavaScript', () => {
    const entrada = readFileSync('paginas/como-arrotar.html', 'utf8');
    const fallback = /<noscript>([\s\S]*?)<\/noscript>/.exec(entrada)?.[1];
    expect(fallback).toBeTruthy();
    const semJs = new DOMParser().parseFromString(fallback!, 'text/html');
    const comJs = new DOMParser().parseFromString(renderToStaticMarkup(<MemoryRouter><ComoArrotar /></MemoryRouter>), 'text/html');
    const textos = (elementos: NodeListOf<Element>) => Array.from(elementos, (elemento) => elemento.textContent?.replace(/\s+/g, ' ').trim());
    expect(textos(semJs.querySelectorAll('h1, h2, p:not(:has(a))'))).toEqual(
      textos(comJs.querySelectorAll('.guia-arena__hero h1, .guia-arena__hero p, .guia-arena__secoes h2, .guia-arena__secoes p')),
    );
  });
});
