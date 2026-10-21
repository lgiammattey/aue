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
});
