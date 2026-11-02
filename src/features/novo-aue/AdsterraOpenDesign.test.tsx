// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PainelDireito } from './PainelDireito';

describe('Adsterra no OpenDesign — placements ficam desligados até publicação explícita', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.useRealTimers();
  });

  it('não exibe Smartlink externo sem a flag de publicação', () => {
    render(
      <MemoryRouter>
        <PainelDireito
          comunidades={[]}
          aoAbrirComunidade={() => {}}
          viewAtual="feed"
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Combustível Oficial 🍺')).toBeNull();
  });

  it('exibe o card de parceiro com Smartlink quando a flag de publicação está ligada', async () => {
    vi.stubEnv('VITE_FEATURE_ADSTERRA', '1');
    const { PainelDireito: PainelComAdsterra } = await import('./PainelDireito');

    render(
      <MemoryRouter>
        <PainelComAdsterra
          comunidades={[]}
          aoAbrirComunidade={() => {}}
          viewAtual="feed"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Combustível Oficial 🍺')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Conferir ofertas parceiras/i });
    expect(link.getAttribute('href')).toContain('arwf.org');
  });
});
