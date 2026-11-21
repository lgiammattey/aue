// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';

describe('AdsterraNativeBanner — bloco de anúncio nativo integrado ao feed', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('não injeta placement externo sem a flag explícita de publicação', () => {
    render(<AdsterraNativeBanner />);

    expect(screen.queryByText('Patrocinado')).toBeNull();
    expect(document.querySelector('script[data-aue-adsterra="native"]')).toBeNull();
  });

  it('injeta o container e o script do banner nativo quando a flag de publicação está ligada', async () => {
    vi.stubEnv('VITE_FEATURE_ADSTERRA', '1');
    const { AdsterraNativeBanner: BannerComAdsterra } = await import('./AdsterraNativeBanner');

    render(<BannerComAdsterra />);

    expect(screen.getByText('Patrocinado')).toBeTruthy();
    expect(document.querySelector('[data-testid="adsterra-native-container"]')).toBeTruthy();
    expect(document.querySelector('script[data-aue-adsterra="native"]')).toBeTruthy();
  });

  it('injeta o Social Bar uma única vez quando a flag está ligada e não injeta quando desligada', async () => {
    const { carregarSocialBar: desligado } = await import('../../plataforma/web/adsterra');
    expect(desligado()).toBeNull();
    expect(document.querySelector('script[data-aue-adsterra="social-bar"]')).toBeNull();

    vi.resetModules();
    vi.stubEnv('VITE_FEATURE_ADSTERRA', '1');
    const { carregarSocialBar: ligado, ADSTERRA_CONFIG } = await import('../../plataforma/web/adsterra');
    const primeiro = ligado();
    const segundo = ligado();

    expect(primeiro).toBeTruthy();
    expect(segundo).toBe(primeiro);
    expect(document.querySelectorAll('script[data-aue-adsterra="social-bar"]')).toHaveLength(1);
    expect(primeiro?.getAttribute('src')).toBe(ADSTERRA_CONFIG.socialBarScript);
  });
});
