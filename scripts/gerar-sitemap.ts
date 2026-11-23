import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://aue.web.app';

// Data estável da última revisão de conteúdo/SEO (evita atualizar diariamente sem alteração real)
const LASTMOD = '2026-11-17';

interface RotaSitemap {
  readonly path: string;
  readonly priority: string;
  readonly lastmod?: string;
}

const ROUTES: readonly RotaSitemap[] = [
  { path: '/', priority: '1.0', lastmod: '2026-11-23' },
  { path: '/comunidades', priority: '0.9', lastmod: '2026-10-22' },
  { path: '/como-jogar', priority: '0.8' },
  { path: '/como-arrotar', priority: '0.8', lastmod: '2026-11-23' },
  { path: '/tipos-de-arroto', priority: '0.8', lastmod: '2026-10-18' },
  { path: '/ranking-de-arrotos', priority: '0.8' },
  { path: '/grupos', priority: '0.7', lastmod: '2026-10-18' },
  { path: '/privacidade', priority: '0.3', lastmod: '2026-08-08' },
  { path: '/termos', priority: '0.3', lastmod: '2026-08-08' },
];

export function montarSitemapXml(): string {
  const entries = ROUTES.map((r) => ({
    loc: `${SITE_URL}${r.path}`,
    lastmod: r.lastmod ?? LASTMOD,
    priority: r.priority,
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

const xml = montarSitemapXml();
const destinoPublic = path.join(RAIZ, 'public', 'sitemap.xml');
mkdirSync(path.dirname(destinoPublic), { recursive: true });
writeFileSync(destinoPublic, xml, 'utf8');

const destinoDist = path.join(RAIZ, 'dist', 'sitemap.xml');
if (existsSync(path.dirname(destinoDist))) {
  writeFileSync(destinoDist, xml, 'utf8');
}
