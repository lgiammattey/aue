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

describe('novo Design System nos cards e player (Carbono + Laranja Elétrico)', () => {
  const card = ler('./CardDoPost.css');
  const player = ler('./PlayerDoArroto.css');
  const tokens = ler('./TokensDoCard.css');

  it('CardDoPost, PlayerDoArroto e TokensDoCard não têm mais verde ácido (#c6ff00/#c6f500) nem tema claro', () => {
    for (const css of [card, player, tokens]) {
      expect(css).not.toMatch(/#c6ff00|#c6f500/i);
      expect(css).not.toContain("data-theme='light'");
    }
  });

  it('o player preenche a onda tocada em laranja elétrico (--accent, #ff5500)', () => {
    expect(player).toMatch(/\.is-tocada\s*\{[^}]*var\(--accent,\s*#ff5500\)/);
  });

  it('o card mantém a variante perfil neutra e não usa !important nem seletores globais .play/.wave', () => {
    const doPerfil = regrasCom(card, '.card-do-post--perfil')
      .filter((regra) => !regra.split('{')[0].includes(':not(.card-do-post--perfil)'));
    expect(doPerfil.length).toBeGreaterThan(0);
    for (const regra of doPerfil) expect(regra).not.toMatch(/accent|#ff5500/i);
    for (const seletor of regrasCom(card, '.post-body')) expect(seletor).toMatch(/^\.card-do-post \.post-body/);
    expect(card).not.toMatch(/(^|[\s,])\.(play|wave)\b/m);
    expect(card.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important');
  });

  it('--border-strong e --ind vêm do novo Design System em TokensDoCard.css', () => {
    expect(tokens).toContain('--border-strong: var(--aue-line-strong, #3b4254)');
    expect(tokens).toContain('--ind: var(--aue-accent, #ff5500)');
    for (const css of [card, player, ler('./FolhaDaFoto.css')]) {
      expect(css).not.toMatch(/--border-strong:\s*#|--ind:\s*#/);
    }
  });
});
