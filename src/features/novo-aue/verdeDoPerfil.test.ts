import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (arquivo: string) => readFileSync(new URL(arquivo, import.meta.url), 'utf8');

/** Regras `{ ... }` cujo seletor contém o trecho dado, já sem comentários. */
function regrasCom(css: string, trecho: string): string[] {
  const limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...limpo.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, seletor]) => seletor.includes(trecho))
    .map(([, seletor, corpo]) => `${seletor.trim()} { ${corpo.trim()} }`);
}

describe('verde do perfil (opção A do Luiz: só aba ativa e ARROTAR)', () => {
  const card = ler('./CardDoPost.css');
  const player = ler('./PlayerDoArroto.css');

  it('o player não usa o verde de acento em lugar nenhum', () => {
    expect(player).not.toMatch(/accent/);
    expect(player).not.toMatch(/#c6ff00/i);
  });

  it('o CSS do card não introduz verde; a variante perfil também não herda o do legado', () => {
    const doPerfil = regrasCom(card, '.card-do-post--perfil');
    expect(doPerfil.length).toBeGreaterThan(0);
    for (const regra of doPerfil) expect(regra, regra).not.toMatch(/accent|#c6ff00/i);
    expect(card).not.toMatch(/--aue-accent|--accent|#c6ff00/i);
  });

  it('a variante perfil neutraliza os quatro pontos que seriam verdes no card', () => {
    const doPerfil = regrasCom(card, '.card-do-post--perfil').join('\n');
    for (const alvo of ['.post-topic-tag__label', '.action-btn.is-active', '.action-btn--save.is-saved', '.action-btn__feedback']) {
      expect(doPerfil, alvo).toContain(alvo);
    }
  });

  it('o card não declara regra para o seletor legado .post-body global nem para .play e .wave', () => {
    for (const seletor of regrasCom(card, '.post-body')) expect(seletor).toMatch(/^\.card-do-post \.post-body/);
    expect(card).not.toMatch(/(^|[\s,])\.(play|wave)\b/m);
  });
});
