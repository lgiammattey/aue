import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(import.meta.dirname, '../..');
const ler = (arquivo: string) => readFileSync(resolve(raiz, arquivo), 'utf8');
const hosting = JSON.parse(ler('firebase.json')).hosting as {
  rewrites: { source?: string; regex?: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

describe('prévia pública genérica do convite de duelo', () => {
  it('entrega metadados sem dados do convite e pede para não indexar', () => {
    const html = ler('paginas/duelo.html');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain('<meta name="referrer" content="no-referrer"');
    expect(html).toContain('<meta property="og:url" content="https://arrotaaue.com.br/duelo"');
    expect(html).toContain('<meta property="og:image" content="https://arrotaaue.com.br/og-image.png"');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).not.toMatch(/canonical|#t=|\?t=/i);
    expect(existsSync(resolve(raiz, 'public/og-image.png'))).toBe(true);
    expect(ler('public/sitemap.xml')).not.toContain('/duelo');
  });

  it('direciona os dois caminhos para o HTML específico sem fallback genérico', () => {
    for (const source of ['/duelo', '/duelo/']) {
      const index = hosting.rewrites.findIndex((regra) => regra.source === source);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(hosting.rewrites[index].destination).toBe('/duelo.html');
    }
    expect(hosting.rewrites.some(({ source }) => source === '**')).toBe(false);
    for (const regex of ['^/b/[^/]+/?$', '^/d/[^/]+/?$', '^/x1/[^/]+/?$']) {
      expect(hosting.rewrites.find((regra) => regra.regex === regex)?.destination).toBe('/index.html');
    }
  });

  it('protege a prévia genérica e os links privados, sem bloquear o rastreador', () => {
    for (const source of ['/duelo', '/duelo/', '/duelo.html']) {
      const regra = hosting.headers.find((item) => item.source === source);
      expect(regra?.headers).toEqual(expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ]));
    }

    // /b e /d continuam liberados no robots.txt para os bots que criam a
    // prévia compartilhada. O noindex vem pelo cabeçalho, que impede a
    // indexação sem impedir a leitura do HTML. /x1 é o alias ainda aceito pelo
    // roteador e tem a mesma característica privada.
    for (const source of ['/b/**', '/d/**', '/x1/**']) {
      const regra = hosting.headers.find((item) => item.source === source);
      expect(regra?.headers).toEqual(expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ]));
    }
    expect(ler('public/robots.txt')).toContain('Allow: /duelo');
    for (const rota of ['Allow: /b/', 'Allow: /d/']) {
      expect(ler('public/robots.txt')).toContain(rota);
    }
    const config = ler('vite.config.ts');
    expect(config).toContain("duelo: entrada('paginas/duelo.html')");
    expect(config).toContain("'duelo.html'");
    expect(config).toContain('navigateFallbackAllowlist');
    const allowlist = /navigateFallbackAllowlist:\s*\[([\s\S]*?)\],\n\s*\/\*/.exec(config)?.[1] ?? '';
    expect(allowlist).not.toContain('duelo');
  });
});
