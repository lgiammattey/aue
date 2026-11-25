import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import { ErroDoSitemap, locsDoSitemap, verificarSitemapFinal } from '../../scripts/verificar-sitemap-final.ts';

const ORIGEM = 'https://arrotaaue.com.br';
const temporarios: string[] = [];
afterEach(() => { for (const caminho of temporarios.splice(0)) rmSync(caminho, { recursive: true, force: true }); });

function xml(locs: readonly string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs.map((loc) => `<url><loc>${loc}</loc></url>`).join('')}</urlset>`;
}
function fixture(): { dist: string; sitemap: string; grupo: string } {
  const dist = mkdtempSync(join(tmpdir(), 'aue-sitemap-'));
  temporarios.push(dist);
  const grupo = `${ORIGEM}/g/arena/`;
  writeFileSync(join(dist, 'sitemap.xml'), xml([`${ORIGEM}/`, grupo]));
  mkdirSync(join(dist, 'g', 'arena'), { recursive: true });
  writeFileSync(join(dist, 'g', 'arena', 'index.html'), `<link rel="canonical" href="${grupo}" />`);
  writeFileSync(join(dist, 'g', 'lista.json'), JSON.stringify({ hash: 'a'.repeat(64), total: 1, geradoEm: '2026-11-25T00:00:00.000Z' }));
  return { dist, sitemap: xml([`${ORIGEM}/`, grupo]), grupo };
}

describe('verificar sitemap final antes do deploy', () => {
  it('rejeita XML malformado, em vez de aceitar texto que só parece tags', () => {
    expect(() => locsDoSitemap('<?xml version="1.0"?><urlset><url><loc>https://arrotaaue.com.br/</loc></urlset>', 'fixture')).toThrow(ErroDoSitemap);
  });
  it('falha quando uma URL estática publicada some do build', () => {
    const { dist } = fixture();
    expect(() => verificarSitemapFinal(dist, xml([`${ORIGEM}/`, `${ORIGEM}/como-arrotar`]))).toThrow(/retirou 1 URL/);
  });
  it('falha se a página de grupo não usar canonical absoluto com barra final', () => {
    const { dist, grupo } = fixture();
    writeFileSync(join(dist, 'g', 'arena', 'index.html'), `<link rel="canonical" href="${grupo.slice(0, -1)}" />`);
    expect(() => verificarSitemapFinal(dist, xml([`${ORIGEM}/`, grupo]))).toThrow(/canonical exato, com barra final/);
  });
  it('falha se sitemap e canonical de grupo omitirem a barra final juntos', () => {
    const { dist, grupo } = fixture();
    const semBarra = grupo.slice(0, -1);
    writeFileSync(join(dist, 'sitemap.xml'), xml([`${ORIGEM}/`, semBarra]));
    writeFileSync(join(dist, 'g', 'arena', 'index.html'), `<link rel="canonical" href="${semBarra}" />`);
    expect(() => verificarSitemapFinal(dist, xml([`${ORIGEM}/`, semBarra]))).toThrow(/URL de grupo no sitemap precisa terminar com barra/);
  });
  it('aceita fixture íntegra sem credenciais e registra grupo removido como moderação legítima', () => {
    const { dist, sitemap, grupo } = fixture();
    expect(verificarSitemapFinal(dist, sitemap)).toEqual({ final: 2, oficial: 2, grupos: 1, gruposRemovidos: [] });
    expect(verificarSitemapFinal(dist, xml([`${ORIGEM}/`, grupo, `${ORIGEM}/g/ocultado/`])).gruposRemovidos).toEqual([`${ORIGEM}/g/ocultado/`]);
  });
});

describe('workflow de publicação', () => {
  it('permite validar manualmente sem alterar push ou agendamento', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/publicar-firebase.yml', import.meta.url), 'utf8');
    expect(workflow).toContain('workflow_dispatch:\n    inputs:\n      somente_validar:');
    expect(workflow).toContain("type: boolean");
    expect(workflow).toContain("default: false");
    expect(workflow).toContain("if: ${{ github.event_name != 'workflow_dispatch' || inputs.somente_validar != true }}");
    expect(workflow).toContain('push:\n    branches: [main]');
    expect(workflow).toContain("schedule:\n    - cron: '17 * * * *'");
  });
});
