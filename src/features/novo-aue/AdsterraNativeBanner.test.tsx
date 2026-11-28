// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';

describe('AdsterraNativeBanner — bloco de anúncio nativo integrado ao feed', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    window.localStorage.removeItem('aue.maioridade.v1');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('não injeta placement externo sem a flag explícita de publicação', () => {
    render(<AdsterraNativeBanner />);

    expect(screen.queryByText('Patrocinado')).toBeNull();
    expect(document.querySelector('script[data-aue-adsterra="native"]')).toBeNull();
  });

  it('não injeta o banner nativo em teste mesmo que a capacidade esteja ligada', async () => {
    vi.stubEnv('VITE_FEATURE_ADSTERRA', '1');
    const { AdsterraNativeBanner: BannerComAdsterra } = await import('./AdsterraNativeBanner');

    render(<BannerComAdsterra />);

    expect(screen.queryByText('Patrocinado')).toBeNull();
    expect(document.querySelector('[data-testid="adsterra-native-container"]')).toBeNull();
    expect(document.querySelector('script[data-aue-adsterra="native"]')).toBeNull();
  });

  it('não oferece Social Bar no contrato de publicidade', async () => {
    const contrato = await import('../../plataforma/web/adsterra');
    expect('carregarSocialBar' in contrato).toBe(false);
    expect('socialBarScript' in contrato.ADSTERRA_CONFIG).toBe(false);
  });

  it('monta somente no iframe após maioridade e desmonta quando a configuração fica indisponível', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_FEATURE_ADSTERRA', '1');
    vi.stubEnv('VITE_ADSTERRA_ATIVAR_REDE', '1');
    vi.stubEnv('VITE_ADSTERRA_CONFIG_URL', 'https://config.example.invalid/publicidade.json');
    const consulta = vi.fn()
      .mockResolvedValueOnce(Response.json({ adsterra: true }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', consulta);
    const { AdsterraNativeBanner: Banner } = await import('./AdsterraNativeBanner');
    const { confirmarMaioridade } = await import('../../plataforma/web/maioridade');
    const { atualizarPublicidadeRuntime } = await import('../../plataforma/web/adsterra');

    render(<Banner />);
    expect(consulta).not.toHaveBeenCalled();
    expect(screen.queryByTitle('Patrocinado')).toBeNull();

    await act(async () => { confirmarMaioridade(); });
    const frame = screen.getByTitle<HTMLIFrameElement>('Patrocinado');
    expect(frame.sandbox?.value ?? frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.srcdoc).toContain('bicea.org');
    expect(document.querySelector('script[src*="bicea.org"]')).toBeNull();
    expect(consulta).toHaveBeenCalledTimes(1);
    expect(consulta).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
    }));

    await act(async () => { await atualizarPublicidadeRuntime(); });
    expect(screen.queryByTitle('Patrocinado')).toBeNull();
  });
});
