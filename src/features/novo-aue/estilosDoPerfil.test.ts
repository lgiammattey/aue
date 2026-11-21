import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (arquivo: string) => readFileSync(new URL(arquivo, import.meta.url), 'utf8');

describe('estilos do perfil, barra superior e ficha de jogada', () => {
  it('a folha de foto trava a rolagem do fundo só enquanto existe, sem tocar nos outros modais', () => {
    const css = ler('./FolhaDaFoto.css');
    expect(css).toMatch(/html:has\(\.folha-da-foto\),\s*body:has\(\.folha-da-foto\)\s*\{[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/\.folha-da-foto\s*\{[^}]*overscroll-behavior:\s*contain/);
    expect(ler('./casca.css')).not.toContain('folha-da-foto');
  });

  it('o avatar do card chega a 44px de área de toque por pseudo-elemento, sem !important', () => {
    const css = ler('./CardDoPost.css');
    expect(css).toMatch(/\.post-avatar-link::after\s*\{[^}]*inset:\s*-2px/);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important');
  });

  it('a folha de foto ancora embaixo no celular com peso maior que o .modal do casca.css', () => {
    const css = ler('./FolhaDaFoto.css');
    expect(css).toMatch(/max-width:\s*699px\)\s*\{\s*\.modal\.folha-da-foto\s*\{[^}]*align-items:\s*flex-end[^}]*padding:\s*0/);
    expect(css).toMatch(/padding-bottom:\s*calc\(24px \+ env\(safe-area-inset-bottom/);
  });

  it('barra superior do celular: 52px + topo seguro, links com 44px de toque e sem overflow-x/!important', () => {
    const css = ler('./BarraSuperior.css');
    const sem = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(sem).toMatch(/header\.topbar\s*\{[^}]*min-height:\s*calc\(52px \+ env\(safe-area-inset-top/);
    expect(sem).toMatch(/\.topbar-nav-link\s*\{[^}]*min-height:\s*44px/);
    expect(sem).toMatch(/\.topbar \.top-actions \.icon-btn\.topbar-login\s*\{[^}]*min-height:\s*44px/);
    expect(sem).not.toContain('overflow-x');
    expect(sem).not.toContain('!important');
  });

  it('cabeçalho do card Ficha de Jogada: nome e @ ficam em linhas distintas, ambos com toque de 44px e foco laranja', () => {
    const css = ler('./CardDoPost.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.card-do-post\s*\{[^}]*--cab-linha:\s*24px/);
    expect(css).toMatch(/\.card-do-post \.author-profile-link,\s*\.card-do-post \.post-meta-handle\s*\{[^}]*height:\s*var\(--hit-target-min, 44px\)/);
    expect(css).toMatch(/\.card-do-post \.post-meta-ident\s*\{[^}]*flex-direction:\s*column[^}]*height:\s*calc\(var\(--cab-linha\) \* 2\)/);
    expect(css).toMatch(/\.card-do-post \.post-meta-details\s*\{[^}]*display:\s*flex[^}]*height:\s*var\(--cab-linha\)/);
    expect(css).toMatch(/\.card-do-post \.post-meta-handle\s*\{[^}]*height:\s*var\(--hit-target-min, 44px\)/);
    expect(css).toMatch(/:focus-visible::before\s*\{[^}]*height:\s*24px[^}]*border:\s*2px solid var\(--accent,\s*#ff5500\)/);
    expect(css).not.toContain('!important');
  });

  it('título do estado de perfil usa a fonte de display do produto', () => {
    const css = ler('./InicioOpenDesign.css');
    expect(css).toMatch(/\.od-profile__state h1\s*\{[^}]*font-family:\s*var\(--font-display, 'Anton', sans-serif\)[^}]*font-size:\s*30px[^}]*line-height:\s*1/);
  });
});
