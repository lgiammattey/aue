import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (arquivo: string) => readFileSync(new URL(arquivo, import.meta.url), 'utf8');

describe('estilos do perfil que não têm como ser vistos no jsdom', () => {
  it('a folha de foto trava a rolagem do fundo só enquanto existe, sem tocar nos outros modais', () => {
    const css = ler('./FolhaDaFoto.css');
    expect(css).toMatch(/html:has\(\.folha-da-foto\),\s*body:has\(\.folha-da-foto\)\s*\{[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/\.folha-da-foto\s*\{[^}]*overscroll-behavior:\s*contain/);
    expect(ler('./casca.css')).not.toContain('folha-da-foto');
  });

  it('a busca do celular cabe em 320 e 360 sem cortar a copy: placeholder menor, campo em 16px', () => {
    const css = ler('./BarraSuperior.css');
    expect(css).toMatch(/\.topbar \.search\s*\{[^}]*font-size:\s*16px/);
    expect(css).toMatch(/\.topbar \.search::placeholder\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/max-width:\s*359px[\s\S]*::placeholder\s*\{[^}]*font-size:\s*12px/);
  });

  it('o avatar do card chega a 44px de área de toque por pseudo-elemento, sem !important', () => {
    const css = ler('./CardDoPost.css');
    expect(css).toMatch(/\.post-avatar-link::after\s*\{[^}]*inset:\s*-2px/);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important');
  });
});
