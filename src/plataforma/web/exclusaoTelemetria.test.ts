// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  document.cookie = 'aue_nao_contar=; Path=/; Max-Age=0';
  window.history.replaceState({}, '', '/');
  vi.resetModules();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.cookie = 'aue_nao_contar=; Path=/; Max-Age=0';
  window.history.replaceState({}, '', '/');
});

describe('preferência de exclusão da telemetria', () => {
  it('bloqueia a primeira visita antes de configurar e mantém o cookie em navegações normais', async () => {
    window.history.replaceState({}, '', '/?nao-contar=1');
    const gate = await import('./exclusaoTelemetria');
    expect(gate.telemetriaBloqueada()).toBe(true);
    expect(gate.configurarExclusaoTelemetria()).toBe('ativada');
    expect(document.cookie).toContain('aue_nao_contar=1');
    window.history.replaceState({}, '', '/arena');
    vi.resetModules();
    expect((await import('./exclusaoTelemetria')).telemetriaBloqueada()).toBe(true);
  });
  it('volta a contar após usar o link de retorno', async () => {
    document.cookie = 'aue_nao_contar=1; Path=/';
    window.history.replaceState({}, '', '/?voltar-a-contar=1');
    const gate = await import('./exclusaoTelemetria');
    expect(gate.configurarExclusaoTelemetria()).toBe('desativada');
    expect(gate.telemetriaBloqueada()).toBe(false);
    expect(document.cookie).not.toContain('aue_nao_contar=');
  });
  it('mantém exclusão quando os dois parâmetros estão presentes', async () => {
    window.history.replaceState({}, '', '/?nao-contar=1&voltar-a-contar=1');
    const gate = await import('./exclusaoTelemetria');
    expect(gate.configurarExclusaoTelemetria()).toBe('ativada');
    expect(gate.telemetriaBloqueada()).toBe(true);
    expect(document.cookie).toContain('aue_nao_contar=1');
  });
  it('usa cookie host-only, SameSite=Lax, duração limitada e Secure em HTTPS', async () => {
    let gravado = '';
    vi.stubGlobal('window', { location: { protocol: 'https:', search: '?nao-contar=1' } });
    vi.stubGlobal('document', { get cookie() { return ''; }, set cookie(v: string) { gravado = v; } });
    const gate = await import('./exclusaoTelemetria');
    expect(gate.configurarExclusaoTelemetria()).toBe('ativacao_nao_persistida');
    expect(gravado).toBe('aue_nao_contar=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
    expect(gravado).not.toMatch(/domain=/i);
  });
  it('bloqueia a visita de exclusão mesmo se o navegador recusar o cookie', async () => {
    window.history.replaceState({}, '', '/?nao-contar=1');
    const gate = await import('./exclusaoTelemetria');
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(gate.configurarExclusaoTelemetria()).toBe('ativacao_nao_persistida');
    window.history.replaceState({}, '', '/arena');
    expect(gate.telemetriaBloqueada()).toBe(true);
  });
  it('não bloqueia outro navegador sem o cookie', async () => {
    const gate = await import('./exclusaoTelemetria');
    gate.configurarExclusaoTelemetria();
    expect(gate.telemetriaBloqueada()).toBe(false);
  });
});
