import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(import.meta.dirname, '../..');
const ler = (arquivo: string) => readFileSync(resolve(raiz, arquivo), 'utf8');
const hosting = JSON.parse(ler('firebase.json')).hosting as {
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

describe('prévia pública genérica do convite de duelo', () => {
  it('entrega metadados sem dados do convite e pede para não indexar', () => {
    const html = ler('duelo.html');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain('<meta name="referrer" content="no-referrer"');
    expect(html).toContain('<meta property="og:url" content="https://aue.web.app/duelo"');
    expect(html).toContain('<meta property="og:image" content="https://aue.web.app/og-image.png"');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).not.toMatch(/canonical|#t=|\?t=/i);
    expect(existsSync(resolve(raiz, 'public/og-image.png'))).toBe(true);
    expect(ler('public/sitemap.xml')).not.toContain('/duelo');
  });

  it('direciona os dois caminhos para o HTML específico antes da SPA', () => {
    const fallback = hosting.rewrites.findIndex(({ source }) => source === '**');
    for (const source of ['/duelo', '/duelo/']) {
      const index = hosting.rewrites.findIndex((regra) => regra.source === source);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(fallback);
      expect(hosting.rewrites[index].destination).toBe('/duelo.html');
    }
    expect(hosting.rewrites[fallback].destination).toBe('/index.html');
    expect(hosting.rewrites.some(({ source }) => source.startsWith('/b/') || source.startsWith('/d/'))).toBe(false);
  });

  it('protege os três endereços e deixa o robô ler o noindex', () => {
    for (const source of ['/duelo', '/duelo/', '/duelo.html']) {
      const regra = hosting.headers.find((item) => item.source === source);
      expect(regra?.headers).toEqual(expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ]));
    }
    expect(ler('public/robots.txt')).toContain('Allow: /duelo');
    const config = ler('vite.config.ts');
    expect(config).toContain("duelo: entrada('duelo.html')");
    expect(config).toContain("'duelo.html'");
    expect(config).toContain('/^\\/duelo(?:\\.html|\\/)?(?:\\?|$)/');
  });
});
