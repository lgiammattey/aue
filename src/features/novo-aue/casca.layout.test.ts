import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./casca.css', import.meta.url)), 'utf8');

describe('layout desktop de 3 colunas', () => {
  it('centraliza as colunas dentro do .app: sem isso sobra faixa vazia à direita em tela larga', () => {
    const bloco = css.match(/\n\.app \{[^}]*\}/)?.[0] ?? '';
    expect(bloco).toContain('grid-template-columns: 275px minmax(0, 600px) 320px');
    expect(bloco).toContain('justify-content: center');
  });

  it('barra inferior do celular: item ativo segue --fg (traço herda currentColor), sem verde', () => {
    expect(css).not.toMatch(/\.mobile-nav-item\.active\s+svg\s*\{[^}]*accent/);
    expect(css).toMatch(/\.mobile-nav-item\.active\s*\{[^}]*color:\s*var\(--aue-text\)/);
    expect(css).toMatch(/\.mobile-nav-item svg\s*\{[^}]*stroke:\s*currentColor/);
  });

  it('o ARROTAR do centro continua sendo o verde da barra', () => {
    expect(css).toMatch(/\.mobile-nav-item--arrotar\s*\{[^}]*background:\s*var\(--aue-accent\)/);
  });

  it('o menu lateral do desktop não muda: .nav-item.active segue em --aue-text', () => {
    expect(css).toMatch(/\.nav-item\.active,[^{]*\{[^}]*color:\s*var\(--aue-text\)/);
  });
});
