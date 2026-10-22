// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VitrineDeApps } from './VitrineDeApps';

vi.mock('../../shared/desktop/qr', () => ({
  gerarMatrizQr: vi.fn(async () => [[true]]),
  ladoComMargem: vi.fn(() => 9),
  matrizParaPath: vi.fn(() => 'M4 4h1v1h-1z'),
}));

describe('VitrineDeApps', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sorteia uma única campanha do SignallQ e separa site oficial de loja correspondente', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<VitrineDeApps />);

    expect(screen.getByText('A conexão tá uma merda?')).toBeTruthy();
    expect(screen.getByRole('link', { name: /conhecer SignallQ/i }).getAttribute('href'))
      .toBe('https://signallq.com');
    await waitFor(() => expect(screen.getByRole('img', { name: 'QR para baixar SignallQ' })).toBeTruthy());
    expect(screen.getByRole('link', { name: /baixar SignallQ na Google Play/i }).getAttribute('href'))
      .toBe('https://play.google.com/store/apps/details?id=io.signallq.app');
  });

  it('pode sortear uma campanha do Lagcheck com App Store própria', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.34);

    render(<VitrineDeApps />);

    expect(screen.getByText('Foi lag ou foi braço?')).toBeTruthy();
    expect(screen.getByRole('link', { name: /conhecer Lagcheck/i }).getAttribute('href'))
      .toBe('https://lagcheck.signallq.com');
  });

  it('pode sortear uma campanha do Linka com App Store própria', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.67);

    render(<VitrineDeApps />);

    expect(screen.getByText('Seu Wi-Fi fala.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /conhecer Linka/i }).getAttribute('href'))
      .toBe('https://linka.signallq.com');
  });
});
