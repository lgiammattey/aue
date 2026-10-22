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

describe('barra inferior em telas estreitas (320 a 389px)', () => {
  const sem = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bloco = (consulta: string) => {
    const ini = sem.indexOf(`@media (${consulta})`);
    expect(ini).toBeGreaterThan(-1);
    let nivel = 0;
    for (let i = sem.indexOf('{', ini); i < sem.length; i++) {
      if (sem[i] === '{') nivel++;
      if (sem[i] === '}' && --nivel === 0) return sem.slice(ini, i + 1);
    }
    return '';
  };

  it('centra o ARROTAR: três colunas de 56px, as do meio dividem o resto, sem vão', () => {
    const b = bloco('max-width: 389px');
    expect(b).toMatch(/\.sidebar \.mobile-bottom-nav\s*\{[^}]*grid-template-columns:\s*56px minmax\(0, 1fr\) 56px minmax\(0, 1fr\) 56px/);
    expect(b).toMatch(/\.sidebar \.mobile-bottom-nav\s*\{[^}]*gap:\s*0;/);
  });

  it('rótulo não quebra linha e corta com reticência; 10px de 320 a 339, sem tocar o ARROTAR', () => {
    expect(bloco('max-width: 389px')).toMatch(/\.mobile-nav-item span\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/);
    expect(bloco('max-width: 339px')).toMatch(/\.mobile-nav-item:not\(\.mobile-nav-item--arrotar\) span\s*\{[^}]*font-size:\s*10px/);
  });

  it('de 390px para cima nada muda: a base segue repeat(5, 1fr) e o arquivo não esconde rolagem', () => {
    expect(bloco('max-width: 699px')).toMatch(/\.mobile-bottom-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5, 1fr\)/);
    expect(sem).not.toContain('overflow-x: hidden');
  });
});
