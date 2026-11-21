import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ler = (caminhoRelativo: string) => readFileSync(fileURLToPath(new URL(caminhoRelativo, import.meta.url)), 'utf8');

const ds = ler('../../styles/designSystem.css');
const shell = ler('../../styles/appShell.css');
const casca = ler('./casca.css');
const barraLateral = ler('./BarraLateral.tsx');

describe('novo App Shell desktop de 3 colunas e mobile sem Bottom Nav', () => {
  it('usa largura total de 3 colunas dentro do .app (240px + 1fr + 320px) e sidebar sem fundo cinza', () => {
    expect(shell).toContain('grid-template-columns: 240px minmax(0, 1fr) 320px');
    expect(shell).toContain('max-inline-size: none');
    expect(casca).toContain('grid-template-columns: 240px minmax(0, 1fr) 320px');
    expect(casca).toContain('max-width: none');
    expect(shell).not.toMatch(/\.sidebar\s*\{[^}]*--bg-elevated/);
    expect(casca).not.toMatch(/\.sidebar\s*\{[^}]*--aue-bg-elevated/);
  });

  it('remove completamente a mobile-bottom-nav no mobile (< 700px)', () => {
    expect(barraLateral).not.toContain('mobile-bottom-nav');
    expect(shell).not.toContain('.mobile-bottom-nav');
    expect(casca).not.toContain('.mobile-bottom-nav');
    expect(shell).not.toContain('overflow-x: hidden');
    expect(casca).not.toContain('overflow-x: hidden');
  });

  it('usa o novo Design System dark-only carbono (#0a0b0e) + laranja (#ff5500), sem verde ácido', () => {
    for (const fonte of [ds, shell, casca]) {
      expect(fonte).not.toMatch(/#c6ff00|#c6f500/i);
    }
    expect(ds).toContain('color-scheme: dark');
    expect(ds).toContain('--bg: #0a0b0e');
    expect(ds).toContain('--accent: #ff5500');
  });
});
