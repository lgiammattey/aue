import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (arquivo: string) => readFileSync(new URL(arquivo, import.meta.url), 'utf8');

/** Regras `{ ... }` cujo seletor contém o trecho dado, já sem comentários. */
function regrasCom(css: string, trecho: string): string[] {
  const limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...limpo.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, seletor]) => seletor.includes(trecho))
    .filter(([, seletor]) => trecho !== '.card-do-post--perfil' || !seletor.includes(':not(.card-do-post--perfil)'))
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
    // O único verde do arquivo é o da variante feed, escrito com :not(.card-do-post--perfil).
    const comVerde = regrasCom(card, '').filter((r) => /accent|#c6ff00/i.test(r));
    expect(comVerde.length).toBeGreaterThan(0);
    for (const regra of comVerde) expect(regra, regra).toContain(':not(.card-do-post--perfil)');
  });

  it('a variante perfil neutraliza os pontos que seriam verdes no card', () => {
    const doPerfil = regrasCom(card, '.card-do-post--perfil').join('\n');
    for (const alvo of ['.post-topic-tag__label', '.action-btn.is-active', '.action-btn__feedback']) {
      expect(doPerfil, alvo).toContain(alvo);
    }
  });

  it('o card não declara regra para o seletor legado .post-body global nem para .play e .wave', () => {
    for (const seletor of regrasCom(card, '.post-body')) expect(seletor).toMatch(/^\.card-do-post \.post-body/);
    expect(card).not.toMatch(/(^|[\s,])\.(play|wave)\b/m);
  });

  it('o verde do feed tem peso explícito (0,4,0), não depende da ordem de import', () => {
    const regras = regrasCom(card, ':not(.card-do-post--perfil) .action-btn').join('\n');
    for (const alvo of ['.action-btn.is-active', '.action-btn--save.is-saved', '.action-btn__feedback']) expect(regras, alvo).toContain(alvo);
    expect(regras).toMatch(/color:\s*var\(--aue-accent\)/);
    expect(card.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important');
  });

  it('--border-strong e --ind são declarados uma vez, com os valores do DESIGN.md', () => {
    const tokens = ler('./TokensDoCard.css');
    expect(tokens).toContain('--border-strong: #74725f');
    expect(tokens).toContain('--border-strong: #85836f');
    expect(tokens).toMatch(/--ind:\s*#0a0a08/);
    for (const css of [card, player, ler('./PerfilDoUsuario.css'), ler('./FolhaDaFoto.css')]) {
      expect(css).not.toMatch(/--border-strong:\s*#|--ind:\s*#/);
    }
  });
});
