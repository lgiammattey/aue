// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/desktop/qr', () => ({
  gerarMatrizQr: vi.fn(async () => [[true]]),
  ladoComMargem: vi.fn(() => 9),
  matrizParaPath: vi.fn(() => 'M4 4h1v1h-1z'),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('SlotPatrocinadoDoFeed', () => {
  it('ocupa o espaço com campanha própria quando o AdSense não foi configurado', async () => {
    vi.stubEnv('VITE_ADSENSE_CLIENT', undefined);
    vi.stubEnv('VITE_ADSENSE_SLOT_FEED', undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { SlotPatrocinadoDoFeed } = await import('./SlotPatrocinadoDoFeed');

    const { getByLabelText } = render(<SlotPatrocinadoDoFeed />);

    expect(getByLabelText('Anúncio do SignallQ')).toBeTruthy();
    expect(document.querySelector('.adsbygoogle')).toBeNull();
  });

  it('prioriza AdSense e só usa campanha própria quando o slot vem explicitamente vazio', async () => {
    vi.stubEnv('VITE_ADSENSE_CLIENT', 'ca-pub-5542349230926522');
    vi.stubEnv('VITE_ADSENSE_SLOT_FEED', 'feed-123');
    vi.spyOn(Math, 'random').mockReturnValue(.34);
    const { SlotPatrocinadoDoFeed } = await import('./SlotPatrocinadoDoFeed');

    const { getByLabelText } = render(<SlotPatrocinadoDoFeed />);
    const blocoDoGoogle = document.querySelector('.adsbygoogle');
    expect(blocoDoGoogle).toBeTruthy();
    expect(document.querySelector('.slot-patrocinado--feed')).toBeTruthy();

    blocoDoGoogle?.setAttribute('data-ad-status', 'unfilled');

    await waitFor(() => expect(getByLabelText('Anúncio do Lagcheck')).toBeTruthy());
    expect(document.querySelector('.adsbygoogle')).toBeNull();
  });

  it('repete a prioridade do AdSense na lateral direita', async () => {
    vi.stubEnv('VITE_ADSENSE_CLIENT', 'ca-pub-5542349230926522');
    vi.stubEnv('VITE_ADSENSE_SLOT_SIDEBAR', 'sidebar-123');
    const { SlotPatrocinado } = await import('./SlotPatrocinadoDoFeed');

    render(<SlotPatrocinado posicionamento="sidebar" />);

    expect(document.querySelector('.slot-patrocinado--sidebar')).toBeTruthy();
    const blocoDoGoogle = document.querySelector('.adsbygoogle');
    expect(blocoDoGoogle).toBeTruthy();

    blocoDoGoogle?.setAttribute('data-ad-status', 'unfilled');

    await waitFor(() => expect(document.querySelector('.vitrine-apps--sidebar')).toBeTruthy());
  });
});
