// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://aue.web.app/"}
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({ bloqueada: false }));
vi.mock('./exclusaoTelemetria', () => ({ telemetriaBloqueada: () => estado.bloqueada }));

beforeEach(() => { vi.resetModules(); estado.bloqueada = false; window.history.replaceState(null, '', '/'); });
afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(s => s.remove());
  delete (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe('Analytics da Arena', () => {
  it('não carrega a tag em prévias locais', async () => {
    vi.stubGlobal('window', { location: new URL('http://localhost:4173/arena') });
    const a = await import('./analyticsArenaV2');
    a.registrarPaginaAnalytics('arena'); a.analyticsArenaV2.registrar('abriu_arena_v2');
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
    expect((window as unknown as { dataLayer?: unknown[] }).dataLayer).toBeUndefined();
  });
  it('não carrega nem envia com exclusão ativada', async () => {
    estado.bloqueada = true;
    const a = await import('./analyticsArenaV2');
    a.registrarPaginaAnalytics('arena'); a.analyticsArenaV2.registrar('iniciou_gravacao');
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
    expect((window as unknown as { dataLayer?: unknown[] }).dataLayer).toBeUndefined();
  });
  it.each(['/duelo#t=segredo', '/arena?campaign=segredo', '/arena#segredo', '/perfil'])('não carrega para %s', async (url) => {
    window.history.replaceState(null, '', url);
    const a = await import('./analyticsArenaV2');
    a.registrarPaginaAnalytics('arena'); a.analyticsArenaV2.registrar('iniciou_gravacao');
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });
  it('envia apenas etapas e categoria usando endereço fixo e sem referrer', async () => {
    window.history.replaceState(null, '', '/arena');
    const a = await import('./analyticsArenaV2');
    a.registrarPaginaAnalytics('arena'); a.analyticsArenaV2.registrar('concluiu_gravacao');
    const filas = (window as unknown as { dataLayer: unknown[][] }).dataLayer;
    expect(filas.every(item => Object.prototype.toString.call(item) === '[object Arguments]')).toBe(true);
    expect(filas.map(item => Array.from(item))).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-43GWYNCCMD', expect.objectContaining({ send_page_view: false, page_location: 'https://aue.web.app/', page_referrer: '' })],
      ['event', 'page_view', expect.objectContaining({ pagina: 'arena', page_location: 'https://aue.web.app/', page_referrer: '' })],
      ['event', 'concluiu_gravacao', expect.objectContaining({ page_location: 'https://aue.web.app/', page_referrer: '' })],
    ]);
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
  it('não envia novas etapas se o bloqueio for ativado depois', async () => {
    const a = await import('./analyticsArenaV2');
    a.analyticsArenaV2.registrar('abriu_arena_v2');
    const filas = (window as unknown as { dataLayer: unknown[][] }).dataLayer;
    const antes = filas.length; estado.bloqueada = true;
    a.analyticsArenaV2.registrar('iniciou_gravacao');
    expect(filas).toHaveLength(antes);
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-43GWYNCCMD']).toBe(true);
  });
  it.each([
    ['/feed', 'feed', 'ouviu_arroto'],
    ['/como-arrotar', 'publica', 'confirmou_maioridade'],
    ['/grupos', 'publica', 'clicou_anuncio'],
  ] as const)('coleta page_view e eventos no mural e nas páginas públicas (%s)', async (rota, categoria, evento) => {
    window.history.replaceState(null, '', rota);
    const a = await import('./analyticsArenaV2');
    a.registrarPaginaAnalytics(categoria);
    a.analyticsArenaV2.registrar(evento);
    const filas = (window as unknown as { dataLayer: unknown[][] }).dataLayer.map((item) => Array.from(item));
    expect(filas).toContainEqual(['event', 'page_view', expect.objectContaining({ pagina: categoria })]);
    expect(filas).toContainEqual(['event', evento, expect.objectContaining({ page_location: 'https://aue.web.app/' })]);
  });
});
