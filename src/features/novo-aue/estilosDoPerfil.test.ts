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

  it('a folha de foto ancora embaixo no celular com peso maior que o .modal do casca.css', () => {
    const css = ler('./FolhaDaFoto.css');
    expect(css).toMatch(/max-width:\s*699px\)\s*\{\s*\.modal\.folha-da-foto\s*\{[^}]*align-items:\s*flex-end[^}]*padding:\s*0/);
    expect(css).toMatch(/padding-bottom:\s*calc\(24px \+ env\(safe-area-inset-bottom/);
  });

  it('barra superior do celular: 44px + topo seguro, logo em 32px/36px, sem linha de baixo só no perfil', () => {
    const css = ler('./BarraSuperior.css');
    expect(css).toMatch(/header\.topbar\s*\{[^}]*min-height:\s*calc\(44px \+ env\(safe-area-inset-top/);
    expect(css).toMatch(/header\.topbar \.topbar-brand-mobile\s*\{[^}]*font-size:\s*32px[^}]*line-height:\s*36px/);
    expect(css).toMatch(/main:has\(\.od-profile\) header\.topbar\s*\{[^}]*border-bottom:\s*0/);
    expect(css).toMatch(/\.topbar \.search\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/data-sessao='ativa'\]\s*\.top-actions\s*\{[^}]*display:\s*none/);
  });

  it('"Entrar" do visitante: a caixa acompanha o texto no mobile, sem esconder o estouro', () => {
    const css = ler('./BarraSuperior.css');
    const sem = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const mobile = sem.slice(sem.indexOf('@media (max-width: 699px)'), sem.indexOf('@media (max-width: 359px)'));
    expect(mobile).toMatch(/\.topbar \.top-actions \.icon-btn\s*\{[^}]*width:\s*auto/);
    expect(mobile).toMatch(/\.topbar \.top-actions \.icon-btn\s*\{[^}]*padding:\s*0 10px/);
    expect(mobile).toMatch(/\.topbar \.top-actions \.icon-btn\s*\{[^}]*font-size:\s*14px/);
    expect(mobile).toMatch(/\.topbar \.top-actions \.icon-btn\s*\{[^}]*font-weight:\s*700/);
    expect(mobile).not.toMatch(/\.icon-btn\s*\{[^}]*font:/);
    expect(sem).not.toContain('overflow-x');
    expect(sem).not.toContain('!important');
    expect(ler('../../index.css')).toMatch(/\.icon-btn\s*\{[^}]*width:\s*44px/);
  });

  it('título do estado de erro do perfil não usa mais Anton com linha 1', () => {
    const css = ler('./InicioOpenDesign.css');
    expect(css).toMatch(/\.od-profile__state h1\s*\{[^}]*font:\s*800 22px\/28px/);
  });
});
