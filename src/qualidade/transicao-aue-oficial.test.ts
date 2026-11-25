import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(import.meta.dirname, '../..');
const lerJson = <T>(arquivo: string): T => JSON.parse(readFileSync(resolve(raiz, arquivo), 'utf8')) as T;
const ler = (arquivo: string): string => readFileSync(resolve(raiz, arquivo), 'utf8');

describe('transição para o site Firebase aue-oficial', () => {
  it('amarra o deploy normal ao novo site, sem trocar o domínio por configuração', () => {
    const firebase = lerJson<{ hosting: { target?: string; site?: string } }>('firebase.json');
    const firebaserc = lerJson<{
      targets?: { 'aue-game'?: { hosting?: Record<string, string[]> } };
    }>('.firebaserc');
    const workflow = ler('.github/workflows/publicar-firebase.yml');

    expect(firebase.hosting.target).toBe('aue-oficial');
    expect(firebase.hosting.site).toBeUndefined();
    expect(firebaserc.targets?.['aue-game']?.hosting?.['aue-oficial']).toEqual(['aue-oficial']);
    expect(workflow).toContain('target: aue-oficial');
    expect(workflow).toContain("EXIGIR_GRUPOS: '1'");
    expect(workflow).toContain('scripts/verificar-sitemap-final.ts');
  });

  it('mantém o redirecionamento do legado fora do deploy normal e conserva caminho', () => {
    const legado = lerJson<{
      hosting: {
        site?: string;
        target?: string;
        redirects?: Array<{ source?: string; regex?: string; destination?: string; type?: number }>;
        headers?: Array<{ source?: string; headers?: Array<{ key: string; value: string }> }>;
      };
      emulators?: { hosting?: { port?: number } };
    }>('firebase.legado-redirect.json');

    expect(legado.hosting.site).toBe('aue');
    expect(legado.hosting.target).toBeUndefined();
    expect(legado.hosting.headers).toContainEqual({
      source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }],
    });
    expect(legado.emulators?.hosting?.port).toBe(5003);
    expect(legado.hosting.redirects).toEqual([
      { source: '/', destination: 'https://arrotaaue.com.br/', type: 301 },
      {
        regex: '^/((?:[^_s].*|s$|s[^w].*|sw$|sw[^.].*|sw\\.$|sw\\.[^j].*|sw\\.j$|sw\\.j[^s].*|sw\\.js.+|_$|_[^_].*|__$|__[^/].*))$',
        destination: 'https://arrotaaue.com.br/:1',
        type: 301,
      },
    ]);
    expect(ler('firebase.json')).not.toContain('https://arrotaaue.com.br/:1');
    expect(ler('.github/workflows/publicar-firebase.yml')).not.toContain('firebase.legado-redirect.json');
  });

  it('só permite publicar o redirect por disparo manual, a partir da main e com confirmação', () => {
    const workflow = ler('.github/workflows/publicar-redirect-legado.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s*(?:push|schedule):/m);
    expect(workflow).toContain("github.ref != 'refs/heads/main'");
    expect(workflow).toContain('REDIRECT_LEGADO_APOS_DOMINIO_CONECTADO');
    expect(workflow).toContain('firebase.legado-redirect.json');
    expect(workflow).toContain('cp scripts/sw-legado-migracao.js dist/sw.js');
    const worker = ler('scripts/sw-legado-migracao.js');
    const codigoDoWorker = worker.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(worker).toContain('self.registration.unregister()');
    expect(worker).toContain('fetch(event.request)');
    expect(codigoDoWorker).not.toMatch(/caches\.delete|localStorage|indexedDB/i);
    expect(workflow).toContain('--only hosting');
    expect(workflow).not.toContain('publicar-firebase.yml');
  });
});
