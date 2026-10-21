// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { espacoEmVolta } from './espacoDoElemento';

afterEach(() => vi.unstubAllGlobals());

describe('espacoEmVolta', () => {
  it('mede o que sobra acima e abaixo na parte visível', () => {
    vi.stubGlobal('innerHeight', 800);
    const el = document.createElement('button');
    el.getBoundingClientRect = () => ({ top: 700, bottom: 744 }) as DOMRect;
    expect(espacoEmVolta(el)).toEqual({ acima: 700, abaixo: 56 });
  });
});
