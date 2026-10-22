import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../../..', import.meta.url));
const inicio = readFileSync(`${raiz}/src/features/novo-aue/InicioOpenDesign.tsx`, 'utf8');
const painel = readFileSync(`${raiz}/src/features/novo-aue/PainelDireito.tsx`, 'utf8');

describe('mídias das comunidades', () => {
  it('lê avatar e capa persistidos, sem PNG específico de comunidade no front', () => {
    expect(inicio).toContain('return comunidade?.avatarUrl ?? undefined;');
    expect(inicio).toContain('return comunidade?.capaUrl ?? undefined;');
    expect(inicio).not.toContain("'/comunidades/");
    expect(painel).toContain('return comunidade.avatarUrl ?? undefined;');
    expect(painel).not.toContain("'/comunidades/");
  });
});
