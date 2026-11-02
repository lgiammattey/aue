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
});
